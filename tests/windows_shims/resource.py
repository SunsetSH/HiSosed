"""Windows test-only stand-in for the POSIX resource module."""
RLIMIT_NOFILE = 7
RLIM_INFINITY = -1
def getrlimit(_r): return (1024, 4096)
def setrlimit(_r, _l): return None
