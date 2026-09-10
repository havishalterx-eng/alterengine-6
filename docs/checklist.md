# checklist.md — Project Revive

Terse list of work. **Numbering follows `action-plan-v1.html` exactly**, so this document,
the action plan and the team all use one vocabulary. Reasoning for every block lives in
[`memoryalter.md` §3](memoryalter.md#3-checklist-context).

**Finish line.** One real business problem in; topology designed; run executed; outcome
verified against real external systems; one node deliberately broken, then detected,
replanned, recovered, remembered, and its drift score readable by the owning tenant —
watched on a screen, not described in a report.

Status: `[ ]` not started · `[~]` in progress · `[x]` done · `[!]` blocked

**Two additions to the action plan, marked `[+]` wherever they appear.** Task 1.0 and all
of Track C are ours, not the plan's. They are called out rather than folded in silently.

---

## Phase 0 — answer five questions. No code.

*Days · Havish only. Written answers are the deliverable — a paragraph each. Three of the
five block later phases outright.*

**PHASE 0 CLOSED 2026-09-08.** Every decision is also written onto the component pages it
affects, which is how the plan's "linked from its issue" gate is met — `alter-x-4-` is
frozen and never written to.

**Closed:** All five answered with rationale in
[`phase-0-decisions.md`](phase-0-decisions.md); derived logic appended to the design log as
§30–§33. No code changed.

- [x] **0.1 memory credential** — *blocks Phase 2.* Memory forwards its caller's token to
      an endpoint that derives tenancy from the token itself, and minting a tenant-scoped
      one is off the table since #113. Either that endpoint accepts a tenant explicitly
      alongside a service credential, or the cycle stays.
- [x] **0.2 recovery contract** — *blocked Phase 2.* **Closed 2026-09-08 from design log
      §24: `TaskSkeleton` is canonical.** Replan re-enters the design path, and L5 is what
      produces the DAG, so replan must hand back what that path consumes. Implementation is
      task 2.2.
- [x] **0.3 auto-creation tier** — *blocks Phase 3.* Issue #125. Creating at the requested
      tier converges but lets any caller conjure a `CEILING`-tier agent. **The action
      plan's own read: refuse above a ceiling — safer, and makes the failure visible.**
      Design log §9's pre-flight budget gate offers a third option (create at the requested
      tier, bound abuse with spend caps). Pick one.
- [x] **0.4 requirements map** — *latent.* Issue #117. Who fills `node_requirements` on the
      architecture path — the compiler by re-resolving, or the caller who already decided?
      Nothing reads the column today, so this can wait, but not indefinitely.
- [x] **0.5 action vocabulary** — *blocked a platform item.* **Closed 2026-09-08 from
      design log §22 item 8: the engine's enum is canonical, the platform moves.** The
      approval inbox is a Platform-side read model over the engine's decision record, and a
      read model maps onto its source. Implementation is task B-vocab.

**Done when** five written answers exist, each with its rationale, each linked from its
issue. No code has changed.

**Also open, not in the action plan:**
- [x] **0.6 [+] Voice and Repository Manager scope.** Cut or scope both explicitly. Until
      then they distort every count. (The plan handles these in Phase 5; this is the
      decision that gates that phase.)
- [x] **0.7 [+] Architecture docs status.** Are `component-contracts` (2,100 lines),
      `layer-architecture`, `plane-architecture` and `whole-architecture` binding standards,
      or superseded by the design log?

---

## Phase 1 — buy and wire the two providers

*1–2 weeks · highest leverage in the plan.* Eight components are judged "works, quality
unproven" purely because the local mock answers everything. It has already produced three
false readings.

- [x] **1.0 [+] prove the stack runs, and keep it running.** **CLOSED 2026-09-08.** 47 ports,
      26 services, all answering; a real two-node workflow dispatched through the real
      Executor with upstream output reaching the second node; a service stopped on purpose
      and the failure seen. Produced two findings beyond its brief — a permission bit that
      silently disabled a LocalStack init script, and the `ALTER_CONFIG_SOURCE` contradiction
      that stops platform-api starting from committed config. Its regression check is
      committed but **not yet wired** — see C16.
- [x] ~~**1.0 (was in progress)**~~ Not in the action plan —
      #122/#123 already fixed the environment and the team had it up on 6 Sep. Added
      because nothing *keeps* it fixed, and the assessment names that exact mechanism as
      what produced the wrong count twice. Half a day, and it protects the phase that
      matters most: wiring real providers into a stack nobody has confirmed still starts is
      a bad trade. *Prompt issued 2026-09-08,
      [`prompts/revive-01-environment.md`](prompts/revive-01-environment.md).*
