# Alter Engine

Alter takes a business problem, decides what topology should exist to solve it, builds and
runs that topology durably, verifies the outcome against real external systems, repairs at
the smallest broken layer, and learns safely from what happened.

n8n, LangChain and LangGraph all require a human to draw the graph. **Nobody has a layer
that decides what topology should exist for an arbitrary problem.** That gap is what this
engine is for, and it is genuinely unsolved — including by every previous Alter build.

---

## Project Revive

This repository is the working home of **Project Revive**: bringing the assessed engine to
a demonstrably working state, then holding it to the design log's standards.

It is not a rebuild. A readiness assessment on 4–6 September 2026 found **25 of 61
components working end to end**, and those 25 are the only verified value in the system.
They are not to be changed during revival.

### The finish line

> One real business problem goes in. The engine designs a topology for it. It runs it. It
> verifies the outcome against real external systems. One node is deliberately broken — the
> engine detects it, replans, recovers, records the memory, and the drift score is visible
> to the tenant that owns it.

Watched on a screen, not described in a report. Every piece of work is judged by whether it
moves that demo closer.

---

## Start here

| Document | What it is |
|---|---|
| [`docs/memoryalter.md`](docs/memoryalter.md) | **The master record.** Every decision, why it was made, what was rejected. Component ledger, open questions, raw memory of what bit us. Read this first. |
| [`docs/checklist.md`](docs/checklist.md) | The work, numbered to match the action plan exactly. Phase 0 through Phase 6, plus Track B (platform) and Track C (design-log compatibility). |
| [`docs/progress.md`](docs/progress.md) | What actually got done. A line appears here only when something was **demonstrated**, never when it was reported. |
| [`docs/components/`](docs/components/README.md) | One folder per component, all 61. What it is, where its code lives, its verified state, its design-log alignment, and what finished looks like. |
| [`docs/local-dev.md`](docs/local-dev.md) | How to actually run the stack. |

### Component readiness

| Category | Count | Meaning |
|---|---|---|
| 1 — works end to end | 25 | Verified live. Do not change during revival. |
| 2 — needs wiring only | 10 | A finished screen and a working backend that were never introduced. |
| 3 — needs fixes | 12 | The call is made and something along the path is wrong. |
| 4 — build from scratch | 4 | Never implemented, or implemented in a shape that reproduces the flaw. |
| 5 — not assessable yet | 10 | Nothing has called these. Neither known-good nor known-broken. |

**The fifth column exists on purpose.** Of three components previously counted as working
on a source read alone, one worked, one failed its first request, and one had no surface to
call. Never let "not assessed" collapse into "works."

---

## Repository layout

Nx + pnpm monorepo. TypeScript/NestJS and Python/FastAPI.

**15 apps.** `ads-core` · `audit-service` · `background-workers` · `cost-ledger-service` ·
`eval-service` · `intelligence-service` · `memory-service` · `model-gateway` ·
`orchestration-service` · `platform-api` · `platform-web` · `provisioning-service` ·
`sandbox-service` · `tool-gateway` · `verification-service`

**6 packages.** `adapters` · `auth` · `contracts` · `observability` · `shared-clients` ·
`tenancy`

Most of the 61 components live *inside* an app rather than beside it —
`orchestration-service` alone holds nine of them. [`docs/components/`](docs/components/README.md)
maps every component to its real paths.

---

## Standing rules

1. **Do not touch the 25 Category 1 components.** No logic change, no code change during
   revival. Anything necessary is recorded in `memoryalter.md` *before* it is made.
2. **Never let "not assessed" collapse into "works."**
3. **A report is not evidence.** Verified means someone ran it.
4. **Branches are never deleted.** Always `--squash` merge, never `--delete-branch`, never
   `--no-verify`, never force-push.
5. **Never clone into a cloud-synced folder.** iCloud Desktop and OneDrive Desktop make git
   hang unpredictably.
6. **Node 22, pinned via `.nvmrc`.** Testcontainers tests fail on Node 20 with
   `webidl.util.MarkAsUncloneable`.
7. **Check for a competing `pnpm` process** before `install` / `add` / `update`. Concurrent
   installs corrupt lockfile and `node_modules` state.

`CLAUDE.md` carries the full set, including the proto-generation and Windows CRLF traps.

---

## History

| Repository | Status |
|---|---|
| `alterengine-6` | **Live.** This repository. |
| [`alter-x-4-`](https://github.com/havishalterx-eng/alter-x-4-) | Frozen. The engine's original home; its 500 commits are preserved here. |
| [`alterengine--5`](https://github.com/havishalterx-eng/alterengine--5) | Frozen. A ground-up rebuild, stopped at 1 component of 55 when the assessment proved 25 already worked. Source of the architecture gates and build method. |
