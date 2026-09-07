# Graph Compiler

**Layer** L5 · **Plane** orchestration · **Category** 1 — works end to end

> **Do not change this component's logic or code during revival.** It is one of the 25 verified
> end to end on 4–6 September 2026, and it is the only verified value in the system. Anything
> necessary is recorded in [`memoryalter.md`](../../memoryalter.md) *before* it is made.

## What it is

Produces the versioned WorkflowDAG from a task skeleton or an architecture. This is the last stop on the design path — everything downstream executes what it emits.

## Blast radius and fail mode

| | |
|---|---|
| Blast radius | `this-layer-only` |
| Fail mode | `fail-closed` |

*Proposed, not ratified.* Design log §29 lists per-component blast radius and fail mode as an open item — *"not yet applied to any specific component list."* These are a first pass, to be confirmed when the component's contract is written.

## Where the code lives

- `apps/orchestration-service/src/compiler`

## Current state

*Verbatim from the readiness assessment — engine verified against main 4–6 September 2026; platform reported as received and not independently verified.*

Absent from the previous classification entirely, and one of the more capable components in the engine. From a five-node skeleton it built a diamond: three edge kinds (`sequential`, `conditional` carrying CEL expressions, `merge`) and four waves, one holding two parallel nodes. It persisted the version itself, derived requirements from the prompts, and gave Gate and Merge no capabilities, correctly recognising they need no model. It also refused a ToolCall entry point — *"no upstream output exists to verify"* — a real safety rule rather than a validation slip. Both entry points now hold.

## Design-log alignment — `ALIGNED`

Design log §24 makes this the boundary that decides the Recovery contract: because L5 is what *produces* the DAG, Recovery re-entering the design path must hand back a `TaskSkeleton`, not a `CompiledDag`. That decision is recorded and not yet implemented — see Recovery.

## What the finished component looks like

- [ ] Design log §8 requires the same DAG validation to run on **user canvas edits**, not only Alter-generated graphs: cycle check, orphaned-node check, data-type compatibility between newly connected nodes. Same validator, different trigger. Not wired.

## Open issues

None.

## Where this sits in the plan

See [`checklist.md`](../../checklist.md).

---

*Alignment key: `ALIGNED` the design log imposes no requirement this component fails · `NEEDS-LOGIC` the log supplies logic the component is missing · `CONFLICT` the log says something different from the current shape · `SILENT` the log does not cover this component.*
