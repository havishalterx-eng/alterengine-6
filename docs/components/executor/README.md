# Executor

**Layer** L6 · **Plane** orchestration · **Category** 1 — works end to end

> **Do not change this component's logic or code during revival.** It is one of the 25 verified
> end to end on 4–6 September 2026, and it is the only verified value in the system. Anything
> necessary is recorded in [`memoryalter.md`](../../memoryalter.md) *before* it is made.

## What it is

Walks the compiled graph wave by wave during a real run, dispatches each node to the gateways, feeds results into the Blackboard, and hands off to Verification after each node.

## Blast radius and fail mode

| | |
|---|---|
| Blast radius | `whole-engine` |
| Fail mode | `fail-closed` |

*Proposed, not ratified.* Design log §29 lists per-component blast radius and fail mode as an open item — *"not yet applied to any specific component list."* These are a first pass, to be confirmed when the component's contract is written.

## Where the code lives

- `apps/background-workers/src/executor`
- `apps/orchestration-service/src/execution-runtime.module.ts`

## Current state

*Verbatim from the readiness assessment — engine verified against main 4–6 September 2026; platform reported as received and not independently verified.*

Eleven node executions succeeded across single- and two-node workflows, driving capability resolution, binding, the model call and the quality gate. In the two-node run it honoured the edge, executed `wave_1` only after `wave_0`, and passed the first node's output into the second.

## Design-log alignment — `ALIGNED`

Design log §13 gave the Executor its own bounded module specifically because the old build smeared its logic across runs/compiler/blackboard. That separation holds here.

## What the finished component looks like

- [ ] Verification's per-node dual check (§5.2 mechanical, §5.3 semantic) fires after every node, not only the semantic half.
- [ ] A failed node routes to Recovery's Classify stage for that node alone — never a full workflow restart.

## Open issues

None.

## Where this sits in the plan

See [`checklist.md`](../../checklist.md).

---

*Alignment key: `ALIGNED` the design log imposes no requirement this component fails · `NEEDS-LOGIC` the log supplies logic the component is missing · `CONFLICT` the log says something different from the current shape · `SILENT` the log does not cover this component.*
