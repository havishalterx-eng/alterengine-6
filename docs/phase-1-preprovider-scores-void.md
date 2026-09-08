# Phase 1 — pre-provider scores, verdicts and similarity numbers are VOID

**Status: explicitly void, recorded before the first honest measurement.**

This file is the record the Phase 1 master prompt requires: *"Write down every
existing eval score, quality verdict and similarity number as explicitly void.
They were produced against a mock that returns one canned reply. The first honest
number will look like a regression and someone will read it as one unless the
record says otherwise."*

It is not one of the CEO-owned documents (`memoryalter.md`, `checklist.md`,
`progress.md`); builders may write this one. It is append-only — a later
Phase 1 result is a new entry that points at this one, it does not rewrite it.

## What is void, and why

Every eval score, quality verdict and similarity number produced before the
real Bedrock model was wired is **void**, for these reasons established in
`docs/memoryalter.md` §5:

1. **The mock model provider returns one canned reply.** For the Conversation
   Manager's intent classification it returns `{"intent":"answer","confidence":0.9}`
   for every utterance (see `packages/shared-clients/src/mocks/model-provider.ts`
   `STRUCTURED_REPLIES`, matched on `/classify a single user utterance/i`). Every
   intent score produced under the mock is therefore a measurement of the mock,
   not of any model's judgement.

2. **The mock embedding provider inverts discrimination.** `underwater.basket.weaving`
   scored **0.8740** against a text-summarisation agent while the genuinely
   relevant `text.summarisation` scored **0.8703** — against a threshold of 0.6
   (`memoryalter.md` §5, "The mock provider inverts discrimination"). Every
   similarity number produced under the mock embedding is therefore void; the
   first real-Titan number is the first meaningful one.

3. **The 30-case golden set scored 0 of 30.** That zero was the right answer
   for the harness at the time, not a measurement of a model: every case failed
   on the injection screen inside `ClassifyIntent` being unable to reach a
   dependency (`memoryalter.md` §6, Eval Harness). A zero can mean "the model
   is bad" or "a dependency was unreachable" — those are not the same finding.

## What this is NOT

This does not void the **harness** or the **infra** — both are real and
verified (task 1.0 proved the stack runs; the golden set is real seeded data
with a real scoring contract). It voids only the **numbers** the harness
produced while the provider was a mock, because those numbers measured the
mock, not a model.

## The first honest number

The first honest number is the output of `scripts/run-intent-golden-set.sh`
against real AWS Bedrock with the four aliases bound to `qwen.qwen3-32b-v1:0`
(see `infrastructure/model-alias-policy/phase-1-qwen-all-aliases.json`). If it
looks like a regression against the void numbers above, that is expected and
is not a regression — it is the first number that means anything at all.

A bad honest number with a clear reason is worth more than a good one that
cannot be explained.
