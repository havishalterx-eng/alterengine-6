# memoryalter.md — Alter Engine master record

Everything decided about the Alter Engine, why it was decided, and what happened as a
result. This file is the record. `checklist.md` is the terse list of work; `progress.md`
is the terse log of what got done. Both of those carry their context here.

**Rules for this file**

- Append-only. Never rewrite or delete an entry.
- A correction is a **new entry** that points at the old one. The old one stays.
- Every entry is dated.
- Raw-memory entries use a fixed shape: **What / Why / How / When / Where.**
- Only the CEO session writes this file. Builders and the Adversary read it and report;
  they do not edit it.

---

## 1. Identity

**What Alter Engine is.** A system that takes a business problem, decides what topology
should exist to solve it, builds and runs that topology durably, verifies the outcome
against real external systems, repairs at the smallest broken layer, and learns safely
from what happened.

**The market gap it exists for.** n8n, LangChain and LangGraph all require a human to
draw the graph. Nobody has a layer that decides *what topology should exist* for an
arbitrary problem. That is the differentiator, and it is genuinely unsolved — including
by every previous Alter build.

**Two genuinely unproven pieces** (design log §1), which no amount of engineering
discipline removes:
1. Reliably turning an arbitrary problem into a *correct* multi-agent topology.
2. Creating a brand-new agent live, mid-failure, and trusting it immediately.

### The finish line

Project Revive is finished when this runs, watched on a screen, not described in a report:

> One real business problem goes in. The engine designs a topology for it. It runs it.
> It verifies the outcome against real external systems. One node is deliberately broken —
> the engine detects it, replans, recovers, records the memory, and the drift score is
> visible to the tenant that owns it.

Every piece of work is judged by whether it moves that demo closer. Anything that does
not is parked.

### Current phase

**Project Revive.** Not a rebuild. The engine assessed on 6 September 2026 is the
product. The design log is now a **standards document** — rules the code is held to —
not a build plan.

---

## 2. Decisions

Append-only. Newest at the bottom of each dated block.

### Prior decisions carried forward

Decisions from the `alterengine--5` ground-up rebuild are preserved verbatim in
[`prior/DECISIONS-alterengine-5.md`](prior/DECISIONS-alterengine-5.md) and
[`prior/CHECKLIST-alterengine-5.md`](prior/CHECKLIST-alterengine-5.md). They are
**historical record, not active direction** — that build is frozen. They are kept
because they contain real reasoning about the architecture gates, RLS enforcement,
and contract shapes that this build will reuse.

### 2026-09-07 — Stop the ground-up rebuild

**Decision.** Stop building `alterengine--5`. It reached 1 component of 55 after
substantial effort.

**Why.** The team's assessment of the existing engine proved 25 components work end to
end. That fact was not known when the design log declared old repos "reference/prior-art
only." 25 running components beats 1.

**Rejected.** Continuing the 55-component sequence. Cost was not the writing of code —
it was proving each component, which took multiple review rounds each.

**Decided by.** Havish.

### 2026-09-07 — The existing engine is the product

**Decision.** Revive the assessed engine. Do not port its working components into a
clean repo and re-verify them there.

**Why.** "Works end to end" and "satisfies a contract" are different bars. Porting a
component means re-verifying it against a bar it was never built for, so port cost lands
close to build cost. Writing the code was roughly 30% of each component's effort; proving
it was the rest. Porting only skips the 30%, and only on the cheap components — the hard
ones (Synthesizer, Planner, Recovery loop) are unbuilt in every repo.

**Rejected.** Bulk-migrating the 25 working components into a clean repo.

**Decided by.** Havish, after the alternative was argued for and set aside.

### 2026-09-07 — The design log becomes a standards document

**Decision.** The design log stops being a build plan. It is the source of *decisions and
standards* the revived engine is held to.

**Why.** Most of the log's value for an existing codebase is enforceable rules — the four
systemic patterns, fail-closed, the two-path model — not architecture that must be built
from zero.

### 2026-09-07 — Do not touch the 25 working components

**Decision.** No logic change and no code change to any Category 1 component during
revival. Changes come later, only if needed, and are recorded here before they are made.

**Why.** They are the only verified value in the system. Changing them during a revival
converts known-good into unknown.

**Decided by.** Havish, explicitly.

### 2026-09-08 — Repo, file layout, and who writes what

**Decision.** New repo `havishalterx-eng/alterengine-6`. `docs/memoryalter.md`,
`docs/checklist.md` and `docs/progress.md` live in the repo. The CEO session writes them.
Builders and the Adversary read them and do not edit them.

**Why.** These files exist so the person doing the work can read them without a relay. A
Desktop-only copy breaks exactly that — and knowledge sitting where the worker cannot see
it is what produced PR #89 (correct diagnoses of seven defects, unread for weeks, three
rediscovered from scratch).

**Rejected.** Desktop-only (builders cannot read it, no version history, dies with the
laptop). Both places at once (two copies drift, nobody knows which is current). Builders
editing it (turns a record into a scratchpad).

**Decided by.** Havish.

### 2026-09-08 — `alterengine--5` and `alter-x-4-` are frozen, not deleted

**Decision.** Both repos stay. Neither is deleted. `alterengine--5` is the source of the
build rules — 11 AST architecture gates, contracts, `loadConfig()`, METHOD.md, RULES.md.
Its component code is not carried over.

**Why.** `alterengine--5` had 1 component and 11 gates; the assessed engine has ~50
components and no gates. The gates are the export worth making — far less code, far more
leverage.

### 2026-09-08 — Recovery contract: `TaskSkeleton` is canonical

**Decision.** `replan` and `recompile` hand back a `TaskSkeleton`, not a `CompiledDag`.

**Why.** Design log §24 states that Recovery's replan "jumps from the run path back into
the **design path**." The design path is L1→L5, and L5 (Graph Compiler) is what *produces*
the DAG. Re-entering the design path means entering **above** the compiler, so replan must
hand back what that path consumes. The current code sends the run path's output back as
the design path's input, which inverts the crossing.

**What this closes.** The action plan lists this as Phase 0 decision 2 — blocking, and
answerable only by the user. It was already answered in the design log and never carried
into code. Two of eight dispatchable Recovery strategies are dead because of it.

**Status.** Decided. Not yet implemented.

### 2026-09-08 — Approval vocabulary: the engine's enum is canonical

**Decision.** The platform sends the engine's vocabulary
(`pending·approved·rejected·expired`). The platform side moves, not the engine.

**Why.** Design log §22 item 8 makes the approval inbox a **Platform-side read model**
built on top of the engine's durable decision record. A read model maps onto its source,
never the reverse.

**What this closes.** The second of the action plan's Phase 0 decisions.

**Status.** Decided. Not yet implemented.

### 2026-09-08 — Phase 0 closed: all five decisions answered

Full reasoning, options and the code evidence behind each: [`phase-0-decisions.md`](phase-0-decisions.md). Derived logic appended to the design log as §30–§33. Each answer was drafted, attacked, and regenerated; three of the five changed materially under that attack.

**0.1 memory credential — internal endpoints accept an explicit tenant alongside a service credential.** Plus two things the first draft missed: a mismatch refuses explicitly with a named reason rather than degrading to "not found", and every service-asserted tenant is audited. **Why the additions:** the first draft made §2 tenant isolation depend on a shared secret every service holds, and did not say so. Design log **§30**.

**0.3 auto-creation — never create an agent that cannot satisfy the requirement that triggered it.** When the requested tier exceeds policy, fail the bind with a named reason. The ceiling is a config value defaulting to `STANDARD`, to be lifted deliberately once Run Manager's budget gate exists. **Idempotency is pulled out of Phase 0 entirely** and fixed immediately — it is not a policy decision and it is corrupting tenant data now. **Why the reframe:** the first draft treated a correctness defect as a cost question. Design log **§31**.

**0.4 requirements map — the architecture path copies the map the caller already supplied.** Verified nearly free: the data is present at the call site and simply not persisted. **Recorded residual:** this leaves two sources for one fact — the stored map and the fresh run-time resolution — which is §7 pattern 4 arrived at from the other direction. Resolving it touches the frozen Executor, so it is deferred as Track C, not closed. Design log **§32**.

**0.6 Voice and Repository Manager — both cut from v1, declarations removed.** Confirmed with Havish that Axon is a separate product and does not run on this engine, which was the question the first draft failed to ask before recommending. Deployment Manager is *not* cut — its backend contract is real. Design log **§33**.

**0.7 architecture documents — imported, then split three ways.** All five now live in `architecture/`; they previously existed only on one laptop with no backup. `layers.md`, `planes.md` and `whole.md` are binding now. `component-contracts.md` contributes its blast radius, fail mode, driver and non-responsibilities fields to the component READMEs, but its done gates are **targets, not gates that fail today**. **Why the split:** calling all 54 contracts "binding" would have manufactured 54 blockers on day one, several against Category 1 components we have promised not to touch.

**Decided by.** Havish, after asking for each recommendation to be attacked and regenerated before approval.
### 2026-09-08 — `alter-x-4-` is read-only; everything happens in `alterengine-6`

