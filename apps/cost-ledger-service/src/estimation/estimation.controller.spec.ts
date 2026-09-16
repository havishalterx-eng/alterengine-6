import { Test } from "@nestjs/testing";
import { FastifyAdapter, type NestFastifyApplication } from "@nestjs/platform-fastify";
import { afterEach, describe, expect, it } from "vitest";

import { COST_STORE_PROVIDER } from "../database/cost-store.token";
import { EstimationController } from "./estimation.controller";
import { EstimationService } from "./estimation.service";

const TENANT = "ten_018f4d6e-2b4a-7a3e-8c1a-1234567890a1";

describe("POST /costs/estimate", () => {
  let app: NestFastifyApplication | undefined;

  afterEach(async () => app?.close());

  it("accepts the same ten_-prefixed tenant format as /costs/by-run", async () => {
    app = await createApp();
    const response = await app.getHttpAdapter().getInstance().inject({
      method: "POST",
      url: "/costs/estimate",
      payload: {
        tenantId: TENANT,
        mode: "workflow",
        lineItems: [{ source: "sandbox", provider: "e2b", resource: "vm_seconds", expectedQuantity: 1 }],
      },
    });

    expect(response.statusCode).toBe(201);
    expect(response.json().currency).toBe("INR");
  });

  it("rejects a bare UUID at the external route", async () => {
    app = await createApp();
    const response = await app.getHttpAdapter().getInstance().inject({
      method: "POST",
      url: "/costs/estimate",
      payload: {
        tenantId: TENANT.slice(4),
        mode: "workflow",
        lineItems: [{ source: "sandbox", provider: "e2b", resource: "vm_seconds", expectedQuantity: 1 }],
      },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json().message).toContain("tenantId must have prefix ten_");
  });
});

async function createApp(): Promise<NestFastifyApplication> {
  const emptyStore = {
    withTenant: async (_tenant: string, operation: (tx: { query: () => Promise<{ rows: never[] }> }) => Promise<unknown>) =>
      operation({ query: async () => ({ rows: [] }) }),
    withProvisioner: async (operation: (tx: { query: () => Promise<{ rows: never[] }> }) => Promise<unknown>) =>
      operation({ query: async () => ({ rows: [] }) }),
  };
  const module = await Test.createTestingModule({
    controllers: [EstimationController],
    providers: [
      EstimationService,
      { provide: COST_STORE_PROVIDER, useValue: emptyStore },
    ],
  }).compile();
  const application = module.createNestApplication<NestFastifyApplication>(new FastifyAdapter());
  await application.init();
  await application.getHttpAdapter().getInstance().ready();
  return application;
}
