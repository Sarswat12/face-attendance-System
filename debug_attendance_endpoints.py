from backend.app import create_app
app = create_app()
app.testing = True
c = app.test_client()
print('GET /api/attendance/today')
r = c.get('/api/attendance/today')
print(r.status_code, r.get_data(as_text=True))
print('GET /api/attendance/records')
r2 = c.get('/api/attendance/records')
print(r2.status_code, r2.get_data(as_text=True))
