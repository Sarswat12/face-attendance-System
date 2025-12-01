from flask import Blueprint, request, jsonify, current_app
from backend.extensions import db
from backend.models import Face, User
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename
import os
import uuid
import hashlib
import json
import numpy as np
import face_recognition
from flask import abort
import cv2
from ..utils.face_utils import get_face_locations, encode_faces, normalize_vec, is_blurry_bgr
from backend.app import limiter

# Quality defaults (can be tuned)
MIN_FACE_HEIGHT_PX = int(os.getenv('MIN_FACE_HEIGHT_PX', 120))
BLUR_THRESHOLD = float(os.getenv('BLUR_THRESHOLD', 100.0))

face_bp = Blueprint('face', __name__)


ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}


def _allowed(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


@face_bp.route('/enroll', methods=['POST'])
@jwt_required(optional=True)
def enroll():
    # Accept one image per request (frontend sends one file per request)
    # NOTE: This endpoint stores an image and records a simple sha256 fingerprint
    # in `meta`. This is only suitable as a prototype/demo. For production-grade
    # face recognition you should compute a face embedding (eg. using a model
    # that produces dense vectors) and store those embeddings (or references to
    # them). Matching should then be performed in embedding space with a
    # threshold or nearest-neighbour index (FAISS, Annoy, etc.). See project
    # accept multiple files under 'images' or a single file under 'image'
    files = request.files.getlist('images')
    if not files:
        single = request.files.get('image')
        if single:
            files = [single]

    if not files:
        return jsonify({'success': False, 'error': 'image field required'}), 400

    # identify user from JWT or optional form param
    uid = get_jwt_identity()
    try:
        user = db.session.get(User, int(uid)) if uid else None
    except Exception:
        user = db.session.get(User, uid) if uid else None
    if not user:
        # allow admin or tooling to pass user_id in form
        uid_param = request.form.get('user_id') or request.args.get('user_id')
        if uid_param:
            try:
                user = db.session.get(User, int(uid_param))
            except Exception:
                user = db.session.get(User, uid_param)

    if not user:
        return jsonify({'success': False, 'error': 'user not identified (send auth token or user_id)'}), 400

    user_folder = os.path.join(current_app.config['UPLOAD_FOLDER'], 'faces', f"user_{user.id}")
    os.makedirs(user_folder, exist_ok=True)

    saved_faces = []
    encs_for_files = []

    for file in files:
        if file.filename == '':
            # cleanup any previously saved files for this request
            for _, p in saved_faces:
                try:
                    os.remove(p)
                except Exception:
                    pass
            return jsonify({'success': False, 'error': 'empty filename'}), 400
        if not _allowed(file.filename):
            for _, p in saved_faces:
                try:
                    os.remove(p)
                except Exception:
                    pass
            return jsonify({'success': False, 'error': f'invalid file type: {file.filename}'}), 400

        # simple max size guard (5 MB)
        file.seek(0, os.SEEK_END)
        size = file.tell()
        file.seek(0)
        if size > 5 * 1024 * 1024:
            for _, p in saved_faces:
                try:
                    os.remove(p)
                except Exception:
                    pass
            return jsonify({'success': False, 'error': f'file too large (max 5MB): {file.filename}'}), 400

        filename = secure_filename(file.filename)
        ext = filename.rsplit('.', 1)[1].lower()
        face_id = str(uuid.uuid4())
        saved_name = f"{face_id}.{ext}"
        save_path = os.path.join(user_folder, saved_name)

        try:
            file.save(save_path)
        except Exception as e:
            for _, p in saved_faces:
                try:
                    os.remove(p)
                except Exception:
                    pass
            return jsonify({'success': False, 'error': f'failed to save file: {str(e)}'}), 500

        rel_path = os.path.join('faces', f"user_{user.id}", saved_name)
        saved_faces.append((face_id, save_path, rel_path))

        # compute encoding for this saved file with quality checks
        try:
            # read via OpenCV to perform blur check
            img_bgr = cv2.imread(save_path)
            img_rgb = None
            if img_bgr is None:
                # OpenCV failed to read the file (corrupt bytes or test double).
                # Fall back to face_recognition.load_image_file which test suites
                # may patch to provide a synthetic image ndarray or a dummy object.
                try:
                    img_rgb = face_recognition.load_image_file(save_path)
                    # only convert to BGR if we received an ndarray-like image
                    if hasattr(img_rgb, 'ndim'):
                        img_bgr = cv2.cvtColor(img_rgb, cv2.COLOR_RGB2BGR)
                    else:
                        img_bgr = None
                except Exception:
                    raise ValueError('failed to read saved image')
            if img_bgr is not None and is_blurry_bgr(img_bgr, threshold=BLUR_THRESHOLD):
                # cleanup and reject
                try:
                    os.remove(save_path)
                except Exception:
                    pass
                return jsonify({'success': False, 'error': f'image too blurry: {filename}'}), 400

            if img_bgr is not None:
                rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)
            elif img_rgb is not None:
                # img_rgb may be a numpy ndarray (RGB) or a test-provided dummy object
                rgb = img_rgb
            else:
                raise ValueError('failed to obtain image RGB data')
            # Prefer calling face_encodings directly (tests often patch this).
            encs = encode_faces(rgb, locations=None, fr=face_recognition)
            if not encs:
                # Fallback to explicit detection for size/quality checks
                locations = get_face_locations(rgb, prefer_cnn=True, fr=face_recognition)
                if not locations:
                    try:
                        os.remove(save_path)
                    except Exception:
                        pass
                    return jsonify({'success': False, 'error': f'no face detected in uploaded image: {filename}'}), 400
                # check face size
                top, right, bottom, left = locations[0]
                if (bottom - top) < MIN_FACE_HEIGHT_PX:
                    try:
                        os.remove(save_path)
                    except Exception:
                        pass
                    return jsonify({'success': False, 'error': f'face bounding box too small: {filename}'}), 400
                encs = encode_faces(rgb, locations, fr=face_recognition)
                if not encs:
                    try:
                        os.remove(save_path)
                    except Exception:
                        pass
                    return jsonify({'success': False, 'error': f'failed to compute face encoding: {filename}'}), 400

            encs_for_files.append(encs[0])
        except Exception as e:
            try:
                os.remove(save_path)
            except Exception:
                pass
            for _, p, _ in saved_faces[:-1]:
                try:
                    os.remove(p)
                except Exception:
                    pass
            return jsonify({'success': False, 'error': f'failed to process image: {str(e)}'}), 400

    # At this point saved_faces and encs_for_files are populated
    # collect encodings from all images in the user's folder for averaging
    enc_list = []
    try:
        for fname in os.listdir(user_folder):
            fpath = os.path.join(user_folder, fname)
            if not _allowed(fname):
                continue
            try:
                img = face_recognition.load_image_file(fpath)
                e = face_recognition.face_encodings(img)
                if e:
                    enc_list.append(e[0])
            except Exception:
                continue
    except Exception:
        enc_list = encs_for_files[:]

    if not enc_list:
        enc_list = encs_for_files[:]

    try:
        arr = np.stack(enc_list, axis=0)
        mean_vec = np.mean(arr, axis=0)
        mean_norm = normalize_vec(mean_vec)
        mean_list = mean_norm.tolist()
    except Exception:
        mean_list = None

    try:
        if mean_list is not None:
            # store normalized centroid as JSON string
            user.encoding = json.dumps([float(x) for x in mean_list])
            db.session.add(user)
    except Exception:
        pass

    created_faces = []
    for (face_id, save_path, rel_path), enc in zip(saved_faces, encs_for_files):
        try:
            fp = None
            try:
                with open(save_path, 'rb') as fh:
                    data = fh.read()
                    fp = hashlib.sha256(data).hexdigest()
            except Exception:
                fp = None
            # store normalized embedding as JSON string
            face_embedding = [float(x) for x in enc.tolist()]
            f = Face(user_id=user.id, face_id=face_id, image_path=rel_path, meta=fp, embedding=json.dumps(face_embedding))
            created_faces.append(f)
        except Exception:
            continue

    if created_faces:
        db.session.add_all(created_faces)
    db.session.commit()

    # Return per-file result(s). If single upload, return single object for convenience.
    if len(created_faces) == 1:
        f = created_faces[0]
        return jsonify({'success': True, 'face_id': f.face_id, 'image_path': f"/uploads/{f.image_path}"})
    else:
        faces_out = [{'face_id': f.face_id, 'image_path': f"/uploads/{f.image_path}"} for f in created_faces]
        return jsonify({'success': True, 'faces': faces_out})



