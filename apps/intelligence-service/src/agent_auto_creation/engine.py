"""PLAN-8 agent persona creation after a genuine PLAN-7 no-match result."""

import hashlib
import json

from pydantic import ValidationError
from sqlalchemy import CursorResult, text
from sqlalchemy.ext.asyncio import AsyncSession

from src.agent_auto_creation.models import (
    CreatePersonaRequest,
    CreatePersonaResponse,
    PersonaCreationOutcome,
)
from src.capability_resolver import NodeRequirement
from src.db.ids import new_prefixed_id
from src.selection_binding import (
    EmbeddingClient,
    NoAgentMatch,
    embedding_vector_literal,
)

_SET_TENANT_CONTEXT = text(
    "SELECT set_config('app.current_tenant_id', :tenant_id, true)"
)

# Idempotency: creation is keyed on (tenant_id, workspace_id, idempotency_key),
# enforced by the partial unique index agents_idempotency_key_unique (0006).
# The key is a hash of the *sorted* capability set, so the same capabilities
# in a different order hit the same key. The pre-SELECT below short-circuits
# repeats without a wasted embed; the ON CONFLICT DO NOTHING on the insert
# resolves the genuine race where two callers pass the pre-SELECT together --
# the loser's conflicting INSERT blocks on the unique index until the winner
# commits, then does nothing, and its follow-up SELECT sees the committed row.
_INSERT_AGENT = text(
    """
INSERT INTO agents
  (id, tenant_id, workspace_id, name, tier, persona_description, status,
   idempotency_key)
VALUES
  (:agent_id, CAST(:tenant_id AS uuid), CAST(:workspace_id AS uuid),
   :name, 'STANDARD', :persona_description, 'draft', :idempotency_key)
ON CONFLICT (tenant_id, workspace_id, idempotency_key)
  WHERE idempotency_key IS NOT NULL
DO NOTHING
"""
)
# A freshly auto-created agent has never run for real -- it starts 'draft'
# (both selection_binding queries include drafts, so it can still be
# matched and accumulate real performance_records) and is promoted to
# 'active' only once performance.repository's promotion check sees enough
# real successes for it. This is the returned outcome's own binding for
# the request that triggered creation, so its status here has no effect on
# whether *this* request succeeds -- only on later requests.

_INSERT_AGENT_VERSION = text(
    """
INSERT INTO agent_versions
  (id, agent_id, tenant_id, version_number, capabilities, model_alias, tools,
   persona_description, published_at)
VALUES
  (:version_id, :agent_id, CAST(:tenant_id AS uuid), 1,
   CAST(:capabilities_json AS jsonb), :model_alias, CAST(:tools_json AS jsonb),
   :persona_description, now())
"""
)

_INSERT_CAPABILITY_EMBEDDING = text(
    """
INSERT INTO capability_embeddings
  (id, agent_id, tenant_id, capability_description, embedding, embedding_metadata)
VALUES
  (:embedding_id, :agent_id, CAST(:tenant_id AS uuid), :capability_description,
   CAST(:embedding AS vector(512)), CAST(:embedding_metadata_json AS jsonb))
"""
)

# Fetch the existing agent for a key so a repeat returns the *stored* agent's
# real identity and persona, not a recomputed one that could disagree with the
# row (e.g. capabilities supplied in a different order).
_FIND_EXISTING_AGENT = text(
    """
SELECT
  a.id AS agent_id,
  a.persona_description,
  latest_version.version_number AS agent_version
FROM agents AS a
JOIN LATERAL (
  SELECT av.version_number
  FROM agent_versions AS av
  WHERE av.tenant_id = a.tenant_id
    AND av.agent_id = a.id
    AND av.published_at IS NOT NULL
  ORDER BY av.version_number DESC
  LIMIT 1
) AS latest_version ON TRUE
WHERE a.tenant_id = CAST(:tenant_id AS uuid)
  AND a.workspace_id = CAST(:workspace_id AS uuid)
  AND a.idempotency_key = :idempotency_key
LIMIT 1
"""
)


class PersonaCreationValidationError(ValueError):
    pass


