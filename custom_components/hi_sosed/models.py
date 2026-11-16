"""Pure data model and validation for HiSosed (no Home Assistant imports)."""

from __future__ import annotations

import re
from dataclasses import asdict, dataclass, replace
from datetime import time
from math import floor
from typing import Any
from uuid import NAMESPACE_URL, UUID, uuid4, uuid5

from .const import (
    DEFAULT_CATEGORY,
    DEFAULT_DENSITY_PERCENT,
    DEFAULT_SLOT_COUNT,
    DEFAULT_SLOT_SECONDS,
    MAX_LAYER_SOUNDS,
    MAX_LAYERS,
    MAX_PRESETS,
    MAX_RANGES_PER_DAY,
    MEDIA_SOURCE_PREFIX,
)

SCHEMA_VERSION = 2
OVERLAP_POLICIES = frozenset({"replace", "skip"})
OUTPUT_KINDS = frozenset({"bluetooth", "jack", "network", "other"})
_ENTITY_RE = re.compile(r"^media_player\.[a-z0-9_]+$")


class HiSosedError(Exception):
    """Domain error carrying a stable, user-independent code."""

    def __init__(self, code: str) -> None:
        super().__init__(code)
        self.code = code


def _require_dict(raw: Any, code: str) -> dict[str, Any]:
    if not isinstance(raw, dict):
        raise HiSosedError(code)
    return raw


def _int(raw: Any, code: str, low: int, high: int) -> int:
    if isinstance(raw, bool):
        raise HiSosedError(code)
    try:
        value = int(raw)
    except (TypeError, ValueError) as err:
        raise HiSosedError(code) from err
    if not low <= value <= high:
        raise HiSosedError(code)
    return value


def _optional_volume(raw: Any) -> int | None:
    return None if raw is None or raw == "" else _int(raw, "invalid_volume", 0, 100)


def _text(raw: Any, limit: int, code: str | None = None, default: str = "") -> str:
    value = " ".join(str(raw if raw is not None else "").split())[:limit]
    if not value:
        if code is not None:
            raise HiSosedError(code)
        return default
    return value


def parse_uuid(value: Any) -> str:
    """Normalize a UUID or create one when absent."""
    if value is None or value == "":
        return str(uuid4())
    try:
        return str(UUID(str(value)))
    except (TypeError, ValueError) as err:
        raise HiSosedError("invalid_id") from err


def parse_hhmm(value: Any) -> str:
    """Normalize local wall-clock time to HH:MM."""
    try:
        parsed = time.fromisoformat(str(value))
    except (TypeError, ValueError) as err:
        raise HiSosedError("invalid_time") from err
    return f"{parsed.hour:02d}:{parsed.minute:02d}"


def _entity_ids(raw: Any) -> tuple[str, ...]:
    if raw is None:
        return ()
    if not isinstance(raw, (list, tuple)):
        raise HiSosedError("invalid_targets")
    targets = tuple(dict.fromkeys(str(item) for item in raw))
    if any(not _ENTITY_RE.match(item) for item in targets):
        raise HiSosedError("invalid_targets")
    return targets


@dataclass(frozen=True, slots=True)
class TimeRange:
    """One local interval; end <= start crosses midnight, start == end is a full day."""

    start: str
    end: str

    @classmethod
    def from_dict(cls, raw: Any) -> TimeRange:
        """Validate one interval."""
        raw = _require_dict(raw, "invalid_time")
        return cls(start=parse_hhmm(raw.get("start")), end=parse_hhmm(raw.get("end")))


