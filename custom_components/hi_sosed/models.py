"""Pure data model and validation for HiSosed scenarios."""

from __future__ import annotations

from dataclasses import asdict, dataclass
from datetime import time
from math import floor
from typing import Any
from uuid import UUID, uuid4

from homeassistant.exceptions import HomeAssistantError

from .const import DEFAULT_DENSITY_PERCENT, DEFAULT_SLOT_COUNT, DEFAULT_SLOT_SECONDS


class ScenarioValidationError(HomeAssistantError):
    """Raised when a scenario does not meet domain invariants."""


def _parse_time(value: str) -> time:
    """Parse a stored local time."""
    try:
        return time.fromisoformat(value)
    except (TypeError, ValueError) as err:
        raise ScenarioValidationError("invalid_time") from err


def _parse_uuid(value: str | None) -> str:
    """Normalize or create a UUID."""
    if value is None:
        return str(uuid4())
    try:
        return str(UUID(value))
    except (TypeError, ValueError) as err:
        raise ScenarioValidationError("invalid_id") from err


@dataclass(frozen=True, slots=True)
class AudioItem:
    """One locally resolvable audio item."""

    id: str
    media_content_id: str
    name: str
    enabled: bool = True
    weight: int = 1

    @classmethod
    def from_dict(cls, raw: dict[str, Any]) -> "AudioItem":
        """Validate an audio item from JSON."""
        uri = str(raw.get("media_content_id", "")).strip()
        if not uri.startswith("media-source://"):
            raise ScenarioValidationError("invalid_media_source")
        weight = int(raw.get("weight", 1))
        if weight < 1 or weight > 1000:
            raise ScenarioValidationError("invalid_audio_weight")
        return cls(
            id=_parse_uuid(raw.get("id")),
            media_content_id=uri,
            name=str(raw.get("name") or "Audio").strip()[:120] or "Audio",
            enabled=bool(raw.get("enabled", True)),
            weight=weight,
        )


@dataclass(frozen=True, slots=True)
class Schedule:
    """A weekly local-time schedule."""

    weekdays: tuple[int, ...]
    start: str
    end: str

    @classmethod
    def from_dict(cls, raw: dict[str, Any]) -> "Schedule":
        """Validate schedule data."""
        start = str(raw.get("start", ""))
        end = str(raw.get("end", ""))
        if _parse_time(start) == _parse_time(end):
            raise ScenarioValidationError("same_start_end")
        weekdays = tuple(sorted({int(day) for day in raw.get("weekdays", [])}))
        if not weekdays or any(day < 0 or day > 6 for day in weekdays):
            raise ScenarioValidationError("invalid_weekdays")
        return cls(weekdays=weekdays, start=start, end=end)


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
    def from_dict(cls, raw: dict[str, Any]) -> "GridSpec":
        """Validate grid settings."""
        spec = cls(
            slot_seconds=int(raw.get("slot_seconds", DEFAULT_SLOT_SECONDS)),
            slot_count=int(raw.get("slot_count", DEFAULT_SLOT_COUNT)),
            density_percent=int(raw.get("density_percent", DEFAULT_DENSITY_PERCENT)),
        )
        if not 1 <= spec.slot_seconds <= 60:
            raise ScenarioValidationError("invalid_slot_seconds")
        if not 1 <= spec.slot_count <= 1800:
            raise ScenarioValidationError("invalid_slot_count")
        if not 0 <= spec.density_percent <= 100:
            raise ScenarioValidationError("invalid_density")
        return spec


@dataclass(frozen=True, slots=True)
class Scenario:
    """A complete playback scenario."""

    id: str
    revision: int
    name: str
    enabled: bool
    target_entity_ids: tuple[str, ...]
    schedule: Schedule
    grid: GridSpec
    audio: tuple[AudioItem, ...]

    @classmethod
    def from_dict(cls, raw: dict[str, Any], *, revision: int | None = None) -> "Scenario":
        """Validate and construct a scenario."""
        targets = tuple(dict.fromkeys(str(item) for item in raw.get("target_entity_ids", [])))
        if not targets or any(not item.startswith("media_player.") for item in targets):
            raise ScenarioValidationError("invalid_targets")
        audio = tuple(AudioItem.from_dict(item) for item in raw.get("audio", []))
        if not audio or not any(item.enabled for item in audio):
            raise ScenarioValidationError("missing_audio")
        name = str(raw.get("name", "")).strip()[:80]
        if not name:
            raise ScenarioValidationError("missing_name")
        return cls(
            id=_parse_uuid(raw.get("id")),
            revision=revision if revision is not None else int(raw.get("revision", 0)),
            name=name,
            enabled=bool(raw.get("enabled", True)),
            target_entity_ids=targets,
            schedule=Schedule.from_dict(dict(raw.get("schedule", {}))),
            grid=GridSpec.from_dict(dict(raw.get("grid", {}))),
            audio=audio,
        )

    def as_dict(self) -> dict[str, Any]:
        """Return JSON-safe representation."""
        return asdict(self)
