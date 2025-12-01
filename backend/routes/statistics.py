from flask import Blueprint, jsonify
from backend.models import User, Face, Attendance
from backend.extensions import db
import datetime
from backend.utils import admin_required
from flask import request

statistics_bp = Blueprint('statistics', __name__)


@statistics_bp.route('/dashboard', methods=['GET', 'OPTIONS'])
def dashboard():
    # Basic dashboard metrics for frontend display
    try:
        total_users = User.query.count()
    except Exception:
        total_users = 0
    try:
        total_faces = Face.query.count()
    except Exception:
        total_faces = 0

    try:
        # today's marks
        now = datetime.datetime.utcnow()
        start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        total_marks_today = Attendance.query.filter(Attendance.timestamp >= start).count()
    except Exception:
        total_marks_today = 0

    return jsonify({
        'totalUsers': total_users,
        'totalFaces': total_faces,
        'marksToday': total_marks_today,
    })


@statistics_bp.route('/debug-faces', methods=['GET'])
@admin_required
def debug_faces():
    """Admin-only debug endpoint with server-side filtering and pagination.
    Query params:
      - q: optional search string (matches name or user_id)
      - page: 1-based page number (default 1)
      - per_page: items per page (default 50)
      - sort_by: 'faces'|'encoding_len'|'name' (default 'faces')
      - sort_order: 'asc'|'desc' (default 'desc')
    Returns: fallback_no_face_count, total_users, page, per_page, per_user (page)
    """
    q = request.args.get('q', '').strip()
    try:
        page = int(request.args.get('page', '1'))
        if page < 1:
            page = 1
    except Exception:
        page = 1
    try:
        per_page = int(request.args.get('per_page', '50'))
        if per_page < 1 or per_page > 500:
            per_page = 50
    except Exception:
        per_page = 50
    sort_by = request.args.get('sort_by', 'faces')
    sort_order = request.args.get('sort_order', 'desc')

    try:
        fallback_count = Attendance.query.filter(Attendance.note == 'no_face_on_record').count()
    except Exception:
        fallback_count = 0

    # Build base user query with optional search
    user_query = User.query
    if q:
        ilike_q = f"%{q}%"
        try:
            user_query = user_query.filter((User.name.ilike(ilike_q)) | (User.user_id.ilike(ilike_q)))
        except Exception:
            # Fallback for DBs without ilike
            user_query = user_query.filter((User.name.like(ilike_q)) | (User.user_id.like(ilike_q)))

    total_users = user_query.count()

    # Fetch page of users
    users_page = user_query.order_by(User.id).offset((page - 1) * per_page).limit(per_page).all()

    per_user = []
    for u in users_page:
        try:
            face_count = Face.query.filter_by(user_id=u.id).count()
        except Exception:
            face_count = 0
        encoding_present = bool(u.encoding)
        encoding_len = len(u.encoding) if isinstance(u.encoding, (list, tuple)) else 0
        per_user.append({
            'id': u.id,
            'user_id': u.user_id,
            'name': u.name,
            'faces': face_count,
            'encoding_present': encoding_present,
            'encoding_len': encoding_len,
        })

    # Sort the page results client-side according to request
    reverse = (sort_order != 'asc')
    if sort_by == 'faces':
        per_user.sort(key=lambda x: x.get('faces', 0), reverse=reverse)
    elif sort_by == 'encoding_len':
        per_user.sort(key=lambda x: x.get('encoding_len', 0), reverse=reverse)
    else:
        per_user.sort(key=lambda x: (x.get('name') or '').lower(), reverse=reverse)

    return jsonify({
        'fallback_no_face_count': fallback_count,
        'total_users': total_users,
        'page': page,
        'per_page': per_page,
        'per_user': per_user,
    })
