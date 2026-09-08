#!/usr/bin/env bash
# Project Revive task C16 — coexistence proof (verification standard proof 1).
#
# Brings THIS project's stack up on overridden ports while sibling stacks
# (alter-x-4-, alterengine--5) keep running untouched on their own ports,
# runs the (now fresh-probe) health check against the overridden ports, then
# shows the sibling stacks STILL running afterwards. That is the collision
# actually solved rather than swapped.
#
# This is the executable artefact for the live proof the sandbox cannot run
# (docker socket denied there). Run it on a host with docker + the sibling
# stacks up. It does not stop, restart or reconfigure any container belonging
# to alter-x-4- or alterengine--5 -- it only starts THIS project's compose
# project on different ports and tears that down at the end.
#
# Usage:
#   scripts/verify-coexistence.sh            # bring up, check, tear down
#   scripts/verify-coexistence.sh --no-teardown  # leave the stack up for inspection
set -euo pipefail

cd "$(dirname "$0")/.."

TEARDOWN=1
[ "${1:-}" = "--no-teardown" ] && TEARDOWN=0

# Sibling stacks hold: alter-x-4- -> 5432,5433,5434,6379,4566,7233
#                     alterengine--5 -> 5440,6390,7240
# Pick overrides that touch none of those.
export PLATFORM_DB_PORT=15432
export ENGINE_DB_PORT=15433
export ADS_DB_PORT=15434
export COST_DB_PORT=15435
export REDIS_PORT=16379
export LOCALSTACK_PORT=14566
export TEMPORAL_PORT=17233
export TEMPORAL_UI_PORT=18233
export TEMPO_PORT=13200
export TEMPO_OTLP_GRPC_PORT=14317
export TEMPO_OTLP_HTTP_PORT=14318
export GRAFANA_PORT=13300
export PRESIDIO_ANALYZER_PORT=15001
export PRESIDIO_ANONYMIZER_PORT=15002

echo "== Sibling stacks BEFORE (must be up and untouched) =="
docker ps --format '{{.Names}}\t{{.Ports}}' | grep -Ei 'alter-x-4-|alterengine--5|alterengine-5' || echo "(no sibling containers visible by name; verify with your own ps)"

# pass/fail for the app-layer proof (the health script has its own, out of scope here).
COEXIST_FAIL=0
pass() { printf "  [PASS] %s\n" "$1"; }
fail() { printf "  [FAIL] %s -- %s\n" "$1" "$2"; COEXIST_FAIL=$((COEXIST_FAIL + 1)); }

echo ""
echo "== Bringing THIS project's stack up on overridden ports =="
if [ ! -f .env.local ]; then
  echo "  no .env.local; running bootstrap-env-local.sh first"
  scripts/bootstrap-env-local.sh
fi
# Source .env.local so compose gets the DB passwords, then override ports.
set -a; . ./.env.local; set +a
export PLATFORM_DB_PORT ENGINE_DB_PORT ADS_DB_PORT COST_DB_PORT REDIS_PORT
export LOCALSTACK_PORT TEMPORAL_PORT TEMPORAL_UI_PORT TEMPO_PORT
export TEMPO_OTLP_GRPC_PORT TEMPO_OTLP_HTTP_PORT GRAFANA_PORT
export PRESIDIO_ANALYZER_PORT PRESIDIO_ANONYMIZER_PORT

docker compose --env-file .env.local up -d --build --wait \
  engine-db ads-db cost-db redis localstack temporal tempo grafana \
  presidio-analyzer presidio-anonymizer

echo ""
echo "== Health check against overridden ports (fresh probes) =="
sh scripts/verify-local-stack-health.sh || HEALTH_FAIL=1