@dataclass(frozen=True, slots=True)
class WeeklySchedule:
    """Time ranges for each weekday, index 0 = Monday."""

    days: tuple[tuple[TimeRange, ...], ...]

    @classmethod
    def from_dict(cls, raw: Any) -> WeeklySchedule:
        """Validate a weekly schedule."""
        raw = _require_dict(raw, "invalid_schedule")
        days_raw = raw.get("days")
        if not isinstance(days_raw, (list, tuple)) or len(days_raw) != 7:
            raise HiSosedError("invalid_schedule")
        days: list[tuple[TimeRange, ...]] = []
        for day in days_raw:
            if not isinstance(day, (list, tuple)) or len(day) > MAX_RANGES_PER_DAY:
                raise HiSosedError("invalid_schedule")
            ranges = sorted({TimeRange.from_dict(item) for item in day}, key=lambda item: (item.start, item.end))
            days.append(tuple(ranges))
        return cls(days=tuple(days))

    @classmethod
    def simple(cls, weekdays: set[int] | tuple[int, ...], start: str, end: str) -> WeeklySchedule:
        """Build the common 'same range on selected days' schedule."""
        rng = TimeRange(parse_hhmm(start), parse_hhmm(end))
        return cls(days=tuple((rng,) if day in weekdays else () for day in range(7)))

    @property
    def is_empty(self) -> bool:
        """Return True when no interval is configured on any day."""
        return not any(self.days)


@dataclass(frozen=True, slots=True)
class GridSpec:
    """The repeating random cell grid."""

    slot_seconds: int = DEFAULT_SLOT_SECONDS
    slot_count: int = DEFAULT_SLOT_COUNT
    density_percent: int = DEFAULT_DENSITY_PERCENT

    @property
    def active_count(self) -> int:
        """Return count using explicit half-up rounding."""
        return floor(self.slot_count * self.density_percent / 100 + 0.5)

    @classmethod
    def from_dict(cls, raw: Any) -> GridSpec:
        """Validate grid settings."""
        raw = _require_dict(raw if raw is not None else {}, "invalid_grid")
        return cls(
            slot_seconds=_int(raw.get("slot_seconds", DEFAULT_SLOT_SECONDS), "invalid_slot_seconds", 1, 600),
            slot_count=_int(raw.get("slot_count", DEFAULT_SLOT_COUNT), "invalid_slot_count", 1, 1800),
            density_percent=_int(raw.get("density_percent", DEFAULT_DENSITY_PERCENT), "invalid_density", 0, 100),
        )


@dataclass(frozen=True, slots=True)
class SoundRef:
    """A library sound used by a layer, with its own switch and weight."""

    sound_id: str
    enabled: bool = True
    weight: int = 1

    @classmethod
    def from_dict(cls, raw: Any) -> SoundRef:
        """Validate a layer sound reference."""
        raw = _require_dict(raw, "invalid_sound_ref")
        return cls(
            sound_id=parse_uuid(raw.get("sound_id") or "invalid"),
            enabled=bool(raw.get("enabled", True)),
            weight=_int(raw.get("weight", 1), "invalid_audio_weight", 1, 1000),
        )


def _sound_refs(raw: Any) -> tuple[SoundRef, ...]:
    if raw is None:
        return ()
    if not isinstance(raw, (list, tuple)) or len(raw) > MAX_LAYER_SOUNDS:
        raise HiSosedError("invalid_sound_ref")
    refs = tuple(SoundRef.from_dict(item) for item in raw)
    if len({ref.sound_id for ref in refs}) != len(refs):
        raise HiSosedError("duplicate_sound")
    return refs


@dataclass(frozen=True, slots=True)
class Layer:
    """An independent random track inside a scenario."""

    id: str
    name: str
    enabled: bool
    sounds: tuple[SoundRef, ...]
    grid: GridSpec
    schedule: WeeklySchedule | None = None
    target_entity_ids: tuple[str, ...] = ()
    volume: int | None = None
    overlap: str = "replace"

    @classmethod
    def from_dict(cls, raw: Any) -> Layer:
        """Validate a layer."""
        raw = _require_dict(raw, "invalid_layer")
        overlap = str(raw.get("overlap", "replace"))
        if overlap not in OVERLAP_POLICIES:
            raise HiSosedError("invalid_overlap")
        schedule_raw = raw.get("schedule")
        return cls(
            id=parse_uuid(raw.get("id")),
            name=_text(raw.get("name"), 60, default="Дорожка"),
            enabled=bool(raw.get("enabled", True)),
            sounds=_sound_refs(raw.get("sounds")),
            grid=GridSpec.from_dict(raw.get("grid")),
            schedule=None if schedule_raw is None else WeeklySchedule.from_dict(schedule_raw),
            target_entity_ids=_entity_ids(raw.get("target_entity_ids")),
            volume=_optional_volume(raw.get("volume")),
            overlap=overlap,
        )

    @property
    def enabled_sounds(self) -> tuple[SoundRef, ...]:
        """Return sounds eligible for random choice."""
        return tuple(ref for ref in self.sounds if ref.enabled)


