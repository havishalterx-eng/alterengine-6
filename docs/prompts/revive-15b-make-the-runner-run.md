# Master prompt — Project Revive, task 1.5b: make the golden-set runner actually run

**Phase 1's last blocker.** Everything else in Phase 1 is done and verified. This produces
the number the phase exists for.

**Do not accept this task without Docker.** Answer first: do you have a working Docker
daemon and can you run `docker compose`? If not, say so and stop — the runner cannot be
finished without executing it, and that is precisely why it is broken.

---

```
You are the Builder on Project Revive.

Repo:  https://github.com/havishalterx-eng/alterengine-6
Clone it fresh into your own workspace. Do NOT work in
~/Desktop/alterengine-6 — that is the CEO session's clone.

alter-x-4- and alterengine--5 are frozen and read-only. Their containers
may be RUNNING on this machine. Do not stop them. Work around them.

You do NOT edit docs/memoryalter.md, docs/checklist.md or
docs/progress.md.

READ FIRST:
  1. docs/verification-standard.md — binding
  2. docs/memoryalter.md section 5 — the entries on the golden-set
     runner, the health check, and the environment
  3. scripts/run-intent-golden-set.sh and
     apps/eval-service/scripts/run_intent_golden_set.py
  4. CLAUDE.md

State before you start: what you read, and whether you have Docker.

WHY THIS TASK EXISTS

scripts/run-intent-golden-set.sh was written in a sandbox that could
never execute it. It has therefore never run, and every defect below was
found in a single attempt to run it — each one hidden behind the previous
one. The runner is the artefact; it does not work.

SEVEN THINGS BETWEEN YOU AND A NUMBER, all found live, all still unfixed

You do not need to rediscover these. Fix them, and COMMIT each fix — the
previous attempt applied them in a shell, so none survived, which
reproduced exactly the unreproducible environment tasks 1.4 and C21
existed to eliminate.

  1. PORT OVERRIDES ARE NOT PLUMBED THROUGH. C16 parameterised every
     compose port and connection URL, but the runner does not export or
     accept overrides. On any machine with a sibling checkout the
     defaults belong to someone else. The runner should take an override
     set and use it end to end.

  2. bootstrap-env-local.sh --merge FLATTENS C16's PARAMETERISATION. A
     .env.local generated before C16 holds literal ports, and --merge
     preserves them rather than re-parameterising, so overrides silently
     do nothing and services connect to the sibling stack. Create mode is
     correct; merge is not.

  3. C21's EXISTING-VOLUME GUARD DOES NOT FIRE. Regenerating passwords
     against volumes whose roles were created with the old ones produces
     `FATAL: password authentication failed`, buried in an alembic
     traceback — the exact failure C21's own prompt said must be named.
     It was not.

  4. NO PYTHONPATH. `ModuleNotFoundError: No module named 'src'`.

  5. WRONG PYTHON. It invokes system python, not
     apps/eval-service/.venv, so `ModuleNotFoundError: No module named
     'psycopg2'`.

  6. THE REPORT QUERY NAMES COLUMNS THAT DO NOT EXIST.
     `column ec.input_json does not exist` — eval_cases has `input`,
     `expected`, `scoring`, `tags`. So even a successful run cannot
     report.

  7. THE GOLDEN SETS ARE NOT IN THE DATABASE THE RUNNER READS. After
     migrations ran clean: eval_runs=0, eval_results=0, eval_cases=0,
     golden_sets=0. The alembic revisions that SEED the sets ran, so the
     seeding and the reading are pointed at different databases. **This
     is the one that matters most** — without it the runner executes an
     empty set and reports a meaningless zero. Find where seeding writes
     and where the runner reads, and say what you found.

  Also: the runner polls a port it chose while .env.local may pin
  MODEL_GATEWAY_PORT, so the service starts correctly and the runner
  declares it never came up. Decide which side owns that port.

THEN: THE ACTUAL MEASUREMENT

Once it runs, the two traps from the original task still apply.

  A ZERO THAT MEANS THE WRONG THING. The last recorded 30-case run
  scored 0 of 30 while the harness was working perfectly — every case
  failed because ClassifyIntent's injection screen could not reach
  ads-core. Read EVERY case's recorded reason and group them. A score
  without its reasons is not a result.

  THE SCORES MAY BE MEASURING THE CACHE. model-gateway consults a
  semantic cache before any provider, threshold 0.95. Run twice and
  compare timings and outputs. A dramatically faster second run is a
  cache hit, not a fast model — that confusion already produced an
  unexplained 80x in task 1.0.

CONSTRAINTS

- COMMIT EVERY FIX. A fix that lives in your shell is not a fix.
- Do not tune anything to make a number look better. A bad honest number
  is the deliverable.
- Do not stop or reconfigure sibling containers.
- Do not change the semantic cache or the model alias policy.
- Never commit a credential, never print a secret value.
- If you find yourself retrying the same thing more than twice, STOP and
  report. The previous attempt did not, and pushed through five layers
  it should have handed back after two.
- Never delete a branch, never force-push, never --no-verify.
- Do not merge. Open a PR and stop.

VERIFICATION — docs/verification-standard.md is binding

The done gate is that someone else can get the same number.

  From a CLEAN CHECKOUT: bootstrap, bring the stack up on overridden
  ports beside the running siblings, and run the golden set to a reported
  result — with NO hand-editing and NO shell-only fixes. Paste it.

  PROVE IT FAILS: break one of the seven above — the simplest is to point
  the runner at a database with no golden sets — and show it reporting
  "no cases" clearly rather than a zero that reads like a score.

  That distinction is the whole point. A runner that reports 0 of 0 as
  though it were 0 of 30 is how the last wrong count happened.

REPORT

  - Whether you had Docker, stated first
  - What you found for defect 7, and where
  - Verbatim: the 30-case result WITH per-reason grouping
  - Whether the cache contaminated it, and how you know
  - Verbatim: clean checkout to reported result, no hand-editing
  - Verbatim: an empty golden set reporting as empty, not as zero

A report saying everything was clean is the least useful report you can
file. A bad number with a clear reason is worth more than a good one you
cannot explain.
```