class AgentAutoCreationEngine:
    """Create one immediately-bindable STANDARD persona for a true no-match."""

    def __init__(
        self,
        session: AsyncSession,
        embedding_client: EmbeddingClient,
    ) -> None:
        self._session = session
        self._embedding_client = embedding_client

    async def create_for_no_match(
        self,
        no_match: NoAgentMatch,
        request: CreatePersonaRequest,
    ) -> PersonaCreationOutcome:
        if no_match.reason != "no_eligible_agent":
            return no_match

        requirement = _parse_capability_profile(request.capability_profile_json)
        if not requirement.capabilities:
            raise PersonaCreationValidationError(
                "no_eligible_agent requires at least one capability"
            )
        if requirement.preferred_agent_id is not None:
            raise PersonaCreationValidationError(
                "no_eligible_agent cannot carry preferred_agent_id"
            )

        tenant_uuid = _raw_uuid(request.tenant_id)
        workspace_uuid = _raw_uuid(request.workspace_id)
        idempotency_key = _idempotency_key(requirement.capabilities)

        await self._session.execute(
            _SET_TENANT_CONTEXT,
            {"tenant_id": tenant_uuid},
        )

        # Short-circuit: an agent already exists for this key. Return it
        # without embedding -- the caller only needs a usable binding.
        existing = await self._find_existing(
            tenant_uuid=tenant_uuid,
            workspace_uuid=workspace_uuid,
            idempotency_key=idempotency_key,
        )
        if existing is not None:
            return _response_for_existing(existing, requirement)

        persona_description = _persona_description(requirement)
        embedding_text = "\n".join(requirement.capabilities)
        embedding_result = await self._embedding_client.embed(
            tenant_id=request.tenant_id,
            text=embedding_text,
        )
        embedding = embedding_vector_literal(embedding_result.vector)

        persona = {
            "capability_profile": requirement.model_dump(exclude_none=True),
            "persona_description": persona_description,
            "tier": "STANDARD",
        }
        persona_json = json.dumps(persona, separators=(",", ":"), sort_keys=True)
        capabilities_json = json.dumps(requirement.capabilities, separators=(",", ":"))
        tools_json = json.dumps(
            [tool.model_dump(exclude_none=True) for tool in requirement.tools or []],
            separators=(",", ":"),
        )

        agent_id = new_prefixed_id("agt")

        result = await self._session.execute(
            _INSERT_AGENT,
            {
                "agent_id": agent_id,
                "tenant_id": tenant_uuid,
                "workspace_id": workspace_uuid,
                "name": f"Capability agent: {requirement.capabilities[0]}",
                "persona_description": persona_description,
                "idempotency_key": idempotency_key,
            },
        )
        if not isinstance(result, CursorResult) or result.rowcount == 0:
            # A concurrent caller won the race for this key. Its agent is now
            # committed (our conflicting INSERT blocked until then); return it.
            existing = await self._find_existing(
                tenant_uuid=tenant_uuid,
                workspace_uuid=workspace_uuid,
                idempotency_key=idempotency_key,
            )
            if existing is None:  # pragma: no cover - defensive; see below
                raise PersonaCreationValidationError(
                    "concurrent creation lost the race but no agent was found"
                )
            return _response_for_existing(existing, requirement)

        await self._session.execute(
            _INSERT_AGENT_VERSION,
            {
                "version_id": new_prefixed_id("agtv"),
                "agent_id": agent_id,
                "tenant_id": tenant_uuid,
                "capabilities_json": capabilities_json,
                "model_alias": requirement.model_alias,
                "tools_json": tools_json,
                "persona_description": persona_description,
            },
        )
        await self._session.execute(
            _INSERT_CAPABILITY_EMBEDDING,
            {
                "embedding_id": new_prefixed_id("cemb"),
                "agent_id": agent_id,
                "tenant_id": tenant_uuid,
                "capability_description": persona_description,
                "embedding": embedding,
                "embedding_metadata_json": json.dumps(
                    {
                        "dimensions": 512,
                        "source": "PLAN-8",
                        "model_id": embedding_result.model_id,
                    },
                    separators=(",", ":"),
                    sort_keys=True,
                ),
            },
        )

        return CreatePersonaResponse(
            agent_id=agent_id,
            agent_version=1,
            persona_json=persona_json,
        )

    async def _find_existing(
        self,
        *,
        tenant_uuid: str,
        workspace_uuid: str,
        idempotency_key: str,
    ) -> tuple[str, int, str] | None:
        """Return (agent_id, latest published version_number, persona_description)."""
        result = await self._session.execute(
            _FIND_EXISTING_AGENT,
            {
                "tenant_id": tenant_uuid,
                "workspace_id": workspace_uuid,
                "idempotency_key": idempotency_key,
            },
        )
        row = result.mappings().first()
        if row is None:
            return None
        return (
            str(row["agent_id"]),
            int(row["agent_version"]),
            str(row["persona_description"]),
        )


def _parse_capability_profile(raw_profile: str) -> NodeRequirement:
    try:
        return NodeRequirement.model_validate_json(raw_profile)
    except (ValidationError, ValueError) as error:
        raise PersonaCreationValidationError(
            "capability_profile_json must match NodeRequirement"
        ) from error


def _persona_description(requirement: NodeRequirement) -> str:
    capabilities = ", ".join(requirement.capabilities)
    return f"Specialist agent for capabilities: {capabilities}."


def _idempotency_key(capabilities: list[str]) -> str:
    """Order-independent hash of the capability set.

    Sorted so the same capabilities in a different order produce the same
    key. Capabilities are validated non-empty strings, so a plain join is
    unambiguous. Scope is capabilities only -- not tier (hardcoded STANDARD
    today), model_alias, or tools; whether tier belongs in the key is owned
    by task 3.3.
    """
    canonical = json.dumps(sorted(capabilities), separators=(",", ":"))
    return hashlib.sha256(canonical.encode("utf-8")).hexdigest()


def _response_for_existing(
    existing: tuple[str, int, str],
    requirement: NodeRequirement,
) -> CreatePersonaResponse:
    """Build the repeat response from the *stored* agent row.

    persona_json's capability_profile is taken from the request (the stored
    agent_versions.capabilities list is not fetched here); the capability
    SET is identical by key construction, so only ordering could differ, and
    persona_json is not consumed downstream (selection_binding reads only
    agent_id and agent_version).
    """
    agent_id, agent_version, persona_description = existing
    persona = {
        "capability_profile": requirement.model_dump(exclude_none=True),
        "persona_description": persona_description,
        "tier": "STANDARD",
    }
    return CreatePersonaResponse(
        agent_id=agent_id,
        agent_version=agent_version,
        persona_json=json.dumps(persona, separators=(",", ":"), sort_keys=True),
    )


def _raw_uuid(prefixed_id: str) -> str:
    return prefixed_id.split("_", maxsplit=1)[1]
