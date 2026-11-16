"""Windows test-only stand-in for the POSIX fcntl module."""
LOCK_EX = LOCK_NB = LOCK_SH = LOCK_UN = 0
F_GETFL = F_SETFL = 0
def flock(*_a, **_k): return None
def lockf(*_a, **_k): return None
def fcntl(*_a, **_k): return 0
def ioctl(*_a, **_k): return 0
