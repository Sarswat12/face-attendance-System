from flask import Blueprint, request, jsonify, make_response, current_app
from backend.extensions import db
from backend.models import User, RoleEnum, RefreshToken
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
import bcrypt
import datetime
import secrets
from datetime import timedelta
from flask import current_app
from backend.utils.ratelimit import get_limit_decorator


auth_bp = Blueprint('auth', __name__)


def _user_payload(user: User):
    return {
        'user_id': user.user_id,
        'name': user.name,
        'role': user.role.value if hasattr(user.role, 'value') else str(user.role),
        'id': user.id,
    }


@auth_bp.route('/login', methods=['POST'])
def login():
    # apply limiter decorator at runtime to avoid import-time dependency
    decorator = get_limit_decorator(current_app, '10 per minute')
    return decorator(_login_impl)()  # Call the _login_impl wrapper


def _login_impl():
    data = request.get_json() or {}
    email = data.get('email')
    password = data.get('password')
    if not email or not password:
        return jsonify({'error': 'email and password required'}), 400

    # Allow login by email or by user_id (EMP000001 etc.) for convenience
    user = None
    if email:
        user = User.query.filter_by(email=email).first()
    if not user:
        # try by user_id
        user = User.query.filter_by(user_id=email).first()
    if not user or not user.password_hash:
        return jsonify({'error': 'invalid credentials'}), 401

    try:
        ok = bcrypt.checkpw(password.encode('utf-8'), user.password_hash.encode('utf-8'))
    except Exception:
        ok = False
    # Fallback: some older records may store unhashed or non-bcrypt passwords.
    # If bcrypt check failed and the stored password doesn't look like a bcrypt
    # hash, allow a direct plaintext comparison as a migration convenience.
    try:
        if not ok and user.password_hash:
            ph = user.password_hash
            if not ph.startswith('$2') and len(ph) < 60:
                # treat as legacy plaintext (insecure) and compare
                if password == ph:
                    ok = True
                    current_app.logger.warning('Auth: accepted legacy plaintext password for user %s', user.id)
                    # Migrate: replace legacy plaintext with bcrypt hash
                    try:
                        new_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
                        user.password_hash = new_hash
                        db.session.add(user)
                        db.session.commit()
                        current_app.logger.info('Auth: migrated password to bcrypt for user %s', user.id)
                    except Exception:
                        try:
                            db.session.rollback()
                        except Exception:
                            pass
    except Exception:
        pass
    if not ok:
        return jsonify({'error': 'invalid credentials'}), 401

    access_token = create_access_token(identity=str(user.id))
    # issue a refresh token and persist it
    refresh_token = secrets.token_urlsafe(64)
    expires_at = datetime.datetime.utcnow() + timedelta(days=current_app.config.get('REFRESH_TOKEN_EXPIRES_DAYS', 30))
    rt = RefreshToken(user_id=user.id, token=refresh_token, expires_at=expires_at)
    db.session.add(rt)
    db.session.commit()

    payload = _user_payload(user)
    resp = jsonify({'token': access_token, 'user_id': payload['user_id'], 'name': payload['name'], 'role': payload['role']})
    cookie_name = current_app.config.get('REFRESH_COOKIE_NAME', 'refresh_token')
    secure_flag = current_app.config.get('REFRESH_COOKIE_SECURE', False)
    max_age = int(current_app.config.get('REFRESH_TOKEN_EXPIRES_DAYS', 30)) * 24 * 3600
    resp.set_cookie(cookie_name, refresh_token, httponly=True, secure=secure_flag, samesite='Lax', path='/api/auth', max_age=max_age)
    return resp


@auth_bp.route('/register', methods=['POST'])
def register():
    # Ensure JSON request
    if not request.is_json:
        return jsonify({'error': 'expected application/json'}), 400
    data = request.get_json(silent=True) or {}

    # Debug log headers and body in dev mode
    try:
        if current_app.debug:
            current_app.logger.debug('Auth register headers: %s', dict(request.headers))
            current_app.logger.debug('Auth register body: %s', data)
    except Exception:
        pass

    name = data.get('name')
    email = data.get('email')
    password = data.get('password')
    role = data.get('role') or 'employee'

    missing = [k for k in ('name', 'email', 'password') if not data.get(k)]
    if missing:
        return jsonify({'error': 'Missing fields', 'missing': missing}), 400

    # basic email & password validation
    import re
    if not re.match(r'^[^@\s]+@[^@\s]+\.[^@\s]+$', email or ''):
        return jsonify({'error': 'invalid email format'}), 400
    if not isinstance(password, str) or len(password) < 6:
        return jsonify({'error': 'password too short (min 6)'},), 400

    if User.query.filter_by(email=email).first():
        return jsonify({'error': 'email already registered'}), 400

    pw_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    # normalize role to RoleEnum
    try:
        role_enum = RoleEnum(role)
    except Exception:
        role_enum = RoleEnum.employee

    # create user inside try/except to rollback on DB errors
    try:
        user = User(name=name, email=email, password_hash=pw_hash, role=role_enum)
        db.session.add(user)
        db.session.commit()
        # generate human-friendly user_id if not provided
        if not user.user_id:
            user.user_id = f"EMP{user.id:06d}"
            db.session.commit()

        access_token = create_access_token(identity=str(user.id))
        # issue refresh token
        refresh_token = secrets.token_urlsafe(64)
        expires_at = datetime.datetime.utcnow() + timedelta(days=current_app.config.get('REFRESH_TOKEN_EXPIRES_DAYS', 30))
        rt = RefreshToken(user_id=user.id, token=refresh_token, expires_at=expires_at)
        db.session.add(rt)
        db.session.commit()
        resp = jsonify({'token': access_token, 'user_id': user.user_id, 'name': user.name, 'role': user.role.value if hasattr(user.role, 'value') else str(user.role)})
        cookie_name = current_app.config.get('REFRESH_COOKIE_NAME', 'refresh_token')
        secure_flag = current_app.config.get('REFRESH_COOKIE_SECURE', False)
        max_age = int(current_app.config.get('REFRESH_TOKEN_EXPIRES_DAYS', 30)) * 24 * 3600
        resp.set_cookie(cookie_name, refresh_token, httponly=True, secure=secure_flag, samesite='Lax', path='/api/auth', max_age=max_age)
        return resp
    except Exception as e:
        try:
            db.session.rollback()
        except Exception:
            pass
        current_app.logger.exception('Failed to create user')
        return jsonify({'error': 'internal server error', 'detail': str(e)}), 500


