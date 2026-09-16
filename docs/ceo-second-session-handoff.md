# Handoff — a second CEO session

**Paste this whole file as the first message.** It exists so a second CEO session can work the
same board as the first without the two of them corrupting each other's record or each other's
merges.

Read [`ceo-session-bootstrap.md`](ceo-session-bootstrap.md) **first and in full**. It defines the
role, the standing rules, where truth lives, and how to write a master prompt. Everything there
applies to you unchanged. This file adds two things it cannot: what has happened since it was
written on 2026-09-09, and how two CEO sessions coexist.

---

## 1. The part that is new, and the part that bites

**There are now two CEO sessions on one repository.** That has already cost this project real
money once, in a different form: two *builders* shared one working directory and it produced an
unpushed commit and a bring-up on non-standard ports that invalidated a regression check. Two
CEOs is worse, because both write the record.

**The three CEO-owned files are `docs/memoryalter.md`, `docs/checklist.md` and
`docs/progress.md`.** Rules for them, non-negotiable:

1. **Always `git pull` immediately before editing any of the three, and push immediately after.**
   Never hold an edit to them across a long piece of work. A stale checklist is how the same task
   gets issued twice.
2. **`memoryalter.md` is append-only.** A correction is a **new dated entry that points at the old
   one**; the wrong entry stays. Two entries were corrected this way in the last two days and both
   corrections are more useful than the originals.
3. **If you hit a conflict in any of the three, do not resolve it by taking your side.** Read what
   the other session wrote, then merge both meanings. Losing the other CEO's finding is the only
   truly unrecoverable failure here.
4. **Never edit a checklist item that names a task the other session issued** unless you are
   closing it with evidence you personally verified.

**Split the work by track, not by file.** Agree with Havish which of you owns which of: the
engine phases, Track B (platform), Track C (design-log compatibility), Track D (conformance).
Two sessions inside one track will collide on prompts and on merges.

## 2. What is true as of 2026-09-16

**This section rots. Verify anything you are about to act on.** `checklist.md` and
`memoryalter.md` are the authority, not this list.

- **The repository moved from being frozen-adjacent to being the only live one.** `alter-x-4-`
  was declared frozen on 2026-09-08 and **that was never true in practice** — Surya Teja and
  Satwik Gogu kept building there, sanctioned, and by 2026-09-14 it was 29 commits ahead. That
  work was imported in **PR #9** (136 files), which brought Phase 2 and most of Phase 3. **They
  may still be pushing there.** Check before assuming this tree is complete.
- **Phase 0** closed. Seven decisions, design log §30–§33.
- **Phase 1** closed except **1.6**, which is blocked on buying Anthropic, OpenAI and E2B, plus
  two missing AppConfig applications. Real golden-set score: **21/30, 0.70**, on real Bedrock.
- **Phase 2 closed 2026-09-16.** 2.1/2.2/2.3 arrived in the import and were demonstrated here by
  **PR #10** (2.4a). 2.4b's two steps both landed as findings rather than demonstrations.
- **Phase 3** closed by the import: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6. **3.0 was superseded** — our
  auto-creation fix was replaced wholesale by theirs, which also fixed the tier.
- **Track B is 3 of 6.** B5, B4 and B-vocab closed by **PR #12**. B1, B2, B3 remain and are the
  bulk. **B6** is new: no route can delete a trigger at all.
- **Track C batch 1 is in flight as of 2026-09-16** — C23, C24, C22, C2 (carrying C15), C6, C25.
  **C2 rewrites every service's environment schema**, so review it for two things: the committed
  local default must still be `mock` and still boot with no AWS credentials (task 1.3), and the
  scoped overrides `AUDIT_CONFIG_SOURCE` and `MODEL_GATEWAY_CONFIG_SOURCE` must **disappear into**
  the new split rather than survive beside it.