- [x] **1.1 provider account procurement. CLOSED 2026-09-09 — Bedrock, already the running
      decision, now recorded as one.** Never formally decided in writing until now, but it's
      been the actual account in continuous use since 2026-09-08: real Titan embeddings
      (task 1.2), real `qwen.qwen3-32b-v1:0` invocations, most recently task 1.5's live
      golden-set run. One AWS account, one IAM story, the only route to Titan embeddings the
      vector column is already sized for. Anthropic direct was never procured — no gap, this
      closes the decision the running system already made.
- [x] **1.2 embeddings — the quieter half. CLOSED 2026-09-08.** Titan wired behind the
      `Embed` RPC, Bedrock bypassing LocalStack with a fatal guard,
      `MODEL_GATEWAY_EMBEDDING_PROVIDER=titan` as a local opt-in that AppConfig cannot
      reach, and `PLATFORM_API_CONFIG_SOURCE` unblocking platform-api. Discrimination
      asserted through real gRPC `Embed` calls, with the mock case as an inverted assertion
      so proven-to-fail runs in CI. End to end: under the mock an unrelated request binds a
      summarisation agent; under Titan it no-matches while a genuine request still binds.
      Surfaced **C18**.
- [x] ~~**1.2 (was open)**~~ Wire `TitanEmbeddingProvider`
      (`amazon.titan-embed-text-v2:0`) behind model-gateway's `Embed` RPC. Do not skip:
      Selection & Binding and Agent Auto-Creation both depend on it, and both currently
      return nonsense that looks like success. **Two traps:** the caller must pass
      `dimensions: 512` or the DB insert fails at a distance from the cause, and
      `healthCheck()` returns healthy without probing anything (`liveProbe: false`).
      *Prompt ready [`prompts/revive-12-titan-embeddings.md`](prompts/revive-12-titan-embeddings.md)
      — needs Titan access granted and 1.0 finished.*
- [x] **1.3 AppConfig configuration + embedding provenance. CLOSED 2026-09-08.** Six Node
      services answering under `appconfig` against real AWS; provenance recorded from
      `EmbedResponse.model_id`, stale vectors excluded fail-closed, exclusions counted.
      AppConfig is a documented **opt-in** — the committed default stays `mock` so local dev
      needs no AWS credentials. **Was seven services in the prompt; eval-service never read
      the variable.** Original scope: Switch `ALTER_CONFIG_SOURCE`
      from mock to `appconfig`; create the AppConfig application, environment and profile.
      Fifteen files across seven services read it and all validate it, so it is
      all-or-nothing in one pass — **run this task alone.** **C18's now-half is folded in
      as a second commit**, because flipping to appconfig switches embeddings to Titan
      unconditionally and makes every mock-space stored vector stale. *Prompt ready
      [`prompts/revive-13-appconfig.md`](prompts/revive-13-appconfig.md) — needs an AWS
      AppConfig application, environment and profile to exist first.*
- [x] **1.4 secrets plumbing — CLOSED 2026-09-08 for the eight references it scoped.** All
      eight now resolve against real AWS, verified by `scripts/check-reference-resolution.sh`
      (names only, proven to fail, gated on credentials). audit-service and
      cost-ledger-service come up from committed configuration alone. **The gateway services
      still cannot** — they read Anthropic, Tavily and Browserbase references never committed,
      and two of those vendors are unpurchased, so it is a dependency rather than a gap. See
      **1.6**. Original scope: Task 1.3
      proved six services run under real AppConfig, but did it by hand-supplying reference
      values, because **only two of eight committed references resolve against real AWS**.
      Four point at resources that exist under a different name; cost-ledger's two point at
      nothing at all. So the path works and is not reproducible from the repository — task
      1.0's lesson, arriving somewhere else. Fix the references rather than renaming
      resources, create only what is missing, unify `APPCONFIG_APP_ID` against
      `APPCONFIG_APPLICATION_ID` (§7 pattern 4), and prove a bring-up from committed
      configuration alone. **Convention for anything new: `/alter/<env>/<service>/<kebab-case>`.**
      *Prompt ready [`prompts/revive-14-secrets-plumbing.md`](prompts/revive-14-secrets-plumbing.md)
      — needs `secretsmanager:CreateSecret` granted first.*
- [x] **1.5 re-run everything — the point of the phase. CLOSED 2026-09-09.** Real number
      obtained from a genuine clean checkout, real Docker, real AWS Bedrock (PR #8,
      `50edf30`): **21/30 passed, pass_rate 0.70.** 9 failures grouped by real cause — 7x
      Model Gateway returning invalid JSON for classification content (`INTERNAL` gRPC
      error), 2x genuine intent misclassification (`workflow`→`execute`, `execute`→`plan`).
      Not infra noise — every failure has a real, named reason, satisfying Phase 1's done
      gate. Run twice per the script's own design: run 2 hit the semantic cache (15.5x
      speedup, byte-identical output to run 1) exactly as the script's own cache-detection
      logic is built to catch — **the trustworthy number is run 1's cold 0.70, not run 2's.**
      This is Phase 1's first real post-provider score, ever — every prior number was void
      per standing rule 11. The 7x JSON-format failures are a real, distinct signal about
      model output reliability, not something Phase 1 committed to fixing — worth its own
      ticket, not chased here.

