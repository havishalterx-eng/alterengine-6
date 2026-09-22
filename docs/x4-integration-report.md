# Bringing alter-x-4-'s work into alterengine-6

**2026-09-22.** Every one of the 22 pull requests merged on `alter-x-4-` since our import (#172 to
#193, last merged 2026-09-19) was read against our design log, our recorded decisions and our
current code. **Short answer: keep all 22.** Nineteen come across as they are or with a small
adjustment, and three need real care. None has to be thrown away.

---

## The good news

- **No migration clashes this time.** In every service, their new migrations start exactly where
  ours stop: orchestration `0038`, intelligence `0007`–`0008`, eval `0009`–`0011`,
  platform-api `0019`–`0020`. The two-files-numbered-`0006` incident cannot repeat.
- **Most of it adds to ours rather than replacing it.** Their Planner decides *which strategy*;
  our C29 work decides *which step owns which success criterion*. Same files, different jobs.
- **It comes with measurements.** Two test sets written before the rewrites, and scores against
  them. Those become our regression tests for free.

## Two things their code shows are wrong on OUR side

1. **Our "replan" replans nothing.** In our tree the Planner's `revise_skeleton` is a stub that
   returns the same plan with "Stub revision: no changes applied." Our 2.4a test proved the right
   plan *reaches* the Planner — which is true and still worth having — but the Planner then
   changes nothing. Their #174 makes replan real. **Phase 2's closure needs this caveat recorded.**
2. **Our C2 breaks every environment set up before it.** `mock` used to be the default for
   `ALTER_CONFIG_SOURCE`; our schema now rejects it and the bootstrap's merge mode keeps old values,
   so platform-api would refuse to start, `db:migrate` included. Their #180 is exactly the safety
   net that is missing.

## Every pull request, and what to do with it

**Keep = take as it is. Adapt = take it, then fit it to ours. Care = keep, but read the note.**

| # | What it does, plainly | Verdict | How it fits our style |
|---|---|---|---|
| 172 | Planner test set v2, written before the rewrite | Keep | Becomes our Planner regression test |
| 173 | Planner asks a model which strategy to use; old rules kept as backup | Adapt | **Closes 4.1**: 35/36, above the 0.90 floor. Re-add our criteria assignment on top, then rerun #172's test |
| 174 | Replan and manager-worker plans become real instead of stubs | Keep | Fixes our stub replan. No test set exists for replan yet — open one |
| 175 | Architecture test set v1, written before the rewrite | Care | Encodes product rules (gate before every outside action, personal data needs verification, residency limits capabilities). **Record them as decisions** so Track D can judge them, not inherit them silently |
| 176 | Constraints decide where safety gates sit | Adapt | **Closes 4.2**: 24/24. Re-add our criteria carrying on top |
| 177 | Run constraints and tenant residency actually reach the synthesizer | Keep | Without it 4.2 never affects a real run |
| 178 | Compiler turns joins into Merge nodes and branches into routing Gates | Keep | Frozen component — record before landing |
| 179 | Agents' own instructions reach the model | Keep | Changes a proto contract; run `buf breaking` |
| 180 | Script permission fix, plus a safe config-source fallback | Adapt | Permission fix we already have. **Keep the fallback under our C2 split**; keep `PLATFORM_API_CONFIG_SOURCE` only as a warned, deprecated alias |
| 181 | Marketplace migrations get a runner, applied by `db:migrate` | Keep | Likely the cause of the missing `MARKETPLACE_DATABASE_URL` our builder hit |
| 182 | A branch can route to a verified action | Keep | Frozen component — record |
| 183 | Voice removed from the build | Keep | Executes our own cut, design log §33 (task 5.1) |
| 184 | Tenant owners set their data residency | Keep | New capability |
| 185 | Approval only before tools that change something, not every tool | Keep | **The prerequisite our C8 idempotency gate has been missing** — you cannot avoid re-sending unless you know what sends |
| 186 | Workspace-level safeguard defaults | Care | Decides **where** approval nodes go. Our §16 decides **how** each behaves (four modes). Compatible, but check their node supports §16's four modes; if not, open an item |
| 187 | Every plan uses the workflow's safeguards; a workflow can add but not remove | Keep | Agrees with §16's "keep the node, never delete it" reasoning |
| 188 | Fixes access checks and proves the approval route | Keep | **Closes 6.3** |
| 189 | Planner uses only the canonical tool list | Keep | Same Planner files as 173 — land together |
| 190 | Human Actions tabs show approvals, escalations and clarifications | Adapt | They call it B6; **ours is B6 already** (trigger delete). Rename. Must keep the engine's approval enum (decision 0.5) |
| 191 | A tool argument can take another step's output | Care | Safe design: whole-value references only, no text splicing, malformed ones fail the step. Frozen compiler and registry — record. Note for Track D: a model's output now flows into an outside action, which approval gates must cover |
| 192 | Alter's own fixed prompts skip personal-data redaction | Care | Carefully done: an explicit marker, never on tenant-written text. **Model Gateway has five dependents** — needs your explicit yes |
| 193 | One instruction file, `AGENTS.md`, for every coding agent | Adapt | **Better than ours.** Our builders run Codex, which never reads `CLAUDE.md`. Adopt it and fold in any rule of ours it lacks |

## How to do it in our build style

1. **One commit per pull request, in their order.** One reviewable unit per feature, and it
   handles #187 depending on #186.
2. **Record before touching frozen components** (standing rule 1). This import changes Graph
   Compiler (#176, #178, #182, #191), the node registry (#179, #191) and Model Gateway (#192).
3. **Re-apply our C29 work on their Planner and synthesizer**, then **rerun both of their test
   sets**. Our criteria assignment changes the Planner's prompt, and that could cost points on
   35/36. Their test set is how we find out.
4. **Write their product decisions into our record** as "adopted from alter-x-4-", from #175 and
   #186 especially. Track D decides whether they stay.
5. **Finish with a merge record** that tells git we now hold their work up to #193. This is the
   fix for my squash-merge of #9, and it is what makes the *next* import cheap instead of hard.
6. **CI green on the final head before merging**, checked against the API.

## Suggested order

1. Planner and test sets together: 172, 173, 174, 189 — then our C29 criteria assignment on top.
2. Synthesizer and compiler: 175, 176, 177, 178, 182, 191 — then our criteria carrying on top.
3. Safeguards and approvals: 185, 186, 187, 188.
4. Platform and small items: 179, 181, 183, 184, 190, 192.
5. Config and instructions: 180 folded into C2, 193 adopted.
6. Merge record.

**Pause C29 slice 2b until step 1 lands.** 2b is built on the Planner, and building it on the one
being replaced means building it twice.

## What this does to our board

Closes **4.1, 4.2, 4.3, 5.1, 6.3**. Opens: a replan test set, a check of §16's four approval
modes, and a relabel of their B6. Reopens Phase 2 with a caveat: the plumbing is proven, the
replan logic was a stub until #174. Unblocks progress on **C8**.
