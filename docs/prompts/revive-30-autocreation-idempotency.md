# Master prompt — Project Revive, task 3.0: make agent auto-creation idempotent

**Pulled ahead of Phase 3 deliberately.** Not a policy question, and it corrupts tenant data
on every retry. Paste the fenced block into a builder session.

---

```
You are the Builder on Project Revive — bringing the existing Alter Engine
back to a demonstrably working state.

Repo:  https://github.com/havishalterx-eng/alterengine-6
Local: ~/Desktop/alterengine-6

This is the ONLY repository. alter-x-4- and alterengine--5 are frozen and
read-only — never push, comment, or file anything on either.

READ FIRST, in this order:
  1. docs/components/agent-auto-creation/README.md — the whole thing,
     including the Decision section dated 2026-09-08.
  2. docs/memoryalter.md section 6 — which components you must not touch.
  3. docs/checklist.md — task 3.0 and the standing rules.
  4. CLAUDE.md — Node 22, pnpm concurrency, the enforced architecture gates.

State before you start: what you read, and what you understand the task
to be.

THE TASK, AND ONLY THIS TASK

Agent auto-creation has no idempotency machinery of any kind. There is no
unique constraint, no ON CONFLICT clause, and no idempotency key anywhere
in apps/intelligence-service/src/agent_auto_creation/. Three identical
requests were observed producing three different agents, taking one tenant
from five agents to eight. A retrying caller writes a permanent row per
attempt and nothing cleans them up.

Make creation idempotent per tenant, workspace and capability set. A
repeated request returns the agent already created for that key, bound the
same way, rather than creating another.

WHAT IS DELIBERATELY NOT IN SCOPE

The tier is hardcoded to 'STANDARD' in the INSERT at engine.py:32 while
eligibility filters on that same column. That is a real defect and it is
task 3.3, not this one. It was separated on purpose: the tier is a policy
decision, this is not. Do not change tier behaviour.

WHAT THE CODE LOOKS LIKE NOW

apps/intelligence-service/src/agent_auto_creation/engine.py performs three
inserts in sequence — agents, agent_versions, capability_embeddings — and
mints a fresh id with new_prefixed_id("agt") on every call. The capability
set you need for the key is requirement.capabilities, a list of strings
parsed from request.capability_profile_json.

Note the file already sets RLS context with
  SELECT set_config('app.current_tenant_id', :tenant_id, true)
which is transaction-local.

WHAT DONE LOOKS LIKE

  1. An idempotency key derived deterministically from tenant, workspace
     and capability set. Order-independent — the same capabilities in a
     different order must produce the same key.
  2. A real database constraint, not application-level checking. Two
     concurrent callers must not both succeed in creating.
  3. A repeat returns the existing agent, bound and usable, NOT an error
     and NOT a second agent.
  4. All three inserts stay atomic together. A partial creation — an agent
     row with no version, or no embedding — must not be reachable.
  5. A migration with its rollback pair. check-migration-rollback-pairing.sh
     is an enforced CI gate.

VERIFICATION — READ docs/verification-standard.md FIRST

That document is binding on every task. Four requirements: the check tests
real behaviour not process state; it runs without anyone remembering; it is
PROVEN TO FAIL by breaking the thing on purpose; and nothing in it is
permanently red.

For this task the artefact is a test that reproduces the ORIGINAL defect —
three identical requests producing three agents — and now passes. Not a
nearby case. The concurrent version is the one that matters: serialised
requests do not test a race.

Prove it fails: run it against the code before your fix and paste the
failure showing three rows.

PROVE IT, WITH REAL EXECUTION AGAINST REAL POSTGRES

  a. Three identical requests in sequence produce ONE agent. Paste the
     actual row count before and after.
  b. Two identical requests fired CONCURRENTLY produce one agent, and both
     callers receive a usable binding. This is the test that matters — a
     unique constraint that only works when requests are serialised has
     not been tested.
  c. The same capabilities in a different order hit the same key.
  d. A genuinely different capability set still creates a second agent.
     Prove the constraint is not too broad.
  e. Existing behaviour holds: a true no_eligible_agent still creates a
     working, immediately-bindable persona on first request.

DECISIONS TO SURFACE, NOT MAKE

Two things you will hit. Report your reading and your reasoning; do not
decide them alone.

  - Where the key lives. A column on agents with a unique constraint over
    (tenant_id, workspace_id, key) is the obvious shape, but say what you
    considered and why.
  - Whether tier belongs in the key. Today tier is always STANDARD, so it
    changes nothing. After task 3.3 it will vary, and then the question is
    whether a STANDARD and a PREMIUM agent for the same capability set are
    one agent or two. Including it now costs nothing and avoids a migration
    later — but say what you think, and flag it rather than assuming.

ONE TRAP FROM THE PREVIOUS BUILD

Postgres resets a transaction-local GUC to the empty string after commit,
not to NULL. Any policy or query that casts app.current_tenant_id straight
to uuid will throw
  ERROR: invalid input syntax for type uuid: ""
on connection reuse. If you add or touch anything reading that setting,
wrap it in NULLIF. This cost a full review round last time.

CONSTRAINTS

- Do NOT change the logic or code of any Category 1 component. Agent
  Auto-Creation is Category 3, so it is yours to change; anything it calls
  may not be.
- Do not change tier behaviour. That is 3.3.
- Do not weaken types, add `any`, or silence a gate.
- Check for a competing pnpm process before install/add/update.
- If you find yourself retrying the same thing more than twice, STOP and
  report.
- Never delete a branch, never force-push, never --no-verify.
- Do not merge. Open a PR and stop; review happens first.

REPORT

  - What you read, and what you understood the task to be
  - The key you derived and why it is order-independent
  - Verbatim output for each of proofs (a) through (e) — actual row counts
    and actual responses, not a summary
  - Your reading on both surfaced decisions
  - The migration and its rollback
  - Anything about the module or the schema that was awkward or wrong

A report saying everything was clean is the least useful report you can
file.
```
