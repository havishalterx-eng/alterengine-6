# C8 Deployment Manager

**Layer** platform · **Plane** platform, as received · **Category** 3 — needs fixes or missing methods

> Both ends exist and the call is made, and something along the path is wrong. A source read marks
> these as finished, because from the source both halves look complete.

## What it is

Deploying and managing what the engine produces.

## Blast radius and fail mode

| | |
|---|---|
| Blast radius | `nothing` |
| Fail mode | `fail-closed` |

*Proposed, not ratified.* Design log §29 lists per-component blast radius and fail mode as an open item — *"not yet applied to any specific component list."* These are a first pass, to be confirmed when the component's contract is written.

## Where the code lives

- `apps/orchestration-service/src/deployment-admin`
- `apps/platform-api/src/admin-deployments`

## Current state

*Verbatim from the readiness assessment — engine verified against main 4–6 September 2026; platform reported as received and not independently verified.*

Declared and never implemented. **Placed here rather than in Category 4 because `DeployctlService` exists with three RPCs** — the backend contract is real even where the surface is not.

## Design-log alignment — `SILENT`

Not covered by the design log. Cheapest of Phase 5's three items because the contract already exists — do it first within that phase.

## What the finished component looks like

- [ ] The surface issues real requests against real routes.
- [ ] No control reports success without a call behind it.

## Open issues

None.

## Where this sits in the plan

See [`checklist.md`](../../checklist.md) — task **5.3**.

---

*Alignment key: `ALIGNED` the design log imposes no requirement this component fails · `NEEDS-LOGIC` the log supplies logic the component is missing · `CONFLICT` the log says something different from the current shape · `SILENT` the log does not cover this component.*
