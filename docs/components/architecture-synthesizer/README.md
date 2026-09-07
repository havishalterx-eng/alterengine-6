# Architecture Synthesizer

**Layer** L4 · **Plane** intelligence · **Category** 4 — build from scratch

> Either never implemented, or implemented in a shape that reproduces the flaw when ported.

## What it is

Decides what system should exist for a described problem — the topology, the waves, the roles. This is the product.

## Blast radius and fail mode

| | |
|---|---|
| Blast radius | `whole-engine` |
| Fail mode | `fail-closed` |

*Proposed, not ratified.* Design log §29 lists per-component blast radius and fail mode as an open item — *"not yet applied to any specific component list."* These are a first pass, to be confirmed when the component's contract is written.

## Where the code lives

- `apps/intelligence-service/src/architecture_synthesizer`

## Current state

*Verbatim from the readiness assessment — engine verified against main 4–6 September 2026; platform reported as received and not independently verified.*

Given the same skeleton with bare defaults and then with **customer-visible, human-approval, EU residency and PII all set**, it returns **byte-identical topology, waves, roles and a hardcoded `confidence 1.0`**. Only a mechanical echo of which flags were set differs.

## Design-log alignment — `NEEDS-LOGIC`

**This is the row that decides whether Alter is a product or n8n with better defaults.**

Design log §1 is unambiguous: n8n, LangChain and LangGraph all require a human to draw the graph, and *nobody in this space has a layer that decides what topology should exist for an arbitrary problem. That gap is Alter's actual differentiator.* It also names this one of only **two genuinely unproven R&D pieces**, nowhere in the industry including every prior Alter build — real research risk, not engineering effort.

§24 supplies the permission that makes a real rewrite affordable: the design path runs **once per workflow creation or edit**, not per run. It is *"reasoning-heavy, slow, expensive — and that is acceptable, because it is rare."* The run path never touches this component.

§4 also depends on it: the batch connector-ask fires **after** the Synthesizer finishes, because the full tool list is not known until the design is complete.

## What the finished component looks like

- [ ] Topology **demonstrably changes when constraints change** — measured by the harness, against a real provider (Phase 4 done gate).
- [ ] Confidence means something rather than being a constant.
- [ ] The architecture golden set written **before** the rewrite, so the target is fixed in advance rather than fitted afterwards.
- [ ] Node config survives synthesis — the #115/#116 counterfactual stays green.

## Open issues

None.

## Where this sits in the plan

See [`checklist.md`](../../checklist.md).

---

*Alignment key: `ALIGNED` the design log imposes no requirement this component fails · `NEEDS-LOGIC` the log supplies logic the component is missing · `CONFLICT` the log says something different from the current shape · `SILENT` the log does not cover this component.*
