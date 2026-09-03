"""UI setup flow for the single HiSosed runtime."""

from __future__ import annotations

from typing import Any

from homeassistant import config_entries

from .const import DOMAIN


class ConfigFlow(config_entries.ConfigFlow, domain=DOMAIN):
    """Configure the local HiSosed service."""

    VERSION = 1

    async def async_step_user(self, user_input: dict[str, Any] | None = None):
        """Create the one local runtime entry."""
        await self.async_set_unique_id(DOMAIN)
        self._abort_if_unique_id_configured()
        if user_input is not None:
            return self.async_create_entry(title="HiSosed", data={})
        return self.async_show_form(step_id="user")