@auth_bp.route('/verify-token', methods=['GET'])
@jwt_required()
def verify_token():
    uid = get_jwt_identity()
    try:
        user = db.session.get(User, int(uid))
    except Exception:
        user = db.session.get(User, uid)
    if not user:
        return jsonify({'valid': False}), 401
    return jsonify({'valid': True, 'user_id': user.user_id, 'name': user.name, 'role': user.role.value if hasattr(user.role, 'value') else str(user.role)})


@auth_bp.route('/refresh', methods=['POST'])
def refresh():
    # Cookie-based refresh with rotation-on-use.
    data = request.get_json(silent=True) or {}
    cookie_name = current_app.config.get('REFRESH_COOKIE_NAME', 'refresh_token')
    token = data.get('refresh_token') or request.cookies.get(cookie_name)
    if not token:
        return jsonify({'error': 'refresh_token required'}), 400

    rt = RefreshToken.query.filter_by(token=token, revoked=False).first()
    if not rt:
        return jsonify({'error': 'invalid or revoked refresh token'}), 401
    if rt.expires_at and rt.expires_at < datetime.datetime.utcnow():
        return jsonify({'error': 'refresh token expired'}), 401

    try:
        user = db.session.get(User, int(rt.user_id))
    except Exception:
        user = db.session.get(User, rt.user_id)
    if not user:
        return jsonify({'error': 'user not found'}), 404

    # rotation: revoke old token and issue a new one
    rt.revoked = True
    new_refresh = secrets.token_urlsafe(64)
    expires_at = datetime.datetime.utcnow() + timedelta(days=current_app.config.get('REFRESH_TOKEN_EXPIRES_DAYS', 30))
    new_rt = RefreshToken(user_id=user.id, token=new_refresh, expires_at=expires_at)
    db.session.add(new_rt)
    db.session.commit()

    access_token = create_access_token(identity=str(user.id))
    resp = jsonify({'token': access_token, 'user_id': user.user_id, 'name': user.name, 'role': user.role.value if hasattr(user.role, 'value') else str(user.role)})
    secure_flag = current_app.config.get('REFRESH_COOKIE_SECURE', False)
    max_age = int(current_app.config.get('REFRESH_TOKEN_EXPIRES_DAYS', 30)) * 24 * 3600
    resp.set_cookie(cookie_name, new_refresh, httponly=True, secure=secure_flag, samesite='Lax', path='/api/auth', max_age=max_age)
    return resp


@auth_bp.route('/revoke-refresh', methods=['POST'])
@jwt_required()
def revoke_refresh():
    # Revoke a single refresh token (admin or token owner). Accepts token
    # either in JSON body or as cookie.
    data = request.get_json(silent=True) or {}
    cookie_name = current_app.config.get('REFRESH_COOKIE_NAME', 'refresh_token')
    token = data.get('refresh_token') or request.cookies.get(cookie_name)
    if not token:
        return jsonify({'error': 'refresh_token required'}), 400
    rt = RefreshToken.query.filter_by(token=token).first()
    if not rt:
        return jsonify({'error': 'not found'}), 404

    # only owner or admin may revoke
    caller_id = get_jwt_identity()
    try:
        caller = db.session.get(User, int(caller_id)) if caller_id else None
    except Exception:
        caller = db.session.get(User, caller_id) if caller_id else None
    is_admin = caller and (getattr(caller.role, 'value', str(caller.role)) == 'admin')
    if rt.user_id != int(caller_id) and not is_admin:
        return jsonify({'error': 'permission denied'}), 403

    rt.revoked = True
    db.session.commit()
    # clear cookie for caller
    resp = jsonify({'revoked': True})
    resp.set_cookie(cookie_name, '', httponly=True, secure=current_app.config.get('REFRESH_COOKIE_SECURE', False), samesite='Lax', path='/api/auth', max_age=0)
    return resp


@auth_bp.route('/oauth/google', methods=['POST'])
def oauth_google():
    # Stub endpoint: real Google OAuth requires client credentials and server-side exchange.
    data = request.get_json(silent=True) or {}
    # In future: accept authCode, exchange with Google, lookup/create user, return tokens.
    return jsonify({'error': 'Google OAuth backend not implemented on server. Please configure OAuth or remove frontend placeholder.'}), 501
