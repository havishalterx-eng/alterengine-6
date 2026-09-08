# Master prompt — Project Revive, task C21: make starting the stack a step

**Blocks task 1.5's live measurement, which is Phase 1's entire point.** Small task, high
leverage. Paste the fenced block into a builder session.

---

```
You are the Builder on Project Revive — bringing the existing Alter Engine
back to a demonstrably working state.

Repo:  https://github.com/havishalterx-eng/alterengine-6
Clone it fresh into your own workspace. Do NOT work in
~/Desktop/alterengine-6 — that is the CEO session's clone.

alter-x-4- and alterengine--5 are frozen and read-only.

You do NOT edit docs/memoryalter.md, docs/checklist.md or
docs/progress.md. Read them; report what you found.

READ FIRST:
  1. docs/verification-standard.md — binding
  2. docs/memoryalter.md — section 5, the entry "The local environment is
     startable, and starting it is still not a step"
  3. docs/local-dev.md
  4. .env.local.example — all of it
  5. CLAUDE.md

State before you start: what you read, and what you understand the task
to be.

THE PROBLEM, MEASURED

.env.local.example CANNOT BE SOURCED. Twenty-five lines carry
<placeholder> values, and bash reads < as a redirect, so
`set -a; . .env.local.example` dies on line 11.

Task 1.0 proved the stack can start, and it does. It started because a
person worked out the substitutions by hand, and that work was never
committed. Startable is not the same as being a step — and
"undocumented research rather than a step" is the mechanism the readiness
assessment blamed for two wrong component counts.

The evidence it is still costing: the .env.local actually in use on the
CEO machine has 16 assignments against the example's 139. The documented
starting point produces something materially different from what anyone
runs. Task 1.5's live golden-set run is blocked on exactly this.

THE SUBSTITUTION GRAPH, so you do not have to derive it

Defined placeholders that need generated values:
    PLATFORM_DB_PASSWORD, ENGINE_DB_ADMIN_PASSWORD, AUDIT_DB_PASSWORD,
    INTELLIGENCE_DB_PASSWORD, COST_DB_PASSWORD, ORCHESTRATION_DB_PASSWORD

Paired values that MUST agree with each other:
    INTERNAL_SERVICE_TOKEN and INTERNAL_SERVICE_TOKEN_SHA256 — the second
    is the SHA-256 of the first. Generating them independently produces a
    file that looks complete and fails authentication.

Also generated:
    MARKETPLACE_SEARCH_CURSOR_SECRET (32-byte hex)

Interpolation, and this is where hand-editing goes wrong:
    AUDIT_DB_PASSWORD appears in FIVE connection strings spanning FOUR
    databases — policy_db, orchestration_db, audit_db, eval_db. One
    password serves all four, which is easy to mistake for an error and
    "fix" into inconsistency.
    PLATFORM_DB_PASSWORD appears in three, INTELLIGENCE_DB_PASSWORD in
    three.

TWO PLACEHOLDERS ARE REFERENCED BUT NEVER DEFINED — surface, do not guess

    ADS_DB_PASSWORD     used by EVAL_ADS_DB_URL
    MEMORY_DB_PASSWORD  used by POLICY_DB_URL

There is no assignment for either anywhere in the file. So the example is
not merely unsourceable — it is incomplete, and nobody can fill it
correctly without deciding what these are. Both databases sit on 5433
alongside the ones AUDIT_DB_PASSWORD serves, which HINTS they may be the
same value, but a hint is not a decision.

Find out what the running stack actually uses — docker-compose.yml and
the database init scripts are the authority, not the example — and report
what you found. Do not invent a value and do not assume the hint is right.

WHAT TO BUILD

A committed bootstrap script that turns .env.local.example into a
sourceable .env.local. Requirements:

  1. Generates every value that needs generating, and keeps the paired
     ones consistent — the token and its SHA-256 must agree.
  2. Propagates each password into every connection string that
     interpolates it. One password, one value, everywhere it appears.
  3. NEVER CLOBBERS AN EXISTING .env.local. The CEO machine has one with
     16 real values — AWS credentials and Auth0 settings — that must
     survive. Merge, or refuse and say what to do. Overwriting someone's
     working credentials is not an acceptable failure mode, and it is
     irreversible.
  4. Idempotent. Running it twice must not regenerate passwords that a
     running database was already created with.

THE TRAP THAT WILL BITE YOU

Generating a fresh password only works if the database role is created
with it. If a stack has already run, the Postgres volumes hold roles
created with the OLD password, and a newly generated one will not
authenticate — producing a failure that looks like a bad script and is
actually stale state.

Decide how the script handles that: detect existing volumes and refuse,
or document the reset. Whichever you choose, the failure must be NAMED
rather than surfacing as an authentication error the next person debugs
from scratch.

CONSTRAINTS

- Never print a generated secret to stdout. Write it to the file.
- Never commit a generated .env.local. Confirm .gitignore covers it.
- Do not change what any service reads. This task generates
  configuration; it does not redesign it.
- If you find yourself retrying the same thing more than twice, or
  re-deriving the same decision more than twice, STOP and report.
- Never delete a branch, never force-push, never --no-verify.
- Do not merge. Open a PR and stop.

VERIFICATION — docs/verification-standard.md is binding

The done gate is that starting the stack becomes a step:

  From a CLEAN CHECKOUT with no .env.local, run the bootstrap, source the
  result, bring the dependency stack up, and show services answering.
  Paste it verbatim. No hand-editing at any point — if you edit anything
  by hand, that is the task not being finished.

  PROVE IT FAILS: remove one substitution from the generated file and
  show the failure being named clearly rather than surfacing as a
  confusing downstream error.

  Also prove requirement 3: run it against an existing .env.local
  carrying values, and show those values surviving.

REPORT

  - What you read, and what you understood the task to be
  - What the running stack actually uses for ADS_DB_PASSWORD and
    MEMORY_DB_PASSWORD, and where you found it
  - How you handled the existing-volumes trap
  - Verbatim: clean checkout to running stack, no hand-editing
  - Verbatim: the failure when a substitution is missing
  - Verbatim: an existing .env.local surviving
  - Anything in .env.local.example that is wrong rather than merely
    unfilled

A report saying everything was clean is the least useful report you can
file.
```
