from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from dotenv import load_dotenv
import os
import sys
import logging
import datetime

# Ensure the repository root is on sys.path so the `backend` package
# can be imported when running `python app.py` from the `backend` folder.
# This makes package-qualified imports like `from backend.models import ...`
# work even when the script is executed directly.
REPO_ROOT = os.path.dirname(os.path.dirname(__file__))
if REPO_ROOT not in sys.path:
    sys.path.insert(0, REPO_ROOT)

# Prefer loading `backend/.env` (repo-local) so DB credentials in that file
# are picked up when running from repo root or from `backend/` directory.
backend_env = os.path.join(REPO_ROOT, 'backend', '.env')
if os.path.exists(backend_env):
    load_dotenv(backend_env)
# Also load top-level .env if present (does not overwrite existing vars)
load_dotenv()

from backend.extensions import db
jwt = JWTManager()
# configure module-level logger early
logger = logging.getLogger('backend')
logger.setLevel(logging.INFO)
handler = logging.StreamHandler()
handler.setFormatter(logging.Formatter('%(asctime)s %(levelname)s %(name)s %(message)s'))
logger.addHandler(handler)

# limiter will be initialized inside create_app if Flask-Limiter is available
limiter = None


def create_app():
    app = Flask(__name__)

    ROOT = os.path.dirname(os.path.dirname(__file__))
    UPLOAD_FOLDER = os.path.join(ROOT, 'backend', 'uploads')
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)

    # Helper utils for env parsing and logging
    def _get_env_bool(name, default=False):
        v = os.getenv(name, None)
        if v is None:
            return bool(default)
        return str(v).lower() in ('1', 'true', 'yes')

    def _mask_db_uri(uri: str) -> str:
        try:
            from sqlalchemy.engine.url import make_url

            u = make_url(uri)
            if u.password:
                u = u._replace(password='***REDACTED***')
            return str(u)
        except Exception:
            # Fallback simple redact
            if '@' in uri and ':' in uri:
                parts = uri.split('@')
                creds = parts[0]
                if ':' in creds:
                    user = creds.split(':')[0]
                    return user + ':***REDACTED***@' + parts[1]
            return uri

    DB_USER = os.getenv('DB_USER', 'root')
    DB_PASS = os.getenv('DB_PASSWORD', '')
    DB_HOST = os.getenv('DB_HOST', '127.0.0.1')
    DB_PORT = os.getenv('DB_PORT', '3306')
    DB_NAME = os.getenv('DB_NAME', 'face_attendance')

    # Read toggles
    # Enforce MySQL-only operation by ignoring any SQLite fallback flags.
    # Projects sometimes leave `USE_SQLITE` or `DEV_FALLBACK_SQLITE` set in
    # local shells or .env files; to ensure the app always uses MySQL, we
    # ignore these and require a proper MySQL URI/credentials and driver.
    if _get_env_bool('USE_SQLITE', False):
        logger.warning('USE_SQLITE is set but this application requires MySQL; ignoring USE_SQLITE.')
    use_sqlite_env = False
    if _get_env_bool('USE_SQLITE_FILE', False):
        logger.warning('USE_SQLITE_FILE is set but this application requires MySQL; ignoring USE_SQLITE_FILE.')
    use_sqlite_file = False
    if _get_env_bool('DEV_FALLBACK_SQLITE', False):
        logger.warning('DEV_FALLBACK_SQLITE is set but this application requires MySQL; ignoring DEV_FALLBACK_SQLITE.')
    dev_fallback = False

    # Determine if we're running in production-like mode (affects fail-fast)
    is_production = os.getenv('FLASK_ENV', '').lower() == 'production' or (not app.config.get('TESTING', False) and not app.debug)

    # Allow explicit SQLALCHEMY_DATABASE_URI env var to override
    explicit_uri = os.getenv('SQLALCHEMY_DATABASE_URI', '')

    final_uri = None

    # If an explicit URI provided, use that
    if explicit_uri:
        final_uri = explicit_uri
    else:
        # If USE_SQLITE explicitly requested, only allow when dev_fallback set
        if use_sqlite_env:
            if not dev_fallback:
                logger.critical('USE_SQLITE requested but DEV_FALLBACK_SQLITE is not set; refusing to run in non-dev mode')
                raise RuntimeError('SQLite fallback requested but DEV_FALLBACK_SQLITE is not enabled')
            if use_sqlite_file:
                db_path = os.path.join(REPO_ROOT, 'backend_dev.db')
                final_uri = f'sqlite:///{db_path}'
            else:
                final_uri = 'sqlite:///:memory:'
        else:
            # If no DB-related env vars were provided at all, treat this as
            # a misconfiguration in production and fail fast (tests may set
            # envs explicitly when needed).
            # Consider DB configured only if non-default values are present.
            has_non_default = any([
                os.getenv('DB_USER') not in (None, '', 'root'),
                os.getenv('DB_PASSWORD') not in (None, ''),
                os.getenv('DB_HOST') not in (None, '', '127.0.0.1'),
                os.getenv('DB_NAME') not in (None, '', 'face_attendance'),
                bool(os.getenv('SQLALCHEMY_DATABASE_URI')),
            ])
            if is_production and (not has_non_default) and (not dev_fallback) and (not app.config.get('TESTING', False)):
                logger.critical('No database environment variables provided and DEV_FALLBACK_SQLITE is not set; refusing to start in production')
                raise RuntimeError('Database misconfigured: no DB env provided in production')

            # Build MySQL URI from parts; pick a driver based on available packages
            from urllib.parse import quote_plus

            safe_pass = quote_plus(DB_PASS or '')

            # Detect available driver
            driver = None
            try:
                import MySQLdb as _mysqldb  # mysqlclient

                driver = 'mysqldb'
                logger.info('mysqlclient (MySQLdb) available; using mysql+mysqldb driver')
            except Exception:
                try:
                    import pymysql

                    # Make pymysql present as MySQLdb to satisfy libraries that expect it
                    try:
                        pymysql.install_as_MySQLdb()
                    except Exception:
                        pass
                    driver = 'pymysql'
                    logger.info('pymysql available; using mysql+pymysql driver')
                except Exception:
                    driver = None

            if driver is None:
                # No mysql client installed; potentially allow dev fallback
                if dev_fallback:
                    logger.warning('No MySQL driver installed; falling back to SQLite due to DEV_FALLBACK_SQLITE=1')
                    db_path = os.path.join(REPO_ROOT, 'backend_dev.db')
                    final_uri = f'sqlite:///{db_path}'
                else:
                    logger.critical('No MySQL driver (mysqlclient or pymysql) installed and DEV_FALLBACK_SQLITE not set')
                    raise RuntimeError('No MySQL driver installed; install mysqlclient or pymysql')
            else:
                if driver == 'mysqldb':
                    final_uri = f'mysql+mysqldb://{DB_USER}:{safe_pass}@{DB_HOST}:{DB_PORT}/{DB_NAME}?charset=utf8mb4'
                else:
                    final_uri = f'mysql+pymysql://{DB_USER}:{safe_pass}@{DB_HOST}:{DB_PORT}/{DB_NAME}?charset=utf8mb4'

    # Enforce production-only MySQL requirement
    is_production = os.getenv('FLASK_ENV', '').lower() == 'production' or (not app.config.get('TESTING', False) and not app.debug)
    if is_production and (not final_uri.startswith('mysql+')) and (not dev_fallback) and (not app.config.get('TESTING', False)):
        app.logger.critical('Database misconfigured: MySQL required in non-dev mode. Final URI: %s', _mask_db_uri(final_uri))
        raise RuntimeError('Database misconfigured: MySQL required in non-dev mode')

    app.config['SQLALCHEMY_DATABASE_URI'] = final_uri
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    # Compute default SQLAlchemy engine options (pooling). These are only
    # applied for MySQL dialects; SQLite (esp in-memory used in tests)
    # does not accept pool_size/max_overflow kwargs.
    pool_opts = {
        'pool_size': int(os.getenv('DB_POOL_SIZE', 10)),
        'max_overflow': int(os.getenv('DB_MAX_OVERFLOW', 20)),
        'pool_recycle': int(os.getenv('DB_POOL_RECYCLE', 1800)),
        'pool_timeout': int(os.getenv('DB_POOL_TIMEOUT', 30)),
    }

    if app.config['SQLALCHEMY_DATABASE_URI'].startswith('mysql+'):
        app.config['SQLALCHEMY_ENGINE_OPTIONS'] = pool_opts
    else:
        # For in-memory sqlite used in tests, allow check_same_thread
        if app.config['SQLALCHEMY_DATABASE_URI'].startswith('sqlite') and ':memory:' in app.config['SQLALCHEMY_DATABASE_URI']:
            app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {'connect_args': {'check_same_thread': False}}
        else:
            app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {}

    # Log resolved DB URI and engine options (mask password)
    logger.info('LOG MSG: DB_URI_MASKED=%s', _mask_db_uri(app.config['SQLALCHEMY_DATABASE_URI']))
    logger.info('LOG MSG: DB_POOL_OPTIONS=%s', app.config['SQLALCHEMY_ENGINE_OPTIONS'])

    # Quick connection test for MySQL (fail-fast in prod)
    try:
        from sqlalchemy import create_engine

        test_engine_args = {}
        # set a short connect timeout for MySQL drivers
        if app.config['SQLALCHEMY_DATABASE_URI'].startswith('mysql+'):
            test_engine_args['connect_args'] = {'connect_timeout': int(os.getenv('DB_CONNECT_TIMEOUT', 5))}
        test_engine = create_engine(app.config['SQLALCHEMY_DATABASE_URI'], pool_pre_ping=True, **test_engine_args)
        conn = test_engine.connect()
        conn.close()
    except Exception as e:
        if dev_fallback:
            logger.warning('DB connectivity check failed (%s). Falling back to SQLite due to DEV_FALLBACK_SQLITE=1.', e)
            db_path = os.path.join(REPO_ROOT, 'backend_dev.db')
            app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{db_path}'
        else:
            app.logger.critical('Could not connect to MySQL during startup: %s', e)
            raise RuntimeError(f'Could not connect to MySQL during startup: {e}')
    
    # JWT configuration - require secure key in production
    jwt_secret = os.getenv('JWT_SECRET_KEY')
    if not jwt_secret and os.getenv('FLASK_ENV') != 'development':
        raise RuntimeError('JWT_SECRET_KEY environment variable is required in production')
    app.config['JWT_SECRET_KEY'] = jwt_secret or 'change-me-dev'

    # Cookie and token lifetime settings
    app.config['JWT_COOKIE_SECURE'] = os.getenv('JWT_COOKIE_SECURE', 'true').lower() in ('1', 'true', 'yes')
    app.config['JWT_COOKIE_SAMESITE'] = os.getenv('JWT_COOKIE_SAMESITE', 'Lax')
    try:
        access_exp_min = int(os.getenv('JWT_ACCESS_TOKEN_EXPIRES_MINUTES', '15'))
        refresh_exp_days = int(os.getenv('JWT_REFRESH_TOKEN_EXPIRES_DAYS', '30'))
        app.config['JWT_ACCESS_TOKEN_EXPIRES'] = datetime.timedelta(minutes=access_exp_min)
        app.config['JWT_REFRESH_TOKEN_EXPIRES'] = datetime.timedelta(days=refresh_exp_days)
    except Exception:
        app.config['JWT_ACCESS_TOKEN_EXPIRES'] = datetime.timedelta(minutes=15)
        app.config['JWT_REFRESH_TOKEN_EXPIRES'] = datetime.timedelta(days=30)
    app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

    # Refresh token cookie settings
    # Name of the cookie used to store refresh tokens (HttpOnly)
    app.config['REFRESH_COOKIE_NAME'] = os.getenv('REFRESH_COOKIE_NAME', 'refresh_token')
    # Whether to set the Secure flag on the refresh cookie. Disable in local testing.
    app.config['REFRESH_COOKIE_SECURE'] = os.getenv('REFRESH_COOKIE_SECURE', 'false').lower() in ('1', 'true', 'yes')
    # Refresh token lifetime (days)
    try:
        app.config['REFRESH_TOKEN_EXPIRES_DAYS'] = int(os.getenv('REFRESH_TOKEN_EXPIRES_DAYS', '30'))
    except Exception:
        app.config['REFRESH_TOKEN_EXPIRES_DAYS'] = 30

    # Allow credentials from the frontend origin(s). Default to common dev ports.
    CORS_ORIGINS = os.getenv('CORS_ORIGINS', 'http://localhost:3000,http://localhost:5173')
    origins = [o.strip() for o in CORS_ORIGINS.split(',') if o.strip()]
    CORS(app, supports_credentials=True, resources={r"/api/*": {"origins": origins}})
    db.init_app(app)
    # initialize rate limiter if Flask-Limiter is available
    try:
        from flask_limiter import Limiter
        from flask_limiter.util import get_remote_address

        _limiter = Limiter(key_func=get_remote_address, default_limits=[])
        _limiter.init_app(app)
        # store on app.extensions for other modules to find
        app.extensions['limiter'] = _limiter
    except Exception:
        logger.info('Flask-Limiter not installed or failed to initialize; continuing without rate limits')
    # initialize migrations only if Flask-Migrate is installed; keep
    # import local so `import backend.app` doesn't raise when the
    # migration package is not available in the environment.
    try:
        from flask_migrate import Migrate

        migrate = Migrate()
        migrate.init_app(app, db)
    except ImportError:
        # Flask-Migrate not installed — migration commands will be unavailable.
        app.logger.info('Flask-Migrate not installed; skipping migration init')
    jwt.init_app(app)

    # import models so tables are registered (use package-qualified import
    # to avoid creating two module objects for the same file which can
    # cause SQLAlchemy to register the same Table twice)
    import backend.models  # noqa: F401

    # register blueprints
    # Use package-qualified imports to be robust whether app is run as a
    # script or as a package module.
    from backend.routes.auth import auth_bp
    from backend.routes.users import users_bp
    from backend.routes.attendance import attendance_bp
    from backend.routes.face import face_bp
    from backend.routes.statistics import statistics_bp

    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(users_bp, url_prefix='/api')
    app.register_blueprint(attendance_bp, url_prefix='/api/attendance')
    app.register_blueprint(face_bp, url_prefix='/api/face')
    app.register_blueprint(statistics_bp, url_prefix='/api/statistics')

    @app.route('/')
    def index():
        return 'Backend is running', 200

    @app.route('/health')
    def health():
        return jsonify({'status': 'ok'})

    # serve uploaded files (avatars / faces)
    @app.route('/uploads/<path:filename>')
    def uploaded_file(filename):
        return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

    with app.app_context():
        # Only run automatic schema creation when explicitly enabled. This
        # prevents the live application from attempting DDL on every startup.
        auto_migrate = os.getenv('AUTO_MIGRATE', '').lower() == 'true'
        if auto_migrate:
            try:
                db.create_all()
                app.logger.info('AUTO_MIGRATE enabled: tables created or already present')
            except Exception as e:
                # Detect MySQL 'table exists' error (errno 1050) and continue; re-raise otherwise.
                try:
                    from sqlalchemy.exc import OperationalError

                    if isinstance(e, OperationalError) and hasattr(e, 'orig'):
                        orig = e.orig
                        # pymysql and mysqlclient expose errno as first arg in .args
                        if hasattr(orig, 'args') and len(orig.args) and orig.args[0] == 1050:
                            app.logger.info('Tables already exist, skipping create_all')
                        else:
                            raise
                    else:
                        # For other DBAPIs, check message text for 'already exists'
                        if 'already exists' in str(e).lower():
                            app.logger.info('Tables already exist, skipping create_all')
                        else:
                            raise
                except Exception:
                    # If anything unexpected occurs while inspecting, re-raise the original
                    raise

            # Runtime best-effort: if new Attendance columns were added in code but
            # migrations haven't been applied (dev environment), attempt to add them
            # so endpoints that SELECT these columns don't fail with OperationalError.
            try:
                engine = db.get_engine(app)
                with engine.connect() as conn:
                    # Add columns if they don't exist. Some DBs support IF NOT EXISTS.
                    try:
                        conn.execute("""
                            ALTER TABLE attendance
                            ADD COLUMN IF NOT EXISTS local_timestamp DATETIME NULL,
                            ADD COLUMN IF NOT EXISTS latitude DOUBLE NULL,
                            ADD COLUMN IF NOT EXISTS longitude DOUBLE NULL
                        """)
                    except Exception:
                        # Fallback: try individual ALTERs without IF NOT EXISTS
                        try:
                            conn.execute("ALTER TABLE attendance ADD COLUMN local_timestamp DATETIME NULL")
                        except Exception:
                            pass
                        try:
                            conn.execute("ALTER TABLE attendance ADD COLUMN latitude DOUBLE NULL")
                        except Exception:
                            pass
                        try:
                            conn.execute("ALTER TABLE attendance ADD COLUMN longitude DOUBLE NULL")
                        except Exception:
                            pass
                    # Attempt to add the new 'note' column used for special audit flags
                    try:
                        conn.execute("ALTER TABLE attendance ADD COLUMN IF NOT EXISTS note VARCHAR(128) NULL")
                    except Exception:
                        try:
                            conn.execute("ALTER TABLE attendance ADD COLUMN note VARCHAR(128) NULL")
                        except Exception:
                            pass
            except Exception:
                # Don't block app startup if DB doesn't permit DDL here.
                app.logger.info('Runtime migration: skipping attendance column additions')
        else:
            app.logger.info('AUTO_MIGRATE not enabled; skipping automatic create_all and runtime DDL')

    return app


if __name__ == '__main__':
    app = create_app()
    host = os.getenv('API_HOST', '0.0.0.0')
    port = int(os.getenv('API_PORT', 8000))
    # Example: run a quick query inside app context (safe - will catch DB errors)
    with app.app_context():
        try:
            # import here to avoid circular imports at module-import time
            from backend.models import User
            count = User.query.count()
            print(f"Users in DB: {count}")
        except Exception as e:
            print("Could not run example DB query:", e)

    app.run(host=host, port=port, debug=(os.getenv('FLASK_ENV') == 'development'))
