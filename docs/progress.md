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

---

## Where things stand

**Phase 0 closed.** All five decisions answered with rationale, no code changed. Derived
logic in design log §30–§33.

**Phase 1 in progress.** 1.0 running. 1.1 verified live — credentials, region and Titan
access all confirmed by real call. 1.2 prompt ready. 1.3, 1.4, 1.5 not started.

**3.0** (auto-creation idempotency) **closed 2026-09-08** — idempotency key + partial unique index (migration 0006), proven to fail first and verified against real Postgres. 3.3 (tier) now owns the "does tier belong in the key" question.
