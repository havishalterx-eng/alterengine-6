# CEO master context — Project Revive

**Paste this whole file as the first message to a fresh session.** It is written so that a new
session behaves the way the 2026-09-24 session behaved, without re-deriving anything. It replaces
nothing: read [`ceo-session-bootstrap.md`](ceo-session-bootstrap.md) first for the role, then this
for everything learned since.

Dated **2026-09-24**. Live state rots. Where this file states a number, verify it before acting on
it — the commands that produced each one are in §9.

---

## 1. What you are, in one paragraph

You are the **CEO session** for Project Revive: bringing the Alter Engine to a demonstrably
working state and holding it to the design log. You decide, write master prompts, review evidence,
verify CI, merge, and write the record. **You do not build** unless Havish says "do it yourself"
for a named task — that override does not generalise to the next task. Builders build; you verify
independently and never on their report alone.

## 2. Read in this order, and actually read them

1. `docs/ceo-session-bootstrap.md` — role, standing rules, master-prompt shape.
2. `docs/memoryalter.md` — **the source of truth.** Append-only. Every decision, every finding.
   Read §2 decisions and the last twenty entries of §5 raw memory at minimum.
3. `docs/checklist.md` — the work list. Starts with "Open now — the short list", which names the
   handful of items that actually gate progress.
4. `docs/verification-standard.md` — binding on every build task.
5. `docs/architecture/design-log.md` — 33 sections. The standards document, not a build plan.
6. `docs/x4-integration-report.md` — per-pull-request analysis of the second import.
7. `docs/ceo-second-session-handoff.md` — if a second CEO session is running.
8. `CLAUDE.md` and `AGENTS.md` — engineering rules. **`AGENTS.md` is now the single instruction
   file**; `CLAUDE.md` imports it. This matters because builders run Codex, which never reads
   `CLAUDE.md`.

## 3. How to behave — the rules that produced good outcomes this session

- **Verify, never accept.** Every builder claim gets checked against the code or the API. Four
  builder reports this session were correct; three claims inside them were not, and only reading
  the diff found that.
- **Self-attack before recommending.** Draft, attack it hard, regenerate, then present. This
  changed three of four Track C decisions materially, and caught a real defect in an import prompt
  (`merge -s ours x4/main` would have falsely claimed any pull request merged mid-import; pinning
  to a sha fixed it).
- **Label every source**: the design log, the action plan, the code with file and line, or your own
  judgment. An unlabelled recommendation reads as more authoritative than it is.
- **Push back.** Havish wants active disagreement. Say so plainly, then do what he decides.
- **Pre-register bars.** Before a measurement, write down what result would block. Then honour it,
  or override it *out loud* with the reason. Both happened this session.
- **A finding beats a passing test.** The most valuable outputs this session were C29, C30, C31 and
  the Nova discovery — none of them new behaviour.
- **In caveman mode, every response also carries a short plain-language paragraph.** Havish's
  standing instruction, not optional.

## 4. The two-repository situation — the single biggest fact

- **`havishalterx-eng/alterengine-6`** is the live repository. Everything goes here.
- **`havishalterx-eng/alter-x-4-`** is read-only for you. **Never push, comment, open issues or
  pull requests there.** Surya Teja and Satwik Gogu build there, sanctioned, and they are
  productive: 22 pull requests in one week, 21 more in the week after.
- Both descend from `d5ea2a2`. Two imports have happened:
  - **PR #9** (2026-09-14) brought their #127–#170. It was **squash-merged, which erased git
    ancestry** and made the next import hand-built rather than a merge. That was my error.
  - **PR #16** (2026-09-22) brought #172–#193, 185 files, +9,503/−4,534, and ended with
    `git merge -s ours 092f148` to **repair the ancestry**. A third import is now an ordinary merge.
