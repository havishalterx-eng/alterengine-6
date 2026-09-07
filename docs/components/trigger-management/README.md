# C13 Trigger Management

**Layer** platform · **Plane** platform, as received · **Category** 3 — needs fixes or missing methods

> Both ends exist and the call is made, and something along the path is wrong. A source read marks
> these as finished, because from the source both halves look complete.

## What it is

Creating, testing and removing the triggers that start workflows.

## Blast radius and fail mode

| | |
|---|---|
| Blast radius | `nothing` |
| Fail mode | `fail-closed` |

*Proposed, not ratified.* Design log §29 lists per-component blast radius and fail mode as an open item — *"not yet applied to any specific component list."* These are a first pass, to be confirmed when the component's contract is written.

## Where the code lives

- `apps/platform-web/src/features/triggers`
- `apps/orchestration-service/src/trigger-registry`
- `apps/orchestration-service/src/trigger-bindings`

## Current state

*Verbatim from the readiness assessment — engine verified against main 4–6 September 2026; platform reported as received and not independently verified.*

Reads are live; **`testTrigger` and `removeTrigger` report success without calling anything.**

## Design-log alignment — `CONFLICT`

Design log §5.5 fail-closed and §7 pattern 1 both forbid this outright: a result is *never silently counted as success*, and an unmarked stub on a production path must fail a CI gate. **A control that claims to have deleted something and has not is worse than one that does nothing visible** — prioritise above cosmetic items. §8 also makes the trigger just another node the user can hand-wire on canvas, with Alter building it conversationally by default.

## What the finished component looks like

- [ ] The surface issues real requests against real routes.
- [ ] No control reports success without a call behind it.

## Open issues

None.

## Where this sits in the plan

See [`checklist.md`](../../checklist.md) — task **B5**.

---

*Alignment key: `ALIGNED` the design log imposes no requirement this component fails · `NEEDS-LOGIC` the log supplies logic the component is missing · `CONFLICT` the log says something different from the current shape · `SILENT` the log does not cover this component.*
