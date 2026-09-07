# ads-core

**Layer** engine · **Plane** retrieval · **Category** 5 — not assessable yet

> Nothing has called this. It is neither known-good nor known-broken, and it has not earned a
> category. **Never let "not assessed" collapse into "works."**

## What it is

The store behind cross-workflow context — where a user's accumulated material physically lives, and what retrieval reads.

## Blast radius and fail mode

| | |
|---|---|
| Blast radius | `degraded` |
| Fail mode | `fail-closed` |

*Proposed, not ratified.* Design log §29 lists per-component blast radius and fail mode as an open item — *"not yet applied to any specific component list."* These are a first pass, to be confirmed when the component's contract is written.

## Where the code lives

- `apps/ads-core/src/storage`
- `apps/ads-core/src/ingestion`
- `apps/ads-core/src/connectors`
- `apps/ads-core/src/memory_namespace`

## Current state

*Verbatim from the readiness assessment — engine verified against main 4–6 September 2026; platform reported as received and not independently verified.*

**No longer the blocker it was recorded as.** It starts, serves, enforces the tenant prefix convention and refuses an unauthenticated call with 401; `GET /ads/sources` returns a correctly shaped tenant-scoped response.

It stays not-assessable because **retrieval — its actual job — needs a real embedding provider to exercise**. What stopped it was neither the port nor the provider but its own settings model rejecting variables belonging to other services (#112), which failed on memory-service's database URL: about as far from the real cause as an error can point.

## Design-log alignment — `NEEDS-LOGIC`

Design log §22 item 5 confirmed **ADS the store** as its own component — earlier drafts listed only ADS *Client*, the accessor, and omitted the thing it accesses.

§10 sets a concrete requirement: cross-workflow context within one user is *expected and required*, so **ADS Client's retrieval scope must span all of that user's workflows and sessions**, not just the current one. §10 also draws the line — this does not weaken §2's tenant isolation, because the isolation boundary is the tenant, not the individual workflow.

Its 0/30 contribution to the eval harness is §11's argument landing: safety reaching across the network to this service is a single point of failure every gateway depends on.

## What the finished component looks like

- [ ] Retrieval exercised against a real embedding provider (Phase 1).
- [ ] Retrieval scope spans all of one user's workflows, not just the current one (§10).

## Open issues

None.

## Where this sits in the plan

See [`checklist.md`](../../checklist.md).

---

*Alignment key: `ALIGNED` the design log imposes no requirement this component fails · `NEEDS-LOGIC` the log supplies logic the component is missing · `CONFLICT` the log says something different from the current shape · `SILENT` the log does not cover this component.*