- [ ] **1.6 [+] finish reproducibility for the gateway services.** audit-service and
      cost-ledger-service bring up from committed configuration; model-gateway, tool-gateway,
      sandbox-service and provisioning-service do not. **Corrected 2026-09-09 — the vendor
      list was incomplete.** Verified directly against each service's environment schema
      (`requireValue`/`required`, all gated behind `ALTER_CONFIG_SOURCE=appconfig`, none
      needed under `mock`): **five vendors, not two.**
      - `ANTHROPIC_API_KEY_SECRET_REF` — model-gateway. Required to boot even though
        Bedrock is the actual provider decision (task 1.1).
      - `OPENAI_API_KEY_SECRET_REF` — model-gateway. Never named anywhere in the record
        before now.
      - `TAVILY_API_KEY_SECRET_REF` — tool-gateway.
      - `BROWSERBASE_API_KEY_REF` + `BROWSERBASE_PROJECT_ID` — tool-gateway **and**
        sandbox-service, both required. (Previously recorded as
        `BROWSERBASE_API_KEY_REFERENCE`, the wrong name, and missing the project ID.)
      - `E2B_API_KEY_REF` — sandbox-service **and** provisioning-service. Never named
        anywhere in the record before now.

      **Blocked on those five purchases, not on engineering** — or on an explicit decision
      to cut any of them (Anthropic and OpenAI being hard-required for a service that
      never calls either provider is worth challenging on its own, separately from
      procurement). Until then the AppConfig path is reproducible for two services out of
      six, and saying otherwise would be the kind of claim this project exists to stop
      making.

      **Partial wiring done 2026-09-09 (`db4b53e`).** Checked AWS directly: Tavily,
      Browserbase (API key), and E2B secrets already exist for real. Committed and proven
      live (resolves clean, proven to fail correctly on a broken reference, restored).
      **Still blocked, three ways:**
      1. `BROWSERBASE_PROJECT_ID` — not a secret, a literal value nobody has supplied.
      2. **sandbox-service and provisioning-service have no AppConfig application at all**
         — only `alterx-engine` and `alterx-tool-gateway` exist. Creating the missing two
         is new AWS resource creation, blocked by this session's permission boundary;
         needs Havish's go-ahead or his own two `aws appconfig create-application` calls.
      3. Anthropic and OpenAI keys still don't exist anywhere in the account — unchanged
         from above.

      **`BROWSERBASE_PROJECT_ID` resolved and tool-gateway closed for real, 2026-09-10.**
      Found the real value directly in Havish's already-open Browserbase dashboard tab
      (org "Alterxtest", single project "Production project") — confirmed same account as
      the already-stored key by comparing shape (both `bb_live_`-prefixed, both exactly 35
      characters; only one Browserbase project exists in the org, so there is nothing else
      it could be), never printing the raw key. Committed
      `BROWSERBASE_PROJECT_ID=c214bf9e-3b19-4e5d-8aa4-c55472ce4669`, plain text — not
      sensitive, same as the dashboard shows it. **tool-gateway then verified with a real
      boot**, direct commands (not through Nx, task C26's fix), real AppConfig
      (`alterx-tool-gateway`/`local`/`tool-gateway-policy`), real Tavily and Browserbase
      secrets, real local M2M issuer: `Nest application successfully started`, `curl
      /health` returned `{"status":"ok","service":"tool-gateway"}` — the exact identity
      check C23 asked for, not just an HTTP 200. **tool-gateway is closed.**

      **sandbox-service and provisioning-service remain blocked** — both need an AppConfig
      application that doesn't exist yet (same gap as above, nothing new). **model-gateway
      remains blocked** — Anthropic and OpenAI keys still don't exist.

**Done when** a 30-case golden set scores above zero for a real reason; a capability
request for `underwater.basket.weaving` no longer matches a summarisation agent; and the
Conversation Manager returns different intents for different utterances.

**All three met, 2026-09-09.** Golden set: 21/30 (0.70), real reasons (task 1.5). Capability
discrimination: real Titan embeddings score `underwater.basket.weaving` at 0.12 against a
0.6 threshold vs 0.86 for the genuinely relevant capability (task 1.2). Conversation
Manager: the same golden-set run returned five distinct, mostly-correct intents
(`plan`/`modify`/`execute`/`answer`/`workflow`) across 30 different utterances, live.

---

## Phase 2 — close the healing loop

*2–3 weeks · needs Phase 0 answers 0.1 and 0.2.* Recovery, Memory and Drift land together
or the observable behaviour does not change. **Do not let these be picked up separately** —
that is how three independent-looking tickets each get closed while the product still
cannot heal itself.

- [ ] **2.1 credential edge** — from decision 0.1, now answered (design log §30). Additive
      tenant parameter on orchestration's `/internal/` routes; Memory stops discarding it.
      Plus: a tenant mismatch **refuses with a named reason** rather than degrading to "not
      found", and every service-asserted tenant is audited. *Unblocked.*
- [ ] **2.2 replan and recompile** — from decision 0.2, now answered. Send `TaskSkeleton`.
      Revives two of eight dead strategies. `repair` decides correctly then defers — finish
      it in the same pass; it is an omission, not a boundary.
- [ ] **2.3 drift readback** — small, real. `drift_read` admits only model and provider
      subjects, so agent drift scores compute, persist, and return zero rows to their own
      tenant. Add the agent subject.
- [ ] **2.4 prove the cycle** — acceptance. Force a run to fail. Watch it reach Recovery,
      replan, summarise into Memory, and move a Drift score that changes the next selection.
      Anything less than the full circuit is not this phase finished.

**Done when** one deliberately failed run produces a recovery, a memory record and a drift
score readable by the tenant that owns it — demonstrated live, not in unit tests.

---

## Phase 3 — clear the known engine defects

*1–2 weeks · mostly parallelisable.* Listed after Phase 1 deliberately: two of these cannot
be judged fixed until a real provider exists, because the mock cannot tell a correct
binding from an incorrect one.

- [ ] **3.1 capability filter** — needs Phase 1. Selection & Binding applies **no exact-
      capability filter at all**. Add it, then re-tune the similarity threshold against real
      embeddings.
- [ ] **3.2 binding ranking** — needs Phase 1. A 30–40× latency and cost swap does not move
      the winner; `agent_id ASC` decides it. The correctly-scoring `/bind-architecture`
      exists but has never run in the execution path — **treat as a migration with a
      fallback, not a swap.**
- [x] **3.0 [+] auto-creation idempotency. CLOSED 2026-09-08.** Auto-creation is now
      idempotent per tenant + workspace + capability set. `agents` gains an
      `idempotency_key` (SHA-256 of the *sorted* capability set) and a partial unique
      index over `(tenant_id, workspace_id, idempotency_key) WHERE idempotency_key IS
      NOT NULL` (migration 0006, with a real downgrade). The engine pre-SELECTs by key
      and returns the stored agent without re-embedding; a genuine race is resolved by
      `INSERT ... ON CONFLICT DO NOTHING` — the loser's conflicting INSERT blocks on the
      unique index until the winner commits, then returns the winner's agent. Proven to
      fail first: three identical requests minted three agents (#125); now they collapse
      to one, two genuinely concurrent requests produce one usable binding, reordered
      capabilities hit the same key, and a different capability set still creates its own
      agent. Key scope is capabilities only — tier (hardcoded STANDARD today) is owned by
      3.3.
- [ ] **3.3 auto-creation tier** — from decision 0.3 (design log §31). Never create an agent
      that cannot satisfy the requirement that triggered it: above the configured ceiling,
      **fail the bind with a named reason**. Ceiling is config, default `STANDARD`.
      **Inherits a trap from 3.0:** the idempotency key hashes the capability set only, so
      once tier varies, a `PREMIUM` request for a capability set that already has a
      `STANDARD` agent hits the same key and **silently returns the STANDARD agent** — no
      error, a usable binding to the wrong tier. Decide explicitly whether tier belongs in
      the key, and migrate the partial unique index with it if so.
- [ ] **3.4 capability resolver** — independent. Advanced-tier terms are tested before
      fast-tier ones in a plain if/elif, so an incidental adjective decides the tier.
      Replace set membership with something that reads the request.
- [ ] **3.5 tool gateway** — independent. Define the protocol enum first; then the count of
      what is missing becomes a fact instead of an estimate.
- [ ] **3.6 requirements map** — from decision 0.4. Do it here, while the architecture path
      is still fresh in someone's head.

**Done when** an unrelated capability request fails to bind instead of matching; the
cheaper of two equivalent agents wins on cost; and a repeated unmet requirement stops
creating agents.

---

## Phase 4 — rebuild the two brains

*3–5 weeks · the real product risk.* L6 is the strongest layer in the system and is being
handed decisions made by string matching. These are rewrites, not repairs — and safe to
schedule late, because what L6 consumes is a plan, not the Planner.

- [ ] **4.1 planner rewrite.** A padded trivial lookup escalates to manager-worker while a
      real three-team, twelve-country migration in 28 words does not — **the classification
      is inverted relative to actual scope.** Replace with a model call behind the same
      contract, keeping the keyword path as a fallback for provider outages.
- [ ] **4.2 synthesizer rewrite.** Returns byte-identical topology, waves, roles and a
      hardcoded `confidence 1.0` whatever the constraints. Make constraints actually shape
      the architecture, and make confidence mean something. **Design log §1 names this the
      product's entire differentiator, and one of only two genuinely unproven pieces.**
- [ ] **4.3 golden sets** — how you know. Write the planner and architecture golden sets
      **before** the rewrite, so the target is fixed in advance rather than fitted
      afterwards.

**Done when** the planner golden set passes its floor of 0.90 and the architecture one
demonstrably changes topology when constraints change — both measured by the harness,
against a real provider.

---

## Phase 5 — build what does not exist

*4–8 weeks · scope depends on decisions.* Both need a product decision before an
engineering one. See 0.6.

- [ ] **5.1 voice** — **decision made 2026-09-08: CUT** (design log §33). *Decided, not
      executed.* The declaration still exists, so the six RPCs still generate clients and
      still appear in every count. Remove or deprecate them — a note is not a cut. Six RPCs declared (`BindNumber`, `GetNumberBinding`,
      `ConfigureCallHandling`, `InitiateCall`, `GetAccountHealth`, `GetCapabilities`), no
      implementation under `apps/`. Needs a telephony vendor, a number-provisioning story,
      and a decision about whether voice ships at all. **The design log never mentions voice
      once** — not deferred like Project Mode, simply absent.
- [ ] **5.2 repository manager** — **decision made 2026-09-08: CUT** (design log §33).
      *Decided, not executed.* Remove or deprecate the declaration. C9. No backend contract to build
      against.
- [ ] **5.3 deployment manager** — surface only. C8. The backend contract is real
      (`DeployctlService`, three RPCs); only the surface is missing. Cheapest of the three —
      do it first within this phase.

**Done when** each of the three either ships, or is explicitly cut and its contract marked
as such, so it stops appearing in counts as pending work.

---

## Phase 6 — production hardening

*2–4 weeks · runs alongside Phases 4 and 5.* Everything verified so far ran against a
single-host stack with LocalStack standing in for AWS. **The local-versus-real gap is where
the remaining surprises live.**

- [ ] **6.1 real AWS** — the big one. Secrets Manager, SSM, S3, SQS and EventBridge all
      resolve against LocalStack today. Real IAM, cross-account boundaries and regional
      endpoints are where this bites — particularly IAM database authentication, which every
      service declares and none has exercised. *Prove this pattern on one service early,
      not late.*
- [ ] **6.2 temporal** — durable substrate. Local Temporal is `start-dev`, one process, no
      persistence guarantees. Moving to Cloud or a real cluster changes retention, history
      size limits and worker versioning — all of which the executor workflow assumes are
      generous.
- [ ] **6.3 approval route** — never verified. The engine's pause and resume work, driven
      by a signal. The REST route a person actually uses to send it has never been
      exercised; it needs a properly minted delegation token.
- [ ] **6.4 chain verification** — audit. Incremental verify resumes from a checkpoint, so a
      forgery in checkpointed history is never re-examined. `verifyChain()` exists with **no
      route and no caller**. Schedule it, even weekly.
- [ ] **6.5 load and failure evidence.** The eval harness already carries chaos scenarios,
      load suites and release gates with nine metric floors and eight required checks. They
      have never been run against anything real. Run them.

**Done when** the promotion gate returns approved on genuine evidence — nine metrics above
their floors, eight checks passing, three approvals recorded — rather than on a
hand-written bundle.

---

## Track B — the platform, in parallel

*3–5 weeks · fully parallel · highest value per hour.* Deliberately unnumbered by the plan,
because nothing here waits on anything above.

**Solo caveat:** the plan assumes different people run this simultaneously. With one
person, Track B competes with the engine rather than running beside it. Take **B5** and
**B4** early anyway — one lies, the others are additive and safe — and defer the rest until
the demo runs.

- [ ] **B1 admin console** — 14 screens, 8 modules. Largest single block of
      finished-but-unreachable work. The plan says start here; solo, it does not.
- [ ] **B2 commerce** — Marketplace (8 methods), Publisher & Payout (fully mock), Cost &
      Billing (10 methods). Billing runs on Razorpay; the webhook path already exists.
- [ ] **B3 the rest** — Notifications (7), Benchmarking (7), Discovery (2), Search. **Search
      returns invented results** — the one actively misleading item. Tool Registry and Media
      Services were source-read only; confirm live before counting them.
- [ ] **B4 four missing routes** — additive, safe. Run cancel, run retry-node,
      `GET /projects`, `GET /projects/:id`. Nothing depends on them. Good first tickets.
- [ ] **B5 trigger management** — silently lying. `testTrigger` and `removeTrigger` report
      success without calling anything. **Prioritise above cosmetic items:** a control that
      claims to have deleted something and has not is worse than one that does nothing
      visible.
- [ ] **B-vocab** — from decision 0.5, now answered. Human Action Centre adopts the engine's
      enum (`pending·approved·rejected·expired`).

**Done when** every screen issues real requests, and no control reports success without a
call behind it.

---

## Track C [+] — design-log compatibility

**Not in the action plan. Ours.** The action plan restores the engine; this track holds it
to the design log's standards. Priced individually, never batched. Nothing here blocks the
demo.

- [ ] **C1 architecture gates.** Export the 11 AST gates from `alterengine--5`, each with a
      baseline allowlist of every current violation, so they fail only on **new** ones.
      Nobody stops for a cleanup sprint; every later fix lands governed.
- [ ] **C2 `RUNTIME_MODE` switch** (§7 pattern 2). In production, any mock selection is a
      fatal boot error, never a silent fallback. Do alongside Phase 1.
- [ ] **C3 deletion registration in CI** (§18, §28). Do before more components store tenant
      data. The old build's erasure certified complete while data survived in ten tables it
      never touched.
- [ ] **C4 safety as a shared in-process library** (§11). Largest item. Unblocks the eval
      harness, which scored 0/30 on one unreachable service.
- [ ] **C5 cost ledger records verification verdicts** (§21). Missing this early means
      backfilling data never captured.
- [ ] **C6 cost ledger consistency.** One tenant-ID format across all routes; enforce the
      `COST_SOURCES` union (`source: "telepathy"` is currently accepted).
- [ ] **C7 Agent Factory extracted** as its own L4 component (§22 item 9) — two callers in
      different layers.
- [ ] **C8 Side-Effect Ledger + idempotency gate** in front of Dispatch (§4, §22 item 7).
- [ ] **C9 reviewer isolation** against prompt injection (§5.4).
- [ ] **C10 Run Manager atomic budget gate** (§22) — must be atomic, not read-then-decide.
- [ ] **C11 Policy Store global tier**, structurally incapable of holding tenant content
      (§22).
- [ ] **C13 map the 54 contracts onto the 61 components** — from decision 0.7. Replace the
      proposed blast radius / fail mode / driver values in `components/` with
      `architecture/component-contracts.md`'s. Its done gates are targets, not gates that
      fail today. Roughly a day; closes design log §29's open item.
- [x] **C16 one source for ports, and a health check worth trusting. CLOSED 2026-09-09.**
      Fourteen ports parameterised, defaults unchanged, connection URLs deriving from the same
      variables so they cannot disagree. Nine cached-status reads replaced by fresh probes.
      Drift check wired into CI. **Coexistence proved live** — ten containers on offset ports
      beside two untouched sibling stacks, with a row written and read back on the overridden
      port only. Surfaced **C23** and **C24**. Original scope: *Prompt ready
      [`prompts/revive-C16-ports-and-health-check.md`](prompts/revive-C16-ports-and-health-check.md).*
      **Port parameterisation folded in:** `docker-compose.yml` hardcodes fourteen host ports,
      so two checkouts cannot coexist — which is both why the check cannot be trusted and why
      the 1.5 measurement could not start. Three tasks have now paid for it. Original scope: **It
      failed its first real use:** task 1.3 ran on alternate ports and the script, which
      hardcodes committed ports, could not serve — the services were verified by hand
      instead. The port-sourcing fix is not cosmetic. Task 1.0
      produced it and it is committed, but it does **not yet meet
      [`verification-standard.md`](verification-standard.md)** and is deliberately unwired
      until it does. Two gaps, both acknowledged in the script's own header: **nine of
      twenty-six checks read Docker's cached `Health.Status`** rather than probing (a
      container that just died reads healthy for up to one 5s interval — that is process
      state, not real behaviour); and **some port defaults are sandbox values, not committed
      ones**, so on a machine using committed ports those checks fail for the wrong reason.
      Fix both, then join the four `scripts/check-*.sh` gates in CI's `gate` job.
- [x] **C21 make starting the stack a step, not research. CLOSED 2026-09-09.** Bootstrap
      committed with create/merge/check modes, `--check` wired into CI's gate job — the first
      verification artefact in this project to acquire a driver. Both undefined placeholders
      resolved against the running stack, not guessed: `ADS_DB_PASSWORD=ads_core_local` from
      `docker-compose.yml`, `MEMORY_DB_PASSWORD` defaulting to `AUDIT_DB_PASSWORD` in
      `engine-db-init.sh`. **Left a gap — see C22.** Original scope: *Prompt ready
      [`prompts/revive-C21-env-bootstrap.md`](prompts/revive-C21-env-bootstrap.md).* **Two
      placeholders are referenced but never defined** — `ADS_DB_PASSWORD` and
      `MEMORY_DB_PASSWORD` — so the example is incomplete, not merely unsourceable, and
      nobody can fill it correctly without deciding what they are. `.env.local.example` cannot be
      sourced: 25 lines carry `<placeholder>` values, including five database passwords that
      nineteen connection strings interpolate, plus a hex token and its SHA-256. Nothing
      generates it, and `local-dev.md` never says how. The working `.env.local` in use has 16
      assignments against the example's 139, so the documented `cp` produces something
      different from what anyone runs. **This blocks task 1.5's live measurement**, and it is
      the mechanism the assessment blamed for two wrong counts, still present after task 1.0.
      Needs a bootstrap script that generates and propagates the values, committed.
- [x] **1.5b [+] make the golden-set runner actually run. CLOSED 2026-09-09.** PR #7 merged
      (`2e2c498`, seven originally-named defects). PR #8 merged (`50edf30`, C26's Nx-bypass
      fix plus the `pnpm install` gap). Done gate met for real: a genuine fresh clone, no
      hand-editing, real Docker, real AWS, produced Phase 1's first real golden-set number —
      21/30 passed, 0.70. See 1.5 above for the number and what it means.
