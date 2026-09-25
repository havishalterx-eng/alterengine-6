import "reflect-metadata";
import { resolve } from "node:path";
import { randomBytes } from "node:crypto";
import { PostgresOrchestrationStoreProvider } from "@alterx/adapters";
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { FastifyAdapter, type NestFastifyApplication } from "@nestjs/platform-fastify";
import { Test } from "@nestjs/testing";
import { APP_FILTER } from "@nestjs/core";
import { afterAll, beforeAll, expect, it, vi } from "vitest";
import { TriggerRegistryController } from "../../../apps/orchestration-service/src/trigger-registry/trigger-registry.controller";
import { TriggerRegistryService } from "../../../apps/orchestration-service/src/trigger-registry/trigger-registry.service";
import { ProjectReadController } from "../../../apps/orchestration-service/src/project-read/project-read.controller";
import { ProjectReadService } from "../../../apps/orchestration-service/src/project-read/project-read.service";
import { ProjectDomainService } from "../../../apps/orchestration-service/src/project-read/project-domain.service";
import { TriggerController } from "../../../apps/platform-api/src/triggers/trigger.controller";
import { TriggerService } from "../../../apps/platform-api/src/triggers/trigger.service";
import { ProjectController } from "../../../apps/platform-api/src/projects/project.controller";
import { ProjectService } from "../../../apps/platform-api/src/projects/project.service";
import { EngineClient, EngineExceptionFilter } from "../../../apps/platform-api/src/engine";
import { engineConfigFromEnvironment } from "../../../apps/platform-api/src/engine/config";
import { RbacModule, type ActorContextType, type RbacRequest } from "../../../apps/platform-api/src/rbac";
import { resourceWorkspaceResolverToken } from "../../../apps/platform-api/src/rbac/rbac.module";
import { ParamWorkspaceResolver, defaultWorkspaceResolutionRules } from "../../../apps/platform-api/src/rbac/param-workspace.resolver";
import type { PlatformDb } from "../../../apps/platform-api/src/signup/platform-db";
import { PgIdempotencyStore } from "../../../apps/platform-api/src/idempotency";
import { ETAG_RESOURCE_RESOLVER } from "../../../apps/platform-api/src/concurrency";
import { TriggerEtagResolver } from "../../../apps/platform-api/src/triggers/trigger-etag.resolver";

const tenant = "018f47a5-7b2c-7d10-8f11-123456789abc";
const otherTenant = "018f47a5-7b2c-7d10-8f11-123456789abd";
const workspace = "018f47a5-7b2c-7d10-8f11-123456789abe";
const otherWorkspace = "018f47a5-7b2c-7d10-8f11-123456789abf";
const projectId = `prj_${tenant}`;
const actor: ActorContextType = { tenant_id: `ten_${tenant}`, workspace_id: `ws_${workspace}`,
  user_id: `usr_${tenant}`, session_id: "test-session", roles: ["admin"],
  permissions: ["workflows:read", "workflows:write", "workflows:deploy", "projects:read"],
  workspaceRoles: [{ workspaceId: workspace, role: "admin" }] };
let container: StartedPostgreSqlContainer;
let store: PostgresOrchestrationStoreProvider;
let engineApp: NestFastifyApplication;
let platformApp: NestFastifyApplication;
let api: typeof import("../../../apps/platform-web/src/api/client").api;
let triggerId: string;
let absentTestRoute = false;
const browserRequests: string[] = [];
const engineRequests: string[] = [];

