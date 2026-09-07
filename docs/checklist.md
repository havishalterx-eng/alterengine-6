# checklist.md — Project Revive

Terse list of work. Reasoning for every block lives in
[`memoryalter.md` §3](memoryalter.md#3-checklist-context).

**Finish line.** One real business problem in; topology designed; run executed; outcome
verified against real external systems; one node deliberately broken, then detected,
replanned, recovered, remembered, and its drift score readable by the owning tenant —
watched on a screen, not described in a report.

Status: `[ ]` not started · `[~]` in progress · `[x]` done · `[!]` blocked

---

## Phase 0 — decisions only Havish can make

- [ ] **0.1** Memory ↔ orchestration credential cycle: does the orchestration endpoint
      accept an explicit tenant alongside a service credential? — *blocks the whole
      healing loop*
- [ ] **0.2** Voice — in scope or cut?
- [ ] **0.3** Repository Manager — in scope or cut?
- [ ] **0.4** Auto-creation tier (#125): requested tier / ceiling / requested tier bounded
      by spend caps
- [ ] **0.5** `node_requirements` ownership (#117)
- [ ] **0.6** Are the four architecture docs binding standards, or superseded by the
      design log?
- [x] **0.7** ~~Recovery contract: `CompiledDag` or `TaskSkeleton`?~~ — **closed by design
      log §24. `TaskSkeleton` is canonical.** Implementation is task 6.1.
- [x] **0.8** ~~Approval vocabulary: which side moves?~~ — **closed by design log §22
      item 8. The engine's enum is canonical; the platform moves.** Implementation is
      task 5.2.

## Phase 1 — infrastructure (parallel, blocked on nothing)

- [~] **1.1** Local environment as a maintained deliverable: one command, stack up, every
      component reachable. Regression test so it stays fixed. — *prompt issued 2026-09-08,
      [`prompts/revive-01-environment.md`](prompts/revive-01-environment.md)*
- [ ] **1.2** Export the 11 AST architecture gates from `alterengine--5`, each with a
      baseline allowlist of every current violation. Fails only on **new** violations.
- [ ] **1.3** Export `loadConfig()`, contracts, METHOD.md, RULES.md.
- [x] **1.4** ~~Triage every open PR before opening new work.~~ — **done 2026-09-08.
      Zero open PRs in `alter-x-4-`. All 14 assessment fixes (#113–#126) merged; main
      current as of 2026-09-06. Two open issues, both decisions not code: #117 and #125.**

## Phase 2 — real provider

- [ ] **2.1** Record every current score as explicitly void, **before** wiring. The first
      honest measurement will look like a regression.
- [ ] **2.2** Purchase and wire a real model and embedding provider.
- [ ] **2.3** `RUNTIME_MODE` switch: in production, any mock selection is a fatal boot
      error, never a silent fallback.

## Phase 3 — re-assess

- [ ] **3.1** Assess the ten not-assessable components against a running stack with a real
      provider. Produce a real count before planning further.
- [ ] **3.2** Verify whether §5.1 structured success criteria and §5.2 mechanical
      read-back exist at all. Absence is currently inferred, not established.

## Phase 4 — the healing loop (one unit, one owner)

- [ ] **4.1** Recovery: send `TaskSkeleton` (§24). Revives two dead strategies.
- [ ] **4.2** Recovery: `repair` decides correctly then defers — close the omission.
- [ ] **4.3** Memory: close the credential cycle per decision 0.1.
- [ ] **4.4** Drift: `drift_read` policy admits the agent subject.
- [ ] **4.5** Drift: outbound suggestion path to the user (§17).
- [ ] **4.6** **Done gate:** one deliberately failed run produces a recovery, a memory
      record, and a drift score readable by its own tenant — demonstrated live.

## Phase 5 — platform track (parallel from day one, different people)

- [ ] **5.1** C26 Search — stop returning invented results. *Take first.*
- [ ] **5.2** C13 Trigger Management — `testTrigger` and `removeTrigger` stop reporting
      success without calling anything.
- [ ] **5.3** C6 Human Action Centre — platform adopts the engine's enum.
- [ ] **5.4** C5 Run Experience — add `actions/cancel`, `actions/retry-node`.
- [ ] **5.5** C7 Project Studio — add `GET /projects`, `GET /projects/:id`.
- [ ] **5.6** C23 Admin Console — fourteen screens, eight backend modules.
- [ ] **5.7** C14 Marketplace — eight methods.
- [ ] **5.8** C15 Publisher & Payout.
- [ ] **5.9** C18 Cost & Billing — ten methods.
- [ ] **5.10** C17 Notifications — seven methods.
- [ ] **5.11** C19 Discovery — two methods.
- [ ] **5.12** C22 Benchmarking — seven methods.
- [ ] **5.13** C16 Tool Registry.
- [ ] **5.14** C20 Media Services.

## Phase 6 — component fixes

- [ ] **6.1** Selection & Binding: add an exact-capability filter. Nothing checks it today.
- [ ] **6.2** Capability Resolver: replace if/elif tier inference.
- [ ] **6.3** Agent Auto-Creation: idempotency, and tier per decision 0.4.
- [ ] **6.4** Cost Ledger: one tenant-ID format across all routes.
- [ ] **6.5** Cost Ledger: enforce the `COST_SOURCES` union.
- [ ] **6.6** Cost Ledger: record verification verdicts (§21). Missing this early means
      backfilling data never captured.
- [ ] **6.7** Audit Ledger: give `verifyChain()` a route and a caller (§7 pattern 3).
- [ ] **6.8** Tool Gateway: a real protocol enum.
- [ ] **6.9** `node_requirements` per decision 0.5 (#117).
- [ ] **6.10** HumanApproval: verify the human-facing REST route with a real delegation
      token.
- [ ] **6.11** Run Manager: atomic pre-flight budget gate (§22).
- [ ] **6.12** Policy Store: global tier, structurally incapable of holding tenant content.

## Phase 7 — the two rewrites

- [ ] **7.1** Planner: real reasoning, not word counting (§1, §3, §24).
- [ ] **7.2** Architecture Synthesizer: topology that actually varies with constraints,
      and a confidence that means something (§1, §24).

## Phase 8 — design-log compatibility (price each separately, never batch)

- [ ] **8.1** Safety as a shared in-process library (§11). Largest item; unblocks the eval
      harness.
- [ ] **8.2** Deletion registration enforced in CI (§18, §28). Do before more components
      store tenant data.
- [ ] **8.3** Agent Factory extracted as its own L4 component (§22 item 9).
- [ ] **8.4** Side-Effect Ledger and the idempotency gate in front of Dispatch (§4,
      §22 item 7).
- [ ] **8.5** Reviewer isolation against prompt injection (§5.4).
- [ ] **8.6** Capability Registry holds reusable workflow templates (§19).
- [ ] **8.7** Estimator: round the total once, at the end (§9).

---

## Standing rules

1. **Do not touch the 25 Category 1 components.** No logic change, no code change.
   Anything necessary gets recorded in `memoryalter.md` before it is made.
2. **Never let "not assessed" collapse into "works."** Keep the fifth column.
3. **A builder report is not evidence.** The Adversary verifies independently, running it.
4. **Never delete branches. Never force-push.**
5. **Grade review depth by blast radius**, not uniformly. Model Gateway has five direct
   dependents; a read-only registry does not.