@dataclass(frozen=True, slots=True)
class PresetLayer:
    """The mix part of one layer captured by a preset."""

    layer_id: str
    enabled: bool
    density_percent: int
    volume: int | None
    sounds: tuple[SoundRef, ...]

    @classmethod
    def from_dict(cls, raw: Any) -> PresetLayer:
        """Validate a preset layer snapshot."""
        raw = _require_dict(raw, "invalid_preset")
        return cls(
            layer_id=parse_uuid(raw.get("layer_id") or "invalid"),
            enabled=bool(raw.get("enabled", True)),
            density_percent=_int(raw.get("density_percent", DEFAULT_DENSITY_PERCENT), "invalid_density", 0, 100),
            volume=_optional_volume(raw.get("volume")),
            sounds=_sound_refs(raw.get("sounds")),
        )


@dataclass(frozen=True, slots=True)
class Preset:
    """A named snapshot of layer switches, sounds, density and volume."""

    id: str
    name: str
    layers: tuple[PresetLayer, ...]

    @classmethod
    def from_dict(cls, raw: Any) -> Preset:
        """Validate a preset."""
        raw = _require_dict(raw, "invalid_preset")
        layers_raw = raw.get("layers", [])
        if not isinstance(layers_raw, (list, tuple)) or len(layers_raw) > MAX_LAYERS:
            raise HiSosedError("invalid_preset")
        return cls(
            id=parse_uuid(raw.get("id")),
            name=_text(raw.get("name"), 40, "missing_preset_name"),
            layers=tuple(PresetLayer.from_dict(item) for item in layers_raw),
        )


@dataclass(frozen=True, slots=True)
class Scenario:
    """A playback program: shared targets and schedule plus independent layers."""

    id: str
    revision: int
    name: str
    enabled: bool
    target_entity_ids: tuple[str, ...]
    schedule: WeeklySchedule
    layers: tuple[Layer, ...]
    presets: tuple[Preset, ...] = ()
    active_preset_id: str | None = None
    schema_version: int = SCHEMA_VERSION

    @classmethod
    def from_dict(cls, raw: Any, *, revision: int | None = None) -> Scenario:
        """Validate and construct a scenario; the only entry point for untrusted data."""
        raw = _require_dict(raw, "invalid_scenario")
        layers_raw = raw.get("layers", [])
        if not isinstance(layers_raw, (list, tuple)) or not 1 <= len(layers_raw) <= MAX_LAYERS:
            raise HiSosedError("invalid_layers")
        layers = tuple(Layer.from_dict(item) for item in layers_raw)
        if len({layer.id for layer in layers}) != len(layers):
            raise HiSosedError("invalid_layers")
        presets_raw = raw.get("presets", [])
        if not isinstance(presets_raw, (list, tuple)) or len(presets_raw) > MAX_PRESETS:
            raise HiSosedError("invalid_preset")
        presets = tuple(Preset.from_dict(item) for item in presets_raw)
        if len({preset.id for preset in presets}) != len(presets):
            raise HiSosedError("invalid_preset")
        active = raw.get("active_preset_id")
        active_id = parse_uuid(active) if active else None
        if active_id is not None and all(preset.id != active_id for preset in presets):
            active_id = None
        return cls(
            id=parse_uuid(raw.get("id")),
            revision=revision if revision is not None else _int(raw.get("revision", 0), "invalid_revision", 0, 2**31),
            name=_text(raw.get("name"), 80, "missing_name"),
            enabled=bool(raw.get("enabled", True)),
            target_entity_ids=_entity_ids(raw.get("target_entity_ids")),
            schedule=WeeklySchedule.from_dict(raw.get("schedule")),
            layers=layers,
            presets=presets,
            active_preset_id=active_id,
        )

    def as_dict(self) -> dict[str, Any]:
        """Return JSON-safe representation."""
        return asdict(self)

    def layer(self, layer_id: str) -> Layer | None:
        """Return one layer by id."""
        return next((layer for layer in self.layers if layer.id == layer_id), None)

    def layer_schedule(self, layer: Layer) -> WeeklySchedule:
        """Return the schedule a layer follows."""
        return layer.schedule if layer.schedule is not None else self.schedule

    def layer_targets(self, layer: Layer) -> tuple[str, ...]:
        """Return the players a layer plays on."""
        return layer.target_entity_ids or self.target_entity_ids

    def sound_ids(self) -> set[str]:
        """Return every library sound referenced by layers or presets."""
        ids = {ref.sound_id for layer in self.layers for ref in layer.sounds}
        ids.update(ref.sound_id for preset in self.presets for item in preset.layers for ref in item.sounds)
        return ids


