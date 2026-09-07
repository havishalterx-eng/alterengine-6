# Architecture compile path

**Layer** L5 · **Plane** orchestration · **Category** 1 — works end to end

> **Do not change this component's logic or code during revival.** It is one of the 25 verified
> end to end on 4–6 September 2026, and it is the only verified value in the system. Anything
> necessary is recorded in [`memoryalter.md`](../../memoryalter.md) *before* it is made.

## What it is

The second route into the Graph Compiler: lowers a synthesized architecture into an executable DAG, rather than compiling from a task skeleton.

## Blast radius and fail mode

| | |
|---|---|
| Blast radius | `this-layer-only` |
| Fail mode | `fail-closed` |

*Proposed, not ratified.* Design log §29 lists per-component blast radius and fail mode as an open item — *"not yet applied to any specific component list."* These are a first pass, to be confirmed when the component's contract is written.

## Where the code lives

- `apps/orchestration-service/src/compiler`
- `apps/intelligence-service/src/architecture_synthesizer`

## Current state

*Verbatim from the readiness assessment — engine verified against main 4–6 September 2026; platform reported as received and not independently verified.*

Fixed in #116 and then run. The Synthesizer was dropping each node's config on the floor, so every DAG this path produced had nothing to execute. Both halves now carry it: synthesis returned two nodes holding their `model_alias` and `prompt`, `CompileArchitectureWorkflow` lowered them into a two-node DAG, and the run completed. **The counterfactual is the proof** — the same architecture with config stripped failed at the first node with `LLMTask requires a non-empty config.prompt string`, exactly what every architecture-path run hit before the fix.

## Design-log alignment — `NEEDS-LOGIC`

Still writes `node_requirements` as an empty object where the task-skeleton path resolves the real map (#117). Nothing reads that column at run time — both the Executor and Recovery resolve capabilities fresh — so it is latent rather than broken. It is a wrong answer waiting for its first reader: an audit view or a cost estimate would be told the workflow requires no capabilities at all.

## What the finished component looks like

- [ ] `node_requirements` carries a real map, per decision 0.4.

## Open issues

- [#117](https://github.com/havishalterx-eng/alter-x-4-/issues/117)

## Where this sits in the plan

See [`checklist.md`](../../checklist.md).

---

*Alignment key: `ALIGNED` the design log imposes no requirement this component fails · `NEEDS-LOGIC` the log supplies logic the component is missing · `CONFLICT` the log says something different from the current shape · `SILENT` the log does not cover this component.*
