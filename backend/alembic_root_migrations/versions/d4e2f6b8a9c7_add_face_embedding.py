"""add face embedding column

Revision ID: d4e2f6b8a9c7
Revises: c3d9f1a2b4e5
Create Date: 2025-11-26 12:30:00.000000

Add a nullable TEXT column `embedding` to `faces` to store per-face
128-d embeddings as a JSON array string.
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'd4e2f6b8a9c7'
down_revision = 'c3d9f1a2b4e5'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('faces', sa.Column('embedding', sa.Text(), nullable=True))


def downgrade():
    op.drop_column('faces', 'embedding')
