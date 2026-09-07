# Capability Resolver

**Layer** L3 · **Plane** intelligence · **Category** 3 — needs fixes or missing methods

> Both ends exist and the call is made, and something along the path is wrong. A source read marks
> these as finished, because from the source both halves look complete.

## What it is

Works out what capability and model tier a described task actually needs.

## Blast radius and fail mode

| | |
|---|---|
| Blast radius | `this-layer-only` |
| Fail mode | `fail-closed` |

*Proposed, not ratified.* Design log §29 lists per-component blast radius and fail mode as an open item — *"not yet applied to any specific component list."* These are a first pass, to be confirmed when the component's contract is written.

## Where the code lives

- `apps/intelligence-service/src/capability_resolver`

## Current state

*Verbatim from the readiness assessment — engine verified against main 4–6 September 2026; platform reported as received and not independently verified.*

**Advanced-tier terms are tested before fast-tier ones in a plain if/elif, so an incidental adjective on the input decides the tier.** Word order does not change it, confirming set membership rather than parsing.

## Design-log alignment — `NEEDS-LOGIC`

Design log §3: reasoning comes from pretrained frontier models through a swappable gateway, never from keyword sets. §3 also names tier classification specifically as a candidate for a narrow fine-tuned model **later**, once real usage volume exists — added as one more swappable Model Gateway entry, not built now. §4 additionally gives this component a pre-compile job: confirm a live connection exists for each required capability before the graph is built.

## What the finished component looks like

- [ ] Something that reads the request rather than testing set membership.
- [ ] Pre-compile connection check per §4's batch-ask flow.

## Open issues

None.

## Where this sits in the plan

See [`checklist.md`](../../checklist.md).

---

*Alignment key: `ALIGNED` the design log imposes no requirement this component fails · `NEEDS-LOGIC` the log supplies logic the component is missing · `CONFLICT` the log says something different from the current shape · `SILENT` the log does not cover this component.*
