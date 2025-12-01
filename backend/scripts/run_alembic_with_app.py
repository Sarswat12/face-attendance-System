"""Run Alembic commands under the Flask application context.

This script creates the Flask app (using `create_app()`), pushes an
application context and then invokes Alembic programmatically so that
`env.py` can use `current_app` safely without modification.

Usage:
  python run_alembic_with_app.py

This will run an `upgrade head`. You can modify the script to expose
other Alembic commands if needed.
"""
import os
import sys
from alembic.config import Config
from alembic import command

# Ensure backend package imports work when running from scripts/
REPO_ROOT = os.path.dirname(os.path.dirname(__file__))
if REPO_ROOT not in sys.path:
    sys.path.insert(0, REPO_ROOT)

from backend.app import create_app


def main():
    backend_dir = os.path.join(REPO_ROOT, 'backend')
    alembic_dir = os.path.join(backend_dir, 'alembic_root_migrations')
    ini_path = os.path.join(alembic_dir, 'alembic.ini')

    if not os.path.exists(ini_path):
        print('Could not find alembic.ini at', ini_path)
        sys.exit(1)

    # Create Flask app and push context so env.py can access current_app
    app = create_app()

    # Configure Alembic and ensure script_location is set (prevents config errors)
    cfg = Config(ini_path)
    cfg.set_main_option('script_location', alembic_dir)

    with app.app_context():
        # Run upgrade to head by default
        command.upgrade(cfg, 'head')


if __name__ == '__main__':
    main()
