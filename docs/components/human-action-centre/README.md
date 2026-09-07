# C6 Human Action Centre

**Layer** platform · **Plane** platform, as received · **Category** 3 — needs fixes or missing methods

> Both ends exist and the call is made, and something along the path is wrong. A source read marks
> these as finished, because from the source both halves look complete.

## What it is

"What is waiting on me" across every workflow — the approval inbox.

## Blast radius and fail mode

| | |
|---|---|
| Blast radius | `nothing` |
| Fail mode | `fail-closed` |

*Proposed, not ratified.* Design log §29 lists per-component blast radius and fail mode as an open item — *"not yet applied to any specific component list."* These are a first pass, to be confirmed when the component's contract is written.

## Where the code lives

- `apps/platform-web/src/features/human-actions`
- `apps/platform-api/src/action-centre`

## Current state

*Verbatim from the readiness assessment — engine verified against main 4–6 September 2026; platform reported as received and not independently verified.*

The UI sends `status=open`; the API accepts `pending·approved·rejected·expired`. **Only `expired` overlaps.**

## Design-log alignment — `CONFLICT`

**Settled.** Design log §22 item 8 makes this inbox a **Platform-side read model** built on the engine's durable approval decision record — the engine holds the record because it is execution evidence feeding the audit chain and §16's promotion logic. A read model maps onto its source, never the reverse. **The engine's enum is canonical; the platform moves.** Recorded as decision 0.5. §27 also names Approval Inbox one of the five surfaces, and notes it cannot exist before the approval record does — it does.

## Decision — 2026-09-08 · design log §22 item 8

**The engine's enum is canonical** (`pending·approved·rejected·expired`). **The platform moves.**

The approval inbox is a Platform-side read model built on top of the engine's durable decision record. The engine holds that record because it is execution evidence feeding the audit chain and §16's promotion logic. A read model maps onto its source, never the reverse.

Rationale: [`phase-0-decisions.md` §0.5](../../phase-0-decisions.md). Implementation is task B-vocab.

## What the finished component looks like

- [ ] The surface issues real requests against real routes.
- [ ] No control reports success without a call behind it.

## Open issues

None.

## Where this sits in the plan

See [`checklist.md`](../../checklist.md) — task **B-vocab**.

---

*Alignment key: `ALIGNED` the design log imposes no requirement this component fails · `NEEDS-LOGIC` the log supplies logic the component is missing · `CONFLICT` the log says something different from the current shape · `SILENT` the log does not cover this component.*
