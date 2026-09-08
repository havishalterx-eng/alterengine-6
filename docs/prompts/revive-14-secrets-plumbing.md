# Master prompt — Project Revive, task 1.4: make the AppConfig path reproducible

**Prerequisite — Havish, before pasting:** `alterengine.dev` needs
`secretsmanager:CreateSecret` and `secretsmanager:PutSecretValue`. Two secrets get created.

---

```
You are the Builder on Project Revive — bringing the existing Alter Engine
back to a demonstrably working state.

Repo:  https://github.com/havishalterx-eng/alterengine-6
Clone it fresh, somewhere of your own. Do NOT work in
~/Desktop/alterengine-6 — that is the CEO session's clone, and sharing it
has already cost an unpushed commit and a bring-up on non-standard ports.

alter-x-4- and alterengine--5 are frozen and read-only.

You do NOT edit docs/memoryalter.md, docs/checklist.md or
docs/progress.md. Read them; report what you found; the CEO session writes
them.

READ FIRST:
  1. docs/verification-standard.md — binding on this task
  2. docs/local-dev.md — the AppConfig opt-in section added by task 1.3
  3. docs/memoryalter.md sections 5 and 6
  4. CLAUDE.md

State before you start: what you read, and what you understand the task
to be.

WHAT THIS TASK IS ACTUALLY FOR

Task 1.3 proved six services run under real AppConfig. It did that by
hand-supplying reference values per service, because the committed
defaults in .env.local.example are LocalStack-shaped and mostly wrong for
real AWS. docs/local-dev.md says "the corresponding real resources must
exist" without naming which.

So the AppConfig path works and is NOT reproducible from the repository.
That is precisely what task 1.0 existed to prevent, arriving in a
different place. Your job is to close that: someone with credentials
should be able to bring up the AppConfig path from committed
configuration alone.

WHAT WAS FOUND, SO YOU DO NOT REDISCOVER IT

Of eight references in committed configuration that point at AWS
resources, two resolve. Verified by listing real resources in ap-south-1:

  RESOLVE
    ACTOR_TOKEN_SIGNING_KEY_REF  -> /alter/local/platform-api/system/actor-token-signing-key
    AUDIT_ARCHIVE_BUCKET_PARAM   -> /alter/local/audit/archive-bucket

  WRONG NAME — the resource exists under a different one
    ALTER_ARTIFACTS_BUCKET_PARAM  committed: alter-local-artifacts-bucket
                                  actual:    /alter/local/orchestration/artifacts-bucket
    AUDIT_DATABASE_SECRET_REF     committed: /alter/local/audit-service/system/database_credentials
                                  actual:    alter/local/audit-service/db-password
    DELETION_PSEUDONYM_KEY_REF    committed: /alter/local/audit-service/system/deletion_pseudonym_key
                                  actual:    alter/local/audit-service/deletion-pseudonym-key
    DELETION_SERVICE_TOKEN_REF    committed: /alter/local/audit-service/system/deletion_service_token
                                  actual:    alter/local/audit-service/deletion-service-token

  MISSING ENTIRELY — nothing exists
    COST_DATABASE_SECRET_REF
    COST_PSEUDONYM_KEY_REF

Verify this yourself rather than trusting it. It was produced by listing
resource NAMES only; no values were read, and you should not read any
either.

FIVE PARTS

1. FIX THE REFERENCES, NOT THE RESOURCES. Point the six wrong references
   at the names that actually exist. Do NOT rename or recreate anything
   that already works — renaming a secret means creating a new one and
   deleting the old, and Secrets Manager deletion has a recovery window.
   A reference value is configuration; set it correctly.

2. CREATE THE TWO THAT ARE MISSING, both plain strings, no JSON envelope
   (confirmed: resolve-database-secret.ts returns getSecret() straight
   through as a connection string, and main.ts:54 uses the pseudonym key
   the same way):

     /alter/local/cost-ledger-service/database-credentials
     /alter/local/cost-ledger-service/pseudonym-key

   NEVER PRINT EITHER VALUE. Not in your report, not in a log line, not
   in a commit. The connection string comes from the committed local
   compose configuration; the pseudonym key is random material you
   generate and never look at. If you cannot create them without
   displaying a value, stop and say so.

3. USE THIS CONVENTION FOR ANYTHING NEW: /alter/<env>/<service>/<kebab-case>,
   leading slash. It matches the majority of what already exists. Existing
   names that do not match it stay as they are — the goal is to stop the
   drift growing, not to relitigate it.

4. UNIFY THE APPCONFIG VARIABLE NAMES. platform-api reads
   APPCONFIG_APP_ID / APPCONFIG_ENV_ID / APPCONFIG_PROFILE_ID while
   model-gateway, tool-gateway and sandbox-service read
   APPCONFIG_APPLICATION_ID / APPCONFIG_ENVIRONMENT_ID /
   APPCONFIG_CONFIGURATION_PROFILE_ID. Two names for three concepts is
   design log section 7 pattern 4. Pick one set, keep the other working as
   a fallback so nothing breaks, and say which you chose.

5. MAKE IT REPRODUCIBLE. Commit the reference values that actually work,
   and extend docs/local-dev.md so the AppConfig opt-in can be followed
   without knowing what task 1.3 did by hand. That is the whole point of
   this task.

NOT IN SCOPE

Tenant secrets carry four different tenant-id formats for what looks like
one tenant — a bare UUID, two ten_-prefixed variants, and ten_test0000...
That is real and recorded separately. Fixing it means recreating tenant
secrets. Report anything you notice; change nothing.

CONSTRAINTS

- Never print, log or commit a secret value.
- Never delete an AWS resource. Creating is fine; deleting is not, and
  nothing in this task requires it.
- Do NOT change the logic of any Category 1 component.
- Do not weaken types, add `any`, or silence a gate.
- If you find yourself retrying the same thing more than twice, or
  re-deriving the same decision more than twice, STOP and report.
- Never delete a branch, never force-push, never --no-verify.
- Do not merge. Open a PR and stop.

VERIFICATION — docs/verification-standard.md is binding

The done gate is reproducibility, so the artefact must test that.

A check that resolves every reference in committed configuration against
real AWS and fails on any that does not exist. Names only — it must never
fetch or print a value, only confirm the resource resolves.

PROVE IT FAILS: point one reference at a name that does not exist and
paste the failure. A check that has never been seen to fail has not been
verified.

It needs credentials, so it cannot run in CI unconditionally. Gate it the
way task 1.2 gated the live Titan test, and say what would run it.

Then the real proof: bring up the AppConfig path using ONLY committed
configuration plus credentials — no hand-supplied references. Paste every
service answering. If you need to supply anything by hand, that is the
task not being finished.

REPORT

  - What you read, and what you understood the task to be
  - Your own verification of the eight references
  - Which APPCONFIG variable set you chose and why
  - Verbatim: the reference check failing, then passing
  - Verbatim: every service answering from committed configuration alone
  - Confirmation that no secret value was printed, logged or committed
  - Anything you noticed and deliberately left alone

A report saying everything was clean is the least useful report you can
file.
```
