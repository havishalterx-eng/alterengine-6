# Import alter-x-4- #172–#193 into alterengine-6 — context and master prompt

**For a Codex builder.** Part A is the context you need and cannot get elsewhere. Part B is the
task. Read both in full before touching anything. **Part B begins with a planning round: send back
your plan and your disagreements, and do not write code until Havish or the CEO session replies.**

---

## PART A — CONTEXT

### What Alter is

A system that takes a business problem, decides what team of agents should exist to solve it,
runs them, checks the result against real external systems, and repairs itself when a piece
breaks. Nx + pnpm monorepo: 15 apps, 6 packages, TypeScript/NestJS and Python/FastAPI.

### Two repositories, one engine

- **`havishalterx-eng/alterengine-6` — the live repository. Everything you produce goes here.**
- **`havishalterx-eng/alter-x-4-` — read-only for you.** Never push, comment, open issues or
  pull requests there. Two engineers, Surya Teja and Satwik Gogu, build there and it is
  sanctioned. You are importing their work, not coordinating with them.

Both descend from one commit, `d5ea2a2`. On 2026-09-14 their work up to their #170 was imported
here as **PR #9**, and it was **squash-merged**. A squash erases ancestry, so git no longer knows
this repository already holds their #127–#170. **That is why a plain `git merge` of their main
will not work**: it reports 63 new commits and 161 conflicting files, when the real work is 22
pull requests and 19 genuinely overlapping files. Your import fixes this permanently (step B6).

### What this repository has that theirs does not

Do not lose any of it:

- **The record.** `docs/memoryalter.md` (append-only decisions and findings), `docs/checklist.md`
  (the work list), `docs/progress.md`, `docs/verification-standard.md`, 61 component pages under
  `docs/components/`, and the design log at `docs/architecture/design-log.md`.
- **Infrastructure:** port parameterisation (C16), the env bootstrap (`scripts/bootstrap-env-local.sh`,
  C21), identity-checking health script (C23), application port parameterisation (C24).
- **C2 — the config split.** `RUNTIME_MODE` answers *real or mock*; `ALTER_CONFIG_SOURCE` answers
  only *where real configuration lives* (`appconfig` or `local-file`). Scoped per-service override
  variables were deliberately collapsed into this.
