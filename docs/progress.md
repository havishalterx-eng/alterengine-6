# progress.md — Project Revive

Terse log of what actually got done. One line per completed item, newest last. Reasoning
and evidence live in [`memoryalter.md` §4](memoryalter.md#4-progress-context).

**A line only appears here when something was demonstrated, not when it was reported.**
A builder saying a thing works is not a reason to write a line. The Adversary running it,
or a live demonstration, is.

Format: `YYYY-MM-DD · task · what was demonstrated · who verified`

---

## 2026-09-08

- `2026-09-08 · setup · repo alterengine-6 created; memoryalter.md, checklist.md, progress.md written · CEO session`
- `2026-09-08 · phase 0 · all five decisions answered, design log §30–§33 appended, no code changed · CEO session`
- `2026-09-08 · 1.1 · Bedrock Titan v2 reachable in ap-south-1 as user/alterengine.dev; live 512-dim embedding returned · verified by real invoke-model call`
- `2026-09-08 · 1.0 · full stack up from committed config: 26 services, 47 ports, all answering · verified by real HTTP+gRPC responses, not container state`
- `2026-09-08 · 1.0 · two-node workflow dispatched through the real Executor; upstream output reached the second node · verified live`
- `2026-09-08 · 1.0 · regression check written and proven to fail by stopping redis · committed, NOT yet wired into CI (C16)`
- `2026-09-09 · C21 · env bootstrap committed, --check wired into CI gate · verified, first artefact in the project to acquire a driver`
- `2026-09-09 · C16 · ten containers up on offset ports beside two untouched sibling stacks; row written to this stack's engine-db on 15433 and read back from 15433 only · verified live`
- `2026-09-09 · ci · fixed architecture boundary violation (task 1.2's spec importing @grpc/grpc-js directly) that had failed every gate job for six merges · verified on the real CI runner, not just locally`
- `2026-09-09 · ci · fixed dependency scan: removed unused @nx/next (2 critical Next.js RCEs + sharp + svgo advisories), bumped vitest 4.1.10→4.1.11 (2 moderate advisories), regenerated a stale baseline · verified, full CI run green including test platform api and both its integration suites`
- `2026-09-08 · 1.4 · all eight committed AWS references resolve; audit-service and cost-ledger-service brought up from committed config alone · verified, check proven to fail`
- `2026-09-08 · 1.3 · six Node services answering under ALTER_CONFIG_SOURCE=appconfig against real AWS · verified by direct health responses on ports 3133-3138`
- `2026-09-08 · 1.3 · embedding provenance recorded and stale vectors excluded fail-closed · verified, proven to fail without the filter`
- `2026-09-08 · 3.0 · auto-creation idempotent: two concurrent callers on independent sessions produce one agent, both bound · verified against real Postgres, proven to fail pre-fix with three distinct agents`
- `2026-09-08 · 1.2 · Titan wired behind the Embed RPC; discrimination asserted through real gRPC calls · verified, mock case fails as a standing check in CI`
- `2026-09-08 · 1.2 · end-to-end counterfactual: mock binds an unrelated request to a summarisation agent, Titan no-matches it while still binding a genuine one · verified live, same tenant, one eligible agent`
- `2026-09-08 · 1.1 · real embeddings discriminate: relevant 0.8600 vs nonsense 0.1214/0.0757 against threshold 0.6; no re-tuning needed · verified live, four real calls`
- `2026-09-08 · 3.0 · auto-creation idempotent per tenant+workspace+capability set: three identical requests now mint one agent (was three, #125); two genuinely concurrent requests produce one usable binding; reordered capabilities hit the same key; a different capability set still creates its own agent · verified against real Postgres, proven to fail first`
- `2026-09-09 · 1.5b · seven named defects addressed per commit history; empty-golden-set guard spot-checked directly against source, exits 3 with exact message; PR #7 pushed and watched to completion · CI red on eval-service:typecheck (6 real mypy errors), not the hang the builder report named as blocking — NOT merged, NOT closing 1.5b`
- `2026-09-09 · 1.5b · six mypy type annotations fixed (f4bc44c), full-file mypy and ruff independently rerun clean, PR #7 pushed and watched to completion · CI green confirmed directly against the API, PR #7 squash-merged, branch kept`
- `2026-09-09 · 1.5b/1.5 · attempted the actual done gate (real number from a clean checkout) for the first time ever, by anyone · found a genuine clean clone has no node_modules and nothing says to run pnpm install; after installing, pnpm exec nx run eval-service:build ran 14+ minutes at 95-99% CPU and was killed, never returning, while the same target's real work (uv sync --frozen) took 0.283s run directly · NOT closing 1.5 or 1.5b — new blocker C26 opened`
- `2026-09-09 · C26 · root cause isolated to Nx task orchestration, not project-graph computation (daemon log: createProjectGraph() in 20.9ms), not sandboxing, not the venv, not git · confirmed by direct process sampling and elimination testing`
- `2026-09-09 · C26 · runner rewritten to run each target's underlying command directly instead of through pnpm exec nx run; full sequence timed at 12.4s, dist outputs confirmed present · PR #8 (50edf30) merged after real CI green confirmed on the API`
- `2026-09-09 · 1.5/1.5b · Phase 1's first-ever real golden-set score: 21/30 passed, pass_rate 0.70, from a genuine fresh clone, real Docker, real AWS Bedrock · 9 failures every one with a real named cause (7x Model Gateway invalid-JSON classification, 2x genuine intent misclassification), run twice, run 2 confirmed a semantic-cache hit (15.5x, byte-identical) by the script's own detection logic — trustworthy number is run 1's cold 0.70 · verified live, CLOSING 1.5 and 1.5b`
- `2026-09-09 · 1.1 · Bedrock formally closed as the provider decision — already the account in continuous real use since 2026-09-08, never written down until now · no new verification needed, decision recorded`
- `2026-09-09 · phase 1 · done gate fully met: golden set scores above zero for real reasons (0.70), capability discrimination proven (task 1.2), Conversation Manager returns distinct intents for distinct utterances (this run) · Phase 1 closed except 1.6, blocked on Tavily/Browserbase purchases`
- `2026-09-09 · 1.6 · corrected the vendor count: five unpurchased vendors named, not two (Anthropic and OpenAI never named before, Browserbase's project id never named, prior Browserbase var name did not exist in code) · verified directly against each service's environment schema, no code changed`
- `2026-09-09 · 1.6 · three of five vendor secrets already existed in AWS (Tavily, Browserbase API key, E2B) — wired and proven live (resolves clean, proven to fail on a broken reference, restored) · verified against real AWS, committed db4b53e`
- `2026-09-10 · 1.6 · found the real Browserbase project id in the account itself (dashboard General settings), confirmed same account as the stored key by length+prefix match without ever printing the raw key, committed it plain text · tool-gateway then built direct (not through Nx) and booted for real under real AppConfig with real Tavily/Browserbase secrets: Nest application successfully started, GET /health returned {"status":"ok","service":"tool-gateway"} · verified live, CLOSING tool-gateway`
- `2026-09-14 · import · 29 commits of alter-x-4- Phase 2 and Phase 3 work merged into a branch, seven conflicts resolved by hand, CI green on the fourth run (34877005230) · verified against the API, not the watch command`
- `2026-09-14 · import · duplicate alembic revision 0006 caught before it shipped: git merged both files without reporting a conflict and all four gate scripts passed · reproduced live in a trial merge, then removed`
- `2026-09-14 · import · auto-created agents would have been invisible to the lookup that created them (embedding written with no model_id, against task 1.3's provenance filter) · found by reading, not by any check; fixed and CI green`
- `2026-09-15 · 2.4a · one deliberately failed node classified, dispatched, and replanned from the persisted task skeleton against real Postgres; proven to fail by reintroducing the pre-#145 compiled-DAG behaviour · verified live, CI green on the branch (34949214600)`
- `2026-09-15 · 2.4a · full recovery suite run on a developer machine for the first time: 9 spec files, 87 tests · verified live`
- `2026-09-15 · 2.4a · agent drift computed, persisted and read back as the owning tenant · verified by memory-service test_drift_integration.py against real Postgres, 2 tests`
- `2026-09-15 · C27 · withdrawn: the local test hang was the clone location, not the repository. Same spec runs in 141ms from ~/alter-work · verified by re-running the identical command from both places`

---

## Where things stand

**Phase 0 closed.** All five decisions answered with rationale, no code changed. Derived
logic in design log §30–§33.

**Phase 1 closed, except 1.6.** 1.0–1.5, 1.5b all closed. 1.1 formally recorded (Bedrock).
Done gate fully met 2026-09-09: golden set 21/30 (0.70) for real reasons, capability
discrimination proven, Conversation Manager returns distinct intents live. Only **1.6**
remains open — corrected 2026-09-09 to five vendors. **tool-gateway closed 2026-09-10**,
proven live (real AppConfig, real Tavily/Browserbase secrets, real health check). Still
blocked, two ways, neither engineering: two missing AppConfig
applications (sandbox-service, provisioning-service), and the Anthropic/OpenAI keys.

**3.0** (auto-creation idempotency) **closed 2026-09-08, superseded 2026-09-14** — our idempotency key and migration are replaced by `alter-x-4-`'s equivalent, which also fixes the tier. The 2026-09-08 verification stands as a record of what was proven; the code it proved is no longer the code that ships.

**Phase 2: 2.1, 2.2 and 2.3 now demonstrated here (2.4a, PR #10). 2.4b is what remains.**
(Superseded note follows.) **Phase 2 code imported 2026-09-14, phase NOT closed.** 2.1, 2.2 and 2.3 arrive from
`alter-x-4-` in PR #9. **2.4 is open and is now the whole of the phase**: nobody has watched
one deliberately failed run produce a recovery, a memory record and a drift score readable by
its tenant — not here, and not there. Standing rule 3 applies with full force: this code was
demonstrated in another repository, by other people, and a demonstration elsewhere is not
evidence here.

**Phase 3 code imported 2026-09-14.** 3.1, 3.2, 3.3, 3.4, 3.5 and 3.6 all arrive in the same
PR. Task 3.0 is superseded by their version of the same fix. The phase's done gate — an
unrelated capability request fails to bind, the cheaper of two equivalent agents wins, a
repeated unmet requirement stops creating agents — **has not been observed in this
repository.**

**What CI green does and does not mean here.** It means 136 files of merged work lint,
typecheck, build and pass their suites together. It does not mean the engine behaves. Three
real defects surfaced across four runs, every one of them at the seam between the two
repositories rather than inside either side's work, and one of them would have passed every
automated check the project owns.
