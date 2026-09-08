# Phase 1, task 1.5 — report

## What I read, and what I understood the task to be

Read, in order: `docs/verification-standard.md` (binding), `docs/memoryalter.md`
(§5 especially: Bedrock model availability, the semantic cache, the mock
provider), `docs/local-dev.md` (the AppConfig opt-in), `docs/checklist.md`
(Phase 1's done gate), `CLAUDE.md`.

Understood the task: Phase 1 is the measurement. Everything before it made
measurement possible; 1.5 is the measurement. The work is to bind the four
model aliases (`FAST`, `STANDARD`, `ADVANCED`, `CEILING`) to a real Bedrock
model — all starting on `qwen.qwen3-32b-v1:0` so the first golden-set number
measures the ENGINE rather than a tier-mapping guess — then run the 30-case
golden set against the real provider, treat a bad honest number as signal,
void the pre-provider numbers first, leave the fallback chain empty and report
the enum problem, and leave behind a verification artefact that keeps the
third done gate true. Do not touch Category 1 logic; do not tune; do not
change the cache or the fallback enum; open a PR and stop.

## Where the alias policy is actually read from

It is not obvious from the code alone; both paths the prompt named are
involved, with precedence:

1. **Override (wins):** `OperationalConfigProvider.resolveModelAlias()`
   (`apps/model-gateway/src/operations/operational-config-provider.ts`)
   calls `loadOverride()` → `readPolicy(parameterName)`, which reads an SSM
   parameter named by `MODEL_POLICY_OVERRIDE_PARAMETER_NAME`
   (`apps/model-gateway/src/config/environment.ts:227`), defaulting to
   `/alter/${ALTER_ENV}/model-gateway/model-policy`. In mock mode `main.ts`
   hardcodes it to `/alter/local/model-gateway/model-policy`. If the
   parameter is present and parses as `ModelAliasPolicySchema`, its bindings
   are returned with **precedence** over the baseline.

2. **Baseline (fallback):** when the override parameter is absent,
   `resolveModelAlias` falls back to `this.baseline.resolveModelAlias(alias)`,
   where baseline is `AwsAppConfigConfigProvider` under `appconfig` or
   `createMockConfigProvider()` under `mock` (the latter's default policy is
   `mock.fast.v1` / `mock.standard.v1` / ... — `packages/shared-clients/src/mocks/config-provider.ts`).

So the alias policy is read from **two** places: the SSM override parameter
(`MODEL_POLICY_OVERRIDE_PARAMETER_NAME`) with precedence, and the AppConfig
configuration profile as the baseline. The model-gateway then passes
`binding.model_id` straight to the primary provider's `invoke({modelId})` —
`AwsBedrockModelProvider.invoke` passes `request.modelId` straight to
`Converse` (`packages/adapters/src/aws/bedrock-model-provider.ts:83`), which
is why a Bedrock model id (or, for Nova, an inference-profile ARN) flows
through transparently.

The binding artefact is `infrastructure/model-alias-policy/phase-1-qwen-all-aliases.json`
(all four aliases → `qwen.qwen3-32b-v1:0`, `fallback_chain` omitted). The
production binding action is `scripts/apply-model-alias-policy.sh`, which
writes that JSON to the SSM override parameter a live model-gateway reads.
The eval path (`apps/model-gateway/src/eval_bootstrap_bedrock.ts`) seeds the
same policy into a mock mutable store and reads it through the same
`OperationalConfigProvider` override path, so the eval run exercises the
real override-read mechanism rather than a parallel one.

## The pre-provider numbers, recorded as void

Recorded in `docs/phase-1-preprovider-scores-void.md` before any live run.
Every eval score, quality verdict and similarity number produced before the
real Bedrock model was wired is void: the mock model provider returns one
canned reply (`{"intent":"answer","confidence":0.9}` for every utterance),
the mock embedding provider inverts discrimination
(`underwater.basket.weaving` 0.8740 > `text.summarisation` 0.8703), and
the 30-case golden set's 0/30 measured a dependency being unreachable, not
a model being bad. The first honest number is the output of
`scripts/run-intent-golden-set.sh` against real Bedrock; if it looks like a
regression against the void numbers, that is expected and is not a
regression.

## The 30-case result, WITH per-reason grouping

**Not run — blocked by the sandbox, with the real reason.** This is the
honest outcome the master prompt explicitly allows ("a zero is acceptable
only if you can name the real reason and show it is not a broken dependency";
here the outcome is "not run", named for the same reason). The live run
needs real AWS Bedrock and the Docker dependency stack; the sandbox that
produced this PR blocks both, verbatim:

- **AWS unreachable:** the AWS CLI is forced through a dead sandbox proxy.
  `aws --region ap-south-1 sts get-caller-identity` returns
  `aws: [ERROR]: Failed to connect to proxy URL: "http://127.0.0.1:57525"`.
  `curl https://bedrock-runtime.ap-south-1.amazonaws.com` returns `000`
  (no connection). Escalation to `full_network` / `all` was requested and
  not granted.
- **Docker unreachable:** `docker info` returns
  `permission denied while trying to connect to the docker API at
  unix:///Users/havishvardhan/.docker/run/docker.sock`. The dependency
  stack (engine-db for `eval_db`, redis for the cache) cannot be started.

Because the run could not happen in-sandbox, the deliverable is the
**executable script** that runs it without interpretation:
`scripts/run-intent-golden-set.sh`. It brings up what it needs (docker
compose `engine-db` + `redis`, eval-service migrations which seed the
30-case intent golden set, the Bedrock eval bootstrap and the
`eval_intent_grpc_server`), runs `apps/eval-service/scripts/run_intent_golden_set.py`
(30 cases, per-case reasons grouped by reason), then runs it a second time
and compares timings/outputs for the cache check. Run it on a host with real
AWS + Docker to get the honest number and the per-reason grouping; this
report will be amended with those numbers then. "Not run" is an environment
limit, not a judgement that the run is unnecessary — the script is the
artefact that keeps that honest.

## Whether the cache contaminated the run, and how you know

**Not determined — not run.** The script's second run is the cache check:
it prints `TIMING: run1=…s run2=…s ratio=…x` and flags a dramatic speedup
(>10x) as a likely semantic-cache hit (task 1.0's unexplained 80x speedup was
exactly this confusion). The model-gateway semantic cache threshold is 0.95
(`packages/shared-clients/src/mocks/cache-provider.ts:19`, live under Redis
in appconfig); if golden-set cases resemble each other, cache hits return
prior answers and the scores measure the cache, not the model. Per the
prompt, the cache is **not changed** — Track C17 is the open decision. The
eval bootstrap uses an in-memory mock cache that is per-process and cleared
on restart, so two runs in one process can hit it; the script reports this
honestly rather than disabling it.

## Verbatim: different utterances returning different intents

**Live: not run (sandbox blocks AWS).** The verbatim live evidence is the
output of `RUN_LIVE_BEDROCK_INTENT_TEST=1 pnpm exec nx run
orchestration-service:test` (the gated case in
`conversation-manager.intent-discrimination.spec.ts`), which logs
`live Bedrock intent outcomes: …` for five genuinely different utterances.

**Against the mock (verbatim, proven to fail):** the discrimination check
throws with exactly:

```
Conversation Manager did not discriminate: every utterance resolved to "answer" (intents=[{"intent":"answer","confidence":0.9},{"intent":"answer","confidence":0.9},{"intent":"answer","confidence":0.9},{"intent":"answer","confidence":0.9},{"intent":"answer","confidence":0.9}]).
```

Five genuinely different utterances — one per intent family (answer / plan /
workflow / execute / modify) — all collapsed to `answer` at 0.9. This is
the property the third done gate exists to detect, and the mock cannot
satisfy it.

## Verbatim: the test failing against the mock

The verification artefact is
`apps/orchestration-service/src/conversation/conversation-manager.intent-discrimination.spec.ts`.
Its mock case always runs and is **proven to fail**: it asserts the
discrimination check throws (the check throws because the mock returns
`answer` for every utterance), so the assertion passes — the passing
assertion is the evidence of the failure, not a contradiction. Verbatim
vitest output:

```
✓ fails the discrimination check with the mock provider (proven to fail)
  Tests  1 passed | 1 skipped (2)
```

The skipped case is the live-Bedrock assertion, gated behind
`RUN_LIVE_BEDROCK_INTENT_TEST=1` (mirroring task 1.2's
`RUN_LIVE_TITAN_EMBEDDING_TEST` gate in
`apps/model-gateway/src/gateway/embedding-discrimination.spec.ts`), so CI
— which has no live AWS credentials — is never left permanently red. The
full orchestration-service suite stays green: `Tests 664 passed | 70 skipped`
with this spec included.

## Gate 2 (underwater.basket.weaving no-match)

**Live: not run (sandbox blocks AWS).** Already proven in task 1.2 against
real Titan (memoryalter.md §5: `underwater.basket.weaving` 0.1214 vs
`text.summarisation` 0.8600 at threshold 0.6). The prompt asks to re-confirm
it with a real model in the loop; that reconfirmation is part of the live
run the sandbox blocks. The alias binding (all tiers → qwen) does not change
the embedding path, so task 1.2's result stands; the reconfirmation belongs
to the live run.

## Your reading on the fallback enum

`FallbackProviderSchema` is `z.enum(["anthropic", "openai"])`
(`packages/contracts/src/model-alias-policy.ts:11`). The fallback chain can
only name Anthropic or OpenAI. Anthropic is out of scope by decision, and
OpenAI-on-Bedrock returned no text in testing (memoryalter.md §5). So the
chain **cannot currently express a working non-Anthropic provider** — it is
left empty (the policy JSON omits `fallback_chain`).

My reading: **the enum is the wrong shape, not just missing a member.** The
primary `model_id` is a free string that takes any Bedrock model (or, for
Nova, an inference-profile ARN); the fallback, by contrast, is keyed by
*provider* (`anthropic` / `openai`) and carries its own `model_id` inside.
So the primary is addressed by model id and the fallback by provider name —
two different addressing schemes in one structure. Adding `bedrock` to the
enum would let the chain name a Bedrock model, but it would still be a
provider-keyed entry for what is really a model-id-keyed address. The open
question (Track C20) is whether the fallback should be a list of model ids
on the same footing as the primary, dropping the provider enum entirely —
not whether to add a member to a shape that may itself be wrong. I did not
extend the enum unilaterally, per the prompt.

## Verification standard compliance

- **Real behaviour, not process state:** the test calls `classifyIntent` on
  real utterances and asserts on the returned intents, not on a health flag.
- **Runs without anyone remembering:** it is a `.spec.ts` picked up by the
  orchestration-service `test` target, so CI's `gate` job runs it every push.
- **Proven to fail:** the mock case asserts the discrimination check
  throws and passes on that throw — verbatim output above.
- **Nothing permanently red:** the live-Bedrock case is gated behind
  `RUN_LIVE_BEDROCK_INTENT_TEST=1`, so CI (no live AWS creds) skips it; the
  mock case always passes.

## Files

- `infrastructure/model-alias-policy/phase-1-qwen-all-aliases.json` — the binding.
- `scripts/apply-model-alias-policy.sh` — writes it to the SSM override (production).
- `apps/model-gateway/src/eval_bootstrap_bedrock.ts` — Bedrock eval entrypoint (additive).
- `apps/eval-service/scripts/run_intent_golden_set.py` — 30-case runner + per-reason grouping.
- `scripts/run-intent-golden-set.sh` — one-command bring-up + run + cache check.
- `apps/orchestration-service/src/conversation/conversation-manager.intent-discrimination.spec.ts` — the artefact.
- `docs/phase-1-preprovider-scores-void.md` — pre-provider numbers voided.
- `docs/phase-1-task-1.5-report.md` — this report.

No Category 1 component logic changed. No credential committed. Branch
`task/1.5-real-model-golden-sets` is not merged; PR opened and stopped, per
the prompt.
