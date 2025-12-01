from flask import Blueprint, request, jsonify, current_app
from backend.extensions import db
from backend.models import Attendance, Face, User
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import func
import datetime
import hashlib
from flask import current_app
import json
import numpy as np
import face_recognition
from zoneinfo import ZoneInfo
from io import BytesIO
import os
import time
import cv2
import uuid
from ..utils.face_utils import (
    get_face_locations,
    encode_faces,
    load_user_profiles_from_db,
    decide_match,
    append_log_row,
    is_blurry_bgr,
)

# Default matching thresholds (can be tuned via environment variables)
USER_TOL = float(os.getenv('USER_TOL', 0.45))
USER_MARGIN = float(os.getenv('USER_MARGIN', 0.15))
FACE_TOL = float(os.getenv('FACE_TOL', 0.55))
MIN_FACE_HEIGHT_PX = int(os.getenv('MIN_FACE_HEIGHT_PX', 120))
BLUR_THRESHOLD = float(os.getenv('BLUR_THRESHOLD', 100.0))
LOG_CSV_PATH = os.getenv('LOG_CSV_PATH', './logs/face_match_log.csv')
LOG_HEADER = ['timestamp','query_id','best_uid','best_d','runner_up_d','margin','per_face_min','accepted','latency','true_label']

attendance_bp = Blueprint('attendance', __name__)


def _serialize_record(r: Attendance):
    user = None
    if r and r.user_id:
        try:
            user = db.session.get(User, int(r.user_id))
        except Exception:
            user = db.session.get(User, r.user_id)
    return {
        'id': r.id if r else None,
        'userId': user.user_id if user else None,
        'name': user.name if user else None,
        'department': r.department if r else None,
        'timestamp': r.timestamp.isoformat() if (r and r.timestamp) else None,
        'status': r.status if r else None,
    }


@attendance_bp.route('/mark', methods=['POST'])
@jwt_required(optional=True)
def mark_attendance():
    # Accept multipart image OR JSON with face_id OR just token (mark current user present)
    uid = get_jwt_identity()
    try:
        user = db.session.get(User, int(uid)) if uid else None
    except Exception:
        user = db.session.get(User, uid) if uid else None

    face_id = None
    distance_val = None

    if request.is_json:
        body = request.get_json() or {}
        face_id = body.get('face_id')

    if 'face_id' in request.form:
        face_id = request.form.get('face_id')

    # If face_id provided, use it
    if face_id:
        face = Face.query.filter_by(face_id=face_id).first()
        if not face:
            return jsonify({'error': 'face not found'}), 404
        try:
            user = db.session.get(User, int(face.user_id))
        except Exception:
            user = db.session.get(User, face.user_id)

    # If image provided: always perform recognition to ensure identity
    if 'image' in request.files:
        img = request.files['image']
        try:
            content = img.read()
            arr = np.frombuffer(content, np.uint8)
            image_bgr = cv2.imdecode(arr, cv2.IMREAD_COLOR)
            if image_bgr is None:
                return jsonify({'error': 'failed to decode uploaded image'}), 400

            # quick quality checks
            if is_blurry_bgr(image_bgr, threshold=BLUR_THRESHOLD):
                return jsonify({'error': 'blurry_image'}), 400

            rgb = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2RGB)

            # Prefer calling face_encodings directly (tests often patch this).
            encs = encode_faces(rgb, locations=None, fr=face_recognition)
            if not encs:
                # fallback to explicit face detection for checks
                locations = get_face_locations(rgb, prefer_cnn=True, fr=face_recognition)
                if not locations:
                    return jsonify({'error': 'no face detected in uploaded image'}), 400
                if len(locations) > 1:
                    return jsonify({'error': 'multiple faces detected; please provide a single-face image'}), 400
                top, right, bottom, left = locations[0]
                if (bottom - top) < MIN_FACE_HEIGHT_PX:
                    return jsonify({'error': 'face_too_small'}), 400
                encs = encode_faces(rgb, locations, fr=face_recognition)
                if not encs:
                    return jsonify({'error': 'failed to compute encoding'}), 400

            query_vec = encs[0]

            # load normalized user profiles and perform decision+logging
            profiles = load_user_profiles_from_db(User, Face)
            start = time.time()
            accepted, debug = decide_match(query_vec, profiles, USER_TOL, USER_MARGIN, FACE_TOL)
            debug['latency'] = time.time() - start
            debug['timestamp'] = time.time()
            debug['query_id'] = str(uuid.uuid4())
            debug['true_label'] = None

            try:
                append_log_row(LOG_CSV_PATH, debug, header=LOG_HEADER)
            except Exception:
                current_app.logger.exception('Failed to append match log')

            if not accepted:
                return jsonify({'error': 'face_not_recognized', 'debug': debug}), 404

            # accepted -> map best_uid to User and face verification already done
            try:
                matched_user = db.session.get(User, int(debug['best_uid']))
            except Exception:
                matched_user = db.session.get(User, debug['best_uid'])

            if user:
                if matched_user and matched_user.id != user.id:
                    return jsonify({'error': 'identity_mismatch', 'message': f"You are not {user.name}; detected: {matched_user.name}", 'detected_user': {'id': matched_user.user_id if matched_user else None, 'name': matched_user.name if matched_user else None}}), 403

            if not user:
                user = matched_user

            # set face_id to None (per-face id can be determined later if needed)
            face_id = None
            distance_val = debug.get('per_face_min')
        except Exception as e:
            current_app.logger.exception('failed to process image for recognition: %s', e)
            return jsonify({'error': f'failed to process image for recognition: {str(e)}'}), 400

    if not user:
        return jsonify({'error': 'user not identified (send token or face_id)'}), 400

    # Accept optional geolocation fields (sent from frontend)
    lat = None
    lon = None
    try:
        if request.is_json:
            body = request.get_json() or {}
            lat = body.get('latitude') or body.get('lat')
            lon = body.get('longitude') or body.get('lon')
        else:
            lat = request.form.get('latitude') or request.form.get('lat')
            lon = request.form.get('longitude') or request.form.get('lon')
        if lat is not None:
            lat = float(lat)
        if lon is not None:
            lon = float(lon)
    except Exception:
        lat = None
        lon = None

    # Log when geolocation is missing (useful for auditing)
    if lat is None or lon is None:
        try:
            current_app.logger.warning('Attendance mark by user %s missing geolocation (lat=%s lon=%s)', getattr(user, 'id', None), lat, lon)
        except Exception:
            pass

    # compute localized IST time for record (Asia/Kolkata)
    timezone_fallback = False
    try:
        # Prefer obtaining current time directly in Asia/Kolkata if ZoneInfo data
        # is available on the platform. This avoids relying on a named 'UTC'
        # zone which may be missing on some Windows builds.
        try:
            ist_now = datetime.datetime.now(ZoneInfo('Asia/Kolkata'))
        except Exception:
            # Fallback: create UTC-aware time and convert to Asia/Kolkata
            now_utc = datetime.datetime.utcnow().replace(tzinfo=datetime.timezone.utc)
            ist_now = now_utc.astimezone(ZoneInfo('Asia/Kolkata'))
    except Exception as e:
        # If zoneinfo conversion fails for any reason, fallback to UTC naive timestamp
        try:
            current_app.logger.warning('IST timezone conversion failed, falling back to UTC naive: %s', str(e))
        except Exception:
            pass
        timezone_fallback = True
        ist_now = datetime.datetime.utcnow()

    # If attendance is being recorded without a matched face (fallback for
    # authenticated users who haven't enrolled), set a note so admins can
    # filter these records later.
    note_val = None
    if not face_id:
        note_val = 'no_face_on_record'

    rec = Attendance(
        user_id=user.id,
        face_id=face_id,
        status='Present',
        department=user.department,
        source='api',
        latitude=lat,
        longitude=lon,
        local_timestamp=ist_now,
        note=note_val
    )
    db.session.add(rec)
    db.session.commit()

    # return record including localized time and coords
    out = _serialize_record(rec)
    # include distance if available (helpful for frontend debugging/UX)
    if distance_val is not None:
        out['distance'] = distance_val
    out['used_fallback'] = True if note_val else False
    if ist_now:
        try:
            out['local_time'] = ist_now.isoformat()
        except Exception:
            out['local_time'] = str(ist_now)
    if lat is not None and lon is not None:
        out['latitude'] = lat
        out['longitude'] = lon
    if timezone_fallback:
        out['timezone_fallback'] = True

    return jsonify({'marked': True, 'record': out})


