# Cost Ledger

**Layer** L8 · **Plane** cost-ledger-service · **Category** 1 — works end to end

> **Do not change this component's logic or code during revival.** It is one of the 25 verified
> end to end on 4–6 September 2026, and it is the only verified value in the system. Anything
> necessary is recorded in [`memoryalter.md`](../../memoryalter.md) *before* it is made.

## What it is

Answers "what did this cost us" — internal, per-run, per-node engineering data. Distinct from Billing, which answers what the customer owes.

## Blast radius and fail mode

| | |
|---|---|
| Blast radius | `this-layer-only` |
| Fail mode | `fail-open-and-logged` |

*Proposed, not ratified.* Design log §29 lists per-component blast radius and fail mode as an open item — *"not yet applied to any specific component list."* These are a first pass, to be confirmed when the component's contract is written.

## Where the code lives

- `apps/cost-ledger-service/src/ingest`
- `apps/cost-ledger-service/src/estimation`
- `apps/cost-ledger-service/src/rollup`
- `apps/cost-ledger-service/src/node-costs`
- `apps/cost-ledger-service/src/model-outcomes`

## Current state

*Verbatim from the readiness assessment — engine verified against main 4–6 September 2026; platform reported as received and not independently verified.*

Five routes answer. **Pre-execution estimation is honest about what it does not know** — with no history it returns `confidence: "no_data"` and `hasUnestimatedLineItems: true` rather than inventing a number. Rollup summary and the model-outcomes window both enforce their parameters. A defect was found and fixed in the same pass (#118).

Two things left standing: the declared five-value `COST_SOURCES` union is not enforced, so `source: "telepathy"` is accepted; and the service is split on tenancy — `/costs/estimate` requires a bare UUID while `/costs/by-run` requires the `ten_` prefix.

## Design-log alignment — `NEEDS-LOGIC`

Three separate design-log requirements:

- **§21 / §22 item 10, the load-bearing one.** Verified-run billing means credits are consumed only by runs that pass verification, so **Cost Ledger must record verification verdicts alongside cost from day one**. If that linkage is missing early, adding billing later requires backfilling data that was never captured. It is a one-column decision now and an archaeology project later.
- **§7 pattern 4.** Two tenant-identifier formats inside one service is duplicated primitives drifting apart. Single source of truth per shared primitive, enforced.
- **§9.** Round the total once, at the end — never round the per-unit price before multiplying. The old build's estimator did the latter and produced estimates **2× to 100× over real cost**. Untested here because no real prices exist yet; check the moment a provider is wired.

## What the finished component looks like

- [ ] Verification verdicts recorded against cost (§21).
- [ ] One tenant-ID format across every route.
- [ ] `COST_SOURCES` enforced at the write path.
- [ ] Estimator rounding verified against real provider prices.

## Open issues

None.

## Where this sits in the plan

See [`checklist.md`](../../checklist.md).

---

*Alignment key: `ALIGNED` the design log imposes no requirement this component fails · `NEEDS-LOGIC` the log supplies logic the component is missing · `CONFLICT` the log says something different from the current shape · `SILENT` the log does not cover this component.*