**Decision.** Nothing is ever posted, pushed, commented or filed on `havishalterx-eng/alter-x-4-`. It is frozen, reference-only. Every artefact of this project — code, decisions, issues, prompts — belongs in `alterengine-6`.

**Why.** Two live repositories for one project means two places to look and two versions of the truth. The 500 commits of history are already preserved here, so nothing is lost by never writing there again.

**Consequence for Phase 0's done gate.** The action plan asks that each decision be linked from its issue; those issues are on the frozen repo. The gate's purpose is that a decision reaches whoever does the work, and here that is the component pages, not an issue tracker. Every Phase 0 decision is therefore written onto the README of every component it touches, carrying its rationale, a link to the full brief, and the original issue number.

**Decided by.** Havish.
---

## 3. Checklist context

Why each block of work on `checklist.md` exists, and what blocks it.

**Numbering follows the action plan.** An earlier draft of `checklist.md` invented its own
phase numbers, inserting an infrastructure phase ahead of the plan's Phase 1 and pushing
everything down one. That was corrected on 2026-09-08: the checklist now uses the action
plan's numbering exactly, so this document, the plan and the team share one vocabulary.
Our two additions — task 1.0 and all of Track C — are marked `[+]` rather than folded in
silently.

**Phase 0 — five decisions, no code.** Two are closed from the design log (0.2 recovery
contract, 0.5 action vocabulary). Three remain: the memory credential cycle (blocks Phase
2), the auto-creation tier (blocks Phase 3), and the requirements map (latent). Two more
sit outside the plan: the Voice / Repository Manager scope call, and whether the four
architecture documents are binding.

**Phase 1 — environment and gates.** Both are infrastructure and neither is blocked on
a decision, so they start immediately. The environment matters more than its size
suggests: the assessment's sharpest finding is that components went unassessed because
the local stack could not be started, *and that is the same mechanism that produced the
previous wrong count.* The gates matter because landing them early means every
subsequent fix arrives governed.

**Phase 2 — provider.** One purchase unblocks eight components. The deeper reason is
that design log §6 forbids verifying against mocks at all, so until a real provider
exists the build philosophy cannot be followed even in principle.

**Phase 3 — re-assess the ten.** Only possible after phases 1 and 2. Of three components
previously counted as working from a source read alone, one worked, one failed its first
request, and one had no surface to call. A real count precedes any further planning.

**Phase 4 — the healing loop.** Recovery, Memory and Drift are consecutive steps in one
cycle. Fixing any one alone changes nothing a user could observe. Both the assessment and
the design log reach this independently.

**Phase 5 — platform track.** Ten wiring items with zero dependencies on each other or on
the engine, against backends that already answer and already enforce permissions. Largest
block of finished-but-unreachable work in the product. Runs in parallel from day one.

**Phase 6 — component fixes.** Category 3 work: capability filtering, tier resolution,
auto-creation idempotency, cost ledger tenancy, #117.

**Phase 7 — the two rewrites.** Planner and Synthesizer. Design log §24 supplies the
budget argument: the design path runs once per workflow, so it is allowed to be slow and
expensive.

**Phase 8 — design-log compatibility.** Structural items, priced individually, never
batched.

---

## 4. Progress context

What got done, how, and what it proved. `progress.md` holds the terse log; the reasoning
lives here.

*(Nothing yet. Project Revive begins 2026-09-08.)*

---

## 5. Raw memory

Every entry: **What / Why / How / When / Where.**

### Local scratch clone decay

- **What.** `/private/tmp/alterengine-5` is being deleted piecemeal by macOS tmp cleanup.
  Root files (`package.json`, `AGENTS.md`, tsconfig) are gone, `docs/architecture` and
  `docs/roles` are now empty directories, and `.git` is present but broken — git refuses
  to read it.
- **Why it matters.** Nothing was lost, because the GitHub remote holds everything. But
  no local file under `/private/tmp` is trustworthy, and no working repo belongs there.
- **How found.** Listing markdown files for this session's setup; git reported
  `fatal: not a git repository`.
- **When.** 2026-09-08.
- **Where.** `/private/tmp/alterengine-5`. Remote intact at
  `havishalterx-eng/alterengine--5`.

### The mock provider inverts discrimination

- **What.** The local mock embedding is a per-dimension SHA-256 hash, so every vector
  lands in the same positive orthant and everything resembles everything.
  `underwater.basket.weaving` scores **0.8740** against a text-summarization agent, while
  the genuinely relevant `text.summarisation` scores **0.8703** — against a threshold of
  0.6. Nonsense scores higher than the real thing.
- **Why it matters.** A mock that answers everything is not a neutral stand-in. It
  silently converts a discriminating system into one that accepts anything. It is why the
  Conversation Manager returns one canned intent, why the eval harness scored 0 of 30, and
  why Problem Understanding answered 503 to every request ever made of it. Every verdict
  that turns on discrimination is unproven until a real provider is wired.
- **How found.** Reaching Agent Auto-Creation required forcing the tier filter, because
  the capability route can never produce a no-match locally.
- **When.** Assessment run, 4–6 September 2026.
- **Where.** Selection & Binding candidate query; the shared local mock provider.

### Real Titan embeddings fix discrimination, and the existing threshold is sound

- **What.** Measured live against Bedrock Titan v2 in `ap-south-1`, 512 dimensions, normalized, before any code was wired. Capability-string to capability-string, which is what the system actually compares:

  | capability | mock | real | threshold 0.6 |
  |---|---|---|---|
  | `text.summarisation` (relevant) | 0.8703 | **0.8600** | MATCH |
  | `underwater.basket.weaving` | **0.8740** | **0.1214** | no-match |
  | `quantum.teleportation` | 0.8499 | **0.0757** | no-match |

  Nonsense went from outscoring the relevant capability to sitting seven times below it.

- **Why it matters.** Phase 1's second done gate is provably achievable before a builder touches anything. It also settles a question the action plan left open: task 3.1 says "add the filter, then **re-tune the similarity threshold against real embeddings**." **No re-tuning is needed.** `minimum_capability_similarity: float = 0.6` at `selection_binding/engine.py:223` separates 0.86 from 0.12 cleanly.

- **How.** Four `bedrock-runtime invoke-model` calls, cosine similarity computed directly. Verified that both sides embed the same shape — `"\n".join(requirement.capabilities)` at `selection_binding/engine.py:273` and the same join in `agent_auto_creation/engine.py` — so the comparison is symmetric.

- **A trap this surfaced, recorded before anyone hits it.** A first pass compared a capability string against a **prose persona description** and scored the genuinely relevant capability at **0.5609 — below the threshold**. That is not how the system works today, and the 0.5609 figure should not be quoted as a system measurement. But it means the 0.6 threshold is calibrated for capability-to-capability text only: **if anything ever embeds a persona description, a summary, or free prose on either side of this comparison, matching silently stops working.** Nothing would fail loudly; agents would simply stop being found.

- **When.** 2026-09-08, during task 1.1 credential verification.
- **Where.** `packages/adapters/src/aws/titan-embedding-provider.ts`, `apps/intelligence-service/src/selection_binding/engine.py:223,273`.

### One variable answering two questions — and a comment that expired

- **What.** `ALTER_CONFIG_SOURCE` is read by both planes with **incompatible accepted values**. platform-api accepts `appconfig|local-file`; model-gateway, tool-gateway, sandbox-service and provisioning-service accept `appconfig|mock`. `.env.local` sets `mock`, so platform-api's own migration crashes from committed configuration:

  ```
  Invalid platform-api environment: ALTER_CONFIG_SOURCE: Invalid option:
  expected one of "appconfig"|"local-file"
  ```

- **Why it matters more than a missing variable.** The repository already solved this once, for audit-service, via a service-scoped override with a fallback (`requireScopedValue(environment, "AUDIT_CONFIG_SOURCE", "ALTER_CONFIG_SOURCE")` at `audit-service/src/config/environment.ts:92`). The comment above it reads: *"audit-service is the only service reading 'local-file' here."* **That statement is now false** — platform-api reads it too. A one-off exception has become a class, and the file that explains the pattern asserts otherwise, so the next person to hit this inherits the wrong model. Design log §7 pattern 4, arriving exactly as described: a hand-maintained assumption drifting as the system grows.

- **The deeper defect.** Engine services are asking *"mock or appconfig?"*; platform-api is asking *"file or appconfig?"*. Two different questions wearing one name. Scoped overrides resolve the symptom; whether they become the documented pattern for every service, or the values get unified, is Track C item C15.

- **How found.** Task 1.0, by running the stack — not by reading the schemas. The builder proved it with the verbatim crash and correctly refused to pick a fix, exporting the value for one shell invocation instead.
- **When.** 2026-09-08.
- **Where.** `apps/platform-api/src/config/env.schema.ts:28`, `apps/audit-service/src/config/environment.ts:89-98`.

### #124 is still live, and its margin is gone

