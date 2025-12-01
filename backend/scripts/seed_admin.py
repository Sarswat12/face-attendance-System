"""Seed an initial admin user into the database using the app context.
Run: python seed_admin.py
"""
import os
from dotenv import load_dotenv

import sys
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
load_dotenv(os.path.join(ROOT, 'backend', '.env'))

# ensure repo root is on sys.path so `backend` package imports resolve
if ROOT not in sys.path:
    sys.path.insert(0, ROOT)

from backend.app import create_app

app = create_app()

with app.app_context():
    from backend.extensions import db
    from backend.models import User, RoleEnum
    import bcrypt

    admin_email = os.getenv('ADMIN_EMAIL', 'admin@example.com')
    admin_password = os.getenv('ADMIN_PASSWORD', 'adminpass')

    existing = User.query.filter_by(email=admin_email).first()
    if existing:
        print('Admin user already exists:', existing.email)
    else:
        pw_hash = bcrypt.hashpw(admin_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        u = User(name='Administrator', email=admin_email, password_hash=pw_hash, role=RoleEnum.admin)
        db.session.add(u)
        db.session.commit()
        u.user_id = u.user_id or f"EMP{u.id:06d}"
        db.session.commit()
        print('Created admin user:', admin_email)
