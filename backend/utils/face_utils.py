import os
import time
import json
import logging
import traceback
import numpy as np
import cv2
import face_recognition
import csv

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def normalize_vec(v):
    """Return L2-normalized numpy vector (float32)."""
    a = np.array(v, dtype=np.float32)
    n = np.linalg.norm(a)
    return a / n if n > 0 else a


def is_blurry_bgr(image_bgr, threshold=100.0):
    """Return True if image is blurry using variance of Laplacian.
    image_bgr: BGR or RGB numpy image.
    """
    try:
        if image_bgr is None:
            return True
        gray = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2GRAY) if image_bgr.ndim == 3 else image_bgr
        var = cv2.Laplacian(gray, cv2.CV_64F).var()
        return var < threshold
    except Exception:
        logger.exception("blur check failed")
        return True


def get_face_locations(image, prefer_cnn=True, fr=None):
    """Return face locations. Use cnn if available, else hog.
    Accept optional `fr` parameter (face_recognition module) so callers can
    pass a patched module for testing.
    """
    try:
        fr = fr or face_recognition
        if prefer_cnn:
            try:
                return fr.face_locations(image, model='cnn')
            except Exception:
                return fr.face_locations(image, model='hog')
        else:
            return fr.face_locations(image, model='hog')
    except Exception:
        logger.exception("face location failed")
        return []


def encode_faces(image, locations=None, fr=None):
    """Return face encodings (list of 128-d numpy arrays).

    If `locations` is None, prefer calling `fr.face_encodings(image)` which
    matches common test patches that replace `face_encodings`. If that
    returns no encodings, fall back to detecting locations first.
    """
    try:
        fr = fr or face_recognition
        encs = []
        if locations is None:
            try:
                encs = fr.face_encodings(image)
            except Exception:
                encs = []
            if not encs:
                locations = get_face_locations(image, fr=fr)
        if locations is not None and locations:
            try:
                encs = fr.face_encodings(image, known_face_locations=locations)
            except Exception:
                encs = []
        return [normalize_vec(e) for e in encs]
    except Exception:
        logger.exception("face encoding failed")
        return []


def load_user_profiles_from_db(UserModel, FaceModel):
    """
    Load normalized user_profiles: { user_id: {'avg': np.array, 'faces':[np.array,...]} }
    Assumes UserModel.encoding stores JSON list of 128 floats and FaceModel.embedding stores JSON list.
    """
    profiles = {}
    users = UserModel.query.all()
    for u in users:
        try:
            if not u.encoding:
                continue
            # user.encoding may be a JSON string or a Python list
            avg_raw = u.encoding
            if isinstance(avg_raw, str):
                avg = np.array(json.loads(avg_raw), dtype=np.float32)
            else:
                avg = np.array(avg_raw, dtype=np.float32)
            faces = []
            for f in FaceModel.query.filter_by(user_id=u.id).all():
                try:
                    vec_raw = f.embedding
                    if isinstance(vec_raw, str):
                        vec = np.array(json.loads(vec_raw), dtype=np.float32)
                    else:
                        vec = np.array(vec_raw, dtype=np.float32)
                    faces.append(normalize_vec(vec))
                except Exception:
                    logger.exception("bad face embedding for face id %s", getattr(f, 'id', None))
            profiles[u.id] = {'avg': normalize_vec(avg), 'faces': faces}
        except Exception:
            logger.exception("failed load profile for user %s", getattr(u, 'id', None))
    return profiles


def decide_match(query_vec, user_profiles, USER_TOL=0.45, USER_MARGIN=0.15, FACE_TOL=0.55):
    """
    Primary matching rule:
      - compute distances to user centroids
      - pick best user if best_d <= USER_TOL
      - require margin = runner_up_d - best_d >= USER_MARGIN
      - verify that at least one per-face distance <= FACE_TOL
    Returns: accepted (bool), debug dict
    """
    q = normalize_vec(query_vec)
    if not user_profiles:
        return False, {'error': 'no user profiles'}

    # compute centroid distances
    dists = []
    for uid, p in user_profiles.items():
        d = float(np.linalg.norm(q - p['avg']))
        dists.append((uid, d))
    dists.sort(key=lambda x: x[1])
    best_uid, best_d = dists[0]
    runner_up_d = dists[1][1] if len(dists) > 1 else float('inf')
    margin = runner_up_d - best_d

    # per-face verification
    per_face_dists = [float(np.linalg.norm(q - f)) for f in user_profiles[best_uid]['faces']] if user_profiles[best_uid]['faces'] else [float('inf')]
    per_face_min = min(per_face_dists)

    accepted = (best_d <= USER_TOL) and (margin >= USER_MARGIN) and (per_face_min <= FACE_TOL)

    debug = {
        'best_uid': best_uid,
        'best_d': best_d,
        'runner_up_d': runner_up_d,
        'margin': margin,
        'per_face_min': per_face_min,
        'per_face_dists_top3': sorted(per_face_dists)[:3],
        'accepted': accepted
    }
    return accepted, debug


def append_log_row(csv_path, row, header=None):
    """Append a dict row to CSV, creating parent dir if needed."""
    try:
        os.makedirs(os.path.dirname(csv_path), exist_ok=True)
        write_header = not os.path.exists(csv_path)
        with open(csv_path, 'a', newline='') as fh:
            writer = csv.writer(fh)
            if write_header and header:
                writer.writerow(header)
            if header:
                writer.writerow([row.get(h, '') for h in header])
            else:
                # write all values
                writer.writerow(list(row.values()))
    except Exception:
        logger.exception("failed to append log row")
