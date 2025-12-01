import os
import pytest


def test_dev_fallback_allows_sqlite(monkeypatch):
    # Force explicit sqlite usage and enable dev fallback
    monkeypatch.delenv('SQLALCHEMY_DATABASE_URI', raising=False)
    monkeypatch.setenv('USE_SQLITE', '1')
    monkeypatch.setenv('DEV_FALLBACK_SQLITE', '1')

    # Import create_app after env set
    from importlib import reload
    import backend.app as app_mod
    reload(app_mod)

    app = app_mod.create_app()
    uri = app.config.get('SQLALCHEMY_DATABASE_URI')
    assert uri is not None
    assert uri.startswith('sqlite')


def test_production_requires_mysql(monkeypatch):
    # Production without dev fallback must raise RuntimeError
    monkeypatch.delenv('SQLALCHEMY_DATABASE_URI', raising=False)
    monkeypatch.delenv('USE_SQLITE', raising=False)
    monkeypatch.delenv('DEV_FALLBACK_SQLITE', raising=False)
    monkeypatch.delenv('DB_USER', raising=False)
    monkeypatch.delenv('DB_PASSWORD', raising=False)
    monkeypatch.delenv('DB_HOST', raising=False)
    monkeypatch.delenv('DB_NAME', raising=False)
    monkeypatch.setenv('FLASK_ENV', 'production')

    from importlib import reload
    import backend.app as app_mod
    reload(app_mod)

    with pytest.raises(RuntimeError):
        app_mod.create_app()
