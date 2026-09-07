# SandboxExec node type

**Layer** L6 · **Plane** node type · **Category** 1 — works end to end

> **Do not change this component's logic or code during revival.** It is one of the 25 verified
> end to end on 4–6 September 2026, and it is the only verified value in the system. Anything
> necessary is recorded in [`memoryalter.md`](../../memoryalter.md) *before* it is made.

## What it is

The node type that runs a real command inside the sandbox and returns its result to the graph.

## Blast radius and fail mode

| | |
|---|---|
| Blast radius | `degraded` |
| Fail mode | `fail-closed` |

*Proposed, not ratified.* Design log §29 lists per-component blast radius and fail mode as an open item — *"not yet applied to any specific component list."* These are a first pass, to be confirmed when the component's contract is written.

## Where the code lives

- `apps/orchestration-service/src/registry`
- `apps/sandbox-service/src/sandbox`

## Current state

*Verbatim from the readiness assessment — engine verified against main 4–6 September 2026; platform reported as received and not independently verified.*

Executed a real command through sandbox-service and returned `exit_code 0` with stdout. **First execution of this node type.**

## Design-log alignment — `ALIGNED`

Design log §23 requires Sandbox and Provisioning stay scoped small so Project Mode remains a later addition rather than a rearchitecture. Do not grow this.

## What the finished component looks like

- [ ] Stays narrow. Growth here is Project Mode creeping in through the back door.

## Open issues

None.

## Where this sits in the plan

See [`checklist.md`](../../checklist.md).

---

*Alignment key: `ALIGNED` the design log imposes no requirement this component fails · `NEEDS-LOGIC` the log supplies logic the component is missing · `CONFLICT` the log says something different from the current shape · `SILENT` the log does not cover this component.*
