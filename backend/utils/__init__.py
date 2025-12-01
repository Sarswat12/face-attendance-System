
"""utils package for backend helpers

This package exposes small helper utilities. Historically some helpers
were defined in `backend/utils.py`. To avoid import ambiguity we now
provide them under `backend.utils.helpers` and re-export commonly used
symbols here so older imports like `from backend.utils import admin_required`
continue to work.
"""
from .helpers import admin_required

__all__ = ["admin_required"]