@attendance_bp.route('/today', methods=['GET'])
@jwt_required(optional=True)
def today():
    uid = get_jwt_identity()
    if uid:
        # Ensure uid is an integer for filtering against Attendance.user_id
        try:
            uid_val = int(uid)
        except Exception:
            uid_val = uid

        # Compute today's range in Asia/Kolkata (IST), then convert to UTC
        # because Attendance.timestamp is stored as UTC (naive datetime.utcnow()).
        try:
            ist_now = datetime.datetime.now(ZoneInfo('Asia/Kolkata'))
            ist_start = ist_now.replace(hour=0, minute=0, second=0, microsecond=0)
            ist_end = ist_start + datetime.timedelta(days=1)
            # convert to UTC-aware and then to naive UTC datetimes for DB comparison
            start_utc = ist_start.astimezone(datetime.timezone.utc).replace(tzinfo=None)
            end_utc = ist_end.astimezone(datetime.timezone.utc).replace(tzinfo=None)
        except Exception:
            # Fallback: use UTC day boundaries
            start_utc = datetime.datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
            end_utc = start_utc + datetime.timedelta(days=1)

        rec = Attendance.query.filter(
            Attendance.user_id == uid_val,
            Attendance.timestamp >= start_utc,
            Attendance.timestamp < end_utc
        ).order_by(Attendance.timestamp.desc()).first()
        return jsonify({'record': _serialize_record(rec) if rec else None})
    # otherwise return summary (simple counts)
    today = datetime.date.today()
    start = datetime.datetime.combine(today, datetime.time.min)
    total = Attendance.query.filter(Attendance.timestamp >= start).count()
    return jsonify({'summary': {'total_marks': total}})


@attendance_bp.route('/records', methods=['GET'])
def records():
    date_q = request.args.get('date')
    userId = request.args.get('userId')
    query = Attendance.query
    if date_q:
        try:
            d = datetime.datetime.fromisoformat(date_q)
            start = datetime.datetime(d.year, d.month, d.day)
            end = start + datetime.timedelta(days=1)
            query = query.filter(Attendance.timestamp >= start, Attendance.timestamp < end)
        except Exception:
            pass
    if userId:
        # match by user_id string
        user = User.query.filter_by(user_id=userId).first()
        if user:
            query = query.filter(Attendance.user_id == user.id)
    query = query.order_by(Attendance.timestamp.desc()).limit(100)
    recs = query.all()
    return jsonify({'records': [_serialize_record(r) for r in recs]})
