# Master prompt — Project Revive, Track B batch 1: the small platform items

**Three items. B5 first, because it is the one that lies.** None of these depends on the
engine or on each other. This is the plan's highest value per hour and nothing has ever
started it.

**No Docker needed for B4 and B-vocab.** B5 needs the platform stack up to verify. Say which
you can run before accepting.

---

```
You are the Builder on Project Revive.

Repo:  https://github.com/havishalterx-eng/alterengine-6
Clone it fresh into your own workspace. Do NOT work in
~/Desktop/alterengine-6 -- that is the CEO session's clone.

You do NOT edit docs/memoryalter.md, docs/checklist.md or docs/progress.md.

READ FIRST:
  1. docs/verification-standard.md -- binding
  2. docs/checklist.md, Track B
  3. docs/phase-0-decisions.md, decision 0.5
  4. docs/components/trigger-management/README.md,
     docs/components/run-experience/README.md,
     docs/components/project-studio/README.md,
     docs/components/human-action-centre/README.md
  5. CLAUDE.md

State before you start: what you read, and what you can run.

B5 -- TRIGGER MANAGEMENT IS SILENTLY LYING. TAKE THIS FIRST.

  testTrigger and removeTrigger report success without calling anything.
  A control that claims to have deleted something and has not is worse
  than one that does nothing visible. Design log section 5.5 (fail-closed)
  and section 7 pattern 1 both forbid it.

  Wire both to the real routes. Where a route does not exist, say so and
  make the control fail honestly rather than succeed falsely -- a visible
  "not available" beats a false success, and that is the point of the item.

B4 -- FOUR MISSING ROUTES, ADDITIVE AND SAFE

  Run cancel, run retry-node, GET /projects, GET /projects/:id. The
  frontends for all four already call them; the routes do not exist. C5 Run
  Experience's stop and retry call actions/cancel and actions/retry-node,
  and C7 Project Studio's list and detail have nothing to call. Nothing
  depends on these, and they touch no existing route.

B-vocab -- THE APPROVAL VOCABULARY

  From decision 0.5, closed 2026-09-08 from design log section 22 item 8:
  the engine's enum is canonical and the PLATFORM moves. The Human Action
  Centre sends status=open; the API accepts
  pending / approved / rejected / expired. Only `expired` overlaps.

  Move the platform side. Do NOT add `open` to the engine's enum -- the
  approval inbox is a Platform-side read model over the engine's durable
  decision record, and a read model maps onto its source, never the
  reverse.

VERIFICATION ARTEFACT, per verification-standard.md

  The failure mode this whole track exists to kill is a control that
  reports success without a call behind it. So the artefact must assert on
  the CALL, not on the rendered result:

  - B5: a test that fails if testTrigger or removeTrigger returns success
    without issuing a request. Prove it fails -- stub the route away and
    show the test catching the silent success. That is the same defect,
    reproduced.
  - B4: a contract test per route that fails when the route is absent or
    its shape changes.
  - B-vocab: a test asserting the platform sends a value the API's enum
    accepts, which fails if `open` comes back.

  Wire them into CI. Unwired is undone.

HARD CONSTRAINTS

  - Do not add `open` to the engine's enum.
  - Do not weaken a type or an assertion to make something pass.
  - Check for a competing pnpm process before install/add/update.
  - If you retry the same thing more than twice, STOP and report.
  - Never force-push. Never delete a branch. Never --no-verify.
  - Do NOT merge. Open a pull request and stop.

REPORT

  Verbatim output. Each artefact's failure and its pass. For B5
  specifically: show what the control did BEFORE your change, verbatim --
  the false success is the evidence the fix was needed.
```
