"""Blocking file operations on the managed media directory (run in the executor)."""

from __future__ import annotations

import os
from pathlib import Path
from typing import Any

from .audio import beep_wav, silence_wav
from .const import (
    ALLOWED_AUDIO_SUFFIXES,
    BEEP_FILE,
    MEDIA_SOURCE_PREFIX,
    MEDIA_SUBDIR,
    SILENCE_FILE,
    SYSTEM_SUBDIR,
)


def media_directory(hass: Any) -> Path:
    """Return <local media dir>/hi_sosed without accepting arbitrary paths."""
    media_dirs = getattr(hass.config, "media_dirs", {})
    local_dir = media_dirs.get("local") if isinstance(media_dirs, dict) else None
    return Path(local_dir or hass.config.path("media")) / MEDIA_SUBDIR


def system_uri(filename: str) -> str:
    """Return the media-source URI of a generated system clip."""
    return f"{MEDIA_SOURCE_PREFIX}{SYSTEM_SUBDIR}/{filename}"


def uri_to_path(directory: Path, uri: str) -> Path | None:
    """Map a managed URI to a file strictly inside ``directory``."""
    if not uri.startswith(MEDIA_SOURCE_PREFIX):
        return None
    relative = uri[len(MEDIA_SOURCE_PREFIX):]
    parts = relative.split("/")
    if not 1 <= len(parts) <= 2 or any(not part or part.startswith(".") for part in parts):
        return None
    if parts[0] == SYSTEM_SUBDIR:
        return None
    root = directory.resolve()
    candidate = (directory / Path(*parts)).resolve()
    # resolve() follows symlinks, so a link pointing outside the root is rejected too.
    return candidate if root in candidate.parents and len(candidate.relative_to(root).parts) == len(parts) else None


def ensure_system_files(directory: Path) -> None:
    """Create generated clips (silence for keep-alive, test beep) if missing."""
    system = directory / SYSTEM_SUBDIR
    system.mkdir(parents=True, exist_ok=True)
    for name, factory in ((SILENCE_FILE, silence_wav), (BEEP_FILE, beep_wav)):
        target = system / name
        if not target.exists():
            write_atomic(system, name, factory())


def write_atomic(directory: Path, filename: str, data: bytes) -> Path:
    """Write through a staging file, then publish with an atomic rename."""
    directory.mkdir(parents=True, exist_ok=True)
    destination = directory / filename
    staging = directory / f".{filename}.part"
    staging.write_bytes(data)
    os.replace(staging, destination)
    return destination


def scan_audio_files(directory: Path) -> list[tuple[str, str, int]]:
    """List audio files in the root and one level of category folders.

    Returns (relative posix path, category or "", size). Folder names become
    categories, which suits files copied in through Samba.
    """
    if not directory.is_dir():
        return []
    found: list[tuple[str, str, int]] = []
    for entry in sorted(directory.iterdir()):
        if entry.name.startswith(".") or entry.name == SYSTEM_SUBDIR:
            continue
        if entry.is_dir():
            for child in sorted(entry.iterdir()):
                if child.is_file() and not child.name.startswith(".") and child.suffix.lower() in ALLOWED_AUDIO_SUFFIXES:
                    found.append((f"{entry.name}/{child.name}", entry.name, child.stat().st_size))
        elif entry.is_file() and entry.suffix.lower() in ALLOWED_AUDIO_SUFFIXES:
            found.append((entry.name, "", entry.stat().st_size))
    return found


def library_size(directory: Path) -> int:
    """Return the total size of audio files the library directory holds."""
    return sum(size for _, _, size in scan_audio_files(directory))


def remove_file(path: Path) -> None:
    """Delete a managed file; a file that is already gone is not an error."""
    try:
        path.unlink()
    except FileNotFoundError:
        pass