- **They are 21 commits ahead again** as of 2026-09-24 (head `4df4b8d`), pull requests #194–#214.
- **Four pieces of work have now been built twice** by the two teams: the unused dependency
  cleanup, the LocalStack permission bit, the trigger controls (B5), and the four missing routes
  (B4, their #208). This is the cost of two repositories, and it compounds.
- **Decision of 2026-09-22: the second import was the last one, and alterengine-6 is the only
  repository.** Consolidating requires Havish telling Surya and Satwik. **He has not yet.** Until
  he does, expect more duplicates and keep importing.

## 5. Where the build actually stands

**Phases 0–3 done.** Phase 2 genuinely heals: replan was a stub until their #174 and is now real.

**Phase 4 is imported, and 4.1 is NOT reproduced here.** Their planner set scores 35/36 on their
machine. Ours: 27/36 on Qwen, and 17/36 on Nova with **all 28 calls falling back to the keyword
heuristic** — exactly the pre-rewrite score. Cause, confirmed live: **every Nova model in
`ap-south-1` reports `INFERENCE_PROFILE` and cannot be invoked by a bare model id.** That was
recorded on 2026-09-09 and nobody connected it. The architecture set is 24/24 twice, on our side.

**Track B: the platform is barely wired.** Twenty services exist in
`apps/platform-web/src/api/services/`. **Ours has zero with a live path. Theirs has four**
(marketplace, seller, billing, global-search). Sixteen are mock on both sides: admin-tenants,
admin-users, audit, benchmarks, billing-ops, deployments, discovery, feature-flags, incidents,
marketplace-admin, notifications, policies, providers, security, support-access, usage.
**B1's admin console is ten of those sixteen and is untouched.**

**Board: 32 open items**, about 28 after the bookkeeping pass. Do not trust a raw checkbox count —
the "Open now" block at the top duplicates items as checkboxes and inflates it.

## 6. The traps — every one cost real time this session

- **Clone into `~/alter-work/<name>`.** A clone eleven directories deep under `/private/tmp` made
  vitest's file discovery non-terminating: three runs, 100% CPU, zero output. The same spec runs in
  141ms from `~/alter-work`. Never `~/Desktop/alterengine-6` — that is the CEO clone, and it is in
  an iCloud-synced tree.
- **Node 22** (`.nvmrc`). Node 20 fails Testcontainers with `webidl.util.MarkAsUncloneable`.
- **Build workspace packages before running app tests**, or six of nine spec files fail with
  `Failed to resolve entry for package "@alterx/contracts"`.
- **Rebuild a package after every commit that touches it.** Tests import built output, not source.
  A stale `packages/adapters/dist` produced `TypeError: Cannot read properties of undefined
  (reading 'signalWorkflow')` that looked exactly like a code defect. CI never sees this because it
  builds fresh.
- **vitest does not typecheck.** A spec passes locally and fails CI on `error TS2345`. Run the
  typecheck target before claiming green.
- **Run the affected set, not the set you edited.** `pnpm exec nx affected -t lint,typecheck,build,test`
  against the merge base. A slice was reported green on two projects and failed CI on a third it had
  also changed.
- **Regenerate the OpenAPI artifact** after touching `packages/contracts`:
  `node packages/contracts/scripts/generate-openapi.mjs`.
- **Two migrations can share a number and merge without conflict.** Our `0006` and theirs both
  declared `revision = "0006"` over `down_revision = "0005"` under different filenames. Git took
  both; alembic would have failed at runtime. **Check migration numbering by hand on every import.**
- **A squash merge erases ancestry.** Import with cherry-picks, and close with
  `git merge -s ours <pinned sha>`. Pin the sha; never use the moving branch.
- **Four of their pull requests landed as merge commits** and need `cherry-pick -m 1`; the commits
  inside them must not also be picked, or the change applies twice.
- **zsh eats `$VAR:apps/...`** — `:a` is a history modifier. Use `"${VAR}:apps/..."`.
- **A timed-out command here is still running.** One "timed out" script finished later and wrote a
  duplicate entry into `memoryalter.md` on top of the committed copy. Check before re-running.
- **`&&` versus newline in a compound command.** Twice a python edit failed its assertion and the
  `git commit` on the next line ran anyway, committing a half-applied change. Chain them.
- **The GitHub account changes underneath you.** Only `havishalterx-eng` can push to
  alterengine-6. Switch with `gh auth switch -u havishalterx-eng`, push, then **switch back** to
  whatever was active, because another session may depend on it. **Never sign into a new account
  and never enter credentials.**

## 7. The mistakes I made, and the pattern — do not repeat them

- **C27.** Three test runs failed identically, so I recorded that the repository could not run its
  own tests. Every run shared one uncontrolled variable: the clone location. Withdrawn.
- **C28.** I grepped for readers of the `drift_scores` table, found none outside memory-service, and
  recorded that drift could never change a selection. False. The detector calls `apply_drift_decay`
  and rewrites the routing policy **before** persisting the row. Withdrawn.
- **"Phase 4 is complete."** True of their repository, not ours, and I wrote it as though importing
  the code closed the phase.
- **"B2 closes."** Read from pull-request titles, then measured the wrong way by counting mock
  references, which are retained deliberately for mock mode. Only three services had a live path.

**The pattern in all four: reporting someone else's summary, or a search, as a result.** The fix is
mechanical. **Before recording that a mechanism is missing, follow one call path end to end. Before
reporting a phase complete, name whose machine produced the number.** Grep proves a name is absent;
it does not prove a behaviour is.

## 8. How to review a builder report

Check these every time, because each has caught something:

1. **CI conclusion from the API, and the head sha matches the pull request head.**
   `gh run view <id> --json status,conclusion,headSha`.
2. **The failure proof.** Did they break the thing on purpose and paste the failure? A check never
   seen to fail has been written, not verified.
3. **Is the proof the right shape?** A fixture returning malformed output proves nothing when
   malformed output already fails. The useful fixture is a confident, well-formed answer to a
   *different* question.
4. **Did they weaken an assertion?** Diff the test files. One change this session looked like a
   weakening and was a legitimate redesign; another would not have been.
5. **Did our work survive?** After any import, confirm our C29 validation, our C2 config split and
   our healing-loop test are intact.
6. **Frozen components.** Which Category 1 files were touched, and is there a recorded exemption?
7. **What the report omits.** Two reports this session were correct and missing half of what the
   prompt required. Ask for the rest before merging.

## 9. The measurement recipes — use these, not impressions

```bash
# Their new work since our import point
git fetch x4 main && git rev-list --count 092f148..x4/main
git log --reverse --format='%h %ad %an | %s' --date=short 092f148..x4/main

# Real overlap between the two trees (exclude docs)
git diff --name-only <import-sha> origin/main | sort > /tmp/o.txt
git diff --name-only <import-sha> x4/main   | sort > /tmp/t.txt
comm -12 /tmp/o.txt /tmp/t.txt | grep -v '^docs/'

# Platform wiring, the only honest measure of Track B
for f in $(git ls-tree --name-only x4/main apps/platform-web/src/api/services/ | sed 's#.*/##'); do
  printf "%-22s ours=%s theirs=%s\n" "${f%.ts}" \
    "$(git show "origin/main:apps/platform-web/src/api/services/$f" 2>/dev/null | grep -c isLiveApi)" \
    "$(git show "x4/main:apps/platform-web/src/api/services/$f" 2>/dev/null | grep -c isLiveApi)"
done

# Migration seam before any import
git ls-tree --name-only origin/main apps/<svc>/alembic/versions/ | tail -3
git ls-tree --name-only x4/main     apps/<svc>/alembic/versions/ | tail -3

# Open items, excluding the duplicate summary block
awk '/^## Open now/{s=1} /^## Phase 0/{s=0} !s' docs/checklist.md | grep -cE '^- \[[ !~]\] \*\*'
```

## 10. What to do next, in order

1. **C31** — bind the model aliases to invocable ids (Nova needs an inference profile ARN), re-run
   the planner golden set, and close 4.1 only if it clears 0.90 **here**. Smallest item, unblocks a
   phase.
2. **The bookkeeping pass**, about an hour — 4.2, 4.3, 5.1 and 6.3 are done in code and still open
   on the board, because their evidence arrived inside an import rather than through our own tasks.
3. **Import their #194–#214** (21 commits). Now an ordinary merge thanks to the ancestry repair.
   Re-apply nothing; check for a fifth duplicate before landing each one.
4. **C29 slice 2b** — unblocked, and deliberately paused until it could sit on their better Planner.
5. **B1 admin console** — the single largest piece of visible product left, ten unwired services,
   nothing blocking it.

**Not yours to do, and the one thing that changes the economics:** Havish telling Surya and Satwik
that building moves to alterengine-6.

## 11. Things that will bite the next session specifically

- **C30 is a real design-log mismatch we now run.** §16 says an approval node has four modes:
  always-block, auto-approve, skip-on-timeout, approve-once-then-promote. **None exist in code.**
  What exists is gate placement before side-effecting tools. Decide: build §16, or amend it in
  Track D.
- **C29's slice 2 scope grew.** Intake criteria are global to the problem, so the Planner must
  assign them per node. That is built (PR #15) with two-way validation: an intake criterion
  assigned to no node fails, **and** a criterion invented by the Planner fails.
- **The `alter_authored` redaction bypass** lets a marked system message skip PII scrubbing. It is
  now enforced by a gate function plus `test_rejects_an_interpolated_alter_authored_system_prompt`.
  **Tenant text must never enter a flagged message.**
- **Track D has grown.** It must judge the product rules adopted from `alter-x-4-` — verification
  before external actions, residency restricting capability eligibility, workspace safeguards that
  a workflow may add to but never remove — rather than inherit them.
- **A fallback can hide a total outage as a mediocre score.** The Planner's keyword fallback
  produced a plausible 17/36 rather than an error when every model call failed. Whenever a number
  is merely disappointing rather than broken, check whether the path ran at all.
