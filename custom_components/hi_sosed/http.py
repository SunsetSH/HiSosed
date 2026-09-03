"""Authenticated, size-limited audio import endpoint."""

from __future__ import annotations

import os
from pathlib import Path
from uuid import uuid4

from aiohttp import web

from homeassistant.components.http.view import HomeAssistantView
from homeassistant.exceptions import Unauthorized

from .const import ALLOWED_AUDIO_SUFFIXES, MAX_UPLOAD_BYTES, MEDIA_SUBDIR, UPLOAD_URL


def _media_directory(hass) -> Path:
    """Return the configured local media directory without exposing arbitrary paths."""
    media_dirs = getattr(hass.config, "media_dirs", {})
    local_dir = media_dirs.get("local") if isinstance(media_dirs, dict) else None
    return Path(local_dir or hass.config.path("media")) / MEDIA_SUBDIR


def _atomic_write(directory: Path, filename: str, data: bytes) -> Path:
    """Write a bounded upload through a staging file then rename it."""
    directory.mkdir(parents=True, exist_ok=True)
    destination = directory / filename
    staging = directory / f".{filename}.part"
    staging.write_bytes(data)
    os.replace(staging, destination)
    return destination


class AudioUploadView(HomeAssistantView):
    """Accept one admin-authorized local audio file at a time."""

    url = UPLOAD_URL
    name = "api:hi_sosed:upload"
    requires_auth = True

    async def post(self, request: web.Request) -> web.Response:
        """Store a selected audio file inside the managed media subdirectory."""
        user = request["hass_user"]
        if not user.is_admin:
            raise Unauthorized()
        if not request.content_type.startswith("multipart/"):
            return self.json_message("multipart upload required", status_code=400)
        reader = await request.multipart()
        field = await reader.next()
        if field is None or field.name != "file" or not field.filename:
            return self.json_message("field 'file' is required", status_code=400)
        original_name = Path(field.filename).name
        suffix = Path(original_name).suffix.lower()
        if suffix not in ALLOWED_AUDIO_SUFFIXES:
            return self.json_message("unsupported audio format", status_code=415)
        chunks: list[bytes] = []
        size = 0
        while chunk := await field.read_chunk(64 * 1024):
            size += len(chunk)
            if size > MAX_UPLOAD_BYTES:
                return self.json_message("file is too large", status_code=413)
            chunks.append(chunk)
        hass = request.app["hass"]
        filename = f"{uuid4().hex}{suffix}"
        await hass.async_add_executor_job(_atomic_write, _media_directory(hass), filename, b"".join(chunks))
        return self.json(
            {
                "id": str(uuid4()),
                "name": original_name[:120],
                "media_content_id": f"media-source://media_source/local/{MEDIA_SUBDIR}/{filename}",
                "size": size,
            }
        )
