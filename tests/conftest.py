"""Shared pytest configuration."""

from __future__ import annotations

import sys

import pytest

if sys.platform == "win32":
    import pytest_socket

    # The Windows event loop needs a loopback socketpair, which pytest-socket blocks.
    pytest_socket.disable_socket = lambda *args, **kwargs: None


@pytest.fixture(autouse=True)
def auto_enable_custom_integrations(enable_custom_integrations: None) -> None:
    """Let Home Assistant load custom_components/hi_sosed in every test."""
