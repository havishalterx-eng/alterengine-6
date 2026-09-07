# Model Gateway

**Layer** L7 · **Plane** model-gateway · **Category** 1 — works end to end

> **Do not change this component's logic or code during revival.** It is one of the 25 verified
> end to end on 4–6 September 2026, and it is the only verified value in the system. Anything
> necessary is recorded in [`memoryalter.md`](../../memoryalter.md) *before* it is made.

## What it is

The single swappable route to every frontier model. Every reasoning component in the engine reaches the outside world through here, and none of them is married to a provider.

## Blast radius and fail mode

| | |
|---|---|
| Blast radius | `whole-engine` |
| Fail mode | `fail-closed` |

*Proposed, not ratified.* Design log §29 lists per-component blast radius and fail mode as an open item — *"not yet applied to any specific component list."* These are a first pass, to be confirmed when the component's contract is written.

## Where the code lives

- `apps/model-gateway/src/gateway`
- `apps/model-gateway/src/operations`

## Current state

*Verbatim from the readiness assessment — engine verified against main 4–6 September 2026; platform reported as received and not independently verified.*

Invoke works, repeats hit cache, auth fails closed. Redaction validates an Aadhaar checksum both ways — redacting a valid number, leaving an invalid one intact.

## Design-log alignment — `ALIGNED`

**Five direct dependents — orchestration, intelligence, verification, ads-core, eval-service — and everything else transitively. This is the only Category 1 component whose failure would take the engine down with it**, which is why its clean re-verification matters more than its own row suggests. Design log §3 makes swappability non-negotiable: reasoning comes from pretrained frontier models through a gateway never locked to one provider.

## What the finished component looks like

- [ ] A real provider wired behind it (Phase 1), with the mock reachable only under a `RUNTIME_MODE` that makes production selection of a mock a **fatal boot error** (§7 pattern 2).
- [ ] Titan embeddings live behind the `Embed` RPC — Selection & Binding and Agent Auto-Creation both depend on it.

## Open issues

None.

## Where this sits in the plan

See [`checklist.md`](../../checklist.md).

---

*Alignment key: `ALIGNED` the design log imposes no requirement this component fails · `NEEDS-LOGIC` the log supplies logic the component is missing · `CONFLICT` the log says something different from the current shape · `SILENT` the log does not cover this component.*
