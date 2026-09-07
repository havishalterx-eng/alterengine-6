# Conversation Manager

**Layer** L1 · **Plane** orchestration · **Category** 1 — works end to end

> **Do not change this component's logic or code during revival.** It is one of the 25 verified
> end to end on 4–6 September 2026, and it is the only verified value in the system. Anything
> necessary is recorded in [`memoryalter.md`](../../memoryalter.md) *before* it is made.

## What it is

The front door. Takes what a person says and works out what they actually want, including asking for clarification when the answer is genuinely ambiguous.

## Blast radius and fail mode

| | |
|---|---|
| Blast radius | `degraded` |
| Fail mode | `fail-closed` |

*Proposed, not ratified.* Design log §29 lists per-component blast radius and fail mode as an open item — *"not yet applied to any specific component list."* These are a first pass, to be confirmed when the component's contract is written.

## Where the code lives

- `apps/orchestration-service/src/conversation`
- `apps/orchestration-service/src/clarifications`

## Current state

*Verbatim from the readiness assessment — engine verified against main 4–6 September 2026; platform reported as received and not independently verified.*

All three RPCs answer. **`ClassifyIntent` is genuinely model-backed** — it screens the utterance through a prompt-injection classifier, calls the Model Gateway with a classification prompt and parses the reply against a five-value taxonomy — rather than matching keywords the way the Planner does. **Its classification quality cannot be judged locally**: the mock provider returns one canned structured reply, so every utterance comes back `answer` at 0.9. That is the mock, not the classifier. Two defects found and fixed here (#120).

## Design-log alignment — `ALIGNED`

Design log §4 bucket 5 routes genuinely ambiguous outcomes here and nowhere else — never to retry or swap, because retrying an ambiguous-but-not-broken result just reproduces the same ambiguity.

## What the finished component looks like

- [ ] Different utterances return different intents against a real provider — the explicit Phase 1 done gate.
- [ ] The Clarification Loop reachable from Recovery's bucket 5.

## Open issues

None.

## Where this sits in the plan

See [`checklist.md`](../../checklist.md).

---

*Alignment key: `ALIGNED` the design log imposes no requirement this component fails · `NEEDS-LOGIC` the log supplies logic the component is missing · `CONFLICT` the log says something different from the current shape · `SILENT` the log does not cover this component.*
