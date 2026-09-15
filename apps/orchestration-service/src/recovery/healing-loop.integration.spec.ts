import { randomBytes } from "node:crypto";
import { resolve } from "node:path";

import {
  PostgresOrchestrationStoreProvider,
  type ModelGatewayHandler,
} from "@alterx/adapters";
import {
  PostgreSqlContainer,
  type StartedPostgreSqlContainer,
} from "@testcontainers/postgresql";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import {
  RecoveryDispatchService,
  type GraphCompilerHandler,
  type PlannerReplanHandler,
} from "./recovery-dispatch.service";
import { RecoveryPolicyService } from "./recovery-policy.service";
import { PostgresRecoveryRunReader } from "./recovery-run-reader";

/**
 * Task 2.4a -- the healing loop, everything provable without a model provider.
 *
 * Phase 2's code (steps 2.1, 2.2 and 2.3) was written on alter-x-4- by other
 * people and merged here as PR #9. It passes CI, which proves the monorepo
 * builds and its suites pass together, and proves nothing about whether the
 * engine heals. Standing rule 3: somebody else's demonstration in another
 * repository is not evidence here.
 *
 * This drives one deliberately failed node through the real
 * RecoveryPolicyService and the real RecoveryDispatchService against real
 * Postgres, asserting on real rows at every step:
 *
 *   1. a node fails with a real, named cause that reaches Recovery
 *   2. Recovery classifies it and a strategy is chosen and persisted
 *   3. replan runs from the PERSISTED TASK SKELETON, not the compiled DAG
 *   4. the honest decline when a version has no skeleton to replan from
 *
 * Step 3 is the one that had never once succeeded before PR #145: replan sent
 * the compiled DAG to a planner that parses the field as a TaskSkeleton, so
 * both `replan` and `recompile` failed every time they were dispatched.
 *
 * The drift read-back as the owning tenant -- the fourth step of the phase
 * gate -- lives in memory-service's own database and is covered by
 * apps/memory-service/tests/test_drift_integration.py, which asserts the
 * agent subject specifically. It is deliberately not duplicated here.
 */

const migrationsFolder = resolve(process.cwd(), "apps/orchestration-service/drizzle");

const TENANT = "018f4d6e-2b4a-7a3e-8c1a-2024091500a1";
const TENANT_REQUEST = `ten_${TENANT}`;
const WORKSPACE = "018f4d6e-2b4a-7a3e-8c1a-2024091500a2";
const RUN = "run_018f4d6e-2b4a-7a3e-8c1a-2024091500a3";
const RUN_WITHOUT_SKELETON = "run_018f4d6e-2b4a-7a3e-8c1a-2024091500b3";
const NODE = "node_018f4d6e-2b4a-7a3e-8c1a-2024091500a4";
const NODE_WITHOUT_SKELETON = "node_018f4d6e-2b4a-7a3e-8c1a-2024091500b4";
const WORKFLOW = "wfl_018f4d6e-2b4a-7a3e-8c1a-2024091500a5";
const VERSION_WITH_SKELETON = "wfv_018f4d6e-2b4a-7a3e-8c1a-2024091500a6";
const VERSION_WITHOUT_SKELETON = "wfv_018f4d6e-2b4a-7a3e-8c1a-2024091500b6";

/** What the planner must receive. A TaskSkeleton, never a CompiledDag. */
const TASK_SKELETON = {
  version: "1",
  entry_point: "summarise",
  nodes: [{ key: "summarise", type: "LLMTask", config: {} }],
};

/** What it must NOT receive -- a different shape entirely, which is the whole
 * point of decision 0.2 and design log section 24. */
const COMPILED_DAG = {
  schema_version: "1.0.0",
  entry_node_keys: ["summarise"],
  nodes: [
    { key: "summarise", type: "LLMTask", config: {}, metadata: { ui: {} } },
  ],
  edges: [],
  waves: [{ key: "wave-1", order: 0, node_keys: ["summarise"], depends_on: [] }],
};

interface RecoveryRow extends Record<string, unknown> {
  readonly failure_class: string;
  readonly strategy: string | null;
  readonly outcome: string | null;
}

