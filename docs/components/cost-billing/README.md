# C18 Cost & Billing

**Layer** platform-web · **Plane** platform, as received · **Category** 2 — needs wiring only

> Both ends exist and answer. This is wiring, not repair — the cheapest class of work on the board.

## What it is

What the customer sees about spend, credits and invoices.

## Blast radius and fail mode

| | |
|---|---|
| Blast radius | `nothing` |
| Fail mode | `fail-closed` |

*Proposed, not ratified.* Design log §29 lists per-component blast radius and fail mode as an open item — *"not yet applied to any specific component list."* These are a first pass, to be confirmed when the component's contract is written.

## Where the code lives

- `apps/platform-web/src/features/settings`
- `apps/platform-api/src/billing`
- `apps/platform-api/src/costs`

## Current state

*Verbatim from the readiness assessment — engine verified against main 4–6 September 2026; platform reported as received and not independently verified.*

Ten methods across billing and billing-ops, none wired.

## Design-log alignment — `ALIGNED`

Design log §6 and §27 say this category should not exist: *UI must never get ahead of real backend wiring* — that is what produced the old build's fake workflow canvas — and each of §27's five surfaces appears only as the backend it exercises becomes real. Remediation, however, is pure wiring: both ends exist and answer.

## What the finished component looks like

- [ ] The screen issues real requests against the answering route.
- [ ] No control reports success without a call behind it.
- [ ] Permissions enforced end to end, not just at the route.

## Open issues

None.

## Where this sits in the plan

See [`checklist.md`](../../checklist.md) — task **B2**.

---

*Alignment key: `ALIGNED` the design log imposes no requirement this component fails · `NEEDS-LOGIC` the log supplies logic the component is missing · `CONFLICT` the log says something different from the current shape · `SILENT` the log does not cover this component.*