- **What.** LocalStack's healthcheck still carries ten assertions on a 5s timeout. In a sandbox where each `awslocal` call costs ~2.4s, Docker kills every probe and the container reports `unhealthy` forever — while `curl http://127.0.0.1:4566/_localstack/health` returns 200 with every needed resource running.
- **Why it matters.** #124 was the fix for exactly this and it merged. The assertions were never re-budgeted, so the fix holds only on hardware fast enough to finish ten calls in five seconds. **A check whose passing depends on machine speed is not a check.** It also means a regression script that includes LocalStack has a permanently-failing member on slower hosts, and a check people learn to ignore is worse than none.
- **When.** 2026-09-08, task 1.0.

### A permission bit silently disabled a LocalStack init script

- **What.** `infrastructure/local/localstack-init/40-service-startup-resources.sh` was committed at mode **100644** while all three of its siblings were **100755**. LocalStack's init hook skipped it without complaint, so the secrets and SSM parameters it creates — `COST_DATABASE_SECRET_REF`, `AUDIT_ARCHIVE_BUCKET_PARAM` and others — never existed. Services depending on them were broken from committed configuration.
- **Why it matters.** No content change would have revealed this. A file mode is invisible in every diff view and every code review, the script is present and correct, and the failure surfaces as unrelated services missing configuration. `docs/local-dev.md` even documents a manual workaround for the resulting gap, which becomes unnecessary once the bit is restored — the workaround was treating the symptom.
- **How found.** Task 1.0, by running the stack. Verified against HEAD: `git ls-tree` showed 100644 where its three siblings showed 100755.
- **When.** 2026-09-08. Fixed the same day.
- **Where.** `infrastructure/local/localstack-init/`.

### The deferred Cache/Reuse plane is already built, running, and about to change behaviour

- **What.** `model-gateway.service.ts` consults a **semantic cache before calling any model provider**, on both the invoke and stream paths, unconditionally. Default similarity threshold **0.95** (`packages/shared-clients/src/mocks/cache-provider.ts:19`). Under `ALTER_CONFIG_SOURCE=mock` it is an in-memory per-process `Map`; otherwise Redis.
- **Why it matters, and this is the part nobody has flagged.** Under mock embeddings every pair of texts clusters around 0.85–0.87, comfortably below 0.95, so the cache only ever hits on **byte-identical** text. It behaves as an exact-match cache. **Real embeddings change that.** Genuinely near-identical prompts will exceed 0.95, and the cache becomes semantic in earnest — returning one prompt's answer for a different prompt. **Task 1.2 will cause that change as a side effect, and nobody decided it.**
- **Against the design log.** §12 defers the Cache/Reuse plane past v1 — *"nothing to reuse on day one"* — while reasoning that a cached answer is the verified answer because it passed the same verification pipeline. That reasoning holds only if the cache never returns a result for genuinely different work. The plane is built and live regardless of the deferral.
- **Second consequence: eval scores.** The harness runs a 30-case golden set. If cases repeat text across runs, cache hits return prior answers and the scores measure the cache, not the model. Relevant to task 1.5's re-run.
- **How found.** Task 1.0's builder traced it to explain an unexplained 80x speedup (0.19s against a documented 15.85s), correctly retracting their first explanation. The trace was evidenced: no process restart between dispatches, zero semantic-cache keys in Redis, byte-identical prompts, similarity 1.0 against a 0.95 threshold.
- **When.** 2026-09-08.
- **Where.** `apps/model-gateway/src/gateway/model-gateway.service.ts:188,265,294`.

### Changing embedding provider invalidates every stored vector

- **What.** Stored vectors live in the embedding space of whatever provider produced them. `capability_embeddings` rows written under the mock are mock-space vectors; a Titan query vector compared against them is meaningless — cosine distance between two different spaces is noise, not similarity.
- **How it surfaced.** Task 1.2's counterfactual needed **two vector rows for the same capability**, one mock-embedded and one Titan-embedded, so each run compared like with like. The builder disclosed this unprompted and correctly noted it controls representation, not eligibility — `candidate_count: 1` counts distinct agents, not rows.
- **Why it matters beyond the fixture.** That workaround is fine in a test and impossible in production. **Every existing `capability_embeddings` row is mock-space.** The moment Titan becomes the live provider for a tenant with existing agents, every stored vector is in the wrong space and matching silently degrades to noise — no error, no failed insert, agents simply stop being found or start being found at random.
- **What it implies.** Switching embedding provider is a **data migration**, not a configuration change: every stored vector must be re-embedded, and until it is, mixed-space rows produce meaningless comparisons. Nothing in the codebase records which provider produced a given vector, so there is currently no way to tell a mock-space row from a Titan-space one. Tracked as **C18**.
- **When.** 2026-09-08, task 1.2.
- **Where.** `capability_embeddings`, `apps/intelligence-service/src/selection_binding/engine.py`.

### Task 3.3 inherits a trap from 3.0's key scope

- **What.** 3.0's idempotency key is a hash of the sorted **capability set only** — tier is deliberately excluded. Tier is hardcoded `STANDARD` today, so that is correct today.
- **The trap.** When 3.3 makes tier vary, a `PREMIUM` request for a capability set that already has a `STANDARD` agent will hit the same key and **silently return the STANDARD agent** — the exact class of defect 3.0 was fixing, reintroduced through a different door. Nothing will error; the caller gets a usable binding to an agent of the wrong tier.
- **Why the key was scoped this way anyway.** Including tier now would put a hardcoded constant inside a hash, making the key appear to encode something it does not. The migration cost is symmetric either way, so it was decided on correctness rather than on avoiding future work. Whether a `STANDARD` and a `PREMIUM` agent for one capability set are one agent or two is a genuine product question that belongs with 3.3, not a guess made blind in 3.0.
- **What 3.3 must do.** Decide that question explicitly, and if tier belongs in the key, migrate the partial unique index with it.
- **When.** 2026-09-08.
- **Where.** `apps/intelligence-service/src/agent_auto_creation/engine.py`, `_idempotency_key`.

### Builders edited the CEO-owned documents

- **What.** Task 3.0's PR modified `docs/checklist.md` and `docs/memoryalter.md`, described in its report as "docs updated per repo convention."
- **Why it matters.** `memoryalter.md`'s own rules say only the CEO session writes these files; builders read them and report. The record is append-only and dated for a reason — if builders edit it, "what we decided" and "what a builder believed we decided" become indistinguishable, which is precisely the ambiguity the file exists to remove.
- **The honest half.** No master prompt has ever stated this constraint. It was reachable — the rule sits in a file they were told to read — but it was never an instruction. **The prompt template is at fault, not the builder.** Fixed by adding the constraint to every future prompt.
- **When.** 2026-09-08, task 3.0.

### A count from a source read, made by the CEO session this time

- **What.** Task 1.3's prompt stated that fifteen files across **seven** services read `ALTER_CONFIG_SOURCE`, and named eval-service among them. The builder checked and found **six**: every occurrence in eval-service is a comment or docstring describing the Node services it calls, with no runtime read anywhere in `apps/eval-service/src`.
- **How the error was made.** `grep -rln` lists files *containing* a string. That output was carried into the prompt as files that *read* it, without checking whether any acted on it. **A count from a source read rather than from behaviour** — precisely the mechanism the assessment identified as producing two wrong component counts, committed here by the session that keeps citing it.
- **Why it is worth recording rather than quietly fixing.** The rule "never let 'not assessed' collapse into 'works'" has a twin: never let "mentions it" collapse into "reads it". Both are the same failure — inferring behaviour from text. A grep is a source read with better ergonomics.
- **When.** 2026-09-08, task 1.3.

### The regression check did not help the first time it was needed

- **What.** `verify-local-stack-health.sh`, produced by task 1.0, could not serve task 1.3's bring-up. It checks the full stack on committed ports, and 1.3 ran six services on alternate ports (3133–3138) to avoid colliding with the shared clone's running stack. Nine of its checks also read Docker's cached status rather than probing. The six services were verified directly instead.
- **Why it matters.** Both limitations were known and written into the script's own header, and they are C16. But knowing about a gap is not the same as it costing nothing: **the check was useless on its first real use.** A check that only works in one configuration is a check that will keep not being there when wanted.
- **What it implies for C16.** The port-sourcing fix is not cosmetic. Until ports come from the same place the services read them, the script serves exactly one scenario.
- **When.** 2026-09-08.

### Two sessions in one clone, again

- **What.** The 1.3 builder worked in `~/Desktop/alterengine-6` — the CEO session's clone — committed to a local branch, and left it unpushed until told. It then had to run its bring-up on alternate ports to avoid the stack already running there.
- **Why it matters.** This was flagged before any builder work started and happened anyway, because no prompt said where to clone. The cost so far: one unpushed commit that existed in exactly one place, and a bring-up on non-standard ports that made the regression check inapplicable — which is why the finding above exists at all.
- **The fix.** Every master prompt states the working location, and it is not the CEO session's clone.
- **When.** 2026-09-08.

### A prompt that scoped the parts narrowly and the done gate broadly