- **Track D** is new and runs last: the whole design log against the whole system, after Phase 4,
  Track B and Track C. It is explicitly allowed to conclude *amend the log*.
- **C29 is written and not started.** It needs Havish's explicit exemption from standing rule 1,
  because the path crosses Graph Compiler, the Executor and the Verification & Quality Gate, all
  Category 1. The prompt is `docs/prompts/revive-C29-success-criteria-subsystem.md`. **It absorbs
  C9.**

## 3. Findings that cost hours to get, so nobody pays twice

- **Clone into `~/alter-work/`, never a deep scratch path.** A clone eleven directories down under
  `/private/tmp` made vitest's file discovery non-terminating: three runs, 100% CPU, zero output.
  The same spec runs in 141ms from `~/alter-work`. Recorded as C27, **withdrawn as a repository
  defect** because it never was one.
- **Node 22.** `.nvmrc` pins it. Node 20 fails Testcontainers with
  `webidl.util.MarkAsUncloneable`.
- **Build the workspace packages before running any app's tests**, or you get
  `Failed to resolve entry for package "@alterx/contracts"` on six of nine spec files.
- **`--reporter=basic` no longer exists in vitest 4** and resolving the missing reporter through
  the monorepo's module graph hangs.
- **vitest does not typecheck.** A spec can pass locally and fail CI on `error TS2345`. Run the
  project's `typecheck` target before claiming green.
- **Two migrations can both be numbered `0006`** under different filenames, and git merges both
  without reporting a conflict. Alembic then fails at runtime with two heads. Check migration
  numbers by hand on any import.
- **`scripts/bootstrap-env-local.sh` fills AWS credentials from LocalStack placeholders**, so
  sourcing the generated file breaks real AWS with `InvalidClientTokenId` while the real
  credentials are fine. That is C22, possibly fixed by batch C by the time you read this.
- **The Bedrock adapter wraps every response** as `{message, stop_reason}`, so `output_json`
  always parses and off-contract prose is accepted as a valid node result. That is C29's reason
  for existing.

## 4. Two mistakes I made that you are equally likely to make

Both were the same shape, two days running, and both were caught only by following a call path
instead of searching for a name.

- **C27:** three test runs failed identically, so I concluded the repository could not run its own
  tests. Every run shared one uncontrolled variable — the clone location — and that was the cause.
  Varying the thing under suspicion while holding the environment fixed **looked** rigorous.
- **C28:** I grepped for readers of the `drift_scores` table, found none outside memory-service,
  and recorded that drift could never change a selection. False. The detector calls
  `apply_drift_decay` and rewrites the tenant's routing policy **before** persisting the row, and
  selection reads those weights on every bind. `action_taken: "weight_decay"` is the record that
  it happened, not an intent nobody honours.

**The rule both would have obeyed: when you are about to record that a mechanism is missing,
follow one call path end to end first.** Grep proves a name is absent. It does not prove a
behaviour is.

## 5. How to behave, beyond the bootstrap's rules

- **Verify, never accept.** A builder report is not evidence. Read the diff, run the check,
  reproduce the number. PR #12's central claim — that no delete route exists — was true, and I
  only know that because I listed the controller's routes myself.
- **Watch CI to completion against the API**, not against the watch command's word.
  `gh run view <id> --json conclusion`. Main was red for six merges once because nobody looked.
- **Squash merge. Never delete a branch. Never force-push.**
- **Self-attack every recommendation before presenting it.** Draft, attack it hard, regenerate.
  Three of four Track C decisions changed materially under attack, and in two cases the better
  answer was not among the options first offered.
- **Say the source of every claim**: the design log, the action plan, the code with file:line, or
  your own judgment. An unlabelled recommendation reads as more authoritative than it is.
- **Push back.** Havish wants active disagreement when your judgment differs. He has said so
  explicitly and more than once.
- **A finding is often worth more than a passing test.** Two of the last three tasks produced no
  new behaviour and were the most valuable work of the week.
