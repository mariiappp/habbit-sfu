"""add tasks table

Revision ID: 4a1b2c3d4e5f
Revises: 3053eeb9352f
Create Date: 2026-05-21 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '4a1b2c3d4e5f'
down_revision: Union[str, Sequence[str], None] = '01e0f132969b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        'tasks',
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(length=200), nullable=False),
        sa.Column('task_type', sa.String(length=120), nullable=True),
        sa.Column('subject', sa.String(length=200), nullable=True),
        sa.Column('deadline', sa.Date(), nullable=False),
        sa.Column('link', sa.String(length=1000), nullable=True),
        sa.Column('is_done', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_tasks_deadline'), 'tasks', ['deadline'], unique=False)
    op.create_index(op.f('ix_tasks_user_id'), 'tasks', ['user_id'], unique=False)
    op.create_index('ix_tasks_user_deadline', 'tasks', ['user_id', 'deadline'], unique=False)



def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index('ix_tasks_user_deadline', table_name='tasks')
    op.drop_index(op.f('ix_tasks_user_id'), table_name='tasks')
    op.drop_index(op.f('ix_tasks_deadline'), table_name='tasks')
    op.drop_table('tasks')