- **What.** Task 1.4's prompt scoped Parts 1–4 to eight specific references, then made Part 5 and the verification demand "bring up the AppConfig path using ONLY committed configuration — paste every service answering." Those are inconsistent: full reproducibility needs more than those eight.
- **What the builder did with it.** Fixed the eight, brought up the two services those eight actually serve, and reported plainly that the rest is unreachable and why — rather than silently widening scope, or claiming the gate was met on two services out of six. Both alternatives would have been worse, and this is the third task in a row where the failure was in the prompt rather than the work.
- **The reason the gap exists, which neither of us named at the time.** The missing references are `ANTHROPIC_API_KEY_SECRET_REF`, `TAVILY_API_KEY_SECRET_REF` and `BROWSERBASE_API_KEY_REFERENCE` — **vendor keys for accounts that do not exist yet.** Tavily and Browserbase were never purchased. So those services cannot be reproducible from committed configuration until Phase 1's remaining purchases happen. It is a dependency, not an oversight, and scoping it as one would have been wrong.
- **The lesson.** A done gate has to be reachable inside the scope the same prompt sets. Writing an ambitious gate does not make the work larger; it makes the report dishonest, unless the builder is willing to say so.
- **When.** 2026-09-08, task 1.4.

### A stale comment that was tested rather than believed

- **What.** Committed configuration carried a comment claiming LocalStack 4.14.0 rejects path-style SSM names on `GetParameter`, which is why `ALTER_ARTIFACTS_BUCKET_PARAM` used a flat name diverging from real AWS. The 1.4 builder tested it against the running version: path-style works on both put and get. The comment was stale, and the divergence it justified was unnecessary.
- **Why it matters.** A comment explaining why something diverges from the obvious shape is the most expensive kind to leave stale — it actively defends the divergence, and everyone who reads it stops asking. Cheap to test, and this one had been protecting a wrong committed value.
- **When.** 2026-09-08.

### Bedrock model availability in ap-south-1, measured 2026-09-09

- **What.** `bedrock:ListFoundationModels` works for `alterengine.dev`. Many text models are listed. Invocability was tested directly through the Converse API — the same call the adapter makes — rather than inferred from the listing.

  | model | bare-modelId Converse | strict 9-key JSON at temp 0 |
  |---|---|---|
  | `qwen.qwen3-32b-v1:0` | works | 9 keys, none missing, none extra |
  | `deepseek.v3.2` | works | 9 keys, none missing, none extra |
  | `mistral.mistral-large-3-675b-instruct` | works | 9 keys, none missing, none extra |
  | `amazon.nova-2-lite-v1:0` | **fails** | not tested |
  | `openai.gpt-oss-120b-1:0` | returns no text at that path | not tested |

- **Nova needs an inference profile, not a model ID.** Verbatim: *"Invocation of model ID amazon.nova-2-lite-v1:0 with on-demand throughput isn't supported. Retry your request with the ID or ARN of an inference profile that contains this model."* The adapter passes `request.modelId` straight to Converse, so it can carry a profile ARN transparently — but the configuration has to know that some models are addressed by profile and others by id. Worth knowing before someone configures Nova and reads the error as an access problem.
- **The JSON test is thin evidence and should not be over-read.** One prompt, one shot, temperature 0. It establishes that none of the three is obviously incapable of holding a strict contract — which is the bar for unblocking Phase 1, and nothing more. The eval harness and its thirty golden cases exist to answer the real question, and that is task 1.5's output rather than a judgement made here.
- **A false negative I nearly reported.** The first pass showed mistral failing to produce JSON. The output began `{\n  "objective": ...` with a literal backslash-n — the AWS CLI's `--output text` escaping, not the model. Re-tested through the JSON response and it passed cleanly. Testing harnesses produce false negatives about the thing being tested, and a model's reputation is exactly the kind of claim that would have stuck.
- **When.** 2026-09-09.

### The local environment is startable, and starting it is still not a step

- **What.** Attempting to run task 1.5's golden-set script on the CEO machine failed before any measurement: `.env.local.example` **cannot be sourced**. Twenty-five of its lines carry `<placeholder>` values — five local database passwords, a 32-byte hex token and its SHA-256, and nineteen connection strings that interpolate those same passwords. Bash reads `<` as a redirect, so `set -a; . file` dies on line 11.
- **Nothing generates it.** There is no bootstrap script in `scripts/`, and `docs/local-dev.md` never says how to fill the placeholders or that they must be consistent across the nineteen derived URLs.
- **The working `.env.local` on this machine has 16 assignments; the committed example has 139.** So `cp .env.local.example .env.local` — the documented starting point — produces something materially different from what anyone is actually running.
- **Why this matters more than it looks.** Task 1.0 proved the stack *can* start, and it does. But it started because a person worked out the substitutions, and that work was never committed. **Startable is not the same as being a step.** This is the exact mechanism the assessment blamed for two wrong component counts — *"undocumented research rather than a step"* — still present after the task that was supposed to close it. 1.0's brief was "bring it up", not "make bringing it up reproducible", so this is a gap in the task rather than in the work.
- **Why the measurement was not forced through anyway.** Generating passwords and substituting them by hand would have produced a golden-set number from an environment nobody could reproduce — which is what task 1.4 spent itself establishing is worthless. The finding is the deliverable; the number waits.
- **When.** 2026-09-09, attempting task 1.5's live run.

### LocalStack environment variables defeating the real-AWS path — second instance

- **What.** C21's bootstrap fills `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` from the example's LocalStack placeholders. Environment variables beat the `~/.aws` profile, so **sourcing the generated `.env.local` breaks real AWS entirely**: `An error occurred (InvalidClientTokenId) ... The security token included in the request is invalid`, while the real credentials are fine. Unset those two and `sts get-caller-identity` succeeds immediately.
- **Why it is a pattern rather than a bug.** `AWS_ENDPOINT_URL` did exactly this in task 1.2 — a LocalStack variable silently defeating the real-AWS path, failing in a way that looks like something else. 1.2 fixed its instance with a service-specific override plus a fatal guard. **This one has no guard at all**, and the failure it produces points at credentials that are not the problem.
- **Where it bites.** Any task needing real AWS from a bootstrapped environment. Worked around during the 1.5 run attempt with a named one-line deviation — a copy of `.env.local` minus those two lines — which is a workaround, not the fix.
- **When.** 2026-09-09.

### Fourteen hardcoded ports, and three tasks that paid for them

- **What.** `docker-compose.yml` hardcodes every host port — 5432, 5433, 5434, 5435, 6379, 4566, 7233, 8233, 3200, 4317, 4318, 3300, 5001, 5002 — with no parameterisation. So two checkouts of this project cannot run on one machine.
- **Not hypothetical.** Three stacks are live here: `alter-x-4--` up two weeks holding six of those ports, `alter-engine-` up seven days on 5440/6390/7240, and presidio on 5001/5002. `alterengine-6`'s stack dies on `Bind for 127.0.0.1:6379 failed: port is already allocated`.
- **What it has cost.** Task 1.3 ran on ports 3133–3138 to dodge it, which made task 1.0's health check inapplicable and left six services verified by hand. The 1.5 live measurement then could not start at all. Three tasks, one unparameterised list.
- **Why stopping the sibling stack is the wrong fix.** It swaps the collision rather than solving it — afterwards the sibling is the one that cannot start. Folded into C16, because ports living in two places is also why the health check cannot be trusted.
- **When.** 2026-09-09.

### A recommendation given without attacking it first

- **What.** Presented three options for the port collision with a recommendation to stop the `alter-x-4-` stack, and ran no attack on it. Havish asked whether I had.
- **What the attack would have caught.** Stopping the sibling swaps the collision instead of solving it. Recommending offset ports would have repeated the exact mistake recorded two tasks earlier, when 1.3's non-standard ports made the health check inapplicable. And the real defect — fourteen hardcoded ports — was neither option.
- **And it was against the grain.** *"Leave Alter alone, lets proceed"* and *"do not post anything on alter-x-4-"* are a consistent line: do not disturb the frozen thing, work around it. Attacking the draft would have surfaced that; instead Havish had to.
- **The rule is [[feedback_self_attack_before_recommending]] and it was skipped**, three days after being written down. Worth recording that having the rule is not the same as running it.
- **When.** 2026-09-09.

### The health check reported another stack's services as this one's

- **What.** Running C16's reworked `verify-local-stack-health.sh` live, three checks passed against services this stack never started: `verification-service` on 8001, `memory-service` on 8002, and `eval-service` on 8003. Our compose brought up **ten dependency containers and zero application services**. Those three ports were held by stray `python3.1` processes.
- **The tell nobody would have caught by reading the score.** Probing **eval-service**'s port returned `{"status":"ok","service":"intelligence-service"}` — the wrong service's identity, counted as a pass. The check asserts HTTP 200 and never asserts that the responder is the service it asked for.
- **Why it is the same footgun one layer up.** C16 parameterised dependency ports and connection URLs. Application service ports were not, so the check probes defaults, and on a machine with sibling stacks the defaults belong to somebody else. Fixing the dependency layer moved the ambiguity rather than removing it.
- **How found.** By running it, on a host with three stacks live. It cannot be found in a sandbox with no Docker, and it would not have been found by a run on a machine with only one checkout.
- **When.** 2026-09-09, verifying C16 after merge.

### What behaved correctly, and is worth keeping

