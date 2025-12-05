#!/usr/bin/env python3
"""
One-off helper to create tables using the application's models.
This script loads environment variables (including `SQLALCHEMY_DATABASE_URI`),
creates the Flask app via `create_app()` and runs `db.create_all()` inside the
application context.

Usage: set `SQLALCHEMY_DATABASE_URI` in the environment (or in .env) and run:
    python create_tables.py

Do NOT echo secrets to logs.
"""
from dotenv import load_dotenv
import os
import sys

# make repo root available for imports
REPO_ROOT = os.path.dirname(os.path.abspath(__file__))
if REPO_ROOT not in sys.path:
    sys.path.insert(0, REPO_ROOT)

# load env files if present
load_dotenv()

from backend.app import create_app
from backend.extensions import db


def _mask_db_uri(uri: str) -> str:
    try:
        from sqlalchemy.engine.url import make_url

        u = make_url(uri)
        if u.password:
            u = u._replace(password='***REDACTED***')
        return str(u)
    except Exception:
        if not uri:
            return ''
        # naive mask
        if '@' in uri and ':' in uri:
            parts = uri.split('@')
            creds = parts[0]
            if ':' in creds:
                user = creds.split(':')[0]
                return user + ':***REDACTED***@' + parts[1]
        return uri


def main():
    uri = os.getenv('SQLALCHEMY_DATABASE_URI', '')
    if not uri:
        print('ERROR: SQLALCHEMY_DATABASE_URI not set in environment')
        sys.exit(2)

    print('Using DB (masked):', _mask_db_uri(uri))

    # Ensure AUTO_MIGRATE is enabled for this run so create_app() will run create_all
    os.environ['AUTO_MIGRATE'] = 'true'

    app = create_app()

    with app.app_context():
        try:
            db.create_all()
            print('SUCCESS: Tables created or verified successfully')
        except Exception as e:
            print('ERROR: Failed to create tables:', e)
            raise


if __name__ == '__main__':
    main()
