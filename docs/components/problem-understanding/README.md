# Problem Understanding

**Layer** L2 · **Plane** intelligence · **Category** 1 — works end to end

> **Do not change this component's logic or code during revival.** It is one of the 25 verified
> end to end on 4–6 September 2026, and it is the only verified value in the system. Anything
> necessary is recorded in [`memoryalter.md`](../../memoryalter.md) *before* it is made.

## What it is

Turns a described objective into a structured ProblemSpec the rest of the design path can reason about.

## Blast radius and fail mode

| | |
|---|---|
| Blast radius | `this-layer-only` |
| Fail mode | `fail-closed` |

*Proposed, not ratified.* Design log §29 lists per-component blast radius and fail mode as an open item — *"not yet applied to any specific component list."* These are a first pass, to be confirmed when the component's contract is written.

## Where the code lives

- `apps/intelligence-service/src/problem_understanding`

## Current state

*Verbatim from the readiness assessment — engine verified against main 4–6 September 2026; platform reported as received and not independently verified.*

It answered 503 to every request, and **the 503 was the mock, not the service**. The prompt asks for strict JSON across nine keys and parses the reply as the `ProblemSpec` protobuf with unknown fields rejected; the mock had no entry for that contract, returned its prose echo, and the kernel raised — naming the Model Gateway, which was working correctly the whole time. Adding the contract (#126) makes the path complete. Validation still fails closed and names the field.

One real behaviour this exposed: **the returned objective is the caller's, not the model's** — `apply_authoritative_problem_fields` overwrites it along with the ADS provenance, so a model cannot rewrite either while enriching the rest.

## Design-log alignment — `ALIGNED`

That overwrite is §5.4 reviewer-isolation logic applied one layer up: the model enriches but cannot rewrite what it was asked to work on. Design log §5.1's structured success criteria are a natural neighbour of this component — see Verification.

## What the finished component looks like

- [ ] Judged against a real provider. The path is proven; the judgement is not.

## Open issues

None.

## Where this sits in the plan

See [`checklist.md`](../../checklist.md).

---

*Alignment key: `ALIGNED` the design log imposes no requirement this component fails · `NEEDS-LOGIC` the log supplies logic the component is missing · `CONFLICT` the log says something different from the current shape · `SILENT` the log does not cover this component.*