- **32 failures, every one named.** Seventeen gRPC checks reported `grpcurl not installed -- cannot fresh-probe gRPC (install grpcurl or this check is unverifiable)` rather than passing or silently skipping. A check that refuses to claim a result it cannot obtain is the whole point of verification-standard requirement 1, and this is the first artefact in the project to do it.
- **Coexistence proved.** Ten containers on offset ports — 15433, 14566, 16379, 15434, 15435, 13200, 13300, 17233, 15001, 15002 — alongside two sibling stacks left untouched and still running. A row written to this stack's engine-db on 15433 read back from 15433 only. The collision is solved rather than swapped, which was the flaw in the alternative of stopping the sibling.
- **When.** 2026-09-09.

### The golden-set runner has never run, and hides seven defects

- **What.** One attempt to execute `scripts/run-intent-golden-set.sh` on a machine with Docker surfaced seven distinct defects, each hidden behind the previous:
  1. Port overrides not plumbed through, so on a machine with a sibling checkout the runner uses defaults that belong to someone else.
  2. `bootstrap-env-local.sh --merge` flattens C16's parameterisation — a file generated before C16 keeps literal ports, and merge preserves rather than re-parameterises them, so overrides silently do nothing.
  3. **C21's existing-volume guard does not fire.** Regenerated passwords against volumes whose roles carry the old ones produce `FATAL: password authentication failed` buried in an alembic traceback — the exact failure C21's prompt said must be named.
  4. No `PYTHONPATH`: `ModuleNotFoundError: No module named 'src'`.
  5. System python rather than eval-service's venv: `No module named 'psycopg2'`.
  6. The report query names `ec.input_json`; the column is `input`. So even a successful run cannot report.
  7. **The golden sets are not in the database the runner reads.** After clean migrations: `eval_runs=0, eval_results=0, eval_cases=0, golden_sets=0`. Seeding and reading point at different databases.
- **Why all seven survived.** The runner was written in a sandbox with no Docker, so it could never be executed by the session that wrote it. Every defect is of the kind only running finds.
- **Defect 7 is the dangerous one.** Without it the runner executes an empty set and reports zero — indistinguishable from thirty genuine failures. *A runner that reports 0 of 0 as though it were 0 of 30 is how the last wrong count happened.*
- **When.** 2026-09-09.

### Pushing through five layers instead of handing back after two

- **What.** The CEO session attempted the live run and worked through port collisions, a flattened parameterisation, mismatched volume passwords, a missing PYTHONPATH, a missing venv, and a wrong column name — before finding the golden sets were absent entirely. Each fix looked like the last one.
- **Why it was wrong even though the findings were real.** Every fix lived in a shell: exported ports, `PYTHONPATH`, a venv on `PATH`, and eight `ALTER ROLE` statements. None was committed, so none is reproducible — **manufacturing exactly the unreproducible environment tasks 1.4 and C21 existed to eliminate.** It was also builder work being done from the review seat.
- **The rule that should have fired.** Every master prompt carries "if you find yourself retrying the same thing more than twice, STOP and report." It applies to the CEO session too, and it did not.
- **What was worth keeping.** The seven defects are now named in 1.5b's prompt, so nobody rediscovers them. That is the salvage, not a justification.
- **When.** 2026-09-09.

### CI was red for six merges before anyone checked

- **What.** Every merge from task 1.2 onward failed CI's `gate` job. Nobody looked until asked directly. `verification-standard.md`, written between merges 5 and 6, requires that a check run without anyone remembering to run it — the standard was written while its own enforcement mechanism was silently broken.
- **Root cause 1.** Task 1.2's `embedding-discrimination.spec.ts` imported `@grpc/grpc-js` and `@grpc/proto-loader` directly to build a test client, which `check-architecture-boundaries.sh` forbids for every Engine app — vendor SDK imports must live under `packages/adapters/**`. That check runs before the test suite, so it masked whatever ran after it for a week; nobody could see if the tests even still passed.
- **Fix.** Added `embed()` to the existing `ModelGatewayClient` adapter (a new `ModelGatewayEmbedHandler` interface, kept separate from `ModelGatewayHandler` so the many orchestration-service consumers that implement only `invoke` are untouched), and rewrote the spec to use it instead of hand-rolling a client. Verified locally, then confirmed on the real CI runner — the local pass was not treated as proof.
- **Root cause 2, found only once root cause 1 stopped masking it.** `pnpm audit` flagged 11 advisories not in the checked-in baseline, two of them **critical Next.js RCEs**. Traced with `pnpm why`, not assumed: nine of the eleven — both critical RCEs, a `sharp` CVE, four `svgo` CVEs — trace to one **unused** devDependency, `@nx/next`. Not registered in `nx.json`, not referenced by any project executor, not imported anywhere under `apps/`; `platform-web` genuinely runs on Vite. Removed outright. The remaining two moderate advisories were in `vitest` itself, the tool every suite in the repo runs through — one patch version, `4.1.10` → `4.1.11`, fixed them.
- **What was deliberately not chased.** Two `js-yaml` advisories (high, CPU-exhaustion only, no path to untrusted input) sit five levels deep in `@nx/eslint`'s pull of Jest/Babel tooling this repo doesn't use as a test runner — no `jest.config` exists anywhere. Accepted into a **regenerated** baseline rather than pursued further: pulling a second Nx plugin on a hunch in the same sitting was the wrong instinct, and removing `@nx/eslint` needs more certainty than was established about whether anything relies on it. Also surfaced, not investigated: **no root `eslint.config` file exists anywhere in the repo**, despite `lint` being a real target. Left for someone else to look at.
- **The baseline itself was stale independent of any of this.** Thirteen of its eighteen entries no longer existed in a fresh audit — resolved by unrelated updates over time, never trimmed. Regenerated to be exactly what `pnpm audit` reports today rather than appended to, so the file means what its name says.
- **What could not be fully explained, reported as such.** A Temporal executor-workflow test failed in the same CI run that first went red (a Zod "too small" validation error inside a deliberately-malformed-input test case). It passed 513/513 locally both before and after the fixes above, and passed on the real CI runner in the run that finally went green. **Whether it was flaky or already fixed by something else is not established** — only that it is not currently failing.
- **Verified for real, not asserted.** Both fixes were pushed and watched to completion with `gh run watch --exit-status`, reading the actual step list rather than trusting a summary. The first push still failed — on the dependency scan, a cause invisible until the boundary check stopped masking it. The second push went fully green: every step, including `test monorepo`, `test platform api`, and both its integration suites.
- **When.** 2026-09-09.

### PR #89 — a red PR holding a correct diagnosis

- **What.** Opened 29 August with correct diagnoses of seven defects. It went red on CI,
  nobody rebased it, and it sat twenty-seven commits behind. Three of those defects were
  rediscovered from scratch during verification and fixed again as #99, #100, #103, #105.
  One of its unshipped fixes silently breaks every multi-node workflow.
- **Why it matters.** The assessment's own conclusion: *a red PR holding a correct
  diagnosis is more expensive than an open bug, because the bug at least gets found twice.*
- **How found.** Triaging it was the cheapest action available at any point. It was done
  last.
- **When.** 29 August – 6 September 2026.
- **Where.** The assessed engine repo.

### The local environment was the hidden blocker