@dataclass(frozen=True, slots=True)
class Sound:
    """One entry of the shared sound library."""

    id: str
    name: str
    category: str
    media_content_id: str
    content_type: str
    size: int = 0
    managed: bool = False
    created_at: str = ""

    @classmethod
    def from_dict(cls, raw: Any) -> Sound:
        """Validate a library sound."""
        raw = _require_dict(raw, "invalid_sound")
        uri = str(raw.get("media_content_id", "")).strip()
        if not uri.startswith("media-source://") or len(uri) > 1024:
            raise HiSosedError("invalid_media_source")
        return cls(
            id=parse_uuid(raw.get("id")),
            name=_text(raw.get("name"), 120, default="Звук"),
            category=_text(raw.get("category"), 40, default=DEFAULT_CATEGORY),
            media_content_id=uri,
            content_type=_text(raw.get("content_type"), 40, default=guess_content_type(uri)),
            size=_int(raw.get("size", 0), "invalid_sound", 0, 2**40),
            managed=bool(raw.get("managed", uri.startswith(MEDIA_SOURCE_PREFIX))),
            created_at=str(raw.get("created_at", ""))[:40],
        )

    def as_dict(self) -> dict[str, Any]:
        """Return JSON-safe representation."""
        return asdict(self)


@dataclass(frozen=True, slots=True)
class OutputProfile:
    """How HiSosed treats one physical speaker behind a media_player."""

    entity_id: str
    kind: str = "other"
    volume: int | None = None
    warmup_seconds: int = 0
    keepalive_seconds: int = 0
    lead_ms: int = 0

    @classmethod
    def from_dict(cls, raw: Any) -> OutputProfile:
        """Validate an output profile."""
        raw = _require_dict(raw, "invalid_output")
        entity = _entity_ids([raw.get("entity_id", "")])
        kind = str(raw.get("kind", "other"))
        if kind not in OUTPUT_KINDS:
            raise HiSosedError("invalid_output")
        keepalive = _int(raw.get("keepalive_seconds", 0), "invalid_keepalive", 0, 3600)
        if 0 < keepalive < 15:
            raise HiSosedError("invalid_keepalive")
        return cls(
            entity_id=entity[0],
            kind=kind,
            volume=_optional_volume(raw.get("volume")),
            warmup_seconds=_int(raw.get("warmup_seconds", 0), "invalid_warmup", 0, 120),
            keepalive_seconds=keepalive,
            lead_ms=_int(raw.get("lead_ms", 0), "invalid_lead", 0, 3000),
        )

    def as_dict(self) -> dict[str, Any]:
        """Return JSON-safe representation."""
        return asdict(self)


_CONTENT_TYPES = {
    ".aac": "audio/aac",
    ".flac": "audio/flac",
    ".m4a": "audio/mp4",
    ".mp3": "audio/mpeg",
    ".ogg": "audio/ogg",
    ".opus": "audio/ogg",
    ".wav": "audio/wav",
}


def guess_content_type(uri: str) -> str:
    """Return a MIME type from the file suffix, falling back to generic music."""
    suffix = uri.rsplit("/", 1)[-1].rsplit(".", 1)[-1].lower() if "." in uri.rsplit("/", 1)[-1] else ""
    return _CONTENT_TYPES.get(f".{suffix}", "music")