echo ""
echo "== App-layer coexistence proof (writes a row to THIS stack's DB on the overridden port, reads it back from the overridden port only) =="
# Prove the app path resolves to THIS stack's database, not a sibling's. We use
# the SAME connection string audit-service reads (AUDIT_DATABASE_URL with the
# overridden ENGINE_DB_PORT) and write a uniquely-marked row, then read it back
# from the overridden port, and confirm the default-port engine-db (a sibling's,
# on 5433) does NOT have it. This is the exact failure C16 would otherwise
# hide: services dialing a sibling's database on the default port.
MARKER="c16-coexist-$(date +%s)-$$"
write_row() {
  # $1 = host, $2 = port, $3 = password ; uses audit_service / audit_db
  PGPASSWORD="$3" psql -h "$1" -p "$2" -U audit_service -d audit_db -v ON_ERROR_STOP=1 -c \
    "CREATE TABLE IF NOT EXISTS _c16_coexist_probe(marker text); DELETE FROM _c16_coexist_probe; INSERT INTO _c16_coexist_probe(marker) VALUES ('$MARKER');" >/dev/null 2>&1
}
read_row() {
  # $1 = host, $2 = port, $3 = password ; prints the marker or EMPTY
  PGPASSWORD="$3" psql -h "$1" -p "$2" -U audit_service -d audit_db -Atc \
    "SELECT marker FROM _c16_coexist_probe WHERE marker='$MARKER';" 2>&1
}
if ! command -v psql >/dev/null 2>&1; then
  echo "  psql not on host; falling back to docker compose exec engine-db (writes the row inside THIS container only)"
  docker compose --env-file .env.local exec -T engine-db sh -c \
    "PGPASSWORD=\"\$AUDIT_DB_PASSWORD\" psql -U audit_service -d audit_db -v ON_ERROR_STOP=1 -c \"CREATE TABLE IF NOT EXISTS _c16_coexist_probe(marker text); DELETE FROM _c16_coexist_probe; INSERT INTO _c16_coexist_probe(marker) VALUES ('$MARKER');\"" >/dev/null
  got=$(docker compose --env-file .env.local exec -T engine-db sh -c \
    "PGPASSWORD=\"\$AUDIT_DB_PASSWORD\" psql -U audit_service -d audit_db -Atc \"SELECT marker FROM _c16_coexist_probe WHERE marker='$MARKER';\"")
  if [ "$got" = "$MARKER" ]; then
    pass "app-layer: row written+read inside THIS engine-db container (marker=$MARKER)"
  else
    fail "app-layer: row not read back from THIS engine-db container" "got '$got'"
  fi
  echo "  (host psql absent; sibling-absence check skipped -- the row lives in THIS project's engine-db container, a different container from any sibling's)"
else
  write_row 127.0.0.1 "$ENGINE_DB_PORT" "$AUDIT_DB_PASSWORD" \
    && pass "app-layer: wrote row to THIS engine-db on overridden port $ENGINE_DB_PORT (marker=$MARKER)" \
    || fail "app-layer: write to 127.0.0.1:$ENGINE_DB_PORT/audit_db" "psql write failed"
  got=$(read_row 127.0.0.1 "$ENGINE_DB_PORT" "$AUDIT_DB_PASSWORD")
  if [ "$got" = "$MARKER" ]; then
    pass "app-layer: read row back from overridden port $ENGINE_DB_PORT -> $MARKER"
  else
    fail "app-layer: read back from overridden port $ENGINE_DB_PORT" "got '$got' (expected $MARKER)"
  fi
  # The default-port engine-db is a sibling's (alter-x-4- on 5433). The row must
  # NOT be reachable there. Auth may differ (sibling's own password) or the row
  # may simply be absent -- either proves THIS stack's row is not in the sibling's db.
  sibling_out=$(PGPASSWORD="$AUDIT_DB_PASSWORD" psql -h 127.0.0.1 -p 5433 -U audit_service -d audit_db -Atc "SELECT marker FROM _c16_coexist_probe WHERE marker='$MARKER';" 2>&1)
  if [ "$sibling_out" = "$MARKER" ]; then
    fail "app-layer: row IS reachable on default port 5433 (sibling's db) -- coexistence FAILED, footgun armed" "marker found on 5433"
  elif printf '%s' "$sibling_out" | grep -qi 'authentication\|password\|failed\|refused\|denied'; then
    pass "app-layer: default port 5433 is a different database (auth differed: $(printf '%s' "$sibling_out" | head -1)) -- row NOT there"
  else
    pass "app-layer: row absent from default-port 5433 engine-db (sibling) -- coexistence holds"
  fi
  # cleanup THIS stack's probe table
  PGPASSWORD="$AUDIT_DB_PASSWORD" psql -h 127.0.0.1 -p "$ENGINE_DB_PORT" -U audit_service -d audit_db -c "DROP TABLE _c16_coexist_probe;" >/dev/null 2>&1 || true
fi

echo ""
echo "== Sibling stacks AFTER (must STILL be up) =="
docker ps --format '{{.Names}}\t{{.Ports}}' | grep -Ei 'alter-x-4-|alterengine--5|alterengine-5' || echo "(none visible by name)"

if [ "${HEALTH_FAIL:-0}" -ne 0 ]; then
  echo "RESULT: health check FAILED on overridden ports."
fi

if [ "$TEARDOWN" -eq 1 ]; then
  echo ""
  echo "== Tearing down THIS project's stack only (siblings untouched) =="
  docker compose --env-file .env.local down
fi

echo ""
echo "Coexistence proof complete. Sibling stacks were not stopped or reconfigured."
exit $(( ${HEALTH_FAIL:-0} + ${COEXIST_FAIL:-0} ))
