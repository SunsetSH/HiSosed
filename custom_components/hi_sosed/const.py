"""Constants for HiSosed."""

from __future__ import annotations

from typing import Final

DOMAIN: Final = "hi_sosed"
PLATFORMS: Final[list[str]] = ["select", "sensor", "switch"]

DATA_MANAGER: Final = "manager"
STORAGE_KEY: Final = f"{DOMAIN}.scenarios"
STORAGE_VERSION: Final = 2
RUNTIME_STORAGE_KEY: Final = f"{DOMAIN}.runtime"
RUNTIME_STORAGE_VERSION: Final = 1
RUNTIME_SAVE_DELAY: Final = 5

SIGNAL_UPDATE: Final = f"{DOMAIN}_update"

PANEL_URL: Final = DOMAIN
PANEL_COMPONENT: Final = "hi-sosed-panel"
STATIC_URL: Final = f"/{DOMAIN}_static"
UPLOAD_URL: Final = f"/api/{DOMAIN}/upload"
MEDIA_SUBDIR: Final = DOMAIN
MEDIA_SOURCE_PREFIX: Final = f"media-source://media_source/local/{MEDIA_SUBDIR}/"
SYSTEM_SUBDIR: Final = "system"
SILENCE_FILE: Final = "silence.wav"
BEEP_FILE: Final = "beep.wav"

SERVICE_START: Final = "start"
SERVICE_STOP: Final = "stop"
SERVICE_RUN_NOW: Final = "run_now"
SERVICE_REGENERATE: Final = "regenerate"
SERVICE_PREVIEW: Final = "preview"
SERVICE_APPLY_PRESET: Final = "apply_preset"
SERVICE_SET_LAYER: Final = "set_layer"
SERVICE_SNOOZE: Final = "snooze"
SERVICE_RESUME: Final = "resume"

DEFAULT_SLOT_SECONDS: Final = 2
DEFAULT_SLOT_COUNT: Final = 120
DEFAULT_DENSITY_PERCENT: Final = 30
DEFAULT_CATEGORY: Final = "Без категории"
STARTER_CATEGORY: Final = "Стартовый набор"

MAX_LAYERS: Final = 20
MAX_LAYER_SOUNDS: Final = 200
MAX_PRESETS: Final = 30
MAX_RANGES_PER_DAY: Final = 8
MAX_SOUNDS: Final = 2000
MAX_RUN_NOW_MINUTES: Final = 24 * 60
MAX_SNOOZE_MINUTES: Final = 24 * 60

MAX_UPLOAD_BYTES: Final = 25 * 1024 * 1024
MAX_LIBRARY_BYTES: Final = 1024 * 1024 * 1024
UPLOAD_CHUNK_BYTES: Final = 256 * 1024
ALLOWED_AUDIO_SUFFIXES: Final = frozenset({".aac", ".flac", ".m4a", ".mp3", ".ogg", ".opus", ".wav"})

# A blocking play_media must not hold a target forever; a stuck player only skips cells.
PLAY_TIMEOUT_SECONDS: Final = 10
TICK_SECONDS: Final = 10
