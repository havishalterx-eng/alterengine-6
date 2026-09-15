# Master prompt — Project Revive, task 2.4b: the two steps that need a real provider

**Runs after 2.4a.** Do not start this until 2.4a's pull request is open and its four steps
are demonstrated. This task adds the two that a local stack cannot prove, and only then is
Phase 2 closed.

**Needs Docker AND real AWS Bedrock in `ap-south-1`.** Confirm both before accepting. If the
AWS route is unavailable, stop and say so — a partial live run that nobody scoped in advance
is how a phase gets declared closed on evidence that does not cover it.

---

```
You are the Builder on Project Revive.

Repo:  https://github.com/havishalterx-eng/alterengine-6
Clone it fresh into your own workspace. Do NOT work in
~/Desktop/alterengine-6 -- that is the CEO session's clone.

You do NOT edit docs/memoryalter.md, docs/checklist.md or docs/progress.md.

READ FIRST:
  1. docs/verification-standard.md -- binding
  2. 2.4a's pull request and its report -- what was already demonstrated
  3. docs/memoryalter.md section 5, the entries on the mock provider
     inverting discrimination, and on real Titan embeddings
  4. scripts/run-model-gateway-aws.sh, and the C22 entry on the bootstrap
     filling AWS credentials from LocalStack placeholders
  5. CLAUDE.md

State before you start: what you read, that Docker works, and that you can
reach Bedrock in ap-south-1.

A TRAP THAT WILL COST YOU AN HOUR IF NOBODY TELLS YOU

scripts/bootstrap-env-local.sh fills AWS_ACCESS_KEY_ID and
AWS_SECRET_ACCESS_KEY from LocalStack placeholders. Environment variables
beat the ~/.aws profile, so sourcing the generated file breaks real AWS:

  An error occurred (InvalidClientTokenId) ... The security token
  included in the request is invalid

while the real credentials are fine. This is tracked as C22 and may still
be unfixed when you start. AWS_ENDPOINT_URL did the same thing in task 1.2.
Unset those variables for the process that needs real AWS, and say in your
report whether C22 was fixed by then or you worked around it.

SCOPE -- THE TWO STEPS

  5. A node fails because a REAL MODEL returned something the contract
     rejects. The observed shape on the other repository was prose where
     JSON was required:

       code:   NODE_EXECUTION_FAILED
       detail: Model response failed validation: output_json is not valid
               JSON: Unexpected token 'T', "The articl"...

     Our own golden-set run saw the same class: 7 of 30 cases failed on
     Model Gateway returning invalid JSON for classification content. So
     this failure is producible. Show it happening, then show Recovery
     classifying it as logic_output_failure and acting on it.

  6. THE DRIFT SCORE CHANGES THE NEXT SELECTION. Bind the same requirement
     again after the drift score lands, and show a different agent wins --
     or show precisely why it cannot yet, and what would be needed.

     This is the step most likely to be incomplete. Selection now ranks on
     capability containment, similarity, performance and efficiency
     (PR #9). Whether a drift score actually reaches that ranking is the
     open question. If it does not, that is a real finding and the phase
     does not close -- do not stretch the evidence to fit.

VERIFICATION ARTEFACT, per verification-standard.md

  Extend 2.4a's end-to-end test rather than writing a second one. Two new
  assertions: that a genuine model-output failure is classified as
  logic_output_failure, and that a persisted drift score changes which
  agent a repeated bind returns.

  - PROVE THEY FAIL. For the second, the honest break is to zero the drift
    score and show the same agent winning again. Paste both.
  - This test needs real credentials, so it will not run in CI. Name
    exactly what runs it and how often, and wire that. "Someone will run it
    manually" is not an answer.
  - Nothing permanently red.

HARD CONSTRAINTS

  - Do not weaken a type, a policy or an assertion to make something pass.
  - Do not disable row-level security to read anything.
  - Record pre-provider scores as void before comparing anything to them
    (standing rule 11).
  - Check for a competing pnpm process before install/add/update.
  - If you retry the same thing more than twice, STOP and report.
  - Never force-push. Never delete a branch. Never --no-verify.
  - Do NOT merge. Open a pull request and stop.

REPORT

  Verbatim output for both steps. The verbatim failure of each new
  assertion when you broke it. Whether step 6 worked, and if it did not,
  exactly what is missing between a persisted drift score and the ranking
  that decides a bind. That answer is worth more than a green test.
```