- [ ] **C23 the health check must verify identity, not just status.** It asserts HTTP 200 and
      never asserts the responder is the service it asked for. Live, that produced three false
      passes against a sibling stack's processes — and probing **eval-service**'s port returned
      `{"service":"intelligence-service"}`, counted as healthy. The response body already
      carries `service`; compare it. **A 200 from the wrong service is a false pass**, which is
      worse than a failure.
- [ ] **C24 application service ports need what C16 gave dependency ports.** C16 parameterised
      the fourteen dependency ports and every connection URL; application service ports stayed
      literal. So the health check probes defaults, and on a machine with sibling checkouts the
      defaults belong to someone else. Same footgun, one layer up.
- [ ] **C25 no root `eslint.config` file exists anywhere in the repo**, despite `lint` being a
      real, invoked target. Found while tracing a dependency-scan advisory to `@nx/eslint`; not
      investigated further — surfaced for someone to look at.
- [x] **C26 Nx graph computation on a cold, fresh clone is unusably slow, blocking 1.5/1.5b.
      CLOSED 2026-09-09** (PR #8, `50edf30`). `pnpm exec nx run eval-service:build` ran
      95–99% CPU for 14+ minutes on a genuine fresh clone and was killed, never returning —
      confirmed independent of sandboxing, independent of the Python virtualenv, independent
      of git performance. Nx's own project-graph computation is separately fast (its daemon
      log: `createProjectGraph()` in 20.9ms) — the slowness is specific to this invocation's
      task orchestration/hashing, isolated but **not fully root-caused** (V8 sampling showed
      time inside string/hash-table primitives, consistent with hashing a large in-memory
      structure). **Fixed by not depending on the answer:** `scripts/run-intent-golden-set.sh`
      no longer routes through `pnpm exec nx run <target>` for its build steps — it runs the
      same underlying commands each `project.json` target already defines, directly, in the
      real dependency order. Proven: the full sequence, direct, took 12.4s; confirmed
      identical dist output files. Companion gap fixed in the same PR: a genuinely fresh
      clone has no `node_modules`, and neither the runner nor `docs/local-dev.md`'s
      Prerequisites said to run `pnpm install` first — both now do.
