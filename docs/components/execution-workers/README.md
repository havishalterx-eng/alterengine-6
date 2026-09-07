# Execution Workers

**Layer** L6 · **Plane** background-workers · **Category** 1 — works end to end

> **Do not change this component's logic or code during revival.** It is one of the 25 verified
> end to end on 4–6 September 2026, and it is the only verified value in the system. Anything
> necessary is recorded in [`memoryalter.md`](../../memoryalter.md) *before* it is made.

## What it is

The worker processes that claim queued runs and execute them. Separate from the Executor's logic: these are the processes, that is the algorithm.

## Blast radius and fail mode

| | |
|---|---|
| Blast radius | `this-layer-only` |
| Fail mode | `fail-closed` |

*Proposed, not ratified.* Design log §29 lists per-component blast radius and fail mode as an open item — *"not yet applied to any specific component list."* These are a first pass, to be confirmed when the component's contract is written.

## Where the code lives

- `apps/background-workers/src/executor`

## Current state

*Verbatim from the readiness assessment — engine verified against main 4–6 September 2026; platform reported as received and not independently verified.*

A run dispatched with the worker down sat unclaimed for 25s; restarting resumed and completed it on attempt 1 with no lost state.

## Design-log alignment — `ALIGNED`

Design log §7 pattern 3 requires a driver-exists test for every background component. This one has a real driver and it was exercised.

## What the finished component looks like

- [ ] Current behaviour holds after the healing loop lands — a worker restart mid-recovery must not double-apply a side effect (§4 idempotency gate).

## Open issues

None.

## Where this sits in the plan

See [`checklist.md`](../../checklist.md).

---

*Alignment key: `ALIGNED` the design log imposes no requirement this component fails · `NEEDS-LOGIC` the log supplies logic the component is missing · `CONFLICT` the log says something different from the current shape · `SILENT` the log does not cover this component.*
