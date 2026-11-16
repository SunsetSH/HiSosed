"""Authenticated, size-limited audio import endpoint."""

from __future__ import annotations

import os
from pathlib import Path
from typing import IO
from urllib.parse import unquote
from uuid import uuid4

from aiohttp import web

from homeassistant.components.http.view import HomeAssistantView
from homeassistant.exceptions import Unauthorized

from .audio import sniff_matches
from .const import (
    ALLOWED_AUDIO_SUFFIXES,
    DATA_MANAGER,
    DOMAIN,
    MAX_UPLOAD_BYTES,
    UPLOAD_CHUNK_BYTES,
    UPLOAD_URL,
)
from .models import HiSosedError


def _open_staging(directory: Path, filename: str) -> tuple[Path, IO[bytes]]:
    directory.mkdir(parents=True, exist_ok=True)
    staging = directory / f".{filename}.part"
    return staging, staging.open("wb")


def _write(handle: IO[bytes], data: bytes) -> None:
    handle.write(data)


def _finish(handle: IO[bytes], staging: Path, destination: Path) -> None:
    handle.close()
    os.replace(staging, destination)


def _abort(handle: IO[bytes], staging: Path) -> None:
    handle.close()
    staging.unlink(missing_ok=True)


class AudioUploadView(HomeAssistantView):
    """Accept one admin-authorized local audio file per request."""

    url = UPLOAD_URL
    name = "api:hi_sosed:upload"
    requires_auth = True

    async def post(self, request: web.Request) -> web.Response:
        """Stream a selected file into the managed directory and add it to the library."""
        user = request["hass_user"]
        if not user.is_admin:
            raise Unauthorized()
        hass = request.app["hass"]
        manager = hass.data.get(DOMAIN, {}).get(DATA_MANAGER)
        if manager is None:
            return self._error("integration_not_ready", 503)
        if not request.content_type.startswith("multipart/"):
            return self._error("multipart_required", 400)
        if request.content_length and request.content_length > MAX_UPLOAD_BYTES + 64 * 1024:
            return self._error("file_too_large", 413)
        reader = await request.multipart()
        category: str | None = None
        field = await reader.next()
        # The panel sends the optional category before the file itself.
        while field is not None and getattr(field, "name", None) == "category":
            category = (await field.text())[:40]
            field = await reader.next()
        if field is None or getattr(field, "name", None) != "file" or not field.filename:
            return self._error("file_required", 400)
        # Some clients percent-encode non-ASCII names; browsers send raw UTF-8.
        original_name = Path(unquote(field.filename)).name
        suffix = Path(original_name).suffix.lower()
        if suffix not in ALLOWED_AUDIO_SUFFIXES:
            return self._error("unsupported_audio_format", 415)
        try:
            manager.check_upload_quota(request.content_length or 0)
        except HiSosedError as err:
            return self._error(err.code, 507)

        filename = f"{uuid4().hex}{suffix}"
        directory = manager.media_dir
        staging, handle = await hass.async_add_executor_job(_open_staging, directory, filename)
        size = 0
        head = b""
        try:
            while chunk := await field.read_chunk(UPLOAD_CHUNK_BYTES):
                size += len(chunk)
                if size > MAX_UPLOAD_BYTES:
                    raise HiSosedError("file_too_large")
                if len(head) < 16:
                    head = (head + chunk)[:16]
                await hass.async_add_executor_job(_write, handle, chunk)
            if size == 0 or not sniff_matches(suffix, head):
                raise HiSosedError("unsupported_audio_format")
            await hass.async_add_executor_job(_finish, handle, staging, directory / filename)
        except HiSosedError as err:
            await hass.async_add_executor_job(_abort, handle, staging)
            return self._error(err.code, 413 if err.code == "file_too_large" else 415)
        except BaseException:
            await hass.async_add_executor_job(_abort, handle, staging)
            raise

        try:
            sound = await manager.async_register_sound(
                relative_path=filename, name=original_name, category=category, size=size
            )
        except HiSosedError as err:
            await hass.async_add_executor_job((directory / filename).unlink, True)
            return self._error(err.code, 507 if err.code == "library_full" else 400)
        return self.json(sound)

    def _error(self, code: str, status: int) -> web.Response:
        return self.json({"code": code, "message": code}, status_code=status)