- **What.** Four services could not start from the configuration the repository shipped
  (#121). `.env.local` carried one service's identity, two services required mutually
  exclusive values of `ALTER_CONFIG_SOURCE`, audit-service and model-gateway defaulted to
  the same gRPC port, and LocalStack seeded three resources while services read six — its
  healthcheck asserting only the three it seeded, so it reported healthy while the rest
  were absent. Nine gRPC bind defaults were wrong, six of them colliding in pairs.
- **Why it matters.** "Classified from a source read" was not laziness — it was the only
  option available without first reverse-engineering the local environment. **That is the
  same mechanism that produced the previous wrong count**, and it will keep producing them
  until the configuration lets a person run what they are judging.
- **How fixed.** #122 and #123. Verified by starting five services together from one file
  with no overrides: eighteen distinct ports, every health endpoint answering.
- **When.** During the assessment, early September 2026.
- **Where.** `.env.local`, gRPC bind defaults, LocalStack healthcheck.

### #124 — the fix that broke the healthcheck

- **What.** #122 grew the LocalStack healthcheck from four assertions to ten without
  raising its 5s timeout. Ten calls take 7.4s, so Docker killed every probe and recorded
  `exit -1`: the container reported unhealthy forever with all eight resources present,
  and `docker compose up` waited on it.
- **Why it matters.** A self-inflicted regression from a correct fix, found minutes after
  merge by bringing the stack up. Worth remembering as a pattern: widening a check without
  widening its budget.
- **When.** Minutes after #122 merged.
- **Where.** LocalStack healthcheck configuration.

### The memory ↔ orchestration credential cycle

- **What.** Memory authenticates a caller with the internal service token, then forwards
  that same header onward to an endpoint that requires an M2M token it cannot mint. The
  M2M token that endpoint wants is in turn rejected by memory.
- **Why it matters.** This is not a missing method on one service. It is a **cycle that
  crosses an authentication boundary**, which is why no single credential closes it.
  Minting a tenant-scoped token is off the table by design — #113 removed the
  `organization` parameter because an Alter tenant UUID was never valid against real
  Auth0. The design log covers user authentication thoroughly (§20) and never addresses
  service-to-service auth topology at all.
- **When.** Found during the assessment; still open as of 2026-09-08.
- **Where.** memory-service, orchestration-service.

### Voice — declared in code, absent from the design

- **What.** `VoiceService` declares six RPCs and no implementation exists under `apps/`.
  No telephony vendor appears in the repository. The design log never mentions voice once
  — not deferred the way Project Mode is explicitly deferred in §23, simply absent.
- **Why it matters.** This is the one place the assessment and the design log disagree
  about what the product is. Until it is explicitly cut or explicitly scoped, it keeps
  appearing in counts as pending work and distorting every estimate that includes it.
- **When.** Raised 2026-09-07. Undecided.

### Category 2 and Category 3 look identical on screen

- **What.** Both show a surface that does not work. They are different orders of cost.
  Wiring means both ends exist and nobody connected them. Fixes mean the connection exists
  and something along it is wrong.
- **Why it matters.** A source read marks both as finished, because from the source both
  halves look complete. This is why the fifth column ("not assessable") exists at all.
- **Where.** `needs.html`, category definitions.

### 1.5b's reported blocker was not the real one — CI proved a different, trivial cause

- **What.** Task 1.5b's builder report named `pnpm exec nx run eval-service:build` hanging
  indefinitely (tried under both Node 20 and Node 22, stopped after two attempts per the
  loop-abort rule, correctly claimed no score) as the reason the runner could not be
  proven end to end. Independently reproduced: in a fresh clone, that exact command
  genuinely hung past 4 minutes with zero output, while `uv sync --frozen` — the actual
  command the `build` target runs — completed in 13ms when invoked directly. So the hang
  is real, but pushing the branch and opening PR #7 to get a real CI verdict (rule 9)
  surfaced the actual, different, and much smaller defect: `eval-service:typecheck` fails
  on **6 real mypy errors** (untyped function defs and one missing generic type argument)
  in the new `run_intent_golden_set.py`, and CI's `nx affected` sweep — including the same
  `eval-service:build` target — ran in about 20 seconds with `eval-service:build` itself
  completing in 0.48ms.
- **Why both things are true.** CI's `gate` job restores Nx's computation cache from
  `actions/cache@v4` (documented in `CLAUDE.md`) before running anything. A fresh clone
  with no persisted cache pays Nx's full project-graph computation cost on its first
  invocation — for a 15-app, 6-package monorepo, evidently well past 4 minutes. That is a
  **working theory, not confirmed to completion** — the local repro was killed at the
  4-minute mark rather than let run to see if it ever finishes. It reads as a hang because
  nothing prints while Nx builds the graph, and 4 minutes is long enough to look
  indistinguishable from actually stuck.
- **Why it matters beyond this one task.** A builder in a fresh clone (which every builder
  is, per standing rule 7) may hit this exact wall on any first Nx invocation, not just
  this target, and reasonably conclude something is broken when it is only slow and
  silent. Worth a named fix — warm the cache first, or add progress output, or document
  the expected first-run cost — so the next builder doesn't repeat the two-attempt cycle
  on the same non-defect.
- **The standing rule earned its keep here.** Rule 9 (never trust a merge without checking
  CI to completion) is why the real cause surfaced at all — the builder's own diagnosis,
  taken alone, would have sent the next round chasing a cold-cache theory instead of
  fixing six one-line type annotations.
- **Status.** PR #7 open, CI red, not merged. Not closing 1.5b. Genuinely closable in the
  next round with a small fix. See `checklist.md` 1.5b.
- **When.** 2026-09-09.
- **Where.** `apps/eval-service/scripts/run_intent_golden_set.py`,
  `havishalterx-eng/alterengine-6#7`.

### PR #7 merged, then a clean-checkout attempt found the real blocker — Nx itself, confirmed severe

- **What.** After the type fix above, CI went green (`gh run view --json conclusion` returned
  `"success"` directly against the API) and PR #7 was squash-merged. But merging only proves
  lint/typecheck/build pass — it does not meet 1.5b's actual done gate, which
  `docs/prompts/revive-15b-make-the-runner-run.md` states explicitly: *"someone else can get
  the same number... from a CLEAN CHECKOUT... run the golden set to a reported result... with
  NO hand-editing and NO shell-only fixes. Paste it."* Nobody had ever done that. So the CEO
  session did it directly, as verification rather than as building: fresh `git clone` outside
  the cloud-synced tree (`CLAUDE.md`'s own rule), offset ports so it coexists with every
  sibling stack, real AWS credentials, `scripts/run-intent-golden-set.sh` run unmodified.
- **First attempt found a second, separate, real gap: nobody runs `pnpm install`.** A truly
  fresh clone has no `node_modules`. Neither the runner script nor `docs/local-dev.md`'s
  Prerequisites section (`Docker Desktop`, `Node.js and pnpm versions declared by repository`
  — no install step) says to run it. The first live attempt exited with status 0 and did
  nothing at all: `pnpm exec nx run eval-service:build` failed instantly with
  `ERR_PNPM_RECURSIVE_EXEC_FIRST_FAIL Command "nx" not found`, but the outer
  `./script 2>&1 | tee log` wrapper reports the exit code of `tee`, not the script, so the
  real failure was silently swallowed and looked like clean success. **Every prior person who
  read this as "the runner works, just untested live" was one `pnpm install` away from the
  real number** — this had never been run to completion by anyone.
- **After `pnpm install`, the real blocker confirmed, not just theorized.** Re-ran the
  runner. It reached `pnpm exec nx run eval-service:build` and sat there. Checked the actual
  process rather than assuming: `ps aux` showed `node .../nx.js run eval-service:build` at
  **95–99% CPU continuously** for the entire wait — genuinely computing, not deadlocked or
  I/O-blocked. Killed it after **14 minutes 7 seconds**, still at 99.5% CPU, zero output.
  Immediately ran the actual underlying command directly, bypassing Nx entirely: `uv sync
  --frozen` in `apps/eval-service` — **0.283 seconds real time**, full venv creation plus 48
  packages installed from nothing. The earlier session's "cold Nx graph computation" theory
  (recorded above, flagged then as unconfirmed) is now confirmed as a real, severe defect:
  whatever Nx computes before running this target costs at minimum multiple thousands of
  times the underlying work, and 14+ minutes was not enough to see it finish. **Not proven
  unbounded — proven far past any reasonable session length**, which is the practical
  equivalent for anyone trying to use this runner.
- **Why CI never shows this.** `CLAUDE.md`: CI's `gate` job persists the Nx computation cache
  via `actions/cache@v4` and restores it before running anything. A fresh clone has no such
  cache and pays a cost CI has never once measured, because CI is never actually cold.
- **Why it matters beyond this one script.** Every builder works from a fresh clone by
  standing rule 7. Every one of them will hit this exact wall on their first Nx invocation of
  *any* target, not just this one, and — per the original builder's own report — two
  independent attempts under two different Node versions both looked like a hang and both
  were abandoned per the two-retry rule. That was the correct call each time; the tool itself
  is the problem, not the caller.
- **What was not done.** No fix attempted. Diagnosing or fixing Nx's graph computation is
  build work, not CEO work, and the cause (dependency graph size, a misconfigured plugin,
  network calls during graph construction, something else) is not yet known — only that the
  underlying command is fast and the wrapper is not.
- **Status.** 1.5b does not close. Its own done gate — a real number from a clean checkout —
  has now been attempted twice for real, by two different people, and has never once been
  reached. This is a new, higher-priority blocker than anything the original seven defects
  named, and it blocks Phase 1's own done gate too, not just this task.
- **When.** 2026-09-09.
- **Where.** Nx target `eval-service:build`, invoked via `pnpm exec nx run`; confirmed with a
  fresh clone outside `~/Desktop`, offset ports `35433`/`36379`, real AWS.

### C26 closed, and Phase 1 gets its first real number — Havish authorized building directly

**What.** Havish explicitly said "build everything yourself," scoped to concluding Phase 1
completely — the documented exception in `docs/ceo-session-bootstrap.md` §1, for this task
only. The CEO session built C26's fix directly rather than writing another master prompt.

**Diagnosis, before the fix.** Isolated the cause methodically rather than guessing once:
- Ruled out sandboxing — reproduced the same hang with the session's own sandbox disabled.
- Ruled out the Python virtualenv — reproduced with `.venv` deleted before the run.
- Ruled out git performance — `git status` 84ms, `git ls-files` 18ms, 2538 tracked files,
  nothing pathological.
- Ruled out project-graph computation itself — the Nx daemon's own log showed
  `createProjectGraph()` completing in **20.9ms**, `build-project-configs` in 532ms. The
  graph was never the bottleneck.
- V8 process sampling (`sample <pid> 6`) during the hang showed the hot path inside
  `v8::internal::MicrotaskQueue::RunMicrotasks`, with the leaf frames dominated by
  `String::ComputeAndSetRawHash`, `EphemeronHashTable`, `OrderedHashMap` — consistent with
  hashing a large in-memory JS structure repeatedly, not file I/O and not a deadlock (the
  process held 95–99% CPU the entire time, never idle).
- **Not fully root-caused.** The specific structure being hashed, and why it's expensive
  every invocation despite a warm daemon-side graph cache, was not identified. Recorded
  honestly as unknown rather than guessed at.

**The fix, once isolated.** Nx's own value here — cross-project build caching — buys
nothing for a script that only ever builds these same handful of targets once per run.
Rewrote `scripts/run-intent-golden-set.sh` to run the identical underlying commands each
`project.json` target already defines (`tsc -p ...`, `uv sync --frozen`, `uv run alembic
upgrade head`, the two `copy-build-assets.mjs` scripts), directly, in the same dependency
order Nx would have used (`contracts` → `shared-clients`/`adapters`/`auth` → the eval
processes). Proven before shipping: the full sequence, direct, took **12.4 seconds**;
confirmed the resulting `dist/` output files existed and matched what the runner expects.
Also fixed the companion gap from the entry above: the runner now checks for `node_modules`
and runs `pnpm install` if missing; `docs/local-dev.md`'s Prerequisites section now says to
run it too.

**Verified for real, end to end, from a genuine fresh clone** (not the CEO's docs clone, not
the earlier partially-warmed clone — a clean `git clone` at the merge commit): real Docker,
real AWS Bedrock, offset ports beside every sibling stack, no hand-editing. Produced Phase
1's first-ever real golden-set number:

> **21/30 passed, pass_rate = 0.70.** 9 failures, every one with a real, named cause — 7×
> `INTERNAL: Model Gateway returned invalid JSON for classification content`, 2× genuine
> intent misclassification (`workflow`→`execute` on "Execute the monthly billing workflow";
> `execute`→`plan` on "Create a new sandbox for this run").

**The script's own cache-detection logic did its job.** Run 2 (same script, same process)
came back at `ratio=15.5x` (9.18s → 0.59s) with byte-identical per-case output to run 1 —
exactly the semantic-cache-hit signature the script exists to catch, not a second
independent measurement. **The number that counts is run 1's cold 0.70.**

**What this closes.** Phase 1's own done gate (`checklist.md` line ~161) had three
conditions; task 1.2 already proved the second (capability discrimination), and this run
proves the first (a real, non-zero, real-reason score) and the third (the Conversation
Manager visibly returning five distinct intents across the 30 utterances) in the same
breath. **All three are now met.** 1.5 and 1.5b both close. 1.1 (provider procurement) also
closes — Bedrock has been the account in continuous use since 2026-09-08 and was simply
never written down as a decision until now.

**What this deliberately does not close.** The 7× JSON-format failures are a real signal
about model output reliability, not a Phase 1 obligation — Phase 1's own text says "expect
bad scores and treat them as signal, not failure." Not chased here; worth its own ticket if
Havish wants it tracked, since it recurs identically in both runs (not noise).

**What's left in Phase 1.** Only **1.6** — gateway reproducibility for model-gateway,
tool-gateway, sandbox-service, provisioning-service — blocked on purchasing Tavily and
Browserbase accounts, which is not engineering work and not something a build session can
close. Everything else in Phase 1 is now closed.

**Status.** Merged: PR #8 (`50edf30`), squash, branch kept. CI confirmed green directly
against the API before merge.
- **When.** 2026-09-09.
- **Where.** `scripts/run-intent-golden-set.sh`, `docs/local-dev.md`,
  `havishalterx-eng/alterengine-6#8`.

---

## 6. Component ledger

61 components. Status from the assessment (engine verified against main, 4–6 September
2026; platform as received and not independently verified).

**Alignment key**
- `ALIGNED` — design log imposes no requirement this component fails.
- `NEEDS-LOGIC` — design log supplies logic the component is missing.
- `CONFLICT` — design log says something different from the component's current shape.
- `SILENT` — design log does not cover this component.

### Category 1 — works end to end (25). Do not touch.

| # | Component | Layer | Alignment | Note |
|---|---|---|---|---|
| 1 | Run Manager | L6 | NEEDS-LOGIC | §22 assigns it the pre-flight budget gate, which must be **atomic** against the budget record, not read-then-decide. Not present today. |
| 2 | Durable Run Queue | L6 | ALIGNED | Dead-letter cap of 5 confirmed in source and regression test, not by live failure. |
| 3 | Execution Workers | L6 | ALIGNED | Resumed an unclaimed run with no lost state. |
| 4 | Durable Substrate | L6 | ALIGNED | Temporal. Every run closes COMPLETED carrying node output. |
| 5 | Node Type Registry | L6 | ALIGNED | Returns exactly the eleven canonical node types. §14 wanted a real registry; it is one. |
| 6 | Executor | L6 | ALIGNED | §13 wanted its own bounded module; it has one. Honoured edges and wave order in a two-node run. |
| 7 | Blackboard | L6 | ALIGNED | Verified carrying one node's output to the next, not only direct read/write. |
| 8 | Graph Compiler | L5 | ALIGNED | Built a diamond from a five-node skeleton: three edge kinds, four waves. Refused a ToolCall entry point — a real safety rule. |
| 9 | Architecture compile path | L5 | NEEDS-LOGIC | Fixed in #116. Still writes `node_requirements` as `{}` (#117). |
| 10 | SandboxExec | L6 | ALIGNED | First execution of this node type; exit_code 0 with stdout. |
| 11 | HumanApproval | L6 | NEEDS-LOGIC | Pause and resume work. §16's four modes are not evidenced. The human-facing REST route is **unverified** — needs a properly minted delegation token. |
| 12 | Gate | L6 | ALIGNED | Evaluated two CEL-subset conditions and routed on the result. |
| 13 | Merge | L6 | ALIGNED | Converged the diamond without waiting for the deactivated branch — the deadlock every fan-out/fan-in design risks. |
| 14 | Provisioning | L6 | ALIGNED | §23 requires it stay scoped small so Project Mode remains addable. It is. |
| 15 | Model Gateway | L7 | ALIGNED | **Five direct dependents** — the only Category 1 component whose failure takes the engine down. Redaction validates an Aadhaar checksum both ways. |
| 16 | Sandbox | L7 | ALIGNED | Holds its six-RPC boundary with no browser or database surface. |
| 17 | Verification & Quality Gate | L8 | NEEDS-LOGIC | Both paths real; a promoted tenant policy moved a threshold and flipped identical output pass→warn. But §5.1 (structured success criteria), §5.2 (mechanical read-back) and §5.3 (end-of-run holistic check) are **not evidenced**. See Open Questions. |
| 18 | Policy Store | L8 | NEEDS-LOGIC | Full draft→canary→active lifecycle, tenant-scoped. §22 requires a **global tier structurally incapable of holding tenant content**. Does not exist yet, so it is free to add now. |
| 19 | Synthesis | L8 | ALIGNED | Declines honestly when there is nothing verified upstream to degrade into. |
| 20 | Capability Registry | L3 | NEEDS-LOGIC | Register/search/get/deactivate all behave; cross-tenant search returns nothing. §19 additionally requires it hold reusable workflow templates from day one. |
| 21 | Audit Ledger | L8 | NEEDS-LOGIC | Most strongly defended component probed. Immutable under UPDATE and DELETE as service role **and** as superuser. One structural gap: incremental verify resumes from a checkpoint, so a forgery in checkpointed history is never re-examined, and the full-walk `verifyChain()` that catches it **has no route and no caller** — §7 pattern 3 verbatim. |
| 22 | Cost Ledger | L8 | NEEDS-LOGIC | Honest about what it does not know (`confidence: "no_data"`). Three gaps: `COST_SOURCES` union not enforced (`source: "telepathy"` accepted); split on tenancy (`/costs/estimate` wants a bare UUID, `/costs/by-run` wants the `ten_` prefix); and §21/§22 require it record **verification verdicts from day one** or billing later needs backfill of data never captured. |
| 23 | Conversation Manager | L1 | ALIGNED | Genuinely model-backed — injection screen, real Model Gateway call, five-value taxonomy. Quality unjudgeable locally: the mock returns one canned reply. |
| 24 | Eval Harness | L8 | ALIGNED | Ran a real 30-case golden set to completion. Scored 0 of 30 — the right answer, not a broken harness: every case failed on the injection screen inside `ClassifyIntent` being unable to reach ads-core. §11 predicted exactly this by rejecting standalone-service safety. |
| 25 | Problem Understanding | L2 | ALIGNED | The 503 was the mock, not the service (#126). One real behaviour exposed: the returned objective is the **caller's**, not the model's — a model cannot rewrite it while enriching the rest. |

### Category 2 — needs wiring only (10). Platform, as received.

Each is a finished screen and a working backend that were never introduced. Routes answer
`403 RBAC_ROLE_DENIED`, not 404 — the backend exists and is authorized. **No dependencies
on each other or on the engine.** All `ALIGNED`; design log §6 and §27 say this category
should not exist, but remediation is pure wiring.

| # | Component | Note |
|---|---|---|
| 26 | C23 Admin Console | Fourteen screens, eight backend modules, never once called by the product. |
| 27 | C14 Marketplace | Eight methods, none wired. |
| 28 | C15 Publisher & Payout | Seller profile and listings fully mock. |
| 29 | C18 Cost & Billing | Ten methods across billing and billing-ops, none wired. |
| 30 | C17 Notifications | Seven methods, none wired. |
| 31 | C19 Discovery | Two methods, none wired. |
| 32 | C22 Benchmarking | Seven methods, none wired. |
| 33 | C26 Search | **Returns invented results** — the only item here that is actively misleading rather than merely inert. Take it first. |
| 34 | C16 Tool Registry | Source read only, not observed live. |
| 35 | C20 Media Services | Source read only, not observed live. |

### Category 3 — needs fixes or missing methods (12). 7 engine verified, 5 platform as received.

| # | Component | Layer | Alignment | Note |
|---|---|---|---|---|
| 36 | Selection & Binding | L4 | NEEDS-LOGIC | **No exact-capability filter at all.** Eligibility is tenant, workspace, status, tier and embedding similarity — nothing checks the agent actually has the capability asked for. A 30–40× latency and cost swap does not move the winner; `agent_id ASC` decides it. §8 and §12 both assume this scoring is real. |
| 37 | Agent Auto-Creation | L4 | CONFLICT | §22 item 9 makes **Agent Factory its own L4 component**, because it has two callers in different layers — Selection & Binding on the design path, Recovery on the run path. Currently folded inside Selection & Binding. Also: hardcodes tier `STANDARD` while eligibility filters on that column. The #125 duplicate-creation defect is **fixed by task 3.0** (idempotency key + partial unique index, migration 0006); the tier question is owned by 3.3. |
| 38 | Capability Resolver | L3 | NEEDS-LOGIC | Advanced-tier terms tested before fast-tier ones in a plain if/elif, so an incidental adjective decides the tier. Set membership, not parsing. §3 requires real reasoning. |
| 39 | Recovery | L8 | CONFLICT | Sends `CompiledDag` where the planner validates `TaskSkeleton`; two of eight strategies dead. **Settled by §24 — `TaskSkeleton` is canonical.** `repair` decides correctly then defers. §4 additionally requires an idempotency gate in front of Dispatch, backed by a Side-Effect Ledger (§22 item 7) that does not exist. |
| 40 | Memory & Learning | L8 | SILENT | The credential cycle. Design log has no service-to-service auth topology. **Blocked on the user.** |
| 41 | Drift Detector | L8 | NEEDS-LOGIC | Scores compute and persist correctly. The `drift_read` policy admits only model and provider subjects, so agent drift returns zero rows to its own tenant. §17 gives it an **outbound suggestion path to the user** on top of its inward path to Policy Store — neither is reachable today. |
| 42 | Tool Gateway | L7 | NEEDS-LOGIC | Four tool families dispatch. Denominator unpinned — no protocol enum exists, and a live probe found three unimplemented, not two. §7 pattern 4 and §14's registry precedent both apply. |
| 43 | C5 Run Experience | platform | ALIGNED | Stop and retry call `actions/cancel` and `actions/retry-node`; neither route exists. Reads work. Additive and safe. |
| 44 | C7 Project Studio | platform | ALIGNED | No `GET /projects` and no `GET /projects/:id`. List and detail have nothing to call. Additive and safe. |
| 45 | C6 Human Action Centre | platform | CONFLICT | UI sends `status=open`; API accepts `pending·approved·rejected·expired`. Only `expired` overlaps. **Settled by §22 item 8 — the engine's enum is canonical, the platform moves.** |
| 46 | C13 Trigger Management | platform | CONFLICT | `testTrigger` and `removeTrigger` **report success without calling anything.** §5.5 fail-closed and §7 pattern 1 both forbid this. Take it early. |
| 47 | C8 Deployment Manager | platform | SILENT | Declared, never implemented. Placed here rather than Category 4 because `DeployctlService` exists with three RPCs — the backend contract is real. |

### Category 4 — build from scratch (4). 2 engine verified, 2 platform as received.

| # | Component | Layer | Alignment | Note |
|---|---|---|---|---|
| 48 | Architecture Synthesizer | L4 | NEEDS-LOGIC | Given bare defaults, then customer-visible + human-approval + EU residency + PII all set, returns **byte-identical topology, waves, roles and a hardcoded `confidence 1.0`**. §1 names autonomous topology design the product's entire differentiator. §24 supplies the budget argument for a real model call. |
| 49 | Planner | L2 | NEEDS-LOGIC | Selects strategy by counting words against a fixed keyword set, never calling a model. A padded trivial lookup escalates to manager-worker; a real three-team, twelve-country migration in 28 words does not. **Classification is inverted relative to actual scope.** §1 names this defect by name in the old build. |
| 50 | C9 Repository Manager | platform | SILENT | Declared, never implemented. Not in the design log. Scope call needed. |
| 51 | Voice | engine | SILENT | Six RPCs declared, no implementation. Design log never mentions voice. Scope call needed. |

### Category 5 — not assessable yet (10). Held out of the four deliberately.

None is known to be broken; none has earned a category. **Of three components previously
counted as working on a source read alone, one worked, one failed its first request, and
one had no surface to call** — which is why this column exists.

| # | Component | Note |
|---|---|---|
| 52 | ads-core | Starts, serves, enforces the tenant prefix, refuses unauthenticated calls with 401. Retrieval — its actual job — needs a real embedding provider. Not a fix; a key. |
| 53 | `contracts` package | Library with unit tests rather than a service with edges. Least worrying here. |
| 54 | `auth` package | As above. |
| 55 | `tenancy` package | As above. |
| 56 | `shared-clients` package | As above. |
| 57 | C10 Knowledge Management | Classified from source, not observed. Additionally depends on ads-core. |
| 58 | C21 Comms Channels | Classified from source, not observed. |
| 59 | C24 Platform Jobs | Classified from source, not observed. |
| 60 | C25 Streaming Gateway | Classified from source, not observed. |
| 61 | C27 Localization | Classified from source, not observed. |

---

## 7. Open questions

| # | Question | Owner | Blocks |
|---|---|---|---|
| 1 | Does the orchestration endpoint accept an explicit tenant alongside a service credential? | Havish | The entire healing loop, which is half the demo. |
| 2 | Voice — in scope or cut? | Havish | Component counts and every estimate that includes them. |
| 3 | Repository Manager — in scope or cut? | Havish | As above. |
| 4 | Auto-creation tier: create at the requested tier, refuse above a ceiling, or **create at the requested tier and bound abuse with spend caps** (§9's pre-flight budget gate offers this third option the action plan does not list)? | Havish | #125. |
| 5 | `node_requirements` (#117): re-resolve, derive from the binding decision already made, or declare the column skeleton-path-only? Deriving reads best — it uses data already committed to rather than re-deciding it. | Havish | Latent. Nothing reads the column today. |
| 6 | Do §5.1 structured success criteria and §5.2 mechanical read-back exist in the code at all? **Absence is inferred, not established** — the assessment never looked for them. | Verify before scheduling | Potentially a subsystem, not a patch. |
| 7 | Are the four architecture documents beside the design log (`component-contracts`, `layer-architecture`, `plane-architecture`, `whole-architecture`) also binding standards, or superseded? | Havish | How much of the standards set gets exported. |
| 8 | Approval notification delivery — push, email, or in-app badge (§16, §29)? | Havish | Does not block architecture; settle before the approval flow is built end to end. |

---

## 8. Sources

| Document | What it is | Where |
|---|---|---|
| `needs.html` | Team's readiness assessment. Engine verified against main 4–6 Sep 2026; platform as received, not independently verified. | Supplied by Havish; text extract preserved in the working set. |
| `action-plan-v1.html` | Team's proposed build sequence — six phases plus a parallel platform track, and a third-party services table. | As above. |
| `alter-engine-rebuild-design-log.md` | 29 sections, status 2026-09-01. **The standards document.** | `~/Desktop/alter engine rebuild/` and `alterengine--5:docs/architecture/design-log.md` |
| `alter-engine-component-contracts.md` | 2,100 lines. Per-component contracts. Binding status open — see Open Question 7. | `~/Desktop/alter engine rebuild/` |
| `alter-engine-layer-architecture.md` | 521 lines. L0–L14 layer design. | As above. |
| `alter-engine-plane-architecture.md` | 213 lines. Cross-cutting planes. | As above. |
| `alter-engine-whole-architecture.md` | 259 lines. Whole-engine view. | As above. |
| Reconciliation artifact | Side-by-side of the assessment against the design log — what the log already answers, where it goes further, where code must move, what nobody decided. | https://claude.ai/code/artifact/fa5cfa3f-fef0-4778-8973-a916cd1bcbb0 |
| `alterengine--5` | Frozen ground-up rebuild. Source of the 11 AST architecture gates, contracts, `loadConfig()`, METHOD.md, RULES.md. Component code not carried over. | `havishalterx-eng/alterengine--5` |
| `alter-x-4-` | Frozen. Prior art. | `havishalterx-eng/alter-x-4-` |
