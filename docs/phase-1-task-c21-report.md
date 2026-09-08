# Project Revive, task C21 — report

## What I read, and what I understood the task to be

Read, in order: `docs/verification-standard.md` (binding), `docs/memoryalter.md`
§5 — the entry "The local environment is startable, and starting it is still
not a step", `docs/local-dev.md`, `.env.local.example` (all of it), `CLAUDE.md`.

Understood the task: Phase 1's live measurement (task 1.5) is blocked because
starting the stack is not a *step*. `.env.local.example` cannot be sourced —
25 uncommented lines carry `<placeholder>` values and bash reads `<` as a
redirect, so `set -a; . .env.local.example` dies on line 11. No script turns
it into a sourceable file, so the documented `cp .env.local.example .env.local`
produces something materially different from what anyone runs (the CEO
machine's working `.env.local` has 16 assignments against the example's
139). The work is to commit a bootstrap script that turns the example into a
sourceable `.env.local`, generating every value that needs generating, keeping
the paired token/SHA-256 consistent, propagating each password into every
connection string that interpolates it, never clobbering an existing
`.env.local`, and being idempotent. Two placeholders are referenced but never
defined — surface them from the authority, do not guess. Open a PR and stop.

## What the running stack actually uses for ADS_DB_PASSWORD and MEMORY_DB_PASSWORD, and where I found it

Both are referenced by `.env.local.example` connection strings but never
assigned in it. The authority is `docker-compose.yml` and the database init
scripts, not the example.

**`ADS_DB_PASSWORD` → `ads_core_local`.** Found in `docker-compose.yml`: the
`ads-db` service hardcodes `POSTGRES_PASSWORD: ads_core_local` (no env-var
indirection — it is a literal). The `ads_core` role is therefore created
with `ads_core_local` by the official image's initdb, and `EVAL_ADS_DB_URL`
(`postgresql://ads_core:<ADS_DB_PASSWORD>@127.0.0.1:5434/ads_db`) must use
exactly that. `.env.local.example`'s own header comment (lines 73–76) already
documents this: *"ADS Core local database uses its documented development-only
credentials: ads_core/ads_core_local."* So this is **not generated and not the
audit password** — it is a fixed development credential. The bootstrap
injects `ADS_DB_PASSWORD=ads_core_local`.

**`MEMORY_DB_PASSWORD` → defaults to `AUDIT_DB_PASSWORD`.** Found in
`infrastructure/local/engine-db-init.sh` line 16:
`: "${MEMORY_DB_PASSWORD:=$AUDIT_DB_PASSWORD}"`. The init script requires
only `AUDIT_DB_PASSWORD`; every other role password falls back to it.
`docker-compose.yml` passes `MEMORY_DB_PASSWORD: ${MEMORY_DB_PASSWORD:-}`
(empty default), so the init script's own default applies and the
`memory_service` role (owner of `policy_db`) is created with the audit
password. The bootstrap sets `MEMORY_DB_PASSWORD=$AUDIT_DB_PASSWORD` so the
`POLICY_DB_URL` connection string and the role agree. (The init script *does*
honour an explicitly set `MEMORY_DB_PASSWORD`, so the bootstrap does not
hard-force equality — an operator who sets a distinct one and re-runs the
init gets a distinct role; the bootstrap only defaults the unset case.)

The prompt's hint that both "sit on 5433 alongside the ones
AUDIT_DB_PASSWORD serves" was half-right: `MEMORY_DB_PASSWORD` does equal
`AUDIT_DB_PASSWORD`, but `ADS_DB_PASSWORD` does **not** — ADS owns its own
cluster on 5434 with a hardcoded credential. Treating the hint as a decision
would have produced a wrong `ADS_DB_PASSWORD`.

## How I handled the existing-volumes trap

Two layers.

1. **Never clobber.** Default mode refuses if `.env.local` exists. `--merge`
   preserves every existing real value and only fills absent/placeholder
   keys. `--force` exists but is discouraged and documented as destructive.
2. **Stale-volume detection on first run.** If `.env.local` does not yet
   exist *and* a docker volume `<project>_engine_db_data` already exists, the
   bootstrap refuses with a named message: a stack has run before, the
   Postgres roles inside that volume were created with whatever password that
   run used, and a freshly generated password would not authenticate — a
   failure that would otherwise surface later as an auth error. The message
   names both remedies: keep the old credentials (re-run `--merge` against the
   `.env.local` that run used, or copy the old `*_DB_PASSWORD` values in
   first), or reset (`docker compose --env-file .env.local down --volumes`
   then re-run — deletes all local Engine DB data). If docker is unavailable
   or the socket is denied (as in this builder sandbox), the check is
   skipped with a warning rather than failing — it cannot detect what it
   cannot see, and refusing without evidence would be worse.

