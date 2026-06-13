"""initial schema

Revision ID: 0001
Revises:
Create Date: 2026-06-14

"""
import sqlalchemy as sa
from alembic import op

revision = "0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("username", sa.String(), nullable=False),
        sa.Column("email", sa.String(), nullable=False),
        sa.Column("password_hash", sa.String(), nullable=False),
        sa.Column(
            "role",
            sa.Enum("admin", "librarian", "student", name="userrole"),
            nullable=False,
            server_default="student",
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.UniqueConstraint("username"),
        sa.UniqueConstraint("email"),
    )

    op.create_table(
        "books",
        sa.Column("isbn", sa.String(), primary_key=True),
        sa.Column("title", sa.String(), nullable=False),
        sa.Column("author", sa.String(), nullable=True),
        sa.Column("publisher", sa.String(), nullable=True),
        sa.Column("publication_year", sa.Integer(), nullable=True),
        sa.Column("total_copies", sa.Integer(), nullable=False, server_default="1"),
    )

    op.create_table(
        "borrow_transactions",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("isbn", sa.String(), sa.ForeignKey("books.isbn"), nullable=False),
        sa.Column("borrow_date", sa.Date(), nullable=False),
        sa.Column("due_date", sa.Date(), nullable=False),
        sa.Column("return_date", sa.Date(), nullable=True),
        sa.Column(
            "status",
            sa.Enum("borrowed", "returned", name="borrowstatus"),
            nullable=False,
            server_default="borrowed",
        ),
    )

    op.create_table(
        "reservations",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("isbn", sa.String(), sa.ForeignKey("books.isbn"), nullable=False),
        sa.Column("reservation_date", sa.Date(), nullable=False),
        sa.Column(
            "status",
            sa.Enum("active", "fulfilled", "cancelled", "expired", name="reservationstatus"),
            nullable=False,
            server_default="active",
        ),
    )


def downgrade():
    op.drop_table("reservations")
    op.drop_table("borrow_transactions")
    op.drop_table("books")
    op.drop_table("users")
    op.execute("DROP TYPE IF EXISTS reservationstatus")
    op.execute("DROP TYPE IF EXISTS borrowstatus")
    op.execute("DROP TYPE IF EXISTS userrole")
