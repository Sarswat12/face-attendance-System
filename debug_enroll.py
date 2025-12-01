from backend.app import create_app
import json, io
app = create_app()
app.testing = True
client = app.test_client()
payload = {'name':'Face User','email':'face@example.com','password':'secret','role':'employee'}
res = client.post('/api/auth/register', data=json.dumps(payload), content_type='application/json')
print('register', res.status_code, res.get_json())
token = res.get_json().get('token')
img = io.BytesIO(b'fake-image-bytes')
data = {'image': (img, 'test.png')}
headers = {'Authorization': f'Bearer {token}'}
res2 = client.post('/api/face/enroll', data=data, headers=headers, content_type='multipart/form-data')
print('enroll status', res2.status_code)
try:
    print('enroll json:', res2.get_json())
except Exception as e:
    print('enroll data raw:', res2.get_data())
