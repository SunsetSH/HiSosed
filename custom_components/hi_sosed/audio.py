"""Pure audio helpers: container sniffing and procedurally generated clips.

Generated clips are original works of this project (HS-FR-028); they need no
codec and no third-party files.
"""

from __future__ import annotations

import io
import math
import struct
import wave
from random import Random

_RATE = 22050


def sniff_matches(suffix: str, head: bytes) -> bool:
    """Return True when the first bytes look like the declared audio container."""
    if suffix == ".wav":
        return head[:4] == b"RIFF" and head[8:12] == b"WAVE"
    if suffix == ".flac":
        return head[:4] == b"fLaC"
    if suffix in (".ogg", ".opus"):
        return head[:4] == b"OggS"
    if suffix == ".m4a":
        return head[4:8] == b"ftyp"
    if suffix == ".mp3":
        return head[:3] == b"ID3" or (len(head) > 1 and head[0] == 0xFF and head[1] & 0xE0 == 0xE0)
    if suffix == ".aac":
        return head[:3] == b"ID3" or (len(head) > 1 and head[0] == 0xFF and head[1] & 0xF6 == 0xF0)
    return False


def _wav(samples: list[float]) -> bytes:
    buffer = io.BytesIO()
    with wave.open(buffer, "wb") as handle:
        handle.setnchannels(1)
        handle.setsampwidth(2)
        handle.setframerate(_RATE)
        handle.writeframes(b"".join(struct.pack("<h", int(max(-1.0, min(1.0, s)) * 32000)) for s in samples))
    return buffer.getvalue()


def silence_wav(seconds: float = 1.0) -> bytes:
    """Return a silent clip used to keep sleepy Bluetooth speakers awake."""
    return _wav([0.0] * int(_RATE * seconds))


def beep_wav() -> bytes:
    """Return a short two-tone test signal."""
    samples = []
    for index in range(int(_RATE * 0.5)):
        t = index / _RATE
        freq = 660 if t < 0.25 else 880
        envelope = min(1.0, t * 80, (0.5 - t) * 80)
        samples.append(0.5 * envelope * math.sin(2 * math.pi * freq * t))
    return _wav(samples)


def _knock(rng: Random, gain: float, pitch: float) -> list[float]:
    samples = []
    for index in range(int(_RATE * 0.18)):
        t = index / _RATE
        body = math.sin(2 * math.pi * pitch * t) * math.exp(-t * 38)
        click = (rng.random() * 2 - 1) * math.exp(-t * 260)
        samples.append(gain * (0.8 * body + 0.5 * click))
    return samples


def starter_clips() -> list[tuple[str, bytes]]:
    """Return the built-in starter pack as (name, wav bytes)."""
    rng = Random(20261116)
    gap = [0.0] * int(_RATE * 0.14)
    return [
        ("Стук", _wav(_knock(rng, 0.9, 95))),
        ("Двойной стук", _wav(_knock(rng, 0.9, 100) + gap + _knock(rng, 0.85, 92))),
        ("Тихий стук", _wav(_knock(rng, 0.35, 120))),
        ("Серия ударов", _wav([s for i in range(4) for s in _knock(rng, 0.8 - i * 0.08, 90 + i * 4) + gap])),
    ]
