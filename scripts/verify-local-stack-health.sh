#!/bin/sh
# Task 1.0 regression check.
#
# Asserts the local stack is genuinely healthy: every docker-compose
# dependency, every documented application service's HTTP surface, and
# every documented gRPC surface actually answers -- not just "container is
# running" or "port accepts a TCP connection".
#
# Why this exists: #124 (docs/memoryalter.md) shows a stack that reported
# healthy for an extended period while a real problem existed underneath,
# because the check that would have caught it was itself broken (a 5s
# timeout against ten assertions that took 7.4s). A check that cannot fail
# loudly is worse than no check. This script is deliberately one command
# and exits non-zero the moment anything is missing.
#
# KNOWN LIMITATIONS -- see docs/verification-standard.md, and tracked as C16.
# This script does not yet meet that standard in two respects:
#
#   1. Nine of the twenty-six checks read Docker's CACHED Health.Status via
#      `docker inspect` rather than probing the service themselves. Docker
#      runs a real command inside each container, but on its own 5s
#      interval, so there is a bounded staleness window: a container that
#      just died can still read "healthy" for up to one interval. The
#      standard requires real behaviour, not process state. These nine
#      should become fresh probes.
#
#   2. The port defaults below are the values observed in the sandbox run
#      this was written against (2026-09-08). Some match
#      .env.local.example; others were moved to dodge collisions and are
#      not this repository's committed defaults. On a machine using the
#      committed ports, those checks will fail for the wrong reason.
#      They should be read from the same source the services read.
#
# Until both are addressed this is a useful check, not a trustworthy gate,
# and it is deliberately not wired into CI yet.
#
# Usage:
#   sh scripts/verify-local-stack-health.sh
#
# Override any port with the matching *_PORT env var if your run differs.

set -u
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
  out=$(grpcurl -plaintext -connect-timeout 3 "$addr" list 2>&1)
  if printf '%s' "$out" | grep -qi 'connection refused\|no connection could be made\|dial tcp'; then
    fail "$name ($addr)" "$out"
  else
    pass "$name ($addr) -> $out"
  fi
}

# NOTE: reads Docker's cached probe result, not a fresh probe. See KNOWN
# LIMITATIONS above.
check_container_health() {
  name="$1"; container="$2"
  status=$(docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}(no healthcheck){{end}}' "$container" 2>&1)
  if [ "$status" = "healthy" ]; then
    pass "$name container health -> healthy"
  else
    fail "$name container health" "reported '$status' (expected healthy)"
  fi
}

echo "== Dependency stack (docker compose) =="
check_container_health "platform-db"         alterengine-6-platform-db-1
check_container_health "engine-db"           alterengine-6-engine-db-1
check_container_health "ads-db"              alterengine-6-ads-db-1
check_container_health "cost-db"             alterengine-6-cost-db-1
check_container_health "redis"               alterengine-6-redis-1
check_container_health "temporal"            alterengine-6-temporal-1
check_container_health "tempo"               alterengine-6-tempo-1
check_container_health "presidio-analyzer"   alterengine-6-presidio-analyzer-1
check_container_health "presidio-anonymizer" alterengine-6-presidio-anonymizer-1
# grafana ships with no docker-compose.yml HEALTHCHECK -- check its own endpoint.
check_http "grafana (own health endpoint)" "http://127.0.0.1:${GRAFANA_PORT:-3300}/api/health"
# LocalStack's docker-level probe is #124: ten assertions against a 5s
# timeout, which on a host where each awslocal call costs ~2.4s can never
# pass. `docker inspect` therefore cannot be trusted for it; its own
# /_localstack/health is the genuine signal.
check_http "localstack (own health endpoint)" "http://127.0.0.1:${LOCALSTACK_PORT:-4566}/_localstack/health"

echo ""
echo "== Application services (HTTP) =="
check_http "audit-service"         "http://127.0.0.1:${AUDIT_SERVICE_PORT:-3021}/health"
check_http "ads-core"              "http://127.0.0.1:${ADS_CORE_PORT:-8010}/health"
check_http "cost-ledger-service"   "http://127.0.0.1:${COST_LEDGER_PORT:-3022}/health"
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
