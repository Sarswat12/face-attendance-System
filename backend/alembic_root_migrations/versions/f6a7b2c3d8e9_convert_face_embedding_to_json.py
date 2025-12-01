"""convert face.embedding to JSON column type

Revision ID: f6a7b2c3d8e9
Revises: d4e2f6b8a9c7
Create Date: 2025-11-26 13:30:00.000000

Alter `faces.embedding` column to MySQL JSON type where supported.
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'f6a7b2c3d8e9'
down_revision = 'd4e2f6b8a9c7'
branch_labels = None
depends_on = None


def upgrade():
    # For MySQL change column type to JSON; for other dialects this will
    # attempt to set a JSON-compatible type (may be TEXT fallback).
    conn = op.get_bind()
    dialect = conn.dialect.name
    if dialect == 'mysql':
        op.execute("ALTER TABLE faces MODIFY COLUMN embedding JSON NULL")
    else:
        # On other DBs keep TEXT but this migration no-ops (column exists already).
        op.alter_column('faces', 'embedding', type_=sa.Text(), existing_type=sa.Text(), nullable=True)


def downgrade():
    conn = op.get_bind()
    dialect = conn.dialect.name
    if dialect == 'mysql':
        op.execute("ALTER TABLE faces MODIFY COLUMN embedding TEXT NULL")
    else:
        op.alter_column('faces', 'embedding', type_=sa.Text(), existing_type=sa.Text(), nullable=True)
