import { createServer } from "node:net";
import { resolve } from "node:path";

import { Module } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { FastifyAdapter } from "@nestjs/platform-fastify";
import {
  MODELGW_HANDLER,
  ModelGatewayClient,
  ModelgwGrpcController,
  startModelgwGrpcTransport,
  TitanEmbeddingProvider,
  type ModelgwHandler,
} from "@alterx/adapters";
import {
  createMockCacheProvider,
  createMockConfigProvider,
  createMockEmbeddingProvider,
  createMockModelProvider,
  createMockPIIRedactionProvider,
  createMockQueueProvider,
  type EmbeddingProvider,
} from "@alterx/shared-clients";
import { afterEach, describe, expect, it } from "vitest";

import { ModelGatewayService } from "./model-gateway.service";

// This test calls the Embed RPC over a real gRPC transport rather than the
// handler directly, so a defect in the gRPC wire path (proto shape, codec,
// transport wiring) cannot hide behind an in-process call. Vendor gRPC
// client construction stays inside ModelGatewayClient (@alterx/adapters) --
// see docs/CLAUDE.md's architecture boundary law: vendor SDK imports live
// only under packages/adapters/**, never in apps/*/src.

const CAPABILITY_TEXTS = [
  "text.summarisation\ncontent.writing",
  "text.summarisation",
  "underwater.basket.weaving",
  "quantum.teleportation",
] as const;
const protoPath = resolve(
  process.cwd(),
  "packages/contracts/proto/alter/modelgw/v1/modelgw.proto",
);

let handler: ModelgwHandler;

@Module({
  controllers: [ModelgwGrpcController],
  providers: [{ provide: MODELGW_HANDLER, useFactory: () => handler }],
})
class ModelgwDiscriminationTestModule {}

let app: Awaited<ReturnType<typeof NestFactory.create>> | undefined;

afterEach(async () => {
  await app?.close();
  app = undefined;
});

async function availablePort(): Promise<number> {
  return new Promise((resolvePort, reject) => {
    const server = createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (address === null || typeof address === "string") {
        reject(new Error("Could not allocate a local gRPC port"));
        return;
      }
      server.close((error) => (error === undefined ? resolvePort(address.port) : reject(error)));
    });
  });
}

async function startGateway(embeddingProvider: EmbeddingProvider): Promise<ModelGatewayClient> {
  handler = new ModelGatewayService(
    createMockConfigProvider(),
    createMockModelProvider(),
    createMockPIIRedactionProvider(),
    embeddingProvider,
    createMockCacheProvider(),
    createMockQueueProvider(),
    "test-cost-events",
    {
      ingestCostEvent: async () => ({ accepted: true }),
      resolveUnitPrice: async () => ({
        unit_cost_minor: "10",
        currency: "INR",
        confidence: "fixed_table",
      }),
      recordModelOutcome: async () => ({ accepted: true }),
    },
  );
  app = await NestFactory.create(ModelgwDiscriminationTestModule, new FastifyAdapter(), {
    logger: false,
  });
  const port = await availablePort();
  await startModelgwGrpcTransport(app, {
    bindAddress: `127.0.0.1:${port}`,
    protoPath,
  });
  await app.init();
  return new ModelGatewayClient({ address: `127.0.0.1:${port}`, protoPath });
}

async function embed(client: ModelGatewayClient, text: string): Promise<readonly number[]> {
  const response = await client.embed({ tenant_id: "verification", text, dimensions: 512 });
  if (response.dimensions !== 512 || response.embedding.length !== 512) {
    throw new Error("Embed RPC did not return a 512-dimension vector");
  }
  return response.embedding;
}

function cosine(left: readonly number[], right: readonly number[]): number {
  const dot = left.reduce(
    (sum, value, index) => sum + value * (right[index] ?? Number.NaN),
    0,
  );
  return dot / Math.sqrt(
    left.reduce((sum, value) => sum + value * value, 0) *
      right.reduce((sum, value) => sum + value * value, 0),
  );
}

async function assertDiscrimination(client: ModelGatewayClient): Promise<void> {
  const vectors = await Promise.all(
    CAPABILITY_TEXTS.map((text) => embed(client, text)),
  );
  const [agent, relevant, firstIrrelevant, secondIrrelevant] = vectors;
  if (
    agent === undefined ||
    relevant === undefined ||
    firstIrrelevant === undefined ||
    secondIrrelevant === undefined
  ) {
    throw new Error("Embed RPC returned fewer discrimination vectors than requested");
  }
  const relevantScore = cosine(agent, relevant);
  const irrelevantScores = [
    cosine(agent, firstIrrelevant),
    cosine(agent, secondIrrelevant),
  ];
  if (!irrelevantScores.every((score) => relevantScore > score)) {
    throw new Error(
      `Embedding discrimination failed: relevant=${relevantScore}, irrelevant=${irrelevantScores.join(",")}`,
    );
  }
}

describe("Model Gateway Embed discrimination", () => {
  it("fails the relationship check with the mock provider", async () => {
    await expect(assertDiscrimination(await startGateway(createMockEmbeddingProvider())))
      .rejects.toThrow(/Embedding discrimination failed: relevant=.*irrelevant=/);
  });

  it.runIf(process.env.RUN_LIVE_TITAN_EMBEDDING_TEST === "1")(
    "returns related capability embeddings ahead of unrelated capabilities from Titan",
    async () => {
      const provider = new TitanEmbeddingProvider({
        region: "ap-south-1",
        endpoint:
          process.env.AWS_ENDPOINT_URL_BEDROCK_RUNTIME ??
          "https://bedrock-runtime.ap-south-1.amazonaws.com",
      });
      try {
        await expect(assertDiscrimination(await startGateway(provider))).resolves.toBeUndefined();
      } finally {
        provider.close();
      }
    },
  );
});
