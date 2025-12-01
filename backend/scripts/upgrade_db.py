#!/usr/bin/env python3
import os
import sys
import subprocess

# Ensure repo root is on sys.path so `import backend` works when this
# script is run from any CWD.
REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
if REPO_ROOT not in sys.path:
    sys.path.insert(0, REPO_ROOT)

from backend.app import create_app
try:
    from flask_migrate import upgrade
except ImportError:
    upgrade = None
    # Try to use Alembic programmatically as a fallback
    try:
        from alembic.config import Config as AlembicConfig
        from alembic import command as alembic_command
    except ImportError:
        AlembicConfig = None
        alembic_command = None

app = create_app()
with app.app_context():
    # We keep the generated Alembic artifacts in `backend/alembic_root_migrations`
    migrations_dir = os.path.join(os.path.dirname(__file__), '..', 'alembic_root_migrations')
    if upgrade is not None:
        upgrade(directory=str(migrations_dir))
        print('Upgrade complete (programmatic)')
    elif AlembicConfig is not None and alembic_command is not None:
        # Use Alembic directly. Point it at the migrations directory we moved into backend.
        cfg_path = os.path.join(migrations_dir, 'alembic.ini')
        cfg = AlembicConfig(cfg_path)
        cfg.set_main_option('script_location', migrations_dir)
        # Run upgrade to head
        alembic_command.upgrade(cfg, 'head')
        print('Upgrade complete (alembic.command)')
    else:
        raise RuntimeError('No migration backend available (flask_migrate or alembic required)')
