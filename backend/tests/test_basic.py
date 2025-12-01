import importlib


def test_health():
    m = importlib.import_module('backend.app')
    app = m.create_app()
    with app.test_client() as c:
        rv = c.get('/health')
        assert rv.status_code == 200
        assert b'status' in rv.data


def test_users_empty():
    m = importlib.import_module('backend.app')
    app = m.create_app()
    with app.test_client() as c:
        rv = c.get('/api/users')
        assert rv.status_code == 200
        data = rv.get_json()
        assert 'users' in data
