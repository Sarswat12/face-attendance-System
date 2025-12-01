from functools import wraps
from flask import jsonify
from flask_jwt_extended import get_jwt_identity
from backend.models import User
from backend.extensions import db


def admin_required(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        uid = get_jwt_identity()
        if not uid:
            return jsonify({'error': 'admin required'}), 401
        try:
            user = db.session.get(User, int(uid))
        except Exception:
            user = db.session.get(User, uid)
        role = getattr(user.role, 'value', str(user.role)) if user else None
        if role != 'admin':
            return jsonify({'error': 'admin required'}), 403
        return fn(*args, **kwargs)

    return wrapper
