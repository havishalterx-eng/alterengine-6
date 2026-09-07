# Gate node type

**Layer** L6 · **Plane** node type · **Category** 1 — works end to end

> **Do not change this component's logic or code during revival.** It is one of the 25 verified
> end to end on 4–6 September 2026, and it is the only verified value in the system. Anything
> necessary is recorded in [`memoryalter.md`](../../memoryalter.md) *before* it is made.

## What it is

Evaluates a condition against real upstream output and routes the run down one branch or another.

## Blast radius and fail mode

| | |
|---|---|
| Blast radius | `degraded` |
| Fail mode | `fail-closed` |

*Proposed, not ratified.* Design log §29 lists per-component blast radius and fail mode as an open item — *"not yet applied to any specific component list."* These are a first pass, to be confirmed when the component's contract is written.

## Where the code lives

- `apps/orchestration-service/src/registry`

## Current state

*Verbatim from the readiness assessment — engine verified against main 4–6 September 2026; platform reported as received and not independently verified.*

Evaluated two CEL-subset conditions against real upstream output and routed on the result — `{left: true, right: false}` — exercising an expression evaluator nothing had touched before. The excluded branch was recorded rather than silently dropped, though under the wrong reason until #114.

## Design-log alignment — `ALIGNED`

#114 is worth remembering as a class: a branch excluded by a routing condition was recorded as `gated_off_by_verification`, though no verification was involved. It sent anyone auditing a skipped branch to the wrong subsystem. A correct mechanism with a wrong label is still a defect.

## What the finished component looks like

Nothing outstanding. This component meets every requirement the design log places on it, and the assessment exercised it live. Its definition of done is that current behaviour holds.

## Open issues

None.

## Where this sits in the plan

See [`checklist.md`](../../checklist.md).

---

*Alignment key: `ALIGNED` the design log imposes no requirement this component fails · `NEEDS-LOGIC` the log supplies logic the component is missing · `CONFLICT` the log says something different from the current shape · `SILENT` the log does not cover this component.*
