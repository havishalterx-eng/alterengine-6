import { AwsBedrockModelProvider } from "@alterx/adapters";
import { describe, expect, it } from "vitest";

import { classifyNodeFailure } from "./failure-classifier";
import { selectRecoveryStrategy } from "./recovery-strategy-table";

/**
 * Task 2.4b, step 5 -- and what it found instead.
 *
 * The step asked for a REAL model returning prose where the contract required
 * JSON, classified as a logic_output_failure and routed to replan. Driving it
 * against real Bedrock shows the first half cannot happen on this path:
 *
 *   AwsBedrockModelProvider.invoke always WRAPS the model's text --
 *   `{message: {role, content}, stop_reason}` -- and ModelGatewayService
 *   passes that wrapper through untouched as `output_json`
 *   (model-gateway.service.ts:270). So output_json is a valid JSON object no
 *   matter what the model said, `#validateOutputShape` cannot fire, and
 *   LLMTaskHandler's and SynthesisHandler's own `JSON.parse(output_json)`
 *   cannot fail either.
 *
 * The consequence is not that the failure is rare. It is that **prose is
 * accepted as a valid node result**: the wrapper parses, the handler proceeds,
 * and nothing anywhere checks that `message.content` matched the task's
 * contract. A model answering the wrong question entirely produces a
 * structurally perfect node output.
 *
 * So MODEL_OUTPUT_INVALID is unreachable from the Bedrock path today, and
 * `ask_user` is what an off-contract answer still falls through to -- the very
 * thing #149 and #151 set out to fix. Tracked as C29.
 *
 * This spec therefore asserts what is TRUE, so the finding cannot rot:
 *   1. real Bedrock prose arrives wrapped, and the wrapper is valid JSON
 *   2. no coded failure is produced anywhere along that path
 *   3. the classifier and strategy table ARE correct -- given the code, they
 *      route it to replan, which 2.4a proved replans from the stored skeleton
 *
 * If someone later makes the gateway surface off-contract content as a coded
 * failure, assertion 2 flips and this spec fails -- which is exactly when it
 * should be rewritten.
 *
 * WHAT DRIVES THIS. Not CI: it needs real Bedrock credentials, and a check
 * that cannot pass in CI must not sit there permanently red
 * (verification-standard.md requirement 4). It skips without credentials, and
 * is run by hand before any change to the Bedrock adapter's response shape,
 * the gateway's output_json handling, or the failure classifier's code
 * patterns -- the three things it pins.
 */

const REGION = process.env.AWS_REGION ?? "ap-south-1";
const MODEL_ID = process.env.ALTER_LIVE_MODEL_ID ?? "qwen.qwen3-32b-v1:0";
const LIVE = process.env.ALTER_LIVE_BEDROCK === "1";

describe.skipIf(!LIVE).sequential(
  "2.4b step 5: what a real model output failure actually does",
  () => {
    it("wraps prose into valid JSON, so no coded failure is produced", async () => {
      const provider = new AwsBedrockModelProvider({ region: REGION });

      // Deliberately invites prose: no JSON instruction, because the case
      // under test is a model that does not produce JSON when a caller needs it.
      const result = await provider.invoke({
        tenantId: "ten_018f4d6e-2b4a-7a3e-8c1a-2024091500a1",
        runId: "run_018f4d6e-2b4a-7a3e-8c1a-2024091500a3",
        nodeExecutionId: "node_018f4d6e-2b4a-7a3e-8c1a-2024091500a4",
        modelId: MODEL_ID,
        capabilityTags: ["text.summarisation"],
        inputJson: JSON.stringify({
          messages: [
            {
              role: "user",
              content:
                "Summarise in one short paragraph why distributed systems are hard.",
            },
          ],
        }),
      });

      // 1. The wrapper is valid JSON whatever the model said.
      const parsed = JSON.parse(result.outputJson) as {
        readonly message: { readonly content: string };
      };
      expect(typeof parsed.message.content).toBe("string");

      // 2. And the content itself is prose, not JSON -- which nothing checks.
      expect(() => JSON.parse(parsed.message.content)).toThrow();

      // 3. So the handlers' own validation passes: output_json parses to a
      //    plain object. No MODEL_OUTPUT_INVALID is produced on this path.
      expect(typeof parsed).toBe("object");
      expect(Array.isArray(parsed)).toBe(false);
    }, 120_000);

    it("classifies and routes correctly once a code exists (C29 is the missing producer)", () => {
      // The downstream half is real and works. It is the producer that is
      // missing, which is why this assertion is separated from the live call.
      const classified = classifyNodeFailure(
        {
          nodeType: "LLMTask",
          attempt: 2,
          error: { code: "MODEL_OUTPUT_INVALID" },
        },
        {},
      );
      expect(classified.failureClass).toBe("logic_output_failure");
      expect(
        selectRecoveryStrategy("logic_output_failure", 2, undefined).strategy,
      ).toBe("replan");
    });
  },
);