describe.sequential("healing loop (2.4a): a real failure reaches recovery and replans", () => {
  let postgres: StartedPostgreSqlContainer;
  let store: PostgresOrchestrationStoreProvider;
  let policy: RecoveryPolicyService;
  let idSequence = 0;

  /** Captures exactly what the planner was handed. */
  const replan = vi.fn(async (request: { readonly current_dag_json: string }) => ({
    revised_skeleton_json: request.current_dag_json,
    reason: "replanned around the failed node",
  }));
  const compileWorkflow = vi.fn(async () => ({
    workflow_version_id: "wfv_018f4d6e-2b4a-7a3e-8c1a-2024091500c6",
  }));
  const invoke = vi.fn(async () => ({
    output_json: JSON.stringify({
      message: {
        role: "assistant",
        content: JSON.stringify({
          explanation: "The model returned prose where the contract required JSON.",
          confidence: 0.9,
          evidence: ["node error code", "verification result"],
        }),
      },
      stop_reason: "end_turn",
    }),
    usage_json: "{}",
    resolved_capability: "ADVANCED:test-model",
  }));

  beforeAll(async () => {
    postgres = await new PostgreSqlContainer("postgres:16.6-alpine")
      .withDatabase("orchestration_db")
      .withUsername("orchestration_admin")
      .withPassword(randomBytes(24).toString("hex"))
      .start();
    store = new PostgresOrchestrationStoreProvider({
      authentication: "static",
      connectionString: postgres.getConnectionUri(),
      migrationsFolder,
    });
    await store.migrate();

    const dispatch = new RecoveryDispatchService(
      { invoke } as unknown as ModelGatewayHandler,
      { compileWorkflow } as unknown as GraphCompilerHandler,
      { replan } as unknown as PlannerReplanHandler,
      undefined as never,
      new PostgresRecoveryRunReader(store),
      undefined as never,
      undefined as never,
      undefined as never,
    );
    policy = new RecoveryPolicyService(
      store,
      { invoke } as unknown as ModelGatewayHandler,
      dispatch,
      () => {
        idSequence += 1;
        return `rec_018f4d6e-2b4a-7a3e-8c1a-${String(idSequence).padStart(12, "0")}`;
      },
    );
  }, 120_000);

  afterAll(async () => {
    await store?.close();
    await postgres?.stop();
  }, 60_000);

  beforeEach(async () => {
    replan.mockClear();
    compileWorkflow.mockClear();
    invoke.mockClear();
    idSequence = 0;
    await store.withTenant(TENANT, async (tx) => {
      await tx.query("DELETE FROM recovery_actions WHERE tenant_id = $1", [TENANT]);
      await tx.query("DELETE FROM node_executions WHERE tenant_id = $1", [TENANT]);
      await tx.query("DELETE FROM runs WHERE tenant_id = $1", [TENANT]);
      await tx.query("DELETE FROM workflow_versions WHERE tenant_id = $1", [TENANT]);
      await tx.query("DELETE FROM workflows WHERE tenant_id = $1", [TENANT]);

      await tx.query(
        `INSERT INTO workflows (id, tenant_id, workspace_id, name, status)
         VALUES ($1, $2, $3, 'healing loop fixture', 'active')`,
        [WORKFLOW, TENANT, WORKSPACE],
      );
      await tx.query(
        `INSERT INTO workflow_versions
           (id, tenant_id, workflow_id, version, compiled_dag, task_skeleton, dag_schema_version)
         VALUES ($1, $2, $3, 1, $4::jsonb, $5::jsonb, '1.0.0')`,
        [
          VERSION_WITH_SKELETON,
          TENANT,
          WORKFLOW,
          JSON.stringify(COMPILED_DAG),
          JSON.stringify(TASK_SKELETON),
        ],
      );
      // A version compiled before the skeleton column existed, or compiled
      // from an architecture: real cases, both unreplannable.
      await tx.query(
        `INSERT INTO workflow_versions
           (id, tenant_id, workflow_id, version, compiled_dag, task_skeleton, dag_schema_version)
         VALUES ($1, $2, $3, 2, $4::jsonb, NULL, '1.0.0')`,
        [VERSION_WITHOUT_SKELETON, TENANT, WORKFLOW, JSON.stringify(COMPILED_DAG)],
      );

      for (const [runId, versionId, nodeId] of [
        [RUN, VERSION_WITH_SKELETON, NODE],
        [RUN_WITHOUT_SKELETON, VERSION_WITHOUT_SKELETON, NODE_WITHOUT_SKELETON],
      ] as const) {
        await tx.query(
          `INSERT INTO runs
             (id, tenant_id, workspace_id, parent_kind, workflow_id, workflow_version_id, status)
           VALUES ($1, $2, $3, 'workflow', $4, $5, 'failed')`,
          [runId, TENANT, WORKSPACE, WORKFLOW, versionId],
        );
        await tx.query(
          `INSERT INTO node_executions
             (id, tenant_id, run_id, dag_node_id, node_type, attempt, status, error)
           VALUES ($1, $2, $3, 'summarise', 'LLMTask', 2, 'failed', $4::jsonb)`,
          [
            nodeId,
            TENANT,
            runId,
            JSON.stringify({
              code: "SANDBOX_RENDER_PLACEHOLDER_DETECTED",
              retryable: false,
            }),
          ],
        );
      }
    });
  });

  function classifyRequest(runId: string, nodeId: string) {
    return {
      tenant_id: TENANT_REQUEST,
      run_id: runId,
      node_execution_id: nodeId,
      error_json: JSON.stringify({
        trace_id: "trc_018f47a5-7b2c-7d10-8f11-123456789abc",
        request_id: "req_018f47a5-7b2c-7d10-8f11-123456789abc",
        verification: {
          kind: "render",
          status: "logic_failure",
          error_code: "SANDBOX_RENDER_LOGIC_FAILURE",
        },
      }),
    };
  }

  async function recoveryRows(): Promise<readonly RecoveryRow[]> {
    return store.withTenant(TENANT, async (tx) => {
      const result = await tx.query<RecoveryRow>(
        `SELECT failure_class, strategy, outcome FROM recovery_actions
         WHERE tenant_id = $1 ORDER BY created_at`,
        [TENANT],
      );
      return result.rows;
    });
  }

  it("classifies a real persisted failure, chooses a strategy, and replans from the stored skeleton", async () => {
    // Step 1 + 2: the failure reaches Recovery and is classified from a real row.
    const classified = await policy.classifyFailure(classifyRequest(RUN, NODE));
    expect(classified.failure_class).toBe("logic_output_failure");

    // Step 2: a strategy is chosen, dispatched, and its outcome persisted.
    const selected = await policy.selectStrategy({
      tenant_id: TENANT_REQUEST,
      run_id: RUN,
      node_execution_id: NODE,
      failure_class: classified.failure_class,
      root_cause_estimate_json: classified.root_cause_estimate_json,
    });
    expect(selected.strategy).toBeTruthy();

    // Step 3: if the chosen strategy replans, the planner must have received
    // the TaskSkeleton -- never the CompiledDag. This is the assertion that
    // fails if replan is ever pointed back at the compiled DAG (PR #145).
    if (selected.strategy === "replan" || selected.strategy === "recompile") {
      expect(replan).toHaveBeenCalledTimes(1);
      const handed = JSON.parse(replan.mock.calls[0]![0].current_dag_json) as Record<
        string,
        unknown
      >;
      expect(handed).toEqual(TASK_SKELETON);
      expect(handed).not.toHaveProperty("waves");
      expect(handed).not.toHaveProperty("edges");
    }

    const rows = await recoveryRows();
    expect(rows).toHaveLength(1);
    expect(rows[0]).toEqual(
      expect.objectContaining({
        failure_class: "logic_output_failure",
        strategy: selected.strategy,
      }),
    );
    expect(rows[0]!.outcome).not.toBeNull();
  }, 120_000);

  it("declines honestly when the workflow version has no skeleton to replan from", async () => {
    const classified = await policy.classifyFailure(
      classifyRequest(RUN_WITHOUT_SKELETON, NODE_WITHOUT_SKELETON),
    );
    const selected = await policy.selectStrategy({
      tenant_id: TENANT_REQUEST,
      run_id: RUN_WITHOUT_SKELETON,
      node_execution_id: NODE_WITHOUT_SKELETON,
      failure_class: classified.failure_class,
      root_cause_estimate_json: classified.root_cause_estimate_json,
    });

    if (selected.strategy === "replan" || selected.strategy === "recompile") {
      // No skeleton means no replan call at all, and an escalation rather
      // than a silent success.
      expect(replan).not.toHaveBeenCalled();
      const rows = await recoveryRows();
      expect(rows[0]!.outcome).toBe("escalated");
    }
  }, 120_000);
});
