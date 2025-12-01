from backend.tests.test_face_attendance import setup_app
from unittest.mock import patch
import io
import json
import numpy as np

app = setup_app()
client = app.test_client()

# Register a user
payload = {'name': 'Face User', 'email': 'face@example.com', 'password': 'secret', 'role': 'employee'}
res = client.post('/api/auth/register', data=json.dumps(payload), content_type='application/json')
print('register status', res.status_code, res.get_json())

data = res.get_json()
token = data['token']

# Enroll fake image
img = io.BytesIO(b'fake-image-bytes')
data = {'image': (img, 'test.png')}
headers = {'Authorization': f"Bearer {token}"}
with patch('backend.routes.face.face_recognition.load_image_file', return_value=b'fake'), \
     patch('backend.routes.face.face_recognition.face_encodings', return_value=[np.zeros(128)]):
    res2 = client.post('/api/face/enroll', data=data, headers=headers, content_type='multipart/form-data')
    print('enroll status', res2.status_code)
    try:
        print('enroll json:', res2.get_json())
    except Exception:
        print('enroll raw:', res2.get_data(as_text=True))