- **C29 slices 1 and 2a — success criteria.** Criteria travel from `ProblemSpec` through the task
  skeleton, the architecture and the compiled DAG to the stored workflow version (PR #14). The
  Planner assigns each intake criterion to named nodes, and validation fails both an intake
  criterion assigned to no node **and** a criterion on a node that was never in the intake list
  (PR #15). The global list stays at the root for the end-of-run check.
- **Track B batch 1 (PR #12):** honest trigger controls, four routes, the platform adopting the
  engine's approval vocabulary `pending|approved|rejected|expired`.
- **The 2.4a healing-loop test**, `apps/orchestration-service/src/recovery/healing-loop.integration.spec.ts`.

### What their 22 pull requests add, verified against our code

Full analysis: **`docs/x4-integration-report.md` — read it.** In short:

- **Phase 4 is done there.** Planner test set v2 written first (#172), then the Planner rewrite
  (#173): **35/36 live, above the 0.90 floor**, keyword rules kept as backup, fallback proven.
  Architecture test set v1 written first (#175), then the synthesizer rewrite (#176): **24/24**.
- **Two things wrong on OUR side that their code fixes.** Our Planner's replan is a stub returning
  the same plan unchanged (#174 makes it real). And our C2 rejects `ALTER_CONFIG_SOURCE=mock`,
  which every pre-C2 `.env.local` still contains, so platform-api refuses to start there (#180
  has the fallback).
- **No migration clashes.** Their new migrations start exactly where ours stop: orchestration
  `0038`, intelligence `0007`–`0008`, eval `0009`–`0011`, platform-api `0019`–`0020`. **Verify
  this yourself before trusting it**; two different files both numbered `0006` once merged with
  no conflict and broke alembic at runtime.

### Rules — non-negotiable, and they apply to you

1. **Work in `~/alter-work/<your-name>`**, a fresh clone. Never a deep scratch path: a clone eleven
   directories down made vitest's file discovery run forever. Never `~/Desktop/alterengine-6`.
2. **Node 22** (`.nvmrc`). Node 20 fails Testcontainers with `webidl.util.MarkAsUncloneable`.
3. **Build the workspace packages before running app tests**, or six of nine spec files fail on
   `Failed to resolve entry for package "@alterx/contracts"`.
4. **vitest does not typecheck.** Run the `typecheck` target before claiming green.
5. **Run the affected set, not the set you edited:** `pnpm exec nx affected -t lint,typecheck,build,test`
   against the merge base. A previous slice was reported green on the projects it edited and failed
   CI on another project it had also changed.
6. **If you touch `packages/contracts`, regenerate the OpenAPI artifact:**
   `node packages/contracts/scripts/generate-openapi.mjs`, and commit `packages/contracts/openapi.json`.
7. **Do not edit `docs/memoryalter.md`, `docs/checklist.md` or `docs/progress.md`.** The CEO session
   writes them. Report what they should say instead.
8. **Frozen components (standing rule 1).** Twenty-five Category 1 components are frozen; changes need
   a recorded exemption first. See step B1.
9. **Check for a competing `pnpm` process** before install/add/update. Abort and report, never queue.
10. **Retry the same thing twice, then stop and report.** Do not stack workarounds in a shell.
11. **Never force-push. Never delete a branch. Never `--no-verify`. Do not merge.** Open a pull request
    and stop.
12. **CI is proven by the API, not the watch command:** `gh run view <id> --json conclusion`, and
    confirm the run's head matches the pull request's head.

---

## PART B — MASTER PROMPT

```
You are the Builder on Project Revive. Your task is to bring 22 pull
requests from alter-x-4- into alterengine-6 on a staging branch, convert
each one to fit this repository's design and build conventions, prove
the result, and open ONE pull request against main. Do not merge it.

READ FIRST, in this order:
  1. This file, Part A, in full.
  2. docs/x4-integration-report.md -- the per-PR verdicts.
  3. docs/architecture/design-log.md sections 4, 5, 7, 16 and 33.
  4. docs/memoryalter.md, every entry dated 2026-09-14 onwards.
  5. docs/verification-standard.md.
  6. PRs #14 and #15 on alterengine-6 -- the C29 work you must preserve.

B0. PLANNING ROUND -- NO CODE YET

  Before writing anything, send back:
    - what you read;
    - your plan, in the order you will land the pull requests;
    - every place you think this file or the integration report is WRONG,
      incomplete, or risky. Disagreement is wanted. The report's author
      reads code and can be mistaken; two diagnoses in the recent record
      were withdrawn after someone checked more carefully;
    - anything you need decided.
  Then STOP and wait for a reply.

B1. FROZEN COMPONENTS -- CHECK THE RECORD BEFORE EACH ONE

  These pull requests change Category 1 components:
    Graph Compiler:   #176, #178, #182, #191
    Node registry:    #179, #191
    Model Gateway:    #192   (five direct dependents -- highest blast radius)

  Before landing any of them, confirm docs/memoryalter.md contains a
  dated exemption entry covering that component FOR THIS IMPORT. The
  existing C29 exemption covers Graph Compiler only for carrying success
  criteria, not for these changes. If the entry is not there, land
  everything else and STOP at the first frozen pull request. Report which
  entry you need.

B2. STAGING BRANCH

  git clone into ~/alter-work/<your-name>
  git checkout -b import/x4-172-193 origin/main
  git remote add x4 https://github.com/havishalterx-eng/alter-x-4-.git
  git fetch x4 main

B3. BRING EACH PULL REQUEST ACROSS, ONE UNIT EACH, IN THIS ORDER

  Use `git cherry-pick <sha>` for ordinary commits and
  `git cherry-pick -m 1 <sha>` for the four MERGE commits.

      #172  9a155c7
      #173  bf123da
      #174  53afd3e
      #175  2962f8f
      #176  711c983
      #177  d71056c
      #178  b1f6ca3
      #179  5af8703
      #180  3482d9b   MERGE  -m 1
      #181  6340a3f   MERGE  -m 1
      #182  d7333ce
      #183  6388b6c
      #184  dcd1df0
      #185  746a02b   MERGE  -m 1
      #186  77b169f   MERGE  -m 1
      #187  01257c7
      #188  c74f150
      #189  3337f1e
      #190  4684fa2
      #192  4f4e89c
      #191  b36924f
      #193  092f148

  THE TRAP: their log also shows the individual commits INSIDE those four
  merges (36c7535, 38ec4ca, 17d6e45, 22976f7, 0385419, 62f9556, d824a86,
  9a5fa42). DO NOT pick those as well. `-m 1` on the merge already carries
  their net change; picking both applies it twice. The first parent of each
  merge was verified to be the previous main commit, so `-m 1` yields
  exactly that pull request's change.

  Order note: #192 landed before #191 on their side. Keep their order.

  After EACH one: resolve conflicts, then build and run the affected tests
  before the next. A problem traced to one pull request is cheap; the same
  problem found after twenty-two is not.

B4. CONVERT AS YOU GO -- this is what "fit our design" means

  a. C29 on top of their Planner and synthesizer (at #173/#174/#189 and at
     #176/#178/#182/#191).
     Their rewrites replace files our C29 slices changed. Re-apply our
     criteria carrying and our criteria assignment ON TOP of their code,
     including the two-way validation. Do not keep our older Planner.
     Their strategy selection and our criteria assignment do different
     jobs and must both survive.
     THEN RERUN THEIR PLANNER TEST SET (#172) AND ARCHITECTURE TEST SET
     (#175). Report the scores. Criteria assignment changes the Planner's
     prompt and may cost points on 35/36; that number is how we find out.

  b. #180 folded into our C2.
     Skip its script-permission change -- this repository fixed that on
     2026-09-08. Keep its config-source fallback, adapted to our split:
       - ALTER_CONFIG_SOURCE=appconfig|local-file: use it.
       - ALTER_CONFIG_SOURCE=mock (a pre-C2 leftover): treat as local-file
         and log ONE warning pointing the user at RUNTIME_MODE.
       - PLATFORM_API_CONFIG_SOURCE: honour it as a DEPRECATED alias, warn
         once, and do NOT add it to .env.local.example.
     Carry their tests for this, re-pointed at our variable names. Our
     platformApiConfigSource() is currently a bare pass-through; theirs is
     the logic to use.

  c. #190 relabelled.
     They call this "B6". Ours is B6 already (a trigger can never be
     deleted). Use a neutral name in code, commits and the PR. Keep the
     engine's approval vocabulary pending|approved|rejected|expired
     (decision 0.5): the platform maps onto the engine, never the reverse.

  d. #193 adopted.
     Their AGENTS.md becomes the single instruction file and CLAUDE.md
     imports it. Fold in any rule from our current CLAUDE.md it lacks.
     This matters: our builders run Codex, which never reads CLAUDE.md,
     so our rules have been invisible to them.

  e. Product decisions surfaced, not silently inherited.
     #175 and #186 encode rules made outside our design log -- "a gate
     before every external action", "personal data requires verification",
     "residency restricts capability eligibility", workspace safeguard
     defaults a workflow can add to but never remove. Do NOT edit the
     record. List each rule in your report with the design-log section it
     touches, so the CEO session can record them as decisions adopted from
     alter-x-4-.

  f. Check design log section 16 against #186/#187.
     Their safeguards decide WHERE an approval node goes. Section 16 says
     each approval node has one of FOUR modes: always block, auto-approve,
     auto-reject/skip on timeout, approve-once-then-promote. Report whether
     their approval node supports those modes. Do not build them; report.

  Everything else comes across as it is.

B5. PRESERVE OUR TESTS

  These must still pass unchanged after the import:
    - apps/orchestration-service/src/recovery/healing-loop.integration.spec.ts
      (2.4a). #174 changes recovery; the test asserts what the Planner
      RECEIVES, so it should survive. If it breaks, report why rather than
      editing the assertion.
    - The C29 tests from PRs #14 and #15.
    - scripts/check-*.sh gates and scripts/bootstrap-env-local.sh --check.

B6. RESTORE THE ANCESTRY -- LAST, AND ONLY AFTER ALL 22 ARE IN

  git merge -s ours x4/main -m "Record alter-x-4- as merged through #193"

  This tells git the repository now contains their work through #193
  without changing a single file. It is what makes the NEXT import a
  normal merge instead of this. Running it before every pull request is
  in would falsely claim work this repository does not have.
  Verify afterwards: git merge-base origin/main x4/main should return
  x4/main's head.

B7. VERIFY, THEN OPEN THE PULL REQUEST

  - pnpm exec nx affected -t lint,typecheck,build,test against the merge
    base, plus both test sets' scores.
  - Push the branch, open ONE pull request against main, watch CI, and
    report the run id and its API conclusion with the head sha.
  - Do not merge.

REPORT -- verbatim output, not summaries

  1. Per pull request: landed cleanly / landed with conflicts (which files,
     how resolved) / blocked (why).
  2. Both test-set scores after conversion, against their 35/36 and 24/24.
  3. Every frozen-component file changed, per component.
  4. The product rules from B4e, each with its design-log section.
  5. The section 16 finding from B4f.
  6. Anything in this file or the integration report that turned out to
     be wrong. That is the most valuable part of the report.

  A report saying everything was clean is the least useful one you can
  file. Two defects in the last import were found only at the seam
  between the two repositories.
```
