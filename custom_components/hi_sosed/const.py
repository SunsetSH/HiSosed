"""Constants for HiSosed."""

from __future__ import annotations

from typing import Final

DOMAIN: Final = "hi_sosed"
PLATFORMS: Final[list[str]] = []

DATA_MANAGER: Final = "manager"
STORAGE_KEY: Final = f"{DOMAIN}.scenarios"
STORAGE_VERSION: Final = 1

PANEL_URL: Final = DOMAIN
PANEL_COMPONENT: Final = "hi-sosed-panel"
STATIC_URL: Final = f"/{DOMAIN}_static"
UPLOAD_URL: Final = f"/api/{DOMAIN}/upload"
MEDIA_SUBDIR: Final = DOMAIN

SERVICE_START: Final = "start"
SERVICE_STOP: Final = "stop"
SERVICE_REGENERATE: Final = "regenerate"
SERVICE_PREVIEW: Final = "preview"

EVENT_UPDATED: Final = f"{DOMAIN}_updated"

DEFAULT_SLOT_SECONDS: Final = 2
DEFAULT_SLOT_COUNT: Final = 120
DEFAULT_DENSITY_PERCENT: Final = 30
MAX_UPLOAD_BYTES: Final = 25 * 1024 * 1024
ALLOWED_AUDIO_SUFFIXES: Final = frozenset({".aac", ".flac", ".m4a", ".mp3", ".ogg", ".opus", ".wav"})
