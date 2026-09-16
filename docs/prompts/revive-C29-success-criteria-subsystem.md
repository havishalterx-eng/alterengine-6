# Master prompt — Project Revive, C29 / C12: carry success criteria to where output is judged

**This breaches standing rule 1 and needs Havish's explicit sign-off before a line is written.**
The path runs through Graph Compiler, the Executor and the Verification & Quality Gate, all
Category 1. Rule 1 says anything necessary is **recorded in `memoryalter.md` before it is made**.
Do not start until that record exists and names the components.

**Needs Docker.** Confirm before accepting. Clone into `~/alter-work/`, never a deep scratch
path — a clone eleven directories down made vitest's file walk non-terminating for an hour
(C27).

---

```
You are the Builder on Project Revive.

Repo:  https://github.com/havishalterx-eng/alterengine-6
Clone it fresh into ~/alter-work/<your-name>. Do NOT work in
~/Desktop/alterengine-6 -- that is the CEO session's clone.

You do NOT edit docs/memoryalter.md, docs/checklist.md or docs/progress.md.

READ FIRST, in this order:
  1. docs/architecture/design-log.md section 5 -- the whole spec for this
     task, and the only authority on what "verification" means here
  2. docs/verification-standard.md -- binding on your own work
  3. docs/memoryalter.md, the 2026-09-16 entries on C12 and C29
  4. apps/intelligence-service/src/problem_understanding/models.py
  5. apps/orchestration-service/src/compiler/dag-builder.ts
  6. CLAUDE.md

State before you start: what you read, that you have Docker, and that the
frozen-component exemption has been recorded.

WHAT IS ALREADY ESTABLISHED, so you do not rediscover it

  - success_criteria EXISTS. ProblemSpec carries it, Problem Understanding
    produces it, and models.py:49 validates every entry as a non-empty
    string.
  - NOTHING CONSUMES IT. Outside intelligence-service's own three files,
    every occurrence in the repository is a test. No orchestration-service
    or verification-service code reads it. That is section 7 pattern 3 --
    real machinery with nothing driving it -- and it is why an LLMTask node
    today declares a prompt and a model alias and no output contract at all.
  - SO PROSE PASSES. AwsBedrockModelProvider wraps every response as
    {message, stop_reason} and the gateway passes that wrapper through as
    output_json (model-gateway.service.ts:270), so output_json always
    parses. A model answering a different question entirely produces a
    structurally perfect node output and the run continues. Proven live
    against Bedrock; the spec that pins it is
    apps/orchestration-service/src/recovery/model-output-failure.live.spec.ts.
  - Section 5.2's mechanical read-back has no trace in the codebase at all.

WHAT DESIGN LOG SECTION 5 ACTUALLY ASKS FOR -- read it, do not take this
summary as the spec

  Intake: a structured statement of success, captured before any run.
  Per node, immediately after it executes: a mechanical check that the real
  external system reflects the claimed action, and a semantic check against
  THAT NODE'S OWN assigned sub-task. Both must clear. Either fails and
  Recovery's Classify stage fires for that node only.
  End of run: one holistic check of the combined outcome against the
  original criteria.
  Reviewer isolation: output under judgment is passed as clearly-marked
  data, never as instruction (that is C9, and it is in scope here because
  building the reviewer without it builds the confused-deputy flaw in).
  Fail-closed: verification that errors, times out, or cannot get a clean
  signal counts as unverified. Never as success.

SCOPE, IN SLICES. Land them separately. Do not start a later slice with an
earlier one unmerged.

  SLICE 1 -- carry the data, judge nothing.
    Optional success_criteria on the task skeleton node and the compiled DAG
    node, populated from the ProblemSpec the caller already supplied. Purely
    additive: existing skeletons and versions without it keep working.
    Touches Graph Compiler (frozen -- exemption required).
    Done when a compiled workflow version carries per-node criteria and
    every existing test still passes unchanged.

  SLICE 2 -- the semantic check, per node.
    A reviewer compares a node's output against that node's criteria, with
    the output passed as marked data (C9). Fail-closed on error or timeout.
    On failure, hand to Recovery's Classify stage for THAT NODE ONLY.
    Touches the Verification & Quality Gate (frozen -- exemption required).

  SLICE 3 -- the end-of-run holistic check.
    Combined outcome against the original criteria, after every node passed.

  EXPLICITLY OUT OF SCOPE
    The mechanical read-back (section 5.2). It needs a per-tool notion of
    "read it back" that does not exist anywhere yet, and bundling it here
    would double the size of a task that is already a subsystem. Open it as
    its own item and say so in your report.

WHAT WAS ALREADY REJECTED, AND WHY -- do not re-propose it

  Adding an `output_schema` to LLMTask's config and validating against it.
  Small, additive, and wrong: it puts a second judge of node output beside
  the Verification & Quality Gate, permanently, because that gate is
  Category 1. Section 7 pattern 4, arriving by the front door. The contract
  is not missing from the system; it is missing from the PATH.

VERIFICATION ARTEFACT, per verification-standard.md

  Per slice, not one at the end.
    Slice 1: a test proving a compiled version carries criteria, and one
      proving a version WITHOUT them still compiles and runs. Prove it fails
      by dropping the carry.
    Slice 2: a test where a node returns a confidently-worded answer to a
      DIFFERENT question than its criteria describe, and the check rejects
      it. That is the case the system gets wrong today -- a fixture that
      returns malformed JSON proves nothing, because malformed JSON already
      fails. Prove it fails by pointing the reviewer at the right answer.
    Slice 3: a test where every node passes and the combination does not
      satisfy the original criteria.
  Wire each into CI. Unwired is undone.

HARD CONSTRAINTS

  - Do not weaken a type, a policy or an assertion to make something pass.
  - Do not touch a Category 1 component beyond the three named, and record
    what you changed in each.
  - Check for a competing pnpm process before install/add/update.
  - If you retry the same thing more than twice, STOP and report.
  - Never force-push. Never delete a branch. Never --no-verify.
  - Do NOT merge. Open a pull request per slice and stop.

REPORT

  Verbatim output per slice: the artefact failing, what you broke, the pass
  afterwards. Every frozen-component file you touched and what changed in
  it. Anything section 5 asks for that you did not build, named. And the
  answer to one question, which is worth more than the code: does section 5
  survive contact with the codebase, or does it describe a verification
  model this engine's shape cannot carry? Say so plainly if it is the
  latter -- Track D exists precisely so the log can be the thing that is
  wrong.
```