Idempotency is the other half of the same trap: `--merge` re-runs do not
regenerate passwords a running database was already created with, because
the now-real values in `.env.local` are loaded first and win over freshly
generated ones. Verified: two consecutive `--merge` runs produce
byte-identical `*_DB_PASSWORD` and `INTERNAL_SERVICE_TOKEN` lines.

## Verbatim: clean checkout to running stack, no hand-editing

The live "services answering" step needs Docker + AWS, which this builder
sandbox blocks (see "Sandbox limits" below). What *can* be shown verbatim
here is the part the sandbox permits — clean checkout to a sourceable,
consistent `.env.local`, with zero hand-editing:

```
$ scripts/bootstrap-env-local.sh --from .env.local.example --out .env.local
  (docker daemon unreachable; cannot check stale volumes)
bootstrap-env-local: wrote .env.local (sourceable, consistent).
  Next: set -a; . ./.env.local; set +a  &&  docker compose --env-file .env.local up -d --build --wait engine-db ads-db cost-db redis localstack temporal

$ set -a; . ./.env.local; set +a && echo SOURCED_OK
SOURCED_OK

$ grep -cE '^[^#]*<[^>]+>|^[^#]*replace-me-with-a-random-value' .env.local
0

$ . ./.env.local && [ "$(printf %s "$INTERNAL_SERVICE_TOKEN" | shasum -a 256 | awk '{print $1}')" = "$INTERNAL_SERVICE_TOKEN_SHA256" ] && echo PAIR_OK
PAIR_OK

$ . ./.env.local && [ "$ADS_DB_PASSWORD" = ads_core_local ] && echo ADS_OK && [ "$MEMORY_DB_PASSWORD" = "$AUDIT_DB_PASSWORD" ] && echo MEM_DEFAULTS_TO_AUDIT_OK
ADS_OK
MEM_DEFAULTS_TO_AUDIT_OK
```

The full "services answering" step is one command after sourcing:
`docker compose --env-file .env.local up -d --build --wait engine-db ads-db cost-db redis localstack temporal`
then `docker compose --env-file .env.local ps`. That needs Docker, which the
sandbox denies; the bootstrap is the part that was not a step and is now.

## Verbatim: the failure when a substitution is missing

Two named failures, one per kind of missing substitution.

A missing *value* (the `MEMORY_DB_PASSWORD` assignment blanked out):
```
NAMED FAILURE: verify: MEMORY_DB_PASSWORD is empty (engine-db-init.sh needs it, defaults to AUDIT_DB_PASSWORD)
```

A leftover *placeholder* (a `<PLATFORM_DB_PASSWORD>` token left in a URL):
```
NAMED FAILURE: verify: unresolved placeholder(s) remain: 136:DATABASE_URL=postgresql://platform_api:<PLATFORM_DB_PASSWORD>@localhost:5432/platform_db
```

Both are named — they say what is wrong and where, rather than surfacing
later as a confusing downstream authentication or connection error.

## Verbatim: an existing .env.local surviving

Synthetic existing `.env.local` carrying four real values (AWS key, AWS
secret, Auth0 domain, M2M client secret), then `--merge`:
```
$ scripts/bootstrap-env-local.sh --merge --from .env.local.example --out .env.local
bootstrap-env-local: merged into .env.local (existing real values preserved, placeholders filled).

$ . ./.env.local && echo "AWS_ACCESS_KEY_ID preserved? $([ "$AWS_ACCESS_KEY_ID" = AKIAREALCEOKEY123 ] && echo YES)"
AWS_ACCESS_KEY_ID preserved? YES
$ . ./.env.local && echo "AWS_SECRET_ACCESS_KEY preserved? $([ "$AWS_SECRET_ACCESS_KEY" = real-ceo-secret-do-not-clobber ] && echo YES)"
AWS_SECRET_ACCESS_KEY preserved? YES
$ . ./.env.local && echo "AUTH0_DOMAIN preserved? $([ "$AUTH0_DOMAIN" = ceo-real-tenant.auth0.com ] && echo YES)"
AUTH0_DOMAIN preserved? YES
$ . ./.env.local && echo "AUTH0_M2M_CLIENT_SECRET preserved? $([ "$AUTH0_M2M_CLIENT_SECRET" = real-m2m-secret ] && echo YES)"
AUTH0_M2M_CLIENT_SECRET preserved? YES
$ . ./.env.local && echo "PLATFORM_DB_PASSWORD filled? $([ -n "$PLATFORM_DB_PASSWORD" ] && echo YES)"
PLATFORM_DB_PASSWORD filled? YES
$ . ./.env.local && [ "$(printf %s "$INTERNAL_SERVICE_TOKEN"|shasum -a 256|awk '{print $1}')" = "$INTERNAL_SERVICE_TOKEN_SHA256" ] && echo "token pair ok? YES"
token pair ok? YES
```

