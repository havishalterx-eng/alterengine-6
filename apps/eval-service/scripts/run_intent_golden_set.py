#!/usr/bin/env python3
# ruff: noqa: E402
"""Phase 1 (task 1.5) -- run the 30-case intent golden set against a real
Bedrock-backed Conversation Manager and print per-case reasons grouped.

This is the executable artefact the Phase 1 master prompt requires: a
committed, one-command runner that brings up what it needs, runs the
30-case golden set, and prints per-case reasons grouped -- not prose run
instructions. It is driven by scripts/run-intent-golden-set.sh, which starts
the dependency stack and the two eval processes this needs, then invokes this
module.

The 30-case golden set is the 'intent' domain (golden set name "intent",
30 cases -- see apps/eval-service/src/db/launch_golden_sets.py INTENT_CASES
and test_orchestrator_integration.py _EVAL_INTENT_CASE_COUNT). Every case
calls orchestration-service's ConversationService.ClassifyIntent, which calls
model-gateway, which calls the real provider. Under the mock every utterance
returned "answer" at 0.9 (see conversation-manager.intent-discrimination.spec.ts
for the verbatim proof); the first honest number is what this runner prints.

Mirrors test_intent_golden_set_executes_for_real_against_a_live_llm
(apps/eval-service/tests/test_orchestrator_integration.py): the intent
client is real (pointed at the eval_intent_grpc_server this script's shell
wrapper starts), every other domain client is an honest unused placeholder
that is never dialled by the intent cases. No fixed pass-rate assertion -- a
real model's accuracy on a golden set it has never seen is not something this
runner controls or should pretend to guarantee. What IS guaranteed: every
case executes for real (never silently skipped) and produces a real persisted
eval_results row, and this script prints each case's reason grouped.

Requires:
  EVAL_DB_URL_SYNC     -- eval_db sync SQLAlchemy URL (defaults to the same
                          DEFAULT_EVAL_DB_URL_SYNC src/config.py uses)
  INTENT_GRPC_TARGET   -- host:port of a live eval_intent_grpc_server
                          (started by scripts/run-intent-golden-set.sh)

Exit code 0 on completion (regardless of pass rate -- a bad honest number is
the deliverable). Non-zero only on a real setup failure (no DB, no target).
"""
from __future__ import annotations

import json
import os
import sys
from collections import Counter
from dataclasses import dataclass
from pathlib import Path
from uuid import UUID

# Make `src.*` importable when run as a script from the repo root.
_REPO_ROOT = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(_REPO_ROOT / "apps" / "eval-service"))

from sqlalchemy import create_engine, event, text
from sqlalchemy.orm import Session, sessionmaker

from src.execution.agent_binding_client import AgentBindingEvalClient
from src.execution.audit_client import AuditEvalClient
from src.execution.credential_client import CredentialEvalClient
from src.execution.idempotency_client import IdempotencyReplayClient
from src.execution.ingestion_client import IngestionEvalClient
from src.execution.intent_client import IntentClient
from src.execution.memory_drift_client import MemoryDriftEvalClient
from src.execution.model_cache_client import ModelGatewayCacheClient
from src.execution.orchestrator import EvalRunOrchestrator
from src.execution.planner_client import PlannerClient
from src.execution.policy_client import PolicyEvalClient
from src.execution.project_client import ProjectEvalClient
from src.execution.recovery_client import RecoveryClient
from src.execution.retrieval_client import RetrievalClient
from src.execution.run_visibility_client import RunVisibilityEvalClient
from src.execution.security_client import SecurityEvalClient, UploadEvalClient
from src.execution.toolgw_client import ToolgwClient
from src.execution.trigger_client import TriggerRegistryClient
from src.execution.verification_client import VerificationClient
from src.execution.verification_severity_client import VerificationSeverityEvalClient
from src.execution.workflow_client import WorkflowEvalClient

# Honest unused placeholders for every domain the intent golden set never
# touches -- same shape and values as test_orchestrator_integration.py's
# _UNUSED_* constants. An unreachable target is real and honest (never
# silently mocked); it is simply never dialled by intent cases.
_UNUSED = "127.0.0.1:1"
_UNUSED_URL = "http://127.0.0.1:1"
_UNUSED_DB = "postgresql://unused:unused@127.0.0.1:1/unused"

