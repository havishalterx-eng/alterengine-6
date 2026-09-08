"""make agent auto-creation idempotent per tenant, workspace, capability set

Revision ID: 0006
Revises: 0005
Create Date: 2026-09-08

Task 3.0. Agent auto-creation had no idempotency machinery: three identical
requests produced three different agents (#125). This adds a deterministic
idempotency_key column to agents and a partial unique index over
(tenant_id, workspace_id, idempotency_key) so two concurrent callers for the
same key cannot both create.

The key is derived (in engine.py) from the sorted capability set only --
not tier, model_alias, or tools. Tier is hardcoded 'STANDARD' today, so a
capability-only key is correct today; whether tier belongs in the key is
owned by task 3.3.

The index is PARTIAL (WHERE idempotency_key IS NOT NULL) so pre-existing
rows (NULL key) and global agents (NULL workspace_id, from 0005) are
unaffected -- NULLs never collide in a unique index, and auto-created rows
always carry both a workspace and a key.
"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "0006"
down_revision: str | None = "0005"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.execute(
        sa.text(
            """
ALTER TABLE agents
  ADD COLUMN idempotency_key TEXT
"""
        )
    )
    op.execute(
        sa.text(
            """
CREATE UNIQUE INDEX agents_idempotency_key_unique
ON agents (tenant_id, workspace_id, idempotency_key)
WHERE idempotency_key IS NOT NULL
"""
        )
    )


def downgrade() -> None:
    op.execute(sa.text("DROP INDEX IF EXISTS agents_idempotency_key_unique"))
    op.execute(sa.text("ALTER TABLE agents DROP COLUMN IF EXISTS idempotency_key"))
