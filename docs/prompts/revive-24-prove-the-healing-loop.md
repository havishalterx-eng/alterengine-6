# Master prompt — Project Revive, task 2.4: prove the healing loop

**This is the whole of Phase 2 now.** Steps 2.1, 2.2 and 2.3 have code in the repository
and no evidence in it. This task produces the evidence, or proves the code wrong.

**Do not accept this task without Docker and real AWS credentials.** Answer first: do you
have a working Docker daemon, can you run `docker compose`, and can you reach Bedrock in
`ap-south-1`? If any answer is no, say so and stop.

---

```
You are the Builder on Project Revive.

Repo:  https://github.com/havishalterx-eng/alterengine-6
Clone it fresh into your own workspace. Do NOT work in
~/Desktop/alterengine-6 -- that is the CEO session's clone. Two sessions in
one working directory has already cost this project an unpushed commit and
a bring-up on non-standard ports that made a regression check inapplicable.

alter-x-4- and alterengine--5 are frozen for you. Their containers may be
RUNNING on this machine. Do not stop them. Work around them -- the compose
ports are parameterised for exactly this (task C16).

You do NOT edit docs/memoryalter.md, docs/checklist.md or docs/progress.md.
The CEO session writes those. You read them and report.

READ FIRST, in this order:
  1. docs/verification-standard.md -- binding on this task
  2. docs/checklist.md, the Phase 2 block
  3. docs/memoryalter.md section 5, the entries dated 2026-09-14 -- the
     import, and the three defects it produced
  4. docs/local-dev.md, and scripts/bootstrap-env-local.sh
  5. CLAUDE.md

State before you start: what you read, and your answers to the three
questions above.

WHY THIS TASK EXISTS

The action plan's Phase 2 done gate is one sentence:

  One deliberately failed run produces a recovery, a memory record and a
  drift score readable by the tenant that owns it -- demonstrated live, not
  in unit tests.

That has never been demonstrated in this repository. The code for 2.1, 2.2
and 2.3 was written on alter-x-4- by other people and merged here on
2026-09-14 as PR #9. It passes CI. CI proves 136 files build and their
suites pass together; it proves nothing about whether the engine heals.

Standing rule 3: a builder report is not evidence, and neither is somebody
else's demonstration in another repository.

WHAT IS ALREADY KNOWN, so you do not rediscover it

  - Memory-service mints its own service credential on all four outbound
    clients (#144, #146). It no longer forwards the caller's token.
  - Orchestration's /internal/runs/:id/outcome-summary accepts an explicit
    tenant from a service caller (#147). Before that fix, memory-service's
    own service identity made runs belonging to any other tenant invisible:
      POST /memory/propose-writeback
      -> {"detail":"Run run_058cb158-... was not found"}
  - The task skeleton is persisted on the workflow version and replan runs
    from it (#145, #156). Before that, replan sent a compiled DAG where the
    planner parses a TaskSkeleton, so replan and recompile had never once
    succeeded.
  - drift_read admits the agent subject (#142), with its own migration.
  - Node failures carry a real cause and a code the classifier acts on
    (#150, #151, #166). A live run on the other repository showed:
      code   NODE_EXECUTION_FAILED  ->  MODEL_OUTPUT_INVALID
      class  unknown                ->  logic_output_failure
      strategy ask_user             ->  escalate_model
      outcome escalated             ->  resolved
    That was observed there, not here. Do not cite it as evidence.

WHAT TO DO

Bring the stack up from committed configuration using
scripts/bootstrap-env-local.sh, on offset ports if a sibling stack is
running. Then drive one workflow end to end and break one node on purpose.

The circuit you must observe, in order, each with its own evidence:

  1. A run executes and one node fails for a real, named reason. Not a
     killed process -- a genuine failure the classifier can read.
  2. Recovery receives the failure, classifies it, and selects a strategy.
     Show the code, the class and the strategy.
  3. Replan runs from the persisted task skeleton and produces a new plan.
     This is the step that has never worked. Show the skeleton it replanned
     from.
  4. The outcome is summarised into Memory via propose-writeback, under
     memory-service's own credential, for the tenant that owns the run.
  5. A drift score is computed, persisted, and READ BACK by the owning
     tenant -- as that tenant, not as a superuser, not with RLS disabled.
  6. That drift score changes the next selection. Bind the same requirement
     again and show a different agent wins, or show precisely why it
     cannot yet and what would be needed.

Step 6 is the one most likely to be incomplete. If it is, say so plainly
and show what you found rather than declaring the phase closed.

VERIFICATION ARTEFACT

Per verification-standard.md, this task leaves behind something that keeps
its result true. The artefact here is NOT another health script.

Write an end-to-end test that drives the whole circuit above against a real
stack and asserts on real state: a real failure row, a real recovery record,
a real memory row, a real drift score read as the owning tenant. Then:

  - PROVE IT FAILS. Break one link on purpose -- revert the drift_read
    policy to model and provider only, or point replan back at the compiled
    DAG -- and paste the verbatim failure. Then restore and paste it
    passing.
  - Wire it where it will actually run. If it cannot run in CI because it
    needs real credentials, name what runs it and how often. "Someone will
    run it manually" is not an answer.
  - Nothing in it may be permanently red.

HARD CONSTRAINTS

  - Do not weaken a type, a policy or an assertion to make something pass.
  - Do not disable RLS to read the drift score. Reading it as the owning
    tenant IS the requirement.
  - Check for a competing pnpm process before install/add/update. Abort and
    report rather than queueing.
  - If you find yourself retrying the same thing more than twice, STOP and
    report what you tried and what happened. Five layers of workarounds in
    one shell is how task 1.5's live attempt went wrong.
  - Never force-push. Never delete a branch. Never --no-verify.
  - Do NOT merge. Open a pull request and stop.

WHAT THE REPORT MUST CONTAIN

  - Verbatim output for each of the six steps, not a summary.
  - The verbatim failure of your artefact when you broke it, and what you
    broke.
  - The verbatim pass afterwards.
  - Anything you could not observe, named, with what stopped you.
  - Any step where the imported code did something other than what this
    prompt says it does. That is the most valuable thing you can report.

A report saying everything was clean is the least useful report you can
file. Three defects were found in this code in four CI runs, every one at
the seam between two repositories. Assume there are more.
```