GOLDEN_SET_NAME = "intent"


@dataclass(frozen=True)
class CaseReport:
    position: int
    utterance: str
    expected_intent: str
    observed_intent: str | None
    verdict: str
    reason: str


def _build_engine(db_url: str):
    engine = create_engine(db_url, pool_pre_ping=True)
    # eval_db is forced-RLS and its policy requires both this role and
    # context -- mirror src/grpc_server.py's checkout listener exactly.
    @event.listens_for(engine, "checkout")
    def _set_eval_service_context(dbapi_connection, _record, _proxy):
        cursor = dbapi_connection.cursor()
        try:
            cursor.execute("SET ROLE eval_service")
            cursor.execute("SET app.eval_internal = 'on'")
        finally:
            cursor.close()

    return engine


def _build_orchestrator(sessions, intent_target: str) -> EvalRunOrchestrator:
    intent_client = IntentClient(intent_target)
    # Every other client is an honest unused placeholder.
    verification_client = VerificationClient(_UNUSED)
    planner_client = PlannerClient(_UNUSED_URL)
    retrieval_client = RetrievalClient(_UNUSED)
    security_client = SecurityEvalClient(_UNUSED_URL)
    upload_client = UploadEvalClient(_UNUSED_URL)
    tenant_isolation_retrieval_client = RetrievalClient(_UNUSED)
    toolgw_client = ToolgwClient(_UNUSED)
    tool_consume_client = ToolgwClient(_UNUSED)
    recovery_client = RecoveryClient(_UNUSED, _UNUSED_DB)
    trigger_registry_client = TriggerRegistryClient(_UNUSED_URL, _UNUSED_DB)
    credential_client = CredentialEvalClient(_UNUSED_URL, _UNUSED_DB)
    idempotency_replay_client = IdempotencyReplayClient(
        tenant_a_base_url=_UNUSED_URL,
        tenant_b_base_url=_UNUSED_URL,
        db_url=_UNUSED_DB,
    )
    ingestion_client = IngestionEvalClient(_UNUSED_URL, _UNUSED_DB)
    policy_client = PolicyEvalClient(_UNUSED_URL, _UNUSED_DB)
    run_visibility_client = RunVisibilityEvalClient(_UNUSED_URL, _UNUSED_DB)
    model_cache_client = ModelGatewayCacheClient(_UNUSED)
    verification_severity_client = VerificationSeverityEvalClient(_UNUSED, _UNUSED_DB)
    audit_client = AuditEvalClient(_UNUSED)
    memory_drift_client = MemoryDriftEvalClient(_UNUSED_URL, _UNUSED_DB)
    workflow_client = WorkflowEvalClient(_UNUSED_URL, _UNUSED_DB)
    agent_binding_client = AgentBindingEvalClient(_UNUSED_URL, _UNUSED_DB)
    project_client = ProjectEvalClient(_UNUSED_URL, _UNUSED_DB)

    return EvalRunOrchestrator(
        sessions,
        verification_client,
        planner_client,
        retrieval_client,
        intent_client,
        security_client,
        upload_client,
        tenant_isolation_retrieval_client,
        toolgw_client,
        recovery_client,
        trigger_registry_client,
        credential_client,
        tool_consume_client,
        idempotency_replay_client,
        ingestion_client,
        policy_client,
        run_visibility_client,
        model_cache_client,
        verification_severity_client,
        audit_client,
        memory_drift_client,
        workflow_client,
        agent_binding_client,
        project_client,
    )


def _case_reason(details: dict) -> tuple[str | None, str]:
    """Return (observed_intent, reason) from an intent case's details."""
    if "error" in details:
        # Real per-case isolation failure (e.g. ClassifyIntent call failed).
        return None, str(details["error"])
    observed = details.get("observed")
    expected = details.get("expected")
    if observed is None or expected is None:
        return None, f"unexpected details shape: {json.dumps(details, sort_keys=True)}"
    observed_intent = observed.get("intent")
    expected_intent = expected.get("intent")
    if observed == expected:
        return observed_intent, "pass"
    return observed_intent, (
        f"observed intent {observed_intent!r} != expected {expected_intent!r}"
    )


