# Master prompt — Project Revive, task 1.2: wire real Titan embeddings

**The highest-value task in Phase 1.** Paste the fenced block into a builder session.

**Prerequisites — check before pasting:** Titan Text Embeddings V2 access granted in Bedrock,
IAM credentials with `bedrock:InvokeModel`, and task 1.0 finished (not merely running — it
stops services on purpose).

---

```
You are the Builder on Project Revive — bringing the existing Alter Engine
back to a demonstrably working state.

Repo:  https://github.com/havishalterx-eng/alterengine-6
Local: ~/Desktop/alterengine-6

This is the ONLY repository. alter-x-4- and alterengine--5 are frozen and
read-only — never push, comment, or file anything on either.

READ FIRST, in this order:
  1. docs/components/selection-binding/README.md — why this task matters
  2. docs/memoryalter.md — section 5 "The mock provider inverts
     discrimination", and section 6 for which components you must not touch
  3. docs/checklist.md — Phase 1, and the standing rules
  4. packages/adapters/src/aws/titan-embedding-provider.ts — the adapter you
     are wiring. Read it fully; it has two traps described below.
  5. CLAUDE.md

State before you start: what you read, and what you understand the task to
be.

WHY THIS IS THE HIGHEST-VALUE TASK IN THE PHASE

The local mock embedding is a per-dimension SHA-256 hash, so every vector
lands in the same positive orthant and everything resembles everything.
Measured during assessment, against a threshold of 0.6:

    underwater.basket.weaving   0.8740   against a summarisation agent
    quantum.teleportation       0.8499
    text.summarisation          0.8703   <- the genuinely relevant one

Nonsense scores higher than the real thing. A mock that answers everything
is not a neutral stand-in: it silently converts a discriminating system
into one that accepts anything. This single mock is why the capability
route can never produce a no-match locally, why Selection & Binding looked
like it worked, and why Agent Auto-Creation had never once been reached.

Three of Phase 3's six tasks are blocked behind it.

THE TASK

Wire TitanEmbeddingProvider (amazon.titan-embed-text-v2:0) behind
model-gateway's Embed RPC, replacing the mock in every path that is not
explicitly local development.

TWO TRAPS IN THE ADAPTER — READ THESE BEFORE YOU START

1. DIMENSIONS. The adapter validates that request.dimensions is exactly
   512 or 1024, and checks the returned vector length against it. The
   database column is vector(512) — see the capability_embeddings insert in
   apps/intelligence-service/src/agent_auto_creation/engine.py. The caller
   MUST pass 512. Pass 1024 and the provider succeeds while the database
   insert fails, at a distance from the cause.

2. healthCheck() DOES NOT PROBE ANYTHING. It returns status "healthy" with
   liveProbe: false without calling Bedrock at all. A passing health check
   proves the object was constructed, not that credentials work or that the
   model is reachable. Do not use it as evidence of anything. Prove reach
   with a real embed call.

Also note: normalize defaults to true. Confirm the similarity maths in
selection_binding actually assumes normalized vectors. If it does not,
scores will be subtly wrong in a way no test currently catches — report it
rather than changing selection_binding, which is Category 3 and not in
this task's scope.

A THIRD TRAP, IN THE ENVIRONMENT RATHER THAN THE ADAPTER

.env.local.example sets AWS_ENDPOINT_URL=http://127.0.0.1:4566. That is a
GLOBAL override in the AWS SDK, so every AWS call — including Bedrock —
routes to LocalStack, which does not implement Bedrock. Real credentials
with that line still in place produce a confusing failure that looks like
a credentials problem and is not.

You cannot simply remove it. LocalStack still serves S3, SQS, Secrets
Manager and SSM for the rest of the stack, and removing the override
breaks what task 1.0 just proved works.

So Bedrock must bypass the global override while everything else keeps
using it. Three shapes are available — a service-specific
AWS_ENDPOINT_URL_BEDROCK_RUNTIME pointing at real AWS, an explicit
endpoint passed to BedrockRuntimeClient in the adapter, or running the
Bedrock-touching service without the global override. Pick one, and say
why you picked it. Credentials are not the conflict: LocalStack ignores
credentials entirely, so real ones work against both.

ALREADY VERIFIED FOR YOU — DO NOT REDO, DO MATCH

Bedrock Titan v2 was called live in ap-south-1 on 2026-09-08 as
user/alterengine.dev, before this task was issued. It returned a 512-
dimension normalized vector. Measuring capability string against
capability string, which is what the system compares:

    text.summarisation          0.8600   MATCH
    underwater.basket.weaving   0.1214   no-match
    quantum.teleportation       0.0757   no-match

against the existing threshold of 0.6 at selection_binding/engine.py:223.

These are your target numbers. Your wiring should reproduce them through
the Embed RPC. If it does not, the wiring is wrong — the provider is not.
Do not tune anything to make numbers appear; report the difference.

The threshold needs NO re-tuning, which is worth knowing because task 3.1
assumed it would.

NO SILENT FALLBACK — THIS IS PART OF THE TASK, NOT A NICE-TO-HAVE

Missing or invalid provider configuration must be a FATAL ERROR at startup,
never a quiet fall back to the mock. Design log section 7, pattern 2: "in
production mode, any mock selection is a fatal boot error, never a silent
fallback."

This matters most at exactly this moment. Wiring a real provider that
silently degrades to the mock reproduces the defect you are fixing, while
making it invisible. Prove it: start the service with the region
deliberately unset and paste the actual failure.

BEFORE YOU MEASURE ANYTHING — RECORD THE OLD SCORES AS VOID

Every similarity score, eval result and quality verdict produced before
this change was measured against a mock that cannot discriminate. Write
them down as explicitly meaningless in your report before you take a single
new measurement.

The first honest number will look like a regression, and someone reading
later will treat it as one unless it is on the record that the old numbers
never meant anything.

WHAT DONE LOOKS LIKE

  1. Real Titan embeddings behind the Embed RPC.
  2. Vectors come back at 512 dimensions and insert into vector(512)
     without error.
  3. Missing configuration is fatal at boot, not a mock fallback.
  4. THE DISCRIMINATION PROOF, which is the Phase 1 done gate for this
     task: embed the same three strings above against the same summarisation
     agent and paste the real scores. text.summarisation must beat both
     underwater.basket.weaving and quantum.teleportation. If it does not,
     STOP and report — that is a finding about the threshold or the
     similarity maths, not something to tune until it passes.
  5. A capability request for an unrelated capability now produces a
     genuine no-match where it previously always matched.

CONSTRAINTS

- Do NOT change the logic or code of any Category 1 component listed in
  docs/memoryalter.md section 6. Model Gateway is Category 1: you are
  wiring a provider into it through configuration, not changing how it
  works. If that turns out to be impossible without changing it, STOP and
  report exactly what does not fit.
- Do not touch selection_binding. Its missing capability filter is task
  3.1. Report anything you notice; change nothing.
- Never commit a credential. Configuration references only — real secrets
  are task 1.4, through Secrets Manager.
- Do not weaken types, add `any`, or silence a gate.
- Check for a competing pnpm process before install/add/update.
- If you find yourself retrying the same thing more than twice, STOP and
  report.
- Never delete a branch, never force-push, never --no-verify.
- Do not merge. Open a PR and stop; review happens first.

REPORT

  - What you read, and what you understood the task to be
  - The pre-provider scores, recorded as void
  - Verbatim: a real embedding response, showing 512 dimensions
  - Verbatim: the fatal error when configuration is missing
  - Verbatim: the three discrimination scores, with the agent they were
    measured against
  - Whether selection_binding's similarity maths assumes normalized vectors
  - Anything that did not fit, was awkward, or was wrong

A report saying everything was clean is the least useful report you can
file.
```
