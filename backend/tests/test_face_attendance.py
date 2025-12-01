import os
import json
import io

os.environ['USE_SQLITE'] = '1'

from backend.app import create_app
from unittest.mock import patch
import numpy as np


def setup_app():
    app = create_app()
    app.testing = True
    return app


def test_enroll_and_mark():
    app = setup_app()
    client = app.test_client()

    # Register a user
    payload = {'name': 'Face User', 'email': 'face@example.com', 'password': 'secret', 'role': 'employee'}
    res = client.post('/api/auth/register', data=json.dumps(payload), content_type='application/json')
    assert res.status_code == 200
    data = res.get_json()
    token = data['token']

    # Enroll a fake image
    img = io.BytesIO(b'fake-image-bytes')
    data = {
        'image': (img, 'test.png')
    }
    headers = {'Authorization': f'Bearer {token}'}
    # mock face_recognition.face_encodings to avoid real image decoding in tests
    # patch the symbol used by the route implementation
    # patch both load_image_file and face_encodings used in the route to avoid real image IO
    with patch('backend.routes.face.face_recognition.load_image_file', return_value=b'fake'), \
         patch('backend.routes.face.face_recognition.face_encodings', return_value=[np.zeros(128)]):
        res2 = client.post('/api/face/enroll', data=data, headers=headers, content_type='multipart/form-data')
    assert res2.status_code == 200
    j = res2.get_json()
    assert j.get('success') is True
    # support both single-face and multi-face responses
    face_id = j.get('face_id') or (j.get('face_ids')[0] if j.get('face_ids') else None)

    # Mark attendance using face_id
    res3 = client.post('/api/attendance/mark', data=json.dumps({'face_id': face_id}), headers={'Content-Type': 'application/json'})
    # Since attendance.mark requires user identification when using face_id without token,
    # it should succeed because face->user mapping exists. Expect 200 or 201.
    assert res3.status_code in (200, 201)
    rec = res3.get_json()
    assert rec.get('marked') is True
