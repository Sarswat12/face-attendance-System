"""Backend package initializer to make `backend` a proper package.
This file is intentionally minimal to allow package-qualified imports
like `from backend.app import db` and `from backend import models`.
"""

__all__ = ["app", "models"]
