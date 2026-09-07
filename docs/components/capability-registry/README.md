# Capability Registry

**Layer** L3 · **Plane** intelligence · **Category** 1 — works end to end

> **Do not change this component's logic or code during revival.** It is one of the 25 verified
> end to end on 4–6 September 2026, and it is the only verified value in the system. Anything
> necessary is recorded in [`memoryalter.md`](../../memoryalter.md) *before* it is made.

## What it is

The catalogue of what agents can do, versioned and tenant-scoped.

## Blast radius and fail mode

| | |
|---|---|
| Blast radius | `this-layer-only` |
| Fail mode | `fail-closed` |

*Proposed, not ratified.* Design log §29 lists per-component blast radius and fail mode as an open item — *"not yet applied to any specific component list."* These are a first pass, to be confirmed when the component's contract is written.

## Where the code lives

- `apps/intelligence-service/src/capability_registry`

## Current state

*Verbatim from the readiness assessment — engine verified against main 4–6 September 2026; platform reported as received and not independently verified.*

Register, search, get-by-version and deactivate all behave; a search scoped to another tenant returns nothing.

## Design-log alignment — `NEEDS-LOGIC`

Design log §19 additionally requires this component to hold and retrieve **reusable workflow patterns and templates from day one**, because the first-run experience shows curated templates below the description box. Constraint locked alongside it: **templates are hand-authored, never harvested from real user workflows.** An abstract lesson carries no customer content; a template is a near-complete workflow shape — node structure, tool choices, sometimes prompt phrasing — and harvesting one customer's workflow into another's account is a different and higher risk class. If harvesting is ever wanted it needs its own explicit decision and privacy review.

## What the finished component looks like

- [ ] Curated templates stored and retrievable.
- [ ] Nothing in the template path can ingest a real tenant workflow.

## Open issues

None.

## Where this sits in the plan

See [`checklist.md`](../../checklist.md).

---

*Alignment key: `ALIGNED` the design log imposes no requirement this component fails · `NEEDS-LOGIC` the log supplies logic the component is missing · `CONFLICT` the log says something different from the current shape · `SILENT` the log does not cover this component.*
