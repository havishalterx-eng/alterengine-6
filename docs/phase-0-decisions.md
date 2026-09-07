# Phase 0 — decisions

**No code. Written answers are the deliverable.** Each question below carries what the
codebase actually says, the options, and a recommendation. The recommendation is not the
decision — fill in **Answer** and it becomes one, then it moves to
[`memoryalter.md` §2](memoryalter.md#2-decisions) as the record.

Two of the action plan's five are already closed from the design log and are shown here for
completeness. Three remain, plus two of ours.

**Done when** every question has a written answer with its rationale, and each is linked
from its issue. No code has changed.

---

## 0.1 — memory credential · **blocks all of Phase 2**

**The question.** Memory forwards its caller's token to an endpoint that derives tenancy
from the token itself, and minting a tenant-scoped one is off the table since #113. Either
that endpoint accepts a tenant explicitly alongside a service credential, or the cycle
stays.

### What the code says

The cycle is exact, and both halves are readable.

Memory **has** the tenant and deliberately throws it away —
`apps/memory-service/src/memory_learning/orchestration_client.py:51`:

```python
del tenant_id  # Tenant comes from validated service token at orchestration ingress.
```

It then forwards the caller's `authorization` header verbatim to
`GET /internal/runs/{run_id}/outcome-summary`.

Orchestration's side of that route —
`apps/orchestration-service/src/runs/run-learning.controller.ts:22`:

```typescript
const tenantId = request.actorContext?.tenant_id;
if (tenantId === undefined) {
  throw new HttpException(problem(request.url, 500, "RUN_LEARNING_INTERNAL",
    "Missing authenticated tenant context"), 500);
}
```

`actorContext` is populated by the Session Gateway from a **user** token. Memory presents a
**service** token, which produces no actor context, so `tenant_id` is undefined and the
route 500s. Memory cannot mint a user token; orchestration will not read a tenant off the
wire. Neither side is wrong on its own.

### The part that matters

**The answer is already written in this repository, in the module on the memory side** —
`apps/memory-service/src/service_auth.py`, under the heading *"ON TENANT IDENTITY — a
correction worth stating plainly"*:

> An earlier draft of the review said "derive tenant_id from the credential, never from the
> request". That is right for a user-facing edge and **WRONG for these internal services,
> which are legitimately called on behalf of many tenants by a trusted caller.** The real
> defect was never that tenant_id travels on the wire — it is that nobody checked whether
> the caller was entitled to assert it. **Authenticate the asserter and the message-borne
> tenant becomes sound.**

That reasoning was applied to memory-service's own inbound edge and never carried across to
orchestration's. The cycle is not an open design question — it is a pattern this codebase
already chose, applied on one side only.

### Options

| | Approach | Cost | Risk |
|---|---|---|---|
| **A** | Orchestration's `/internal/` route accepts an explicit tenant alongside a service credential, guarded by the same asserter-authentication pattern `service_auth.py` documents. Memory stops discarding `tenant_id` at line 51. | Small. An additive parameter, a guard, and one deleted line. | Low. The pattern is already proven on the memory side and at `apps/ads-core/src/deletion/router.py`. |
| **B** | Mint a tenant-scoped token for service-to-service calls. | Large. | **Ruled out already.** #113 removed the Auth0 `organization` parameter because an Alter tenant UUID was never a valid namespace there. |
| **C** | Leave it. | None. | The healing loop does not exist, and half the finish-line demo is unreachable. |

### Recommendation

**A.** It is the pattern the codebase already documents and already uses. Add the guard
`service_auth.py` describes: authenticate that the caller is a real service, then validate
the asserted tenant's format and bind it against a tenant claim where one exists — rather
than banning the field.

One caveat worth stating plainly: today every service presents the **same** shared token, so
this authenticates *that the caller is a service*, not *which service*. That is acceptable
now — `service_auth.py` says so explicitly, and pairs it with per-service security groups —
but it means the tenant assertion is trusted at the granularity of "any Alter service." When
per-service Auth0 M2M applications exist, the same call sites tighten without changing.

**Answer:**

**Approved 2026-09-08 — option A, with two additions found by attacking the first draft.**

Orchestration's `/internal/` routes accept an explicit tenant alongside a service credential, per the pattern `service_auth.py` already documents and `ads-core/src/deletion/router.py` already uses. Memory stops discarding `tenant_id` at `orchestration_client.py:51`.

**Two additions the first draft missed.** The original recommendation made tenant isolation — design log §2, the first locked decision — depend on a shared secret held by every service, and did not say so. Therefore:

1. **A mismatch refuses explicitly, with a named reason.** `run-outcome.service.ts:236` already queries `WHERE tenant_id = $1 AND run_id = $2` inside `withTenant()`, so a wrong assertion already returns nothing — but as an indistinguishable "not found" rather than a refusal. Fail-closed means saying why.
2. **Every service-asserted tenant is audited.** The shared credential is the weak point; the trail is what makes a leak recoverable.

**Stated limitation.** Every service presents the same token today, so this authenticates *that the caller is an Alter service*, not *which one*. Acceptable now, tightens to RS256 per-service verification when M2M applications exist, with call sites unchanged.

Recorded as design log **§30**. Implementation is task 2.1.

---

## 0.2 — recovery contract · **closed 2026-09-08**

**The question.** Is `CompiledDag` or `TaskSkeleton` canonical for `replan` and `recompile`?

**Answer.** `TaskSkeleton`.

**Rationale.** Design log §24 states that Recovery's `replan` / `recompile`
*"jumps from the run path back into the **design path**."* The design path is L1→L5, and L5
(Graph Compiler) is what *produces* the DAG. Re-entering the design path therefore means
entering **above** the compiler, so replan must hand back what that path consumes, not what
it emits. The current code sends the run path's output back as the design path's input,
which inverts the crossing.

**What this unblocks.** Two of eight dispatchable Recovery strategies are dead today. This
revives them. Implementation is task 2.2.

**Note.** The action plan lists this as answerable only by the user. It was already answered
in the design log and never carried into code.

---

## 0.3 — auto-creation tier · **blocks Phase 3** · [#125](https://github.com/havishalterx-eng/alter-x-4-/issues/125)

**The question.** Auto-creation hardcodes tier while eligibility filters on that column, so
an agent created for an unmet tier requirement still fails it. Creating at the requested
tier converges but lets any caller conjure a `CEILING`-tier agent.

### What the code says

`apps/intelligence-service/src/agent_auto_creation/engine.py:32` — the tier is a string
literal inside the insert:

```sql
(id, tenant_id, workspace_id, name, tier, persona_description, status)
VALUES (..., :name, 'STANDARD', :persona_description, 'draft')
```

There is **no idempotency machinery at all** in that module — no unique constraint, no
`ON CONFLICT`, no idempotency key. Three identical requests genuinely produce three rows,
and nothing bounds a retrying caller.

**Two separable problems.** Idempotency is not a tier question and should be fixed
regardless of which option below is chosen. The action plan says the same: *"whatever the
tier decision, also make the no-match path idempotent per tenant, workspace and capability
set."*

### Options

| | Approach | Tradeoff |
|---|---|---|
| **A** | **Refuse above a ceiling.** Create at the requested tier up to a configured maximum; above it, fail the bind and say why. | The action plan's own read: *"safer, and makes the failure visible."* Costs a real failure path where an expensive requirement simply cannot be met. |
| **B** | **Create at the requested tier, unbounded.** | Converges — the created agent satisfies the requirement that triggered it. But any caller can conjure a `CEILING`-tier agent, which is a spend vector rather than a bug. |
| **C** | **Create at the requested tier, bounded by spend caps.** Design log §9 already requires a pre-flight budget gate, a per-run hard cap, a per-workflow period budget, and threshold alerts. Let cost control the abuse rather than a tier ceiling. | Correct on paper and the most honest of the three — the objection to B is cost, and §9 exists to control cost. But it depends on the budget gate existing, which it does not yet (task C10, Run Manager). Choosing C means the ceiling is unenforced until that lands. |

### Recommendation

**A now, C later, and say so in the answer.** The ceiling is a small config value and it
makes the failure visible today, which is the property that matters while nothing is
watching spend. Revisit once Run Manager's atomic budget gate exists — at that point the
tier ceiling becomes redundant and can be lifted deliberately rather than forgotten.

Fix idempotency in the same pass either way.

**Answer:**

**Approved 2026-09-08 — reframed after attacking the first draft.**

The first draft treated this as a cost question. It is primarily a **correctness** question: the engine creates an agent that cannot satisfy the requirement that triggered its creation, and the failure surfaces several steps downstream where the cause is no longer recoverable.

**Three parts:**

1. **Idempotency leaves Phase 0 entirely.** It is not a policy decision, nobody disagrees about it, and it is corrupting tenant data now — every retry permanently adds an agent row. Fix immediately as its own ticket, unique on tenant + workspace + capability set.
2. **Never create a doomed agent.** When the requested tier exceeds policy, **fail the bind with a named reason** rather than substituting a cheaper agent that will fail the same filter.
3. **The ceiling is a config value, defaulting to `STANDARD`, raisable per deployment** — not a constant, and not a global judgment about what tiers should exist.

Revisit once Run Manager's atomic budget gate exists (task C10): spend caps address the real objection to unbounded tiers, and the ceiling should then be lifted deliberately rather than left in place by inertia.

Recorded as design log **§31**. Implementation is task 3.3, with idempotency pulled out ahead of it.

---

## 0.4 — requirements map · **latent** · [#117](https://github.com/havishalterx-eng/alter-x-4-/issues/117)

**The question.** Who fills `node_requirements` on the architecture path — the compiler by
re-resolving, or the caller who already decided?

### What the code says

Verified directly. **Nothing reads the stored column.** Both consumers resolve fresh at run
time:

- `apps/orchestration-service/src/registry/nodeexec.service.ts:386` — the Executor calls
  `resolve_node_requirements` and builds `node_requirements_json` per node.
- `apps/orchestration-service/src/recovery/recovery-dispatch.service.ts:343` — Recovery does
  the same.

Three places **write** it: `graph-compiler.service.ts:191`,
`template-variables.service.ts:211`, and the architecture path (which writes `{}`). The
column is a stored answer nothing consumes — which is exactly why it is latent, and exactly
why it will bite the first reader rather than the current ones. An audit view or a cost
estimate reading it would be told the workflow requires no capabilities at all.

### Options

| | Approach | Tradeoff |
|---|---|---|
| **A** | Compiler re-resolves on the architecture path, same as the skeleton path. | Consistent. But re-decides something the caller already committed to, and a second resolution can disagree with the first. |
| **B** | **Derive from the architecture and binding decision the caller already supplied.** | Uses data already committed to rather than re-deciding it. The action plan's own read: *"this reads best."* |
| **C** | Declare the column skeleton-path-only, and have the version record which path produced it. | Honest, and cheapest. But leaves two shapes of `workflow_versions` row, and every future reader has to know the difference. |

### Recommendation

**B.** It matches the design log's general instinct against re-deciding committed data, and
it is the only option where the column means the same thing however the version was made.
Do it during Phase 3 while the architecture path is still fresh in someone's head, not later.

**Answer:**

**Approved 2026-09-08 — option B, with the residual problem recorded rather than hidden.**

The architecture path copies the requirements map from what the caller already supplied. Verified in code that this is nearly free: `architecture_synthesizer/models.py:115` validates `request.node_requirements` against the node keys, so the data is present at the call site and is simply not persisted.

**What attacking the first draft found.** Filling the column leaves the system with two sources for one fact — the stored map, and the fresh resolution the Executor (`nodeexec.service.ts:386`) and Recovery (`recovery-dispatch.service.ts:343`) each perform at run time. That is design log §7 pattern 4, duplicated primitives drifting apart, arrived at from the other direction. **Option B does not close that.**

The clean resolution is for run-time consumers to read the stored value instead of re-resolving, or for the column to be deleted as redundant. **Deferred, because it touches the Executor, which is frozen during revival.** Logged as a Track C item so it is not forgotten.

Recorded as design log **§32**. Implementation is task 3.6.

---

## 0.5 — action vocabulary · **closed 2026-09-08**

**The question.** The Human Action Centre sends `status=open`; the API accepts
`pending·approved·rejected·expired`. Only `expired` overlaps. One side has to move.

**Answer.** The **engine's** enum is canonical. The platform moves.

**Rationale.** Design log §22 item 8 makes the approval inbox a **Platform-side read model**
built on top of the engine's durable approval decision record. The engine holds that record
because it is execution evidence feeding the audit chain and §16's promotion logic. A read
model maps onto its source, never the reverse.

**Implementation.** Task B-vocab.

---

## 0.6 [+] — Voice and Repository Manager scope

**Not in the action plan's Phase 0** — the plan handles both in Phase 5. Listed here because
Phase 5 cannot be scoped until this is answered, and because both keep appearing in counts
as pending work in the meantime.

### What the code says

**Voice.** `VoiceService` declares six RPCs — `BindNumber`, `GetNumberBinding`,
`ConfigureCallHandling`, `InitiateCall`, `GetAccountHealth`, `GetCapabilities` — with no
implementation under `apps/` and **no telephony vendor anywhere in the repository.**

**Repository Manager (C9).** Declared, never implemented, and unlike Deployment Manager it
has **no backend contract to build against** — no service, no RPCs.

### The part that matters

**The design log never mentions voice once.** Not deferred the way Project Mode is
explicitly deferred in §23 — simply absent. This is the one place the assessment and the
design log disagree about what the product is. Repository Manager is the same: absent from
the design log, present in the contracts as a declared surface.

Neither is an engineering question yet. Voice needs a vendor, a number-provisioning story,
and a decision about the first release. Repository Manager needs someone to say what it is
for.

### Recommendation

**Cut both from the first release, explicitly, and mark their contracts as cut.** Not
delete — mark. The finish-line demo needs neither, the design log anticipates neither, and
every week they stay ambiguous they distort the component count and every estimate built on
it. Cutting is reversible; ambiguity compounds.

If Voice is strategically important, that is a legitimate answer too — but then it needs a
vendor decision in the same breath, or it will sit exactly where it is.

**Answer:**

**Approved 2026-09-08 — cut both.**

**Voice: cut.** Six RPCs declared, no implementation under `apps/`, no telephony vendor in the repository. The first draft recommended this without checking whether a voice product elsewhere in the portfolio depended on this engine — that was the right question and it was asked: **Axon is a separate product and does not run on this engine.** Nothing outside the engine argues for keeping it, and the design log never mentioned it at all — unlike Project Mode, which §23 deferred explicitly.

**Repository Manager: cut.** Declared, never implemented, and unlike Deployment Manager it has no backend contract to build against. Nobody has stated what it is for.

**Cutting means removing or deprecating the declaration, not writing a note.** A contract that remains generates clients, appears in counts, and sits inside every estimate of remaining work — which is the cost that made this worth deciding.

Deployment Manager is **not** cut: its backend contract is real (`DeployctlService`, three RPCs) and only the surface is missing. It stays as task 5.3.

Recorded as design log **§33**.

---

## 0.7 [+] — status of the four architecture documents

### What they are

The design log is **document 1 of a five-document set**, all written 2026-09-01, all
currently outside this repository at `~/Desktop/alter engine rebuild/`:

| # | Document | Size |
|---|---|---|
| 1 | `alter-engine-rebuild-design-log.md` — decisions and reasoning | 29 sections |
| 2 | `alter-engine-component-contracts.md` — per-component contracts | **54 contracts, 2,100 lines** |
| 3 | `alter-engine-layer-architecture.md` — L1–L8 composition and inter-layer edges | 521 lines |
| 4 | `alter-engine-plane-architecture.md` — cross-cutting planes, Account/Control plane | 213 lines |
| 5 | `alter-engine-whole-architecture.md` — the engine as one system | 259 lines |

### The part that matters

Document 2 carries, **per component**, exactly the fields I marked *"proposed, not
ratified"* across all 61 component READMEs: `DRIVER` plus the test asserting the driver
exists, `FAILURE TARGET`, `BLAST RADIUS`, `FAIL MODE`, `PLANE DEPS`, `NON-RESPONSIBILITIES`,
and a `DONE GATE`. With reasoning attached to each, not just a value.

It also says of itself:

> once stable they become the per-component READMEs in the new repo (design log Section 6 —
> one folder per component)

Which is what `docs/components/` now is. **My first pass at blast radius and fail mode
should be replaced by document 2's, wherever the two describe the same component.**

**The catch.** Document 2 contracts **54 components of the ground-up rebuild**. The running
engine has **61**, and the lists are not the same — the rebuild's list includes components
that were never built (Side-Effect Ledger, Agent Factory, Public Surface, Deletion &
Retention) and omits things the running engine has. The overlap is large but partial, so
these are binding as *design intent*, not as a checklist against this codebase.

### Options

| | Approach | Tradeoff |
|---|---|---|
| **A** | **Binding.** Import all five into the repo, map the 54 contracts onto the 61 components, and replace the proposed blast-radius/fail-mode values with the contracted ones. Where a contract has no matching component, it becomes a design-log-compatibility item on Track C. | Real work — a mapping pass over 54 documents. But it closes design log §29's open item (*blast radius and fail mode "not yet applied to any specific component list"*) and gives every component a real done gate written before anyone touched it. |
| **B** | **Reference only.** Import them, cite them, but keep the component READMEs as the authority. | Cheaper. Loses the reasoning behind each field and leaves §29 open. |
| **C** | **Superseded.** They describe a build that was stopped. | Throws away the most complete architectural thinking that exists for this product, over a naming mismatch. |

### Recommendation

**A.** Documents 3, 4 and 5 are short and describe layer, plane and whole-system structure
that applies to the running engine unchanged. Document 2 is the valuable one and the only
one needing a mapping pass. Import all five into `docs/architecture/` first — they currently
exist in exactly one place, on one laptop, outside version control.

**Answer:**

**Approved 2026-09-08 — three different treatments, not one.**

The first draft said "binding," which would have made 54 contracts into gates against a codebase we have promised not to touch — manufacturing 54 blockers on day one, several of them against frozen Category 1 components.

1. **All five documents imported into `docs/architecture/`** — done 2026-09-08, unconditional and independent of everything below. They existed in one place, on one laptop, with no backup.
2. **`layers.md`, `planes.md`, `whole.md` — binding now.** They describe structure and impose no per-component obligation, so adopting them creates nothing to violate.
3. **`component-contracts.md` — split.** Adopt its `BLAST RADIUS`, `FAIL MODE`, `DRIVER` and `NON-RESPONSIBILITIES` fields to replace the proposed values across all 61 component READMEs. Treat its `DONE GATE` entries as **the target definition, not a gate that fails today.**

The mapping pass is real work — 54 rebuild components onto 61 running ones, overlapping but not identical lists, needing judgment rather than mechanical matching. Roughly a day. It closes design log §29's open item on blast radius and fail mode.

The repository copies are now canonical; the Desktop copies are a backup.

Logged as Track C task C13.

---

## Summary

| # | Question | Status | Blocks |
|---|---|---|---|
| 0.1 | memory credential | **closed** — explicit tenant + service credential, loud refusal on mismatch, audited | design log §30 |
| 0.2 | recovery contract | **closed** — `TaskSkeleton` canonical | design log §24 |
| 0.3 | auto-creation tier | **closed** — never create a doomed agent; ceiling is config; idempotency pulled out | design log §31 |
| 0.4 | requirements map | **closed** — copy the caller's map; residual pattern-4 risk recorded | design log §32 |
| 0.5 | action vocabulary | **closed** — engine's enum canonical | design log §22 |
| 0.6 | Voice / Repository Manager | **closed** — both cut, declarations removed | design log §33 |
| 0.7 | architecture documents | **closed** — imported; 3 binding, contracts split | Track C13 |

**Phase 0 is complete.** Every question has a written answer with its rationale. No code has
changed. Each answer was drafted, attacked, and regenerated — three of the five changed
materially under that attack, and the changes are described inside each answer.

### On the action plan's "linked from its issue"

The plan's done gate asks that each answer be linked from its issue. Those issues (#117,
#125) live on `alter-x-4-`, which is **frozen and not written to** — every artefact of this
project belongs in this repository.

The gate exists so a decision reaches whoever does the work. Here, that is not an issue
tracker: builders read `docs/components/<component>/README.md` and `docs/checklist.md`.
Creating two orphan issues in a repository with no issue workflow would satisfy the words
and miss the point.

So every decision is written onto the component page of every component it touches —
Memory & Learning, Audit Ledger, Agent Auto-Creation, the architecture compile path,
Recovery, the Human Action Centre, Voice and Repository Manager — each carrying the
decision, its rationale, a link back to this document, and the original issue number where
one existed.

When the team grows and an issue workflow exists in this repository, port the tracker
deliberately rather than seeding it with two entries nobody is watching.
