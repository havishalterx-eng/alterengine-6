# Master prompt — Project Revive, task 1.3: AppConfig, and the embedding provenance it forces

**Run this alone.** It touches seven services and is all-or-nothing by design. Do not run
another builder session against the same stack while it is in flight.

**Prerequisite — Havish, before pasting:** an AWS AppConfig application, environment and
configuration profile must exist in `ap-south-1`, and `alterengine.dev` needs
`appconfig:GetLatestConfiguration` and `appconfig:StartConfigurationSession`.

---

```
You are the Builder on Project Revive — bringing the existing Alter Engine
back to a demonstrably working state.

Repo:  https://github.com/havishalterx-eng/alterengine-6
Local: ~/Desktop/alterengine-6

This is the ONLY repository. alter-x-4- and alterengine--5 are frozen and
read-only — never push, comment, or file anything on either.

You do NOT edit docs/memoryalter.md, docs/checklist.md or
docs/progress.md. Read them; report what you found; the CEO session writes
them. If builders edit the record, "what we decided" and "what a builder
believed we decided" stop being distinguishable, which is the ambiguity
those files exist to remove.

READ FIRST, in this order:
  1. docs/verification-standard.md — binding on this task
  2. docs/memoryalter.md — section 5, the entries on ALTER_CONFIG_SOURCE
     and on embedding provenance; section 6 for hands-off components
  3. docs/checklist.md — Phase 1, and the standing rules
  4. .env.local.example — lines 23-31 and 155-160
  5. CLAUDE.md

State before you start: what you read, and what you understand the task
to be.

WHY THIS TASK RUNS ALONE

Fifteen files across seven services read ALTER_CONFIG_SOURCE, and every
one validates it. Switching it is all-or-nothing: a service that cannot
reach AppConfig does not start. Anything else running against this stack
while you work will see phantom failures.

TWO PARTS. TWO SEPARATE COMMITS ON ONE BRANCH.

Do not interleave them. Each must review and revert independently.

=== PART A: switch to AppConfig ===

Switch ALTER_CONFIG_SOURCE from mock to appconfig and make every service
start from committed configuration.

AwsAppConfigConfigProvider needs region, applicationIdentifier,
environmentIdentifier and configurationProfileIdentifier. Wire those from
configuration, not literals.

Services reading the variable: platform-api, tool-gateway,
provisioning-service, audit-service, sandbox-service, model-gateway, and
eval-service's execution clients.

=== PART B: embedding provenance — why this task forces it ===

Flipping to appconfig switches the embedding provider to Titan
UNCONDITIONALLY. createEmbeddingProvider returns the mock only when
configSource is "mock"; under appconfig it is always Titan. So Part A
makes this live rather than theoretical.

A stored vector lives in the embedding space of whatever produced it.
Every existing capability_embeddings row is mock-space. A Titan query
vector compared against a mock-space vector is noise, not similarity —
and pgvector will happily compute a cosine distance for it. No error, no
failed insert. Agents stop being found, or get found at random.

The dimension check does not save you: mock and Titan are both 512, so
the column accepts both. A 1024-dimension provider would fail loudly.
This particular swap is silent.

THE PROVENANCE ALREADY EXISTS AND IS BEING THROWN AWAY

EmbedResponse carries model_id as field 3
(packages/contracts/proto/alter/modelgw/v1/modelgw.proto:95). The Titan
adapter returns it. Then
apps/intelligence-service/src/agent_auto_creation/engine.py:224 stores
this instead:

    {"dimensions": 512, "source": "PLAN-8"}

"PLAN-8" identifies the code path, not the model. The data is at the
boundary and discarded one line before it would be persisted.

Three things, all small:

1. RECORD the model identifier in embedding_metadata, from the Embed
   response rather than a literal. Keep the existing fields.

2. FILTER the selection candidate query so vectors produced by a
   different model are not candidates. Selection runs a pgvector
   similarity query in SQL, so there is no point at which a stale vector
   could be noticed and re-embedded mid-query — excluding it is the only
   option available. A stale vector must produce NO match rather than a
   noise match. Fail-closed, design log section 5.5.

3. COUNT AND REPORT the rows excluded as stale. Without this, an agent
   that exists, looks healthy and never matches is a silent failure —
   the exact class this project keeps finding. A log line is the
   minimum. Make the exclusion observable, not merely correct.

NOT in this task: re-embedding existing rows. That is a batch job needing
credentials at run time, and it is tracked separately. Your job is to make
staleness visible and harmless, not to repair it.

DECISIONS TO SURFACE, NOT MAKE

  - AUDIT_CONFIG_SOURCE and PLATFORM_API_CONFIG_SOURCE are both
    "local-file" today. When the shared value becomes appconfig, do they
    follow, or stay? Say what you think and why. Do not decide alone.

  - How the filter learns the current model identifier: a configured
    literal, or read back from the provider at startup. A literal can
    drift from what the provider actually returns, which would exclude
    everything. Say which you chose and how you know it cannot drift.

CONSTRAINTS

- Do NOT change the logic of any Category 1 component. You are changing
  how configuration reaches them, not what they do. Selection & Binding
  is Category 3, so its query is yours to change — its missing capability
  filter is task 3.1 and stays out of scope.
- Never commit a credential. Configuration references only.
- Do not weaken types, add `any`, or silence a gate.
- Check for a competing pnpm process before install/add/update.
- If you find yourself retrying the same thing more than twice, or
  re-deriving the same decision more than twice, STOP and report. That
  applies to reasoning as much as to execution.
- Never delete a branch, never force-push, never --no-verify.
- Do not merge. Open a PR and stop.

VERIFICATION — docs/verification-standard.md is binding

Two artefacts, one per part.

  Part A: the stack starts from committed configuration under appconfig,
  every service answering. scripts/verify-local-stack-health.sh exists
  for this; note that it does not yet meet the standard (nine of its
  checks read Docker's cached status, and some ports are sandbox values)
  — say whether it served, and what it missed.

  Part B: a test proving a mock-space vector is excluded from candidacy
  under Titan. PROVE IT FAILS: run it without the filter and show the
  stale vector matching. That is the defect, and a test that has never
  been seen to fail has not been verified.

REPORT

  - What you read, and what you understood the task to be
  - Verbatim: every service answering under appconfig
  - Verbatim: the stale-vector test failing without the filter, then
    passing with it
  - The excluded-row count, and where it surfaces
  - Your reading on both surfaced decisions
  - Anything that did not start from committed configuration, and exactly
    what you changed to get past it

A report saying everything was clean is the least useful report you can
file.
```
