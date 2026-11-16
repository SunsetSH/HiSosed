"""Versioned local storage for HiSosed."""

from __future__ import annotations

from typing import Any

from homeassistant.core import HomeAssistant
from homeassistant.helpers.storage import Store

from .const import (
    RUNTIME_SAVE_DELAY,
    RUNTIME_STORAGE_KEY,
    RUNTIME_STORAGE_VERSION,
    STORAGE_KEY,
    STORAGE_VERSION,
)
from .models import migrate_v1

_SECTIONS = ("sounds", "outputs", "scenarios")


class _MigratingStore(Store[dict[str, Any]]):
    """Store that upgrades older major versions with the pure domain migration."""

    async def _async_migrate_func(self, old_major_version: int, old_minor_version: int, old_data: Any) -> Any:
        if old_major_version == 1 and isinstance(old_data, dict):
            return migrate_v1(old_data)
        raise NotImplementedError


class ScenarioStore:
    """Persist library, output profiles and scenarios outside config-entry options."""

    def __init__(self, hass: HomeAssistant) -> None:
        self._store = _MigratingStore(hass, STORAGE_VERSION, STORAGE_KEY)

    async def async_load(self) -> dict[str, dict[str, Any]]:
        """Load a safe mapping per section; garbage becomes empty sections."""
        data = await self._store.async_load()
        data = data if isinstance(data, dict) else {}
        return {key: value if isinstance(value := data.get(key), dict) else {} for key in _SECTIONS}

    async def async_save(self, data: dict[str, dict[str, Any]]) -> None:
        """Atomically publish validated data (Store writes a temp file then renames)."""
        await self._store.async_save({key: data.get(key, {}) for key in _SECTIONS})


class RuntimeStore:
    """Checkpoint of patterns, manual runs and snooze for recovery after restart."""

    def __init__(self, hass: HomeAssistant) -> None:
        self._store: Store[dict[str, Any]] = Store(hass, RUNTIME_STORAGE_VERSION, RUNTIME_STORAGE_KEY)

    async def async_load(self) -> dict[str, Any]:
        """Load the last checkpoint or an empty one."""
        data = await self._store.async_load()
        return data if isinstance(data, dict) else {}

    def async_schedule_save(self, data_func) -> None:
        """Coalesce frequent checkpoint writes."""
        self._store.async_delay_save(data_func, RUNTIME_SAVE_DELAY)

    async def async_flush(self, data_func) -> None:
        """Write the checkpoint now (unload)."""
        await self._store.async_save(data_func())