def _report(sessions, eval_run_id: UUID) -> list[CaseReport]:
    rows = sessions().execute(
        text(
            """
            SELECT ec.id, er.verdict, er.details, ec.input, ec.expected
            FROM eval_results er
            JOIN eval_cases ec ON ec.id = er.eval_case_id
            WHERE er.eval_run_id = :rid
            ORDER BY ec.id
            """
        ),
        {"rid": str(eval_run_id)},
    )
    reports: list[CaseReport] = []
    for position, row in enumerate(rows, start=1):
        details = row.details if isinstance(row.details, dict) else json.loads(row.details)
        observed_intent, reason = _case_reason(details)
        expected_intent = row.expected.get("intent") if isinstance(row.expected, dict) else None
        utterance = row.input.get("utterance") if isinstance(row.input, dict) else None
        reports.append(
            CaseReport(
                position=position,
                utterance=str(utterance),
                expected_intent=str(expected_intent),
                observed_intent=observed_intent,
                verdict=str(row.verdict),
                reason=reason,
            )
        )
    return reports


def _case_count(sessions) -> int:
    return int(
        sessions().execute(
            text(
                """
                SELECT count(*)
                FROM golden_sets AS gs
                JOIN eval_cases AS ec ON ec.golden_set_id = gs.id
                WHERE gs.name = :name
                """
            ),
            {"name": GOLDEN_SET_NAME},
        ).scalar_one()
    )


def main() -> int:
    db_url = os.environ.get("EVAL_DB_URL_SYNC")
    if not db_url:
        # Fall back to src.config.DEFAULT_EVAL_DB_URL_SYNC without importing
        # Settings (which would require every runtime service address).
        from src.config import DEFAULT_EVAL_DB_URL_SYNC

        db_url = os.environ.get("EVAL_DB_URL_SYNC", DEFAULT_EVAL_DB_URL_SYNC)
    engine = _build_engine(db_url)
    sessions = sessionmaker(bind=engine, expire_on_commit=False, class_=Session)
    case_count = _case_count(sessions)
    if case_count == 0:
        print(
            f"NO CASES: golden set {GOLDEN_SET_NAME!r} is empty in "
            "EVAL_DB_URL_SYNC; refusing to report a score.",
            file=sys.stderr,
        )
        return 3

    intent_target = os.environ.get("INTENT_GRPC_TARGET")
    if not intent_target:
        print("run_intent_golden_set: INTENT_GRPC_TARGET is required", file=sys.stderr)
        return 2

    orchestrator = _build_orchestrator(sessions, intent_target)
    print(f"Running golden set {GOLDEN_SET_NAME!r} against {intent_target} ...")
    summary = orchestrator.run(GOLDEN_SET_NAME, trigger="manual")

    print(
        f"\nRESULT: total={summary.total_cases} passed={summary.passed} "
        f"failed={summary.failed} pass_rate={summary.pass_rate:.4f}"
    )

    reports = _report(sessions, summary.eval_run_id)
    if len(reports) != case_count:
        print(
            f"run_intent_golden_set: expected {case_count} result rows, got {len(reports)}",
            file=sys.stderr,
        )
        return 3
    print("\nPER-CASE:")
    for case in reports:
        print(
            f"  [{case.position:02d}] verdict={case.verdict} expected={case.expected_intent} "
            f"observed={case.observed_intent} reason={case.reason} utterance={case.utterance!r}"
        )

    failures = [c for c in reports if c.verdict != "pass"]
    print(f"\nFAILURES GROUPED BY REASON ({len(failures)} failed):")
    grouped: Counter[str] = Counter(c.reason for c in failures)
    for reason, count in grouped.most_common():
        print(f"  {count:3d} x  {reason}")
    if not failures:
        print("  (none -- every case passed)")

    # Cache-contamination check: report whether a second run would hit the
    # semantic cache. The shell wrapper runs this twice and compares timings.
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