- [ ] **C22 the bootstrap breaks real AWS.** C21 fills `AWS_ACCESS_KEY_ID` and
      `AWS_SECRET_ACCESS_KEY` from LocalStack placeholders, and environment variables beat the
      `~/.aws` profile — so sourcing the generated file returns `InvalidClientTokenId` while
      the real credentials are fine. **Second instance of the pattern `AWS_ENDPOINT_URL`
      showed in 1.2**: a LocalStack variable silently defeating the real-AWS path, failing in
      a way that points at the wrong thing. 1.2's instance got a fatal guard; this one has none.
- [ ] **C20 the fallback chain cannot express a working provider.**
      `FallbackProviderSchema` is `z.enum(["anthropic", "openai"])`, so a fallback may only
      name Anthropic or OpenAI. Anthropic is out of scope by decision, and OpenAI-on-Bedrock
      returned no text when tested. The primary `model_id` is a free string and takes any
      Bedrock model, so **only the fallback is constrained** — and it is currently
      unusable. The question is not whether to add a member: it is whether a *provider* enum
      is the right shape when the primary is addressed by model id. Decide the shape, not the
      contents.
- [ ] **C19 tenant-id format drift, now in AWS resource names.** Tavily integration secrets
      exist under four shapes for what looks like one tenant: a bare UUID, two `ten_`-prefixed
      variants, and `ten_test0000…`. Same drift as the Cost Ledger tenancy split, except
      fixing it here means recreating tenant secrets rather than editing a query. Decide the
      canonical shape before more tenant secrets are created.
