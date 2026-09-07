# C23 Admin Console

**Layer** platform-web · **Plane** platform, as received · **Category** 2 — needs wiring only

> Both ends exist and answer. This is wiring, not repair — the cheapest class of work on the board.

## What it is

Fourteen screens across eight backend modules — tenants, policy, controls, deployments, audit. The largest single block of finished-but-unreachable work in the product.

## Blast radius and fail mode

| | |
|---|---|
| Blast radius | `nothing` |
| Fail mode | `fail-closed` |

*Proposed, not ratified.* Design log §29 lists per-component blast radius and fail mode as an open item — *"not yet applied to any specific component list."* These are a first pass, to be confirmed when the component's contract is written.

## Where the code lives

- `apps/platform-web/src/features/admin`
- `apps/platform-api/src/admin-tenants`
- `apps/platform-api/src/admin-policy`
- `apps/platform-api/src/admin-controls`
- `apps/platform-api/src/admin-deployments`
- `apps/platform-api/src/admin-audit`

## Current state

*Verbatim from the readiness assessment — engine verified against main 4–6 September 2026; platform reported as received and not independently verified.*

Fourteen screens and eight backend modules. **The routes answer `403 RBAC_ROLE_DENIED`, not 404** — the backend exists and is authorized; the frontend edge was never connected.

## Design-log alignment — `ALIGNED`

Design log §6 and §27 say this category should not exist: *UI must never get ahead of real backend wiring* — that is what produced the old build's fake workflow canvas — and each of §27's five surfaces appears only as the backend it exercises becomes real. Remediation, however, is pure wiring: both ends exist and answer.

## What the finished component looks like

- [ ] The screen issues real requests against the answering route.
- [ ] No control reports success without a call behind it.
- [ ] Permissions enforced end to end, not just at the route.

## Open issues

None.

## Where this sits in the plan

See [`checklist.md`](../../checklist.md) — task **B1**.

---

*Alignment key: `ALIGNED` the design log imposes no requirement this component fails · `NEEDS-LOGIC` the log supplies logic the component is missing · `CONFLICT` the log says something different from the current shape · `SILENT` the log does not cover this component.*
