import os
import json
import tempfile
import pytest

os.environ['USE_SQLITE'] = '1'

from backend.app import create_app


def setup_app():
    app = create_app()
    app.testing = True
    return app


def test_register_login_verify():
    app = setup_app()
    client = app.test_client()

    # Register
    payload = {'name': 'Test User', 'email': 'test@example.com', 'password': 'secret', 'role': 'employee'}
    res = client.post('/api/auth/register', data=json.dumps(payload), content_type='application/json')
    assert res.status_code == 200
    data = res.get_json()
    assert 'token' in data
    # Ensure refresh cookie was set
    cookie_hdr = res.headers.get('Set-Cookie')
    assert cookie_hdr is not None
    # parse cookie value
    cookie_val = cookie_hdr.split(';', 1)[0].split('=', 1)[1]

    # Login
    res2 = client.post('/api/auth/login', data=json.dumps({'email': 'test@example.com', 'password': 'secret'}), content_type='application/json')
    assert res2.status_code == 200
    data2 = res2.get_json()
    assert 'token' in data2

    # Verify token
    token = data2['token']
    headers = {'Authorization': f'Bearer {token}'}
    res3 = client.get('/api/auth/verify-token', headers=headers)
    assert res3.status_code == 200
    v = res3.get_json()
    assert v.get('valid') is True


def test_refresh_rotation_and_revoke():
    app = setup_app()
    client = app.test_client()

    # Register to get cookie
    payload = {'name': 'Rotate User', 'email': 'rot@example.com', 'password': 'secret', 'role': 'employee'}
    r = client.post('/api/auth/register', data=json.dumps(payload), content_type='application/json')
    assert r.status_code == 200
    cookie_hdr = r.headers.get('Set-Cookie')
    assert cookie_hdr is not None
    old_cookie = cookie_hdr.split(';', 1)[0].split('=', 1)[1]

    # Use refresh endpoint - should rotate and set a new cookie (send cookie via header)
    rr = client.post('/api/auth/refresh', headers={'Cookie': f'refresh_token={old_cookie}'})
    assert rr.status_code == 200
    new_cookie_hdr = rr.headers.get('Set-Cookie')
    assert new_cookie_hdr is not None
    new_cookie = new_cookie_hdr.split(';', 1)[0].split('=', 1)[1]
    assert new_cookie != old_cookie

    # Revoke using revoke-refresh (requires Authorization). Use returned access token.
    token = rr.get_json()['token']
    headers = {'Authorization': f'Bearer {token}', 'Content-Type': 'application/json', 'Cookie': f'refresh_token={new_cookie}'}
    rv = client.post('/api/auth/revoke-refresh', headers=headers)
    assert rv.status_code == 200
    j = rv.get_json()
    assert j.get('revoked') is True