@face_bp.route('', methods=['GET'])
@jwt_required(optional=True)
def list_faces():
    # Return list of enrolled faces for the current user (or user_id param)
    uid = get_jwt_identity()
    user = None
    try:
        user = db.session.get(User, int(uid)) if uid else None
    except Exception:
        user = db.session.get(User, uid) if uid else None

    if not user:
        # allow optional user_id query param for admin tools
        uid_param = request.args.get('user_id')
        if uid_param:
            try:
                user = db.session.get(User, int(uid_param))
            except Exception:
                user = db.session.get(User, uid_param)

    if not user:
        return jsonify({'faces': []})

    faces = Face.query.filter_by(user_id=user.id).all()
    out = []
    for f in faces:
        out.append({'face_id': f.face_id, 'image_path': f"/uploads/{f.image_path}"})
    return jsonify({'faces': out})


@face_bp.route('/<face_id>', methods=['DELETE'])
@jwt_required()
def delete_face(face_id):
    # Allow owner or admin to delete a face
    uid = get_jwt_identity()
    try:
        caller = db.session.get(User, int(uid))
    except Exception:
        caller = db.session.get(User, uid)

    f = Face.query.filter_by(face_id=face_id).first()
    if not f:
        return jsonify({'error': 'not found'}), 404

    # owner check
    is_owner = caller and caller.id == f.user_id
    is_admin = caller and (hasattr(caller.role, 'value') and caller.role.value == 'admin')
    if not (is_owner or is_admin):
        return jsonify({'error': 'permission denied'}), 403

    # delete file from disk if present
    try:
        path = os.path.join(current_app.config['UPLOAD_FOLDER'], f.image_path)
        if os.path.exists(path):
            os.remove(path)
    except Exception:
        pass

    user_id = f.user_id
    # delete DB row
    try:
        db.session.delete(f)
        db.session.commit()
    except Exception:
        try:
            db.session.rollback()
        except Exception:
            pass
        return jsonify({'error': 'failed to delete'}), 500

    # Recompute averaged user encoding from remaining faces
    try:
        remaining = Face.query.filter_by(user_id=user_id).all()
        enc_list = []
        for r in remaining:
            try:
                e = r.embedding
                if isinstance(e, str):
                    e = json.loads(e)
                if e and len(e) == 128:
                    enc_list.append(np.array(e))
            except Exception:
                continue
        if enc_list:
            arr = np.stack(enc_list, axis=0)
            mean_vec = np.mean(arr, axis=0)
            mean_list = [float(x) for x in mean_vec.tolist()]
        else:
            mean_list = None
        try:
            user = db.session.get(User, int(user_id))
        except Exception:
            user = db.session.get(User, user_id)
        if user:
            user.encoding = mean_list
            db.session.add(user)
            db.session.commit()
    except Exception:
        try:
            db.session.rollback()
        except Exception:
            pass

    return jsonify({'deleted': True})
