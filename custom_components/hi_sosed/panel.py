"""Register the bundled, authenticated HiSosed side panel."""

from __future__ import annotations

from pathlib import Path

from homeassistant.components import panel_custom
from homeassistant.components.http import StaticPathConfig
from homeassistant.core import HomeAssistant

from .const import DOMAIN, PANEL_COMPONENT, PANEL_URL, STATIC_URL


async def async_register_panel(hass: HomeAssistant) -> None:
    """Serve the local module and show a sidebar entry for administrators."""
    static_dir = Path(__file__).parent / "static"
    await hass.http.async_register_static_paths(
        [StaticPathConfig(STATIC_URL, str(static_dir), cache_headers=False)]
    )
    await panel_custom.async_register_panel(
        hass=hass,
        frontend_url_path=PANEL_URL,
        webcomponent_name=PANEL_COMPONENT,
        module_url=f"{STATIC_URL}/hi-sosed-panel.js",
        sidebar_title="HiSosed",
        sidebar_icon="mdi:music-note-plus",
        require_admin=True,
        config={},
        config_panel_domain=DOMAIN,
    )
