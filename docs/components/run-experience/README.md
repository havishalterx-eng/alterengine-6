# C5 Run Experience

**Layer** platform · **Plane** platform, as received · **Category** 3 — needs fixes or missing methods

> Both ends exist and the call is made, and something along the path is wrong. A source read marks
> these as finished, because from the source both halves look complete.

## What it is

Watching a run happen: live progress, per-node verification results, history.

## Blast radius and fail mode

| | |
|---|---|
| Blast radius | `nothing` |
| Fail mode | `fail-closed` |

*Proposed, not ratified.* Design log §29 lists per-component blast radius and fail mode as an open item — *"not yet applied to any specific component list."* These are a first pass, to be confirmed when the component's contract is written.

## Where the code lives

- `apps/platform-web/src/features/workspace`
- `apps/platform-api/src/runs`

## Current state

*Verbatim from the readiness assessment — engine verified against main 4–6 September 2026; platform reported as received and not independently verified.*

Stop and retry call `actions/cancel` and `actions/retry-node`. **Neither route exists** — confirmed in source. Reads work.

## Design-log alignment — `ALIGNED`

Design log §27 makes Run Monitor one of the five platform surfaces, and the one the demo is watched on. Additive and safe — the missing routes touch nothing existing.

## What the finished component looks like

- [ ] The surface issues real requests against real routes.
- [ ] No control reports success without a call behind it.

## Open issues

None.

## Where this sits in the plan

See [`checklist.md`](../../checklist.md) — task **B4**.

---

*Alignment key: `ALIGNED` the design log imposes no requirement this component fails · `NEEDS-LOGIC` the log supplies logic the component is missing · `CONFLICT` the log says something different from the current shape · `SILENT` the log does not cover this component.*
