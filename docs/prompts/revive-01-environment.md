# Master prompt — Project Revive, task 1.1: prove the stack runs and keep it running

**First task of Project Revive.** Paste into a builder session.

---

```
You are the Builder on Project Revive — bringing the existing Alter Engine
back to a working state.

Engine repo:  https://github.com/havishalterx-eng/alter-x-4-
Record repo:  https://github.com/havishalterx-eng/alterengine-6

READ FIRST, in this order:
  1. alterengine-6 docs/memoryalter.md — sections 1, 3, 5 and 6.
     Section 1 gives you the finish line. Section 5 tells you what bit
     the last people. Section 6 tells you which components you must not
     touch.
  2. alterengine-6 docs/checklist.md — Phase 1 and the standing rules.
  3. alter-x-4- README and whatever local-development docs it ships.

State before you start: what you read, and what you understand the task
to be.

WHY THIS TASK IS FIRST

The assessment's sharpest finding was not a defect. It was this:
components went unassessed because the local stack could not be started,
and that is the same mechanism that produced the previous wrong count.
People classified components from a source read because running them was
undocumented research rather than a step.

#122 and #123 fixed that. Five services were started together from one
file with no overrides — eighteen distinct ports, every health endpoint
answering. But nothing keeps it fixed. The next person to add a service
or change a port breaks it silently, and the count goes wrong again.

Your job is to prove it still works today, and to leave behind something
that fails loudly when it stops working.

WORKING LOCATION

Clone to a permanent path — NOT /private/tmp, which macOS cleanup
deletes piecemeal (it ate the previous working clone: root files gone,
.git corrupted). ~/Desktop/alter-x-4- or similar.

WHAT TO DO

1. Bring up the full local stack from the configuration the repository
   ships. No hand-edits, no overrides, no "just set this one variable" —
   if it does not start from what is committed, that is the finding.

2. Prove it is up. For every service, paste the actual health response,
   not a summary. List every port actually bound. The prior verified
   state was eighteen distinct ports with every health endpoint
   answering — say whether that still holds and name any difference.

3. Dispatch a real two-node workflow, compiled from a task skeleton, and
   show it complete. The prior verified run took 15.85s with the second
   node's prompt carrying the first node's output under "Upstream node
   output". Paste the actual run output.

4. Then break something on purpose and confirm the stack tells you.
   Stop one service and show what the health check reports. A stack that
   reports healthy while a service is down is the #124 failure again —
   that healthcheck grew from four assertions to ten without raising its
   5s timeout, so ten calls taking 7.4s made Docker kill every probe and
   record exit -1: the container reported unhealthy forever with all
   eight resources present.

5. Write a regression check that asserts the stack is genuinely
   healthy — every expected service, every expected port, and a real
   response from each, not just a container in "running" state. It must
   be runnable as one command and it must fail when a service is
   missing. Prove it fails by running it with a service stopped.

CONSTRAINTS

- Do NOT change the logic or code of any component listed in
  memoryalter.md section 6 Category 1. Those 25 are the only verified
  value in the system. If one of them is what stops the stack starting,
  report it and stop — do not fix it.
- Fix nothing beyond what actually prevents the stack from starting.
  This is not a cleanup pass.
- If a fix needs a design decision, do not pick one. Report the options
  and stop.
- If you find yourself retrying the same thing more than twice, STOP and
  report. Do not burn turns in a loop.
- Do not merge. Open a PR and stop; review happens first.

REPORT

Structure it as:
  - What you read and what you understood the task to be
  - The verbatim health output for every service
  - The verbatim two-node run output
  - What the health check said when you stopped a service
  - The regression check, and the verbatim output of it failing
  - Anything that did not start from committed configuration, and
    exactly what you changed to get past it
  - Anything about the repository that was awkward, wrong, or
    undocumented

A report saying everything was clean is the least useful report you can
file. The last four components nobody had called produced three real
defects the moment someone called them.
```
