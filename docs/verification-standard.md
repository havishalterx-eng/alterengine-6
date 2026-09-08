# Verification standard

**Every build task leaves behind something that keeps its result true.**

Read this before starting any task. It is referenced by every master prompt, and a task is
not finished until it satisfies it.

---

## The principle

A task proves something works. Days later, someone changes something else, and it quietly
stops working. Nobody notices until a count comes back wrong.

That has now happened three times in this codebase:

- The local environment was fixed by #122/#123 and nothing kept it fixed.
- `verifyChain()` exists, works, and **has no route and no caller** — a verifier nothing
  drives.
- `testTrigger` and `removeTrigger` report success without calling anything.

Design log §7 pattern 3 names this: *real machinery with nothing driving it*. The
prescribed fix is a mandatory driver-exists test — **not just proof the mechanism works
when called.**

So: **what a task proves, it must also protect.**

## Four requirements

A verification artefact is not finished until all four hold.

### 1. It checks real behaviour, not process state

A container in `running` state, a health endpoint that returns `healthy` without probing
anything, a policy document that looks correct — none of these are evidence.

`TitanEmbeddingProvider.healthCheck()` returns `status: "healthy"` with `liveProbe: false`
and never contacts Bedrock. It is the shape of a check with none of the substance. Do not
build another one, and do not accept one as proof.

Check the thing itself: a real response body, a real row count, a real score.

### 2. It runs without anyone remembering to run it

A script nobody invokes is `verifyChain()` again.

CI's `gate` job already runs `scripts/check-architecture-boundaries.sh`,
`check-rbac-classification.sh`, `check-placeholder-markers.sh` and
`check-migration-rollback-pairing.sh`. That is the established pattern: a script in
`scripts/`, wired into `.github/workflows/ci.yml`.

**Wiring it in is part of the task.** Writing the script and leaving it unwired is not
half-done, it is undone — the script's existence then creates false confidence, which is
worse than its absence.

Where CI genuinely cannot run it — something needing real cloud credentials, say — name
what does run it and how often. "Someone will run it manually" is not an answer.

### 3. It is proven to fail

**This is the requirement most often skipped, and the one that matters most.**

An untested check that always passes is the worst possible outcome: it looks like coverage,
consumes trust, and protects nothing.

Break the thing on purpose. Show the check failing. Paste the actual failure output. Then
restore and show it passing again. Task 1.0 did this correctly by stopping Redis.

A check that has never been seen to fail has not been verified — it has been written.

### 4. Nothing in it is permanently red

A check with a member that always fails is one everybody learns to ignore, and then the
whole check dies quietly.

If part of it cannot pass in some environment, either exclude that part deliberately and say
so, or fix the underlying problem. Do not ship a check that is expected to be partly red.

*Live example:* LocalStack's healthcheck carries ten assertions on a 5s timeout. On a host
where each call costs ~2.4s it can never pass, so the container reports `unhealthy` forever
while the service is genuinely fine. A check whose passing depends on machine speed is not a
check.

## The shape varies with the task

"The same as task 1.0" is the wrong instruction — 1.0 was infrastructure, so a stack-health
script was right for it. Match the artefact to what was actually proven:

| Task proves | The artefact |
|---|---|
| Infrastructure runs | A health script hitting real endpoints, wired into CI |
| A defect is fixed | A test that **reproduces the original defect** and now passes — the failing case, not a nearby one |
| Something is idempotent or concurrent | A test firing real concurrent requests. Serialised requests do not test a race. |
| A provider or integration works | A test against the real dependency, or a contract test that fails when the shape changes |
| A rule must hold across the codebase | A `scripts/check-*.sh` gate in CI, with a baseline allowlist if existing violations must be grandfathered |
| Behaviour depends on a threshold or score | An assertion on the **relationship** — relevant beats irrelevant — not on a magic number that drifts |

## Claiming there is nothing to check

Sometimes true. A comment correction, a documentation change.

**It must be argued in the report, never assumed by silence.** One sentence naming what
could regress and why nothing can catch it, or why nothing needs to.

Silence reads as an oversight, and reviewers cannot tell the difference between "nothing was
needed" and "nobody thought about it."

## What goes in the report

- What the check verifies, and what it deliberately does not
- Where it runs, and what triggers it
- **Verbatim output of it failing**, and what you broke to cause that
- Verbatim output of it passing afterwards
- Anything permanently red, and why that was accepted

---

*Related: design log §7 (the four systemic patterns), §5.5 (fail-closed), §28 (CI
enforcement rather than discipline).*