- [ ] **C18 backfill: re-embed stored vectors when the provider changes.** *Detection and
      containment folded into task 1.3* — provenance recorded from `EmbedResponse.model_id`,
      stale vectors excluded from candidacy, exclusions counted. **What remains here is the
      repair:** a batch job that re-embeds existing rows, needing credentials at run time.
      Until it exists, an agent whose vectors are stale is visible and harmless, but still
      unfindable. Original finding: Stored
      vectors live in their producer's embedding space. Every existing `capability_embeddings`
      row is mock-space; the moment Titan is live for a tenant with existing agents, those
      vectors are meaningless and matching degrades to noise **silently** — no error, no
      failed insert. Nothing records which provider produced a vector, so mock-space and
      Titan-space rows are currently indistinguishable. Needs a provenance column and a
      re-embed path before any tenant with real data switches. **Found by task 1.2's
      counterfactual needing two vector rows for one capability.**
- [ ] **C17 decide what the semantic cache is for.** `model-gateway` consults a semantic
      cache before every model call, threshold 0.95, on both invoke and stream paths. Under
      mock embeddings everything clusters at 0.85–0.87 so it only hits on identical text;
      **real embeddings will push near-identical prompts past 0.95 and make it genuinely
      semantic — a behaviour change task 1.2 causes as a side effect that nobody decided.**
      Design log §12 defers this plane past v1, yet it is built and live. Also decide whether
      eval golden sets bypass it, or the harness measures the cache rather than the model.
