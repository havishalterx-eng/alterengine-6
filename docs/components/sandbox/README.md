# Sandbox

**Layer** L7 · **Plane** sandbox · **Category** 1 — works end to end

> **Do not change this component's logic or code during revival.** It is one of the 25 verified
> end to end on 4–6 September 2026, and it is the only verified value in the system. Anything
> necessary is recorded in [`memoryalter.md`](../../memoryalter.md) *before* it is made.

## What it is

Executes untrusted code in isolation and returns the result. Holds a deliberately narrow boundary.

## Blast radius and fail mode

| | |
|---|---|
| Blast radius | `degraded` |
| Fail mode | `fail-closed` |

*Proposed, not ratified.* Design log §29 lists per-component blast radius and fail mode as an open item — *"not yet applied to any specific component list."* These are a first pass, to be confirmed when the component's contract is written.

## Where the code lives

- `apps/sandbox-service/src/sandbox`
- `apps/sandbox-service/src/artifacts`

## Current state

*Verbatim from the readiness assessment — engine verified against main 4–6 September 2026; platform reported as received and not independently verified.*

Session and execute both work; validation names the missing field. **Holds its six-RPC boundary with no browser or database surface.**

## Design-log alignment — `ALIGNED`

Design log §11 makes Sandbox a primary consumer of the shared safety library. Today safety is a separate service — that is task C4, and the eval harness scoring 0/30 on an unreachable ads-core is the cost of the current shape.

## What the finished component looks like

- [ ] Imports the safety library in-process rather than reaching a service over the network (§11).
- [ ] A vendor chosen — e2b or AgentCore. Both adapters exist.

## Open issues

None.

## Where this sits in the plan

See [`checklist.md`](../../checklist.md).

---

*Alignment key: `ALIGNED` the design log imposes no requirement this component fails · `NEEDS-LOGIC` the log supplies logic the component is missing · `CONFLICT` the log says something different from the current shape · `SILENT` the log does not cover this component.*
