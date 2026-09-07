# Voice

**Layer** engine · **Plane** contracts only · **Category** 4 — build from scratch

> Either never implemented, or implemented in a shape that reproduces the flaw when ported.

## What it is

A declared voice surface: number binding, call handling, outbound calls, account health.

## Blast radius and fail mode

| | |
|---|---|
| Blast radius | `nothing` |
| Fail mode | `fail-closed` |

*Proposed, not ratified.* Design log §29 lists per-component blast radius and fail mode as an open item — *"not yet applied to any specific component list."* These are a first pass, to be confirmed when the component's contract is written.

## Where the code lives

**Nowhere.** No implementation exists in this repository.

## Current state

*Verbatim from the readiness assessment — engine verified against main 4–6 September 2026; platform reported as received and not independently verified.*

`VoiceService` declares six RPCs — `BindNumber`, `GetNumberBinding`, `ConfigureCallHandling`, `InitiateCall`, `GetAccountHealth`, `GetCapabilities` — and **no implementation was found under `apps/`**. No telephony vendor appears anywhere in the repository. Listed as the honest reading of a contract with nothing behind it.

## Design-log alignment — `SILENT`

**The design log never mentions voice once.** Not deferred the way Project Mode is explicitly deferred in §23 — simply absent. This is the one place the assessment and the design log disagree about what the product is. Needs a telephony vendor, a number-provisioning story, and a decision about whether voice is in the first release at all (decision 0.6).

## What the finished component looks like

- [ ] Either ships with a chosen vendor, or is **explicitly cut** and its contract marked as such, so it stops appearing in counts as pending work.

## Open issues

None.

## Where this sits in the plan

See [`checklist.md`](../../checklist.md) — task **5.1**.

---

*Alignment key: `ALIGNED` the design log imposes no requirement this component fails · `NEEDS-LOGIC` the log supplies logic the component is missing · `CONFLICT` the log says something different from the current shape · `SILENT` the log does not cover this component.*