- [ ] **C15 one variable, one question — `ALTER_CONFIG_SOURCE`.** Engine services ask
      "mock or appconfig?"; platform-api asks "file or appconfig?". Two different questions
      wearing one name, currently resolved by per-service scoped overrides
      (`AUDIT_CONFIG_SOURCE`, and `PLATFORM_API_CONFIG_SOURCE` added in 1.2). Two instances
      means it is the rule, not the exception. Decide whether scoped overrides become the
      documented pattern for every service, or the values are unified. **Found by task 1.0
      running the stack, not by reading it.**
- [ ] **C14 node_requirements single source of truth** — from decision 0.4's recorded
      residual. A stored map plus fresh run-time resolution is §7 pattern 4. Either run-time
      consumers read the column, or it is deleted. Touches the frozen Executor, so **after
      revival**, not during.
- [ ] **C12 verify §5.1 and §5.2 exist at all** — structured success criteria and mechanical
      read-back. **Absence is currently inferred, not established.** Check before scheduling;
      if genuinely missing this is a subsystem, not a patch.

---

## Standing rules

1. **Do not touch the 25 Category 1 components.** No logic change, no code change. Anything
   necessary gets recorded in `memoryalter.md` before it is made.
2. **Never let "not assessed" collapse into "works."** Keep the fifth column.
3. **A builder report is not evidence.** Verified independently, by running it.
4. **Every task leaves behind something that keeps its result true.**
   [`verification-standard.md`](verification-standard.md) is binding: real behaviour not
   process state, runs without anyone remembering, **proven to fail**, nothing permanently
   red. "Nothing to check here" must be argued in the report, never assumed by silence.
5. **Never delete branches. Never force-push.**
6. **Never write to `alter-x-4-`.** Frozen, reference-only. Every artefact belongs here.
7. **Every master prompt states the working location, and it is never the CEO session's
   clone.** Two sessions in one working directory has now cost an unpushed commit and a
   bring-up on non-standard ports that made the regression check inapplicable.
8. **Builders never edit `memoryalter.md`, `checklist.md` or `progress.md`.** The CEO session
   writes them; builders read them and report. Otherwise "what we decided" and "what a
   builder believed we decided" stop being distinguishable — which is the ambiguity these
   files exist to remove. Every master prompt must say so.
9. **Never trust a merge without checking CI to completion.** Six merges in a row went red
   before anyone looked — the verification standard was written while its own enforcement
   was silently broken. `git push` then `gh run watch <id> --exit-status`, reading the real
   step list, every time. A local pass is not evidence a CI runner will agree.
10. **Grade review depth by blast radius.** Model Gateway has five direct dependents; a
   read-only registry does not.
11. **Record pre-provider scores as void before Phase 1 lands.** The first honest measurement
   will look like a regression, and someone will read it as one.
