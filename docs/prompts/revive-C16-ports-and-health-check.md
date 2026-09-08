# Master prompt — Project Revive, task C16: one source for ports, and a health check worth trusting

**Two halves of one problem.** The stack-health script cannot be trusted partly because ports
live in two places. Fixing the ports fixes both.

---

```
You are the Builder on Project Revive — bringing the existing Alter Engine
back to a demonstrably working state.

Repo:  https://github.com/havishalterx-eng/alterengine-6
Clone it fresh into your own workspace. Do NOT work in
~/Desktop/alterengine-6 — that is the CEO session's clone.

alter-x-4- and alterengine--5 are frozen and read-only. Their containers
may be RUNNING on this machine. Do not stop them, do not touch them.
Working around them is the point of this task.

You do NOT edit docs/memoryalter.md, docs/checklist.md or
docs/progress.md. Read them; report what you found.

READ FIRST:
  1. docs/verification-standard.md — binding, and this task exists
     because an artefact failed it
  2. docs/memoryalter.md — section 5, "The regression check did not help
     the first time it was needed"
  3. scripts/verify-local-stack-health.sh — read its header, which
     documents its own two failures honestly
  4. docker-compose.yml
  5. CLAUDE.md

State before you start: what you read, and what you understand the task
to be.

WHY THIS EXISTS

Task 1.0 produced scripts/verify-local-stack-health.sh. It has never been
usable:

  - Task 1.3 ran services on ports 3133-3138 to dodge a collision, so the
    script — which hardcodes committed ports — could not check them. The
    services were verified by hand instead.
  - The CEO session then could not bring the stack up at all:
    `Bind for 127.0.0.1:6379 failed: port is already allocated`, because a
    frozen sibling checkout's containers hold every port this compose file
    wants.

Both limitations are already written into the script's own header, which
is honest and does not help. A check that only works in one configuration
is a check that will keep not being there when wanted, and this one has
now cost three separate tasks.

PART A — ONE SOURCE FOR PORTS

docker-compose.yml hardcodes FOURTEEN host ports: 5432, 5433, 5434, 5435,
6379, 4566, 7233, 8233, 3200, 4317, 4318, 3300, 5001, 5002. Not one is
parameterised.

So a second checkout of this project on one machine is dead on arrival.
That is not hypothetical: alter-x-4-'s stack has been up for two weeks
holding 5432, 5433, 5434, 6379, 4566 and 7233, and alterengine--5's holds
5440, 6390 and 7240.

Parameterise every host port with the CURRENT VALUE AS THE DEFAULT, so
nothing changes for anyone who sets nothing. `${ENGINE_DB_PORT:-5433}`
shape. Add them to .env.local.example, and make C21's bootstrap
(scripts/bootstrap-env-local.sh) carry them through.

Do NOT invent an offset scheme or a second compose file. One
parameterised file, defaults unchanged.

PART B — MAKE THE HEALTH CHECK TRUSTWORTHY

Two defects, both admitted in its own header.

  1. NINE OF TWENTY-SIX CHECKS READ DOCKER'S CACHED STATUS via
     `docker inspect .State.Health.Status`, rather than probing. Docker
     runs a real command, but on its own 5s interval, so a container that
     just died still reads healthy for up to one interval. That is
     process state, and docs/verification-standard.md requirement 1 says
     real behaviour instead. Replace all nine with fresh probes —
     pg_isready, redis-cli ping, and so on, run at check time.

  2. PORTS ARE HARDCODED sandbox values. After Part A they come from the
     same place the services read them. Read them from there; do not
     duplicate the list.

PART C — GIVE IT A DRIVER

CI's gate job already runs four scripts/check-*.sh gates. C21's
bootstrap --check joined them and is the only verification artefact in
this project that has ever acquired a driver.

Wire this one in too, or — if CI genuinely cannot bring a stack up —
say precisely what does run it and how often. "Someone will run it
manually" is not an answer. An unwired check is verifyChain() again:
machinery with no caller, creating confidence nothing supports.

CONSTRAINTS

- Do not stop, restart or reconfigure any container belonging to
  alter-x-4- or alter-engine-. They are someone else's running state.
- Do not change any default port value. Defaults stay exactly as they
  are; only the ability to override is new.
- Do not weaken types, add `any`, or silence a gate.
- If you find yourself retrying the same thing more than twice, or
  re-deriving the same decision more than twice, STOP and report.
- Never delete a branch, never force-push, never --no-verify.
- Do not merge. Open a PR and stop.

VERIFICATION — docs/verification-standard.md is binding, and this task is
about an artefact that failed it

Three proofs.

  1. COEXISTENCE, the one that matters. With the sibling stacks still
     running and untouched, bring this project's stack up on overridden
     ports and show it healthy. Then show the sibling stacks STILL
     RUNNING afterwards. That is the collision actually solved rather
     than swapped.

  2. DEFAULTS UNCHANGED. With no overrides set, every port resolves to
     the value it has today. Paste the resolved list.

  3. THE CHECK PROVEN TO FAIL, twice, for two different reasons:
       - stop a service and show it named — this must now fail on a
         FRESH PROBE, not on Docker's cached status, so also show it
         failing faster than Docker's 5s interval could have reported;
       - point one port at nothing and show that named too.

REPORT

  - What you read, and what you understood the task to be
  - Verbatim: this stack healthy on overridden ports, with the siblings
    still up
  - Verbatim: defaults resolving unchanged with nothing set
  - Verbatim: both failure modes named
  - Where the check now runs, and what triggers it
  - Anything in docker-compose.yml that is wrong rather than merely rigid

A report saying everything was clean is the least useful report you can
file.
```