And the clobber refusal, verbatim:
```
$ scripts/bootstrap-env-local.sh --from .env.local.example --out .env.local4
bootstrap-env-local: REFUSING to overwrite .env.local4.
  An existing .env.local usually carries real AWS credentials and Auth0 settings
  that cannot be recovered once overwritten. Use --merge to fill only
  missing/placeholder values while preserving the rest, or --force only if you
  are certain .env.local4 contains nothing worth keeping.
```

## Anything in .env.local.example that is wrong rather than merely unfilled

1. **`ORCHESTRATION_DB_PASSWORD=replace-me-with-a-random-value`** (line 247)
   and **`ORCHESTRATION_DATABASE_URL=...:replace-me-with-a-random-value@...`**
   (line 252). Every other password uses a `<...>` placeholder, but these two
   use a bare sentinel. A bare word sources fine (no `<` redirect), so it does
   not trip the "unsourceable" failure — it silently produces a `.env.local`
   whose `ORCHESTRATION_DB_PASSWORD` is the literal string
   `replace-me-with-a-random-value`, which the `orchestration_service` role
   (created by `engine-db-init.sh` from `ORCHESTRATION_DB_PASSWORD`) will not
   have unless someone also passed that literal to the init script. It is a
   second, quieter failure mode of the same file. The bootstrap substitutes
   it; worth flagging because it is inconsistent with the file's own
   `<placeholder>` convention and would not be caught by a "no `<` remains"
   check alone.

2. **`MEMORY_DB_PASSWORD` and `ADS_DB_PASSWORD` are referenced but never
   assigned.** This is the gap the prompt named. It is not strictly "wrong"
   (the file is explicit that it is a template to be filled), but it is
   *incomplete in a way nobody can fill correctly without the authority* —
   `ADS_DB_PASSWORD` is not derivable from the example at all, and the 5433
   hint for `MEMORY_DB_PASSWORD` is misleading for ADS. The bootstrap resolves
   both from `docker-compose.yml` + `engine-db-init.sh`.

3. **The header comment on lines 73–76 documents the ADS dev credential**, so
   the information was in the file all along — just not in a form a script
   could use, and not adjacent to the `EVAL_ADS_DB_URL` line that needs it.
   Worth recording: the knowledge existed; what was missing was the path from
   the knowledge to the substitution.

No other content in `.env.local.example` is wrong; the rest is unfilled
template by design, and the bootstrap fills it without changing what any
service reads.

## Verification standard compliance

- **Real behaviour, not process state:** `verify_file` sources the generated
  file with bash, checks for leftover placeholders, recomputes the SHA-256 of
  the token and compares, and asserts the two authority-resolved passwords.
- **Runs without anyone remembering:** `scripts/bootstrap-env-local.sh --check`
  is wired into `.github/workflows/ci.yml` as the "env-local bootstrap check"
  step, so the `gate` job runs it on every PR and every push to main.
- **Proven to fail:** two named failures shown verbatim above (blanked
  `MEMORY_DB_PASSWORD`; leftover `<PLATFORM_DB_PASSWORD>` in a URL).
- **Nothing permanently red:** `--check` generates its own fresh temp file and
  verifies it; it does not touch the real `.env.local` and needs no Docker or
  AWS, so CI (which has no live AWS creds and no prior `.env.local`) runs it
  cleanly. The stale-volume detection is best-effort and degrades to a
  warning when docker is unavailable, so it is not a permanently-red member.

## Sandbox limits, verbatim

The live "services answering" half of the done gate could not be run in the
builder sandbox. The sandbox blocks the two things it needs:

- **Docker:** `docker info` returns `permission denied while trying to
  connect to the docker API at
  unix:///Users/havishvardhan/.docker/run/docker.sock`. The dependency stack
  (`engine-db`, `ads-db`, `cost-db`, `redis`, `localstack`, `temporal`)
  cannot be started, so no service can be brought up to answer.
- **AWS:** the AWS CLI is forced through a dead sandbox proxy:
  `aws: [ERROR]: Failed to connect to proxy URL: "http://127.0.0.1:57525"`.
  `curl https://bedrock-runtime.ap-south-1.amazonaws.com` returns `000`.

Escalation to `full_network` / `all` was requested and not granted. The
bootstrap script itself runs fully in-sandbox (proven above); only the
final `docker compose up` + health-probe step needs an environment the
sandbox does not provide. That step is one command, documented in the
script's own "Next:" output line, and is the same step `docs/local-dev.md`
already documents — no undocumented research was added.

## Files

- `scripts/bootstrap-env-local.sh` — the bootstrap (create / --merge / --check).
- `.github/workflows/ci.yml` — wires `--check` into the `gate` job.
- `docs/local-dev.md` — points at the bootstrap under "Configure".
- `docs/phase-1-task-c21-report.md` — this report.

No service code changed; no credential committed; `.gitignore` already covers
`.env.*` (verified: `git check-ignore .env.local` → ignored). Branch
`task/c21-env-bootstrap` is not merged; PR opened and stopped, per the prompt.
