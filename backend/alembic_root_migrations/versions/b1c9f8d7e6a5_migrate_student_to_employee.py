"""migrate student -> employee

Revision ID: b1c9f8d7e6a5
Revises: a07f8fe369b2
Create Date: 2025-11-25 15:10:00.000000

This migration performs two actions:
- update any existing rows that still contain the value 'student' to 'employee'
- for MySQL, alter the `users.role` ENUM to remove the 'student' value

Notes:
- This migration handles MySQL automatically. For other dialects (Postgres, SQLite)
  the migration will update data but will intentionally NOT attempt to mutate DB-level
  enum types. Please follow the manual instructions in the project README for PG.

IMPORTANT: Run this on a staging DB first and make a full backup of production before
applying to a live database.
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import text

# revision identifiers, used by Alembic.
revision = 'b1c9f8d7e6a5'
down_revision = 'a07f8fe369b2'
branch_labels = None
depends_on = None


def upgrade():
    conn = op.get_bind()
    dialect = conn.dialect.name

    # 1) Data migration: convert any remaining 'student' role values to 'employee'
    conn.execute(text("""UPDATE users SET role='employee' WHERE role='student'"""))

    # 2) Schema migration: for MySQL, alter the ENUM to remove 'student'
    if dialect == 'mysql':
        # Use MODIFY COLUMN to redefine the ENUM without the 'student' value.
        # This is atomic on InnoDB but make sure you have a backup.
        op.execute("""
        ALTER TABLE users
        MODIFY COLUMN role ENUM('admin','employee') NOT NULL DEFAULT 'employee'
        """)
    else:
        # For other dialects (Postgres, SQLite) we only change the data above.
        # Postgres requires more careful enum type recreation; handle manually if needed.
        op.get_context().impl.warn(
            "Non-MySQL dialect detected (%s): only data updated. Manual enum change may be required." % dialect
        )


def downgrade():
    conn = op.get_bind()
    dialect = conn.dialect.name

    # Downgrade tries to restore the schema to include 'student' in the enum type.
    # It does NOT attempt to convert rows which may have been changed to 'employee'.
    if dialect == 'mysql':
        # Re-add 'student' to the enum type. We keep 'employee' as default.
        op.execute("""
        ALTER TABLE users
        MODIFY COLUMN role ENUM('admin','employee','student') NOT NULL DEFAULT 'employee'
        """)
    else:
        # No-op for other dialects: the original enum/type must be restored manually.
        op.get_context().impl.warn(
            "Non-MySQL dialect detected (%s): schema downgrade is a no-op. Manually restore enum if needed." % dialect
        )
