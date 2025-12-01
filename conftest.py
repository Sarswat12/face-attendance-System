"""Pytest configuration helper.

Ensure the project root is on sys.path so tests can import the `backend`
package reliably when running `pytest` from the repository root or from
other working directories.
"""
import os
import sys

# Insert the repository root (one level up from this file) at the front
# of sys.path so imports like `from backend.app import create_app` work.
REPO_ROOT = os.path.dirname(__file__)
if REPO_ROOT not in sys.path:
    sys.path.insert(0, REPO_ROOT)
