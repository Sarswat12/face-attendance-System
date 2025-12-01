import os,json
os.environ['USE_SQLITE']='1'
from backend.app import create_app
app=create_app()
client=app.test_client()
print('registering...')
res=client.post('/api/auth/register',data=json.dumps({'name':'A','email':'a@example.com','password':'p'}),content_type='application/json')
print('register',res.status_code,res.get_json())
res2=client.post('/api/auth/login',data=json.dumps({'email':'a@example.com','password':'p'}),content_type='application/json')
print('login',res2.status_code,res2.get_json())
if res2.status_code==200:
    token=res2.get_json()['token']
    h={'Authorization':f'Bearer {token}'}
    res3=client.get('/api/auth/verify-token',headers=h)
    print('verify',res3.status_code,res3.get_data())
else:
    print('login failed')
