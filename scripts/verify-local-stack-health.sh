#!/bin/sh
# Task 1.0 regression check, reworked by Project Revive task C16.
#
# Asserts the local stack is genuinely healthy: every docker-compose
# dependency, every documented application service's HTTP surface, and every
# documented gRPC surface actually answers -- not just "container is running"
# or "Docker's cached Health.Status says healthy".
#
# Why this exists: #124 (docs/memoryalter.md) -- a stack that reported healthy
# for an extended period while a real problem existed underneath, because the
# check that would have caught it was itself broken. A check that cannot fail
# loudly is worse than no check.
#
# This script previously failed docs/verification-standard.md in two respects
# (admitted in its own header). C16 fixes both:
#
#   1. NINE CHECKS READ DOCKER'S CACHED Health.Status via `docker inspect`
#      rather than probing. Docker runs a real command but on its own 5s
#      interval, so a container that just died still read healthy for up to
#      one interval -- process state, not real behaviour. All nine are now
#      FRESH PROBES run at check time: pg_isready, redis-cli ping, grpcurl,
#      curl against the service's own health endpoint.
#
#   2. PORTS WERE HARDCODED sandbox values, some moved to dodge collisions and
#      not this repo's committed defaults. Every dependency port now comes
#      from the SAME source docker-compose.yml reads -- the *_PORT vars in
#      .env.local, with the committed value as the default. The script
#      sources .env.local if present, so an operator who overrode ports for
#      coexistence (Part A) gets those overrides checked without editing this
#      file. The list is not duplicated: docker-compose.yml and this script
#      both read ${PLATFORM_DB_PORT:-5432} etc.
#
# Usage:
#   sh scripts/verify-local-stack-health.sh
#
# The script sources ./.env.local if it exists (set -a), so it checks the
# same ports the services read. Override any var by exporting it first.

set -u

# Read the same source the services read. .env.local is gitignored and never
# committed; if absent, defaults below apply (committed values).
if [ -f ./.env.local ]; then
  set -a
  . ./.env.local
  set +a
fi

FAILURES=0

pass() { printf '  [PASS] %s\n' "$1"; }
fail() { printf '  [FAIL] %s -- %s\n' "$1" "$2"; FAILURES=$((FAILURES + 1)); }

check_http() {
  name="$1"; url="$2"
  body=$(curl -s --max-time 5 "$url" 2>&1)
  code=$(curl -s -o /dev/null --max-time 5 -w '%{http_code}' "$url" 2>&1)
  if [ "$code" = "200" ]; then
    pass "$name ($url) -> $body"
  else
    fail "$name ($url)" "HTTP ${code:-000}, body: $body"
  fi
}

check_grpc() {
  name="$1"; addr="$2"
  if ! command -v grpcurl >/dev/null 2>&1; then
    fail "$name ($addr)" "grpcurl not installed -- cannot fresh-probe gRPC (install grpcurl or this check is unverifiable)"
    return
  fi
  out=$(grpcurl -plaintext -connect-timeout 3 "$addr" list 2>&1)
  if printf '%s' "$out" | grep -qi 'connection refused\|no connection could be made\|dial tcp'; then
    fail "$name ($addr)" "$out"
  else
    pass "$name ($addr) -> $out"
  fi
}

# Fresh "port answers" probe for ingest endpoints that do not return 200 on a
# GET (e.g. OTLP HTTP ingest). Anything other than 000 means something is
# listening and speaking HTTP; 000 means nothing answered.
check_port() {
  name="$1"; url="$2"
  code=$(curl -s -o /dev/null --max-time 3 -w '%{http_code}' "$url" 2>&1)
  if [ "$code" = "000" ]; then
    fail "$name ($url)" "no response (000)"
  else
    pass "$name ($url) -> HTTP $code (port answers)"
  fi
}

# Fresh Postgres probe (replaces docker inspect .State.Health.Status).
# pg_isready returns 0 only if the server accepts a connection -- real
# behaviour, not cached state.
check_pg() {
  name="$1"; host="$2"; port="$3"; user="$4"; db="$5"
  if pg_isready -h "$host" -p "$port" -U "$user" -d "$db" -t 1 >/dev/null 2>&1; then
    pass "$name (pg_isready $host:$port/$db)"
  else
    fail "$name (pg_isready $host:$port/$db)" "pg_isready did not accept a connection"
  fi
}

# Fresh Redis probe.
check_redis() {
  name="$1"; host="$2"; port="$3"
  out=$(redis-cli -h "$host" -p "$port" ping 2>&1)
  if [ "$out" = "PONG" ]; then
    pass "$name (redis-cli $host:$port ping) -> PONG"
  else
    fail "$name (redis-cli $host:$port ping)" "got '$out' (expected PONG)"
  fi
}

