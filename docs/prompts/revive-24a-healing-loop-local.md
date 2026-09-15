# Master prompt — Project Revive, task 2.4a: the healing loop, everything provable locally

**Supersedes the first half of `revive-24-prove-the-healing-loop.md`,** which required real
Bedrock for all six steps. Four of those six do not need a model provider at all. This task
takes those four. Task 2.4b takes the two that genuinely need one.

**Needs Docker. Does NOT need AWS or Bedrock.** Confirm you have a working Docker daemon
before accepting. If Docker is denied, stop and say so — do not write this blind, and do not
ask for broader permissions than Docker.

---

```
You are the Builder on Project Revive.

Repo:  https://github.com/havishalterx-eng/alterengine-6
Clone it fresh into your own workspace. Do NOT work in
~/Desktop/alterengine-6 -- that is the CEO session's clone.

alter-x-4- and alterengine--5 are frozen for you. Their containers may be
RUNNING on this machine. Do not stop them. Work around them -- the compose
ports are parameterised for exactly this (task C16).

You do NOT edit docs/memoryalter.md, docs/checklist.md or docs/progress.md.

READ FIRST, in this order:
  1. docs/verification-standard.md -- binding
  2. docs/checklist.md, the Phase 2 block
  3. docs/memoryalter.md section 5, the entries dated 2026-09-14 -- the
     import and the three defects it produced
  4. docs/local-dev.md and scripts/bootstrap-env-local.sh
  5. CLAUDE.md

State before you start: what you read, and that Docker works.

WHY THIS TASK EXISTS

Phase 2's code -- steps 2.1, 2.2 and 2.3 -- was written on alter-x-4- by
other people and merged here on 2026-09-14 as PR #9. It passes CI. CI
proves 136 files build and their suites pass together. It proves nothing
about whether the engine heals.

Standing rule 3: a builder report is not evidence, and neither is somebody
else's demonstration in another repository.

SCOPE -- FOUR STEPS, ALL PROVABLE WITHOUT A MODEL PROVIDER

Bring the stack up from committed configuration using
scripts/bootstrap-env-local.sh, on offset ports if a sibling stack is
running. The committed default is ALTER_CONFIG_SOURCE=mock and it needs no
AWS credentials -- keep it that way.

  1. A run executes and one node fails with a real, named cause that
     reaches Recovery. You do NOT need a model to produce this: a tool
     failure, a sandbox non-zero exit, or a deliberately malformed node
     input all produce an authentic failure with a code. Pick one, say
     which, and show the code and detail that arrive at Recovery.

  2. Recovery classifies that failure and selects a strategy. Show the
     code, the class and the strategy. #150 and #151 added codes the
     classifier can act on -- verify they arrive, rather than assuming.

  3. Replan runs from the PERSISTED TASK SKELETON and produces a new plan.
     This is the step that had never once succeeded before #145: replan
     used to send a compiled DAG where the planner parses a TaskSkeleton.
     Show the skeleton row it replanned from, and the plan it produced.

  4. The outcome is summarised into Memory via propose-writeback, under
     memory-service's OWN service credential (#144, #146), naming the
     tenant explicitly on the outcome-summary route (#147). Then a drift
     score is computed, persisted, and READ BACK AS THE OWNING TENANT --
     not as a superuser, not with row-level security disabled. Reading it
     as that tenant IS the requirement (#142 added the agent subject).

EXPLICITLY OUT OF SCOPE, and they are task 2.4b

  - Producing the failure via a real model returning prose where JSON was
    required. That needs Bedrock.
  - Showing the drift score change the NEXT SELECTION -- binding the same
    requirement again and a different agent winning. That needs real
    embeddings, so it needs Bedrock too.

  Do not attempt either. Do not simulate them. If you find that one of the
  four in-scope steps secretly depends on a real provider, STOP and report
  that -- it is a more valuable finding than a workaround.

VERIFICATION ARTEFACT, per verification-standard.md

  An end-to-end test driving steps 1 to 4 against the real local stack,
  asserting on real state: a real failure row, a real recovery record with
  its class and strategy, a real memory row, a real drift score selected as
  the owning tenant.

  - PROVE IT FAILS. Break one link deliberately -- revert the drift_read
    policy to model and provider only, or point replan back at the compiled
    DAG -- and paste the verbatim failure. Restore, paste it passing.
  - Wire it where it runs without anyone remembering. If it cannot run in
    CI, name what runs it and how often. "Someone will run it manually" is
    not an answer.
  - Nothing in it may be permanently red.

HARD CONSTRAINTS

  - Do not weaken a type, a policy or an assertion to make something pass.
  - Do not disable row-level security to read the drift score.
  - Check for a competing pnpm process before install/add/update.
  - If you retry the same thing more than twice, STOP and report what you
    tried. Five layers of workarounds in one shell is how task 1.5's live
    attempt went wrong, and every fix lived only in that shell.
  - Never force-push. Never delete a branch. Never --no-verify.
  - Do NOT merge. Open a pull request and stop.

REPORT

  Verbatim output for each of the four steps, not summaries. The verbatim
  failure of your artefact when you broke it, and what you broke. The
  verbatim pass afterwards. Anything you could not observe, named, with
  what stopped you. Any step where the imported code did something other
  than what this prompt says it does -- that is the most valuable thing you
  can report, and three such defects were already found in four CI runs.
```