// Focused stack: real controllers, HTTP transport and PostgreSQL; identity and
// idempotency storage supplied by the harness. Auth0/Temporal are outside this test.
beforeAll(async () => {
  container = await new PostgreSqlContainer("postgres:16.6-alpine")
    .withDatabase("orchestration_db").withPassword(randomBytes(24).toString("hex")).start();
  store = new PostgresOrchestrationStoreProvider({ authentication: "static",
    connectionString: container.getConnectionUri(), migrationsFolder: resolve("apps/orchestration-service/drizzle") });
  await store.migrate();
  for (const [tenantId, workspaceId, id] of [
    [tenant, workspace, projectId], [tenant, otherWorkspace, `prj_${workspace}`], [otherTenant, workspace, `prj_${otherTenant}`],
  ]) {
    await store.withTenant(tenantId!, tx => tx.query("INSERT INTO projects (id, tenant_id, workspace_id, name, status) VALUES ($1, $2, $3, 'Visible project', 'draft')", [id, tenantId, workspaceId]));
  }
  await store.withTenant(tenant, tx => tx.query("INSERT INTO workflows (id, tenant_id, workspace_id, name) VALUES ($1, $2, $3, 'Test workflow')", [`wf_${tenant}`, tenant, workspace]));
  const triggers = new TriggerRegistryService(store);
  triggerId = (await triggers.registerTrigger({ tenantId: actor.tenant_id, workspaceId: workspace,
    workflowId: `wf_${tenant}`, name: "Test trigger", type: "manual" })).trigger.id;
  const moduleRef = await Test.createTestingModule({ controllers: [TriggerRegistryController, ProjectReadController], providers: [
    { provide: TriggerRegistryService, useValue: triggers }, { provide: ProjectReadService, useValue: new ProjectReadService(store) },
    { provide: ProjectDomainService, useValue: {} },
  ] }).compile();
  engineApp = moduleRef.createNestApplication<NestFastifyApplication>(new FastifyAdapter());
  engineApp.getHttpAdapter().getInstance().addHook("preHandler", async (request, reply) => {
    engineRequests.push(request.url);
    Object.assign(request, { actorContext: actor });
    if (absentTestRoute && request.url.endsWith("/actions/test")) return reply.code(404).send({ detail: "Test route unavailable" });
  });
  await engineApp.listen(0, "127.0.0.1");
  const engineUrl = await engineApp.getUrl();
  const engine = new EngineClient(engineConfigFromEnvironment({ ENGINE_BASE_URL: engineUrl,
    ADS_CORE_BASE_URL: engineUrl, COST_LEDGER_BASE_URL: engineUrl, AUDIT_SERVICE_BASE_URL: engineUrl,
    EVAL_FACADE_TOKEN_REF: "test", DEPLOYMENT_ADMIN_SERVICE_TOKEN_REF: "test", AUDIT_QUERY_SERVICE_TOKEN_REF: "test",
    ENGINE_M2M_TOKEN_URL: engineUrl, ENGINE_M2M_AUDIENCE: "test", ENGINE_M2M_CLIENT_ID: "test", ENGINE_M2M_CLIENT_SECRET_REF: "test",
  }), { authorize: async () => ({ m2mAccessToken: "test", actorToken: "test" }) });
  const platform = await Test.createTestingModule({ imports: [RbacModule], controllers: [TriggerController, ProjectController], providers: [
    { provide: EngineClient, useValue: engine },
    { provide: TriggerService, useValue: new TriggerService(engine) },
    { provide: ProjectService, useValue: new ProjectService(engine) },
    TriggerEtagResolver, { provide: ETAG_RESOURCE_RESOLVER, useExisting: TriggerEtagResolver },
    { provide: PgIdempotencyStore, useValue: { execute: async (_input: unknown, operation: () => Promise<object>) => ({ ...await operation(), replayed: false }) } },
    { provide: APP_FILTER, useClass: EngineExceptionFilter },
  ] })
    // Production's EnforcingRbacModule resolution: a :projectId route is bound to the
    // workspace the engine says owns the project, and the actor needs a role THERE.
    .overrideProvider(resourceWorkspaceResolverToken)
    .useValue(new ParamWorkspaceResolver(defaultWorkspaceResolutionRules({ engineClient: engine, db: {} as PlatformDb })))
    .compile();
  platformApp = platform.createNestApplication<NestFastifyApplication>(new FastifyAdapter());
  platformApp.getHttpAdapter().getInstance().addHook("preHandler", async request => { (request as RbacRequest).actorContext = actor; });
  await platformApp.listen(0, "127.0.0.1");
  vi.stubEnv("VITE_API_MODE", "live");
  vi.stubEnv("VITE_API_BASE_URL", await platformApp.getUrl());
  const realFetch = globalThis.fetch;
  vi.stubGlobal("fetch", ((input, init) => { browserRequests.push(String(input)); return realFetch(input, init); }) as typeof fetch);
  ({ api } = await import("../../../apps/platform-web/src/api/client"));
}, 60_000);

afterAll(async () => {
  vi.unstubAllGlobals(); vi.unstubAllEnvs();
  await platformApp?.close(); await engineApp?.close(); await store?.close(); await container?.stop();
}, 60_000);

it("B5 real trigger test request persists exactly its returned event", async () => {
  const result = await api.testTrigger(triggerId);
  expect(result.success).toBe(true);
  expect(browserRequests.some(url => url.endsWith(`/triggers/${triggerId}/actions/test`))).toBe(true);
  expect(engineRequests).toContain(`/api/v1/triggers/${triggerId}/actions/test`);
  const rows = await store.withTenant(tenant, tx => tx.query("SELECT event_id, event_type, trigger_id FROM events WHERE event_id = $1", [result.eventId]));
  expect(rows.rows).toEqual([{ event_id: result.eventId, event_type: "trigger.test", trigger_id: triggerId }]);
});

it("B5 absent upstream route fails without persisting another event", async () => {
  const before = await store.withTenant(tenant, tx => tx.query("SELECT event_id FROM events WHERE trigger_id = $1", [triggerId]));
  absentTestRoute = true;
  const count = browserRequests.length;
  try { await expect(api.testTrigger(triggerId)).rejects.toThrow(); } finally { absentTestRoute = false; }
  expect(browserRequests).toHaveLength(count + 1);
  const rows = await store.withTenant(tenant, tx => tx.query("SELECT event_id FROM events WHERE trigger_id = $1", [triggerId]));
  expect(rows.rows).toEqual(before.rows);
});

it("B5 removal archives the trigger through the status route and keeps the row", async () => {
  await api.removeTrigger(triggerId);
  expect(engineRequests).toContain(`/api/v1/triggers/${triggerId}/status`);
  const rows = await store.withTenant(tenant, tx => tx.query("SELECT id, status FROM triggers WHERE id = $1", [triggerId]));
  expect(rows.rows).toEqual([{ id: triggerId, status: "archived" }]);
});

it("B4 project list reaches SQL and excludes other tenants and workspaces", async () => {
  const projects = await api.getProjects();
  expect(projects.map(project => project.id)).toEqual([projectId]);
  expect(engineRequests).toContain("/api/v1/projects");
  expect(projects[0]?.name).toBe("Visible project");
});

it("B4 project detail reaches the stored project", async () => {
  expect(await api.getProject(projectId)).toMatchObject({ id: projectId, name: "Visible project" });
  expect(engineRequests).toContain(`/api/v1/projects/${projectId}`);
});

it("B4 project detail refuses another workspace or tenant", async () => {
  // Same tenant, a workspace the actor holds no role in: the guard refuses before the read.
  await expect(api.getProject(`prj_${workspace}`)).rejects.toThrow("Access denied");
  await expect(api.getProject(`prj_${otherTenant}`)).rejects.toThrow();
});
