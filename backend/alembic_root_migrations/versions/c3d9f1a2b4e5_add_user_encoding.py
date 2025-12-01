"""add user encoding

Revision ID: c3d9f1a2b4e5
Revises: b1c9f8d7e6a5
Create Date: 2025-11-26 12:00:00.000000

Add a nullable TEXT column `encoding` to `users` to store averaged
face embeddings as a JSON array string.
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'c3d9f1a2b4e5'
down_revision = 'b1c9f8d7e6a5'
branch_labels = None
depends_on = None


def upgrade():
    # Add `encoding` column as TEXT (nullable).
    op.add_column('users', sa.Column('encoding', sa.Text(), nullable=True))


def downgrade():
    # Remove the column on downgrade.
    op.drop_column('users', 'encoding')
