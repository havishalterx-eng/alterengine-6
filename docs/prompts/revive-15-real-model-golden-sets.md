# Master prompt — Project Revive, task 1.5: a real model, and honest numbers

**The point of Phase 1.** Everything before this made measurement possible; this is the
measurement. Paste the fenced block into a builder session.

---

```
You are the Builder on Project Revive — bringing the existing Alter Engine
back to a demonstrably working state.

Repo:  https://github.com/havishalterx-eng/alterengine-6
Clone it fresh, somewhere of your own. Do NOT work in
~/Desktop/alterengine-6 — that is the CEO session's clone.

alter-x-4- and alterengine--5 are frozen and read-only.

You do NOT edit docs/memoryalter.md, docs/checklist.md or
docs/progress.md. Read them; report what you found.

READ FIRST:
  1. docs/verification-standard.md — binding
  2. docs/memoryalter.md — section 5, especially the entries on Bedrock
     model availability, the semantic cache, and the mock provider
  3. docs/local-dev.md — the AppConfig opt-in
  4. docs/checklist.md — Phase 1's done gate
  5. CLAUDE.md

State before you start: what you read, and what you understand the task
to be.

WHAT IS ALREADY DONE, SO YOU DO NOT REDO IT

Bedrock is ALREADY the model provider under appconfig. main.ts's
createModelProvider builds it as the real primary, with a comment saying
so: "Bedrock is the real primary and needs no secret (IAM/AWS creds
only)." Do not rewire that.

Embeddings are already real Titan and already proven to discriminate.

MEASURED IN ap-south-1 ON 2026-09-09, so you need not rediscover it.
Invocability was tested through Converse — the call the adapter makes:

  qwen.qwen3-32b-v1:0                    works, held a strict 9-key
                                         JSON contract at temperature 0
  deepseek.v3.2                          works, same
  mistral.mistral-large-3-675b-instruct  works, same
  amazon.nova-2-lite-v1:0                CANNOT be invoked by model id —
                                         needs an inference profile ARN
  openai.gpt-oss-120b-1:0                returned no text at that path

Anthropic models are OUT OF SCOPE by decision. Do not use one, do not
suggest one.

THE ACTUAL WORK: bind four aliases to real models

ModelAliasSchema is FAST, STANDARD, ADVANCED, CEILING. Each needs a
model_id in the alias policy. Find where that policy is actually read
from — MODEL_POLICY_OVERRIDE_PARAMETER_NAME and the AppConfig profile are
both involved — and say what you found, because it is not obvious from
the code alone.

Start every alias on qwen.qwen3-32b-v1:0. That is deliberate: one model
across all four aliases makes the first golden-set numbers a measurement
of the ENGINE rather than of a tier-mapping guess. Differentiating the
tiers is a later decision the harness should inform.

A CONSTRAINT THAT WILL SURPRISE YOU

FallbackProviderSchema is z.enum(["anthropic", "openai"]). The fallback
chain can only name Anthropic or OpenAI. Anthropic is out of scope, and
OpenAI-on-Bedrock returned no text in testing. So the fallback chain
CANNOT currently express a working non-Anthropic option.

Leave fallback_chain empty and REPORT this. Do not extend the enum
unilaterally — whether Bedrock model ids belong in a provider enum at all
is a design question, and the answer may be that the enum is the wrong
shape rather than that it needs another member.

BEFORE YOU MEASURE ANYTHING

Write down every existing eval score, quality verdict and similarity
number as explicitly void. They were produced against a mock that returns
one canned reply. The first honest number will look like a regression and
someone will read it as one unless the record says otherwise.

THEN: RUN THE 30-CASE GOLDEN SET

Two traps sit between you and an honest number. Both have bitten before.

TRAP 1 — A ZERO THAT MEANS THE WRONG THING. The last 30-case run scored
0 of 30, and the harness was working correctly. Every case failed for the
same reason: the injection screen inside ClassifyIntent could not reach
ads-core, which was not running. A zero can mean "the model is bad" or "a
dependency was unreachable", and those are not the same finding at all.

  READ EVERY CASE'S RECORDED REASON, not just the score. If cases failed,
  group them by reason and say how many failed for each. A score without
  its reasons is not a result.

TRAP 2 — THE SCORES MAY BE MEASURING THE CACHE. model-gateway consults a
semantic cache before calling any provider, on both invoke and stream
paths, threshold 0.95. If golden-set cases repeat text across runs, or
resemble each other closely, cache hits return prior answers and the
scores measure the cache rather than the model.

  Determine whether the golden set actually hits the cache. Run it twice
  and compare timings and outputs; a second run that is dramatically
  faster is a cache hit, not a fast model — that exact confusion produced
  an unexplained 80x speedup in task 1.0. Say what you found. If the
  cache is contaminating results, report it and say what you would do;
  do not change the cache, which is a separate open decision.

PHASE 1'S DONE GATE — three things, all observable

  1. A 30-case golden set scores above zero FOR A REAL REASON. If it
     scores zero, that is an acceptable outcome ONLY if you can name the
     real reason and show it is not a broken dependency.
  2. A capability request for underwater.basket.weaving does not match a
     summarisation agent. Already proven in task 1.2 — re-confirm it
     still holds with a real model in the loop.
  3. The Conversation Manager returns DIFFERENT intents for DIFFERENT
     utterances. Under the mock every utterance came back "answer" at
     0.9. Send several genuinely different utterances and paste the
     results.

CONSTRAINTS

- Do NOT change the logic of any Category 1 component. You are giving
  them a real provider, not changing what they do.
- Do not tune anything to make a number look better. A bad honest number
  is the deliverable; a good tuned one is worse than nothing.
- Do not change the semantic cache or the fallback enum. Report both.
- Never commit a credential.
- If you find yourself retrying the same thing more than twice, or
  re-deriving the same decision more than twice, STOP and report.
- Never delete a branch, never force-push, never --no-verify.
- Do not merge. Open a PR and stop.

VERIFICATION — docs/verification-standard.md is binding

The artefact is a test asserting the Conversation Manager returns
different intents for different utterances — the property that was
impossible under the mock and is the cheapest of the three gates to keep
true.

PROVE IT FAILS: point it at the mock provider, where every utterance
returns "answer" at 0.9, and paste that failure.

Gate anything needing live Bedrock the way task 1.2 gated the live Titan
test, so CI is not left permanently red.

REPORT

  - What you read, and what you understood the task to be
  - Where the alias policy is actually read from
  - The pre-provider numbers, recorded as void
  - The 30-case result, WITH per-reason grouping if anything failed
  - Whether the cache contaminated the run, and how you know
  - Verbatim: different utterances returning different intents
  - Verbatim: the test failing against the mock
  - Your reading on the fallback enum

A report saying everything was clean is the least useful report you can
file. A report with a bad number and a clear reason is worth more than a
good one you cannot explain.
```
