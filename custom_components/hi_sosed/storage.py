"""Versioned local storage for HiSosed."""

from __future__ import annotations

from typing import Any

from homeassistant.core import HomeAssistant
from homeassistant.helpers.storage import Store

from .const import STORAGE_KEY, STORAGE_VERSION


class ScenarioStore:
    """Persist scenario configuration outside config-entry options."""

    def __init__(self, hass: HomeAssistant) -> None:
        self._store: Store[dict[str, Any]] = Store(hass, STORAGE_VERSION, STORAGE_KEY)

    async def async_load(self) -> dict[str, dict[str, Any]]:
        """Load a safe mapping of scenario IDs to JSON data."""
        data = await self._store.async_load()
        if not isinstance(data, dict):
            return {}
        scenarios = data.get("scenarios", {})
        return scenarios if isinstance(scenarios, dict) else {}

    async def async_save(self, scenarios: dict[str, dict[str, Any]]) -> None:
        """Atomically publish validated scenarios."""
        await self._store.async_save({"scenarios": scenarios})
