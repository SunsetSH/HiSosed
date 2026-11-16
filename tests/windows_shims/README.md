Stand-ins for POSIX-only modules so `pytest-homeassistant-custom-component`
can import Home Assistant on Windows. Use only for local runs:

    PYTHONPATH=tests/windows_shims .venv/Scripts/python -m pytest

CI runs on Linux without them.