def apply_preset(scenario: Scenario, preset_id: str) -> Scenario:
    """Return the scenario with the preset mix applied to the layers it knows."""
    preset = next((item for item in scenario.presets if item.id == preset_id), None)
    if preset is None:
        raise HiSosedError("preset_not_found")
    snapshot = {item.layer_id: item for item in preset.layers}
    layers = []
    for layer in scenario.layers:
        item = snapshot.get(layer.id)
        if item is None:
            layers.append(layer)
            continue
        layers.append(
            replace(
                layer,
                enabled=item.enabled,
                sounds=item.sounds,
                volume=item.volume,
                grid=replace(layer.grid, density_percent=item.density_percent),
            )
        )
    return replace(scenario, layers=tuple(layers), active_preset_id=preset.id)


def capture_preset(scenario: Scenario, name: str, preset_id: str | None = None) -> Scenario:
    """Return the scenario with the current mix stored as a new or replaced preset."""
    preset = Preset(
        id=parse_uuid(preset_id),
        name=_text(name, 40, "missing_preset_name"),
        layers=tuple(
            PresetLayer(
                layer_id=layer.id,
                enabled=layer.enabled,
                density_percent=layer.grid.density_percent,
                volume=layer.volume,
                sounds=layer.sounds,
            )
            for layer in scenario.layers
        ),
    )
    presets = [item for item in scenario.presets if item.id != preset.id]
    if preset_id is None and len(presets) >= MAX_PRESETS:
        raise HiSosedError("too_many_presets")
    index = next((i for i, item in enumerate(scenario.presets) if item.id == preset.id), len(presets))
    presets.insert(index, preset)
    return replace(scenario, presets=tuple(presets), active_preset_id=preset.id)


def timing_signature(scenario: Scenario, layer: Layer) -> tuple[Any, ...]:
    """Return everything that, when changed, requires rescheduling the layer.

    Sounds, weights and volume are read at fire time, so editing them keeps the
    current cycle running (HS-FR-033).
    """
    return (
        scenario.enabled,
        layer.enabled,
        layer.grid,
        scenario.layer_schedule(layer),
        scenario.layer_targets(layer),
        bool(layer.enabled_sounds),
    )


def migrate_v1(data: dict[str, Any]) -> dict[str, Any]:
    """Convert storage v1 (one schedule, grid and audio list per scenario) to v2."""
    sounds: dict[str, dict[str, Any]] = {}
    scenarios: dict[str, dict[str, Any]] = {}
    for scenario_id, raw in (data.get("scenarios") or {}).items():
        if not isinstance(raw, dict):
            continue
        refs = []
        for item in raw.get("audio") or []:
            if not isinstance(item, dict) or not item.get("id"):
                continue
            uri = str(item.get("media_content_id", ""))
            sounds[str(item["id"])] = {
                "id": item["id"],
                "name": item.get("name") or "Звук",
                "category": "Импорт",
                "media_content_id": uri,
                "content_type": guess_content_type(uri),
                "managed": uri.startswith(MEDIA_SOURCE_PREFIX),
            }
            refs.append({"sound_id": item["id"], "enabled": item.get("enabled", True), "weight": item.get("weight", 1)})
        old_schedule = raw.get("schedule") or {}
        weekdays = set(old_schedule.get("weekdays") or [])
        start, end = old_schedule.get("start", "10:00"), old_schedule.get("end", "18:00")
        schedule = {
            "days": [[{"start": start, "end": end}] if day in weekdays else [] for day in range(7)]
        }
        scenarios[scenario_id] = {
            "id": scenario_id,
            "revision": raw.get("revision", 1),
            "name": raw.get("name"),
            "enabled": raw.get("enabled", True),
            "target_entity_ids": raw.get("target_entity_ids", []),
            "schedule": schedule,
            "layers": [
                {
                    "id": str(uuid5(NAMESPACE_URL, f"hi_sosed:{scenario_id}:layer")),
                    "name": "Основная",
                    "enabled": True,
                    "sounds": refs,
                    "grid": raw.get("grid") or {},
                }
            ],
            "presets": [],
        }
    return {"sounds": sounds, "outputs": {}, "scenarios": scenarios}
