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
exit "${HEALTH_FAIL:-0}"
