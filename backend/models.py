from datetime import datetime
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import Enum
import enum

from backend.extensions import db


class RoleEnum(enum.Enum):
    admin = 'admin'
    employee = 'employee'


class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.String(64), unique=True, nullable=True, index=True)
    name = db.Column(db.String(255), nullable=False)
    email = db.Column(db.String(255), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=True)
    role = db.Column(db.Enum(RoleEnum), nullable=False, default=RoleEnum.employee)
    department = db.Column(db.String(128), nullable=True)
    avatar = db.Column(db.String(512), nullable=True)
    phone = db.Column(db.String(64), nullable=True)
    status = db.Column(db.String(32), nullable=False, default='Active')
    join_date = db.Column(db.Date, nullable=True)
    address = db.Column(db.Text, nullable=True)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    faces = db.relationship('Face', backref='user', lazy=True)
    attendance = db.relationship('Attendance', backref='user', lazy=True)

    # JSON-serialized averaged 128-d face embedding for this user
    # Use the JSON column type to align with MySQL `JSON` column
    encoding = db.Column(db.JSON, nullable=True)


class Face(db.Model):
    __tablename__ = 'faces'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    face_id = db.Column(db.String(128), unique=True, nullable=False)
    image_path = db.Column(db.String(512), nullable=True)
    # Per-face 128-d embedding stored as native JSON (array of floats)
    embedding = db.Column(db.JSON, nullable=True)
    # 'metadata' is a reserved attribute name on Declarative classes
    # (SQLAlchemy uses `.metadata` for MetaData). Use attribute `meta`
    # mapped to the DB column name 'metadata' to preserve schema.
    meta = db.Column('metadata', db.Text, nullable=True)
    enrolled_at = db.Column(db.DateTime, default=datetime.utcnow)


class Attendance(db.Model):
    __tablename__ = 'attendance'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'), nullable=True)
    face_id = db.Column(db.String(128), db.ForeignKey('faces.face_id'), nullable=True)
    status = db.Column(db.String(32), nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    department = db.Column(db.String(128), nullable=True)
    source = db.Column(db.String(32), nullable=True)
    # Optional geolocation and localized timestamp (stored for audit)
    latitude = db.Column(db.Float, nullable=True)
    longitude = db.Column(db.Float, nullable=True)
    local_timestamp = db.Column(db.DateTime, nullable=True)
    # Optional note to indicate special handling (e.g., attendance accepted
    # without an enrolled face). Use a short string for filtering/reporting.
    note = db.Column(db.String(128), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


class RefreshToken(db.Model):
    __tablename__ = 'refresh_tokens'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    token = db.Column(db.Text, nullable=False)
    issued_at = db.Column(db.DateTime, default=datetime.utcnow)
    expires_at = db.Column(db.DateTime, nullable=True)
    revoked = db.Column(db.Boolean, default=False)