echo "== Dependency stack (fresh probes, not Docker cached status) =="
check_pg "platform-db" 127.0.0.1 "${PLATFORM_DB_PORT:-5432}" platform_api platform_db
check_pg "engine-db"   127.0.0.1 "${ENGINE_DB_PORT:-5433}" audit_service audit_db
check_pg "ads-db"      127.0.0.1 "${ADS_DB_PORT:-5434}" ads_core ads_db
check_pg "cost-db"     127.0.0.1 "${COST_DB_PORT:-5435}" cost_ledger_service cost_db
check_redis "redis" 127.0.0.1 "${REDIS_PORT:-6379}"
# Temporal: fresh gRPC probe -- a down server returns "connection refused".
check_grpc "temporal (gRPC)" "127.0.0.1:${TEMPORAL_PORT:-7233}"
check_http "temporal web UI" "http://127.0.0.1:${TEMPORAL_UI_PORT:-8233}/"
# Tempo: fresh HTTP /ready probe (the compose healthcheck's own signal).
check_http "tempo (own /ready)" "http://127.0.0.1:${TEMPO_PORT:-3200}/ready"
# Tempo OTLP ingest ports: fresh probes. The gRPC ingest answers grpcurl; the
# HTTP ingest does not return 200 on a GET (it expects an OTLP POST), so a
# "port answers" probe is the honest signal.
check_grpc "tempo OTLP gRPC ingest" "127.0.0.1:${TEMPO_OTLP_GRPC_PORT:-4317}"
check_port "tempo OTLP HTTP ingest" "http://127.0.0.1:${TEMPO_OTLP_HTTP_PORT:-4318}"
# Presidio: fresh HTTP /health probes.
check_http "presidio-analyzer (own /health)" "http://127.0.0.1:${PRESIDIO_ANALYZER_PORT:-5001}/health"
check_http "presidio-anonymizer (own /health)" "http://127.0.0.1:${PRESIDIO_ANONYMIZER_PORT:-5002}/health"
# grafana + localstack already probed their own endpoints (no docker-level probe trusted).
check_http "grafana (own health endpoint)" "http://127.0.0.1:${GRAFANA_PORT:-3300}/api/health"
check_http "localstack (own health endpoint)" "http://127.0.0.1:${LOCALSTACK_PORT:-4566}/_localstack/health"

echo ""
echo "== Application services (HTTP) =="
check_http "audit-service"         "http://127.0.0.1:${AUDIT_PORT:-3021}/health"
check_http "ads-core"              "http://127.0.0.1:${ADS_CORE_PORT:-8010}/health"
check_http "cost-ledger-service"   "http://127.0.0.1:${COST_PORT:-3022}/health"
check_http "orchestration-service" "http://127.0.0.1:${ORCHESTRATION_PORT:-3010}/health"
check_http "background-workers"    "http://127.0.0.1:${BACKGROUND_WORKERS_PORT:-3011}/health"
check_http "model-gateway"         "http://127.0.0.1:${MODEL_GATEWAY_PORT:-3023}/health"
check_http "tool-gateway"          "http://127.0.0.1:${TOOL_GATEWAY_PORT:-3024}/health"
check_http "sandbox-service"       "http://127.0.0.1:${SANDBOX_SERVICE_PORT:-3025}/health"
check_http "provisioning-service"  "http://127.0.0.1:${PROVISIONING_SERVICE_PORT:-3026}/health"
check_http "platform-api"          "http://127.0.0.1:${PLATFORM_API_PORT:-3020}/health"
check_http "intelligence-service"  "http://127.0.0.1:${INTELLIGENCE_SERVICE_PORT:-8000}/health"
check_http "verification-service"  "http://127.0.0.1:${VERIFICATION_SERVICE_PORT:-8001}/health"
check_http "memory-service"        "http://127.0.0.1:${MEMORY_SERVICE_PORT:-8002}/health"
check_http "eval-service"          "http://127.0.0.1:${EVAL_SERVICE_PORT:-8003}/health"
check_http "platform-web"          "http://localhost:${PLATFORM_WEB_PORT:-5173}/"
check_http "local-mock-auth0 jwks" "http://127.0.0.1:${MOCK_AUTH0_PORT:-4999}/.well-known/jwks.json"

echo ""
echo "== Application services (gRPC) =="
check_grpc "model-gateway"                           "127.0.0.1:${MODEL_GATEWAY_GRPC_PORT:-50051}"
check_grpc "orchestration-service: compiler"         "127.0.0.1:${COMPILER_GRPC_PORT:-50056}"
check_grpc "orchestration-service: recovery"         "127.0.0.1:${RECOVERY_GRPC_PORT:-50058}"
check_grpc "orchestration-service: runs"             "127.0.0.1:${RUNS_GRPC_PORT:-50059}"
check_grpc "orchestration-service: registry"         "127.0.0.1:${REGISTRY_GRPC_PORT:-50063}"
check_grpc "orchestration-service: nodeexec"         "127.0.0.1:${NODEEXEC_GRPC_PORT:-50064}"
check_grpc "orchestration-service: blackboard"       "127.0.0.1:${BLACKBOARD_GRPC_PORT:-50065}"
check_grpc "orchestration-service: deployctl"        "127.0.0.1:${DEPLOYCTL_GRPC_PORT:-50066}"
check_grpc "orchestration-service: artifact-content" "127.0.0.1:${ARTIFACT_CONTENT_GRPC_PORT:-50067}"
check_grpc "orchestration-service: conversation"     "127.0.0.1:${CONVERSATION_GRPC_PORT:-50072}"
check_grpc "audit-service"                           "127.0.0.1:${AUDIT_GRPC_PORT:-50068}"
check_grpc "cost-ledger-service"                     "127.0.0.1:${COST_GRPC_PORT:-50069}"
check_grpc "tool-gateway"                            "127.0.0.1:${TOOLGW_GRPC_PORT:-50053}"
check_grpc "sandbox-service"                         "127.0.0.1:${SANDBOX_GRPC_PORT:-50057}"
check_grpc "provisioning-service"                    "127.0.0.1:${PROVISIONING_GRPC_PORT:-50055}"
check_grpc "intelligence-service: capability-resolver" "127.0.0.1:${CAPABILITY_RESOLVER_PORT:-50061}"
check_grpc "verification-service"                    "127.0.0.1:${VERIFY_SERVICE_PORT:-50054}"

echo ""
if [ "$FAILURES" -eq 0 ]; then
  echo "RESULT: all checks passed -- stack is genuinely healthy."
  exit 0
else
  echo "RESULT: $FAILURES check(s) FAILED -- stack is NOT healthy."
  exit 1
fi
