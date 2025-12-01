"""Simple DB check utility

Usage: python backend/scripts/_db_check.py

Prints masked SQLALCHEMY_DATABASE_URI and engine options, attempts a short
connect to the database and exits with non-zero status if MySQL is required
but not reachable (unless DEV_FALLBACK_SQLITE is enabled).
"""
import sys
import os
from time import sleep

# Ensure repo root is on sys.path so `import backend` works when running
# this script as `python backend/scripts/_db_check.py` (sys.path[0] is the
# scripts dir in that execution mode).
REPO_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
if REPO_ROOT not in sys.path:
    sys.path.insert(0, REPO_ROOT)

try:
    # import here to get the same create_app behavior
    from backend.app import create_app
except Exception as e:
    print('Failed to import create_app():', e)
    sys.exit(2)


def main():
    # Build app and print db info
    try:
        app = create_app()
    except Exception as e:
        print('create_app() failed:', e)
        sys.exit(3)

    uri = app.config.get('SQLALCHEMY_DATABASE_URI')
    opts = app.config.get('SQLALCHEMY_ENGINE_OPTIONS')

    # Mask password for printing
    def _mask(uri_str: str) -> str:
        try:
            from sqlalchemy.engine.url import make_url

            u = make_url(uri_str)
            if u.password:
                u = u._replace(password='***REDACTED***')
            return str(u)
        except Exception:
            if uri_str and '@' in uri_str:
                parts = uri_str.split('@')
                creds = parts[0]
                if ':' in creds:
                    user = creds.split(':')[0]
                    return user + ':***REDACTED***@' + parts[1]
            return uri_str

    print('DB_URI_MASKED=', _mask(uri))
    print('DB_POOL_OPTIONS=', opts)

    # If MySQL required but unreachable create_app() should have failed already.
    # Still try a direct connect for extra assurance.
    from sqlalchemy import create_engine
    try:
        engine = create_engine(uri, pool_pre_ping=True)
        with engine.connect() as conn:
            print('DB connect: OK')
            sys.exit(0)
    except Exception as e:
        dev_fallback = os.getenv('DEV_FALLBACK_SQLITE', '').lower() in ('1', 'true', 'yes')
        print('DB connect failed:', e)
        if dev_fallback:
            print('DEV_FALLBACK_SQLITE set; exiting 0')
            sys.exit(0)
        else:
            print('MySQL required and not reachable; exiting 4')
            sys.exit(4)


if __name__ == '__main__':
    main()
#!/usr/bin/env python
"""Simple DB check utility for the backend.

Prints masked DB URI and engine options and attempts a short connect.
Exits with non-zero if MySQL is not reachable and DEV_FALLBACK_SQLITE is not set.
"""
import sys
import os
import traceback

# Ensure repo root on path
REPO_ROOT = os.path.dirname(os.path.dirname(__file__))
if REPO_ROOT not in sys.path:
    sys.path.insert(0, REPO_ROOT)

from backend.app import create_app


def main():
    try:
        app = create_app()
    except Exception as e:
        print('create_app() failed:', e)
        sys.exit(2)

    uri = app.config.get('SQLALCHEMY_DATABASE_URI')
    opts = app.config.get('SQLALCHEMY_ENGINE_OPTIONS')
    print('Resolved SQLALCHEMY_DATABASE_URI:', uri)
    print('Engine options:', opts)

    # If using MySQL try a short connect
    if uri and uri.startswith('mysql+'):
        try:
            from sqlalchemy import create_engine
            engine = create_engine(uri, pool_pre_ping=True, connect_args={'connect_timeout': 5})
            conn = engine.connect()
            conn.close()
            print('Successfully connected to MySQL')
            sys.exit(0)
        except Exception as e:
            dev_fallback = os.getenv('DEV_FALLBACK_SQLITE', '').lower() in ('1', 'true', 'yes')
            print('MySQL connectivity check failed:', e)
            if dev_fallback:
                print('DEV_FALLBACK_SQLITE set; exiting with code 0')
                sys.exit(0)
            else:
                print('DEV_FALLBACK_SQLITE not set; exiting with code 3')
                traceback.print_exc()
                sys.exit(3)
    else:
        print('Not a MySQL URI; no connectivity check performed')
        sys.exit(0)


if __name__ == '__main__':
    main()
