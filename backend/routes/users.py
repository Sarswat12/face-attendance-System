from flask import Blueprint, request, jsonify, abort
from backend.extensions import db
from backend.models import User, RoleEnum
from flask_jwt_extended import jwt_required, get_jwt_identity
from flask import current_app
from backend.utils import admin_required

users_bp = Blueprint('users', __name__)


def _serialize_user(u: User):
    return {
        'id': u.id,
        'user_id': u.user_id,
        'name': u.name,
        'email': u.email,
        'role': u.role.value if hasattr(u.role, 'value') else str(u.role),
        'department': u.department,
        'avatar': u.avatar,
        'status': u.status,
        'joinDate': u.join_date.isoformat() if u.join_date else None,
        'address': u.address,
        'phone': u.phone,
        'created_at': u.created_at.isoformat() if u.created_at else None,
    }


@users_bp.route('/users', methods=['GET'])
def list_users():
    role = request.args.get('role')
    query = User.query
    if role:
        try:
            role_enum = RoleEnum(role)
            query = query.filter(User.role == role_enum)
        except Exception:
            pass
    users = query.all()
    return jsonify({'users': [_serialize_user(u) for u in users]})


@users_bp.route('/users/<int:id>', methods=['GET'])
def get_user(id):
    u = db.session.get(User, id)
    if not u:
        abort(404)
    return jsonify(_serialize_user(u))


@users_bp.route('/users', methods=['POST'])
@jwt_required()
def create_user():
    # Admin-only in production; enforce admin role here
    # admin check
    return _create_user_impl()


@jwt_required()
@admin_required
def _create_user_impl():
    data = request.get_json() or {}
    name = data.get('name')
    email = data.get('email')
    role = data.get('role', 'employee')
    try:
        role_enum = RoleEnum(role)
    except Exception:
        role_enum = RoleEnum.employee
    if not (name and email):
        return jsonify({'error': 'name and email required'}), 400
    if User.query.filter_by(email=email).first():
        return jsonify({'error': 'email exists'}), 400
    u = User(name=name, email=email, role=role_enum)
    db.session.add(u)
    db.session.commit()
    if not u.user_id:
        u.user_id = f"EMP{u.id:06d}"
        db.session.commit()
    return jsonify(_serialize_user(u)), 201


@users_bp.route('/users/<int:id>', methods=['PUT'])
@jwt_required()
def update_user(id):
    u = db.session.get(User, id)
    if not u:
        return jsonify({'error': 'not found'}), 404
    data = request.get_json() or {}
    for k in ('name', 'department', 'avatar', 'status', 'address', 'phone'):
        if k in data:
            setattr(u, k if k != 'phone' else 'phone', data[k])
    db.session.commit()
    return jsonify(_serialize_user(u))


@users_bp.route('/users/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_user(id):
    # admin-only
    uid = get_jwt_identity()
    try:
        caller = db.session.get(User, int(uid)) if uid else None
    except Exception:
        caller = db.session.get(User, uid) if uid else None
    if not caller or (hasattr(caller, 'role') and getattr(caller.role, 'value', str(caller.role)) != 'admin'):
        return jsonify({'error': 'admin privileges required'}), 403
    u = db.session.get(User, id)
    if not u:
        return jsonify({'error': 'not found'}), 404
    db.session.delete(u)
    db.session.commit()
    return jsonify({}), 204
