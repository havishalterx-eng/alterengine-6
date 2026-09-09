#!/usr/bin/env bash
# Phase 1 (task 1.5) -- one-command runner for the 30-case intent golden
# set against real AWS Bedrock (qwen.qwen3-32b-v1:0).
#
# Brings up what it needs, runs the 30-case intent golden set, prints per-case
# reasons grouped, then runs it a second time and compares timings/outputs so
# a cache hit (an 80x speedup with identical outputs) is visible as cache
# contamination rather than read as a fast model. This is the executable
# artefact the Phase 1 master prompt requires -- not prose run instructions.
#
# Usage:
#   scripts/run-intent-golden-set.sh
#
# Prerequisites (all checked up front, fail-loud if missing):
#   - Docker with `docker compose` (dependency stack: engine-db for eval_db)
#   - Real AWS credentials with bedrock:InvokeModel in ap-south-1
#     (Bedrock needs no secret -- IAM/AWS creds only, per main.ts)
#   - pnpm + Node 22 (.nvmrc)
#
# Sandbox note (recorded verbatim in the PR): this script could NOT be run
# inside the builder sandbox that produced it. The sandbox forced the AWS
# CLI through a dead proxy at 127.0.0.1:57525 (`aws: [ERROR]: Failed to
# connect to proxy URL: "http://127.0.0.1:57525"`) and denied the Docker
# socket (`permission denied while trying to connect to the docker API at
# unix:///Users/havishvardhan/.docker/run/docker.sock`). "Not run" here is
# an environment limit, not a judgement that the run is unnecessary -- run
# this script on a host with real AWS + Docker to get the honest number.
#
# Never commits a credential. Exit 0 on completion regardless of pass
# rate (a bad honest number is the deliverable); non-zero only on a real
# setup failure.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

ENV_FILE="${ENV_FILE:-.env.local}"
if [ ! -f "$ENV_FILE" ]; then
  echo "run-intent-golden-set: $ENV_FILE not found -- copy .env.local.example first" >&2
  exit 2
fi
set -a; . "$ENV_FILE"; set +a

# This runner calls real Bedrock. LocalStack credentials from .env.local would
# override the operator's normal AWS credential chain and make that fail.
unset AWS_ACCESS_KEY_ID AWS_SECRET_ACCESS_KEY AWS_SESSION_TOKEN AWS_ENDPOINT_URL AWS_ENDPOINT_URL_STS

# Migrations and report must read same database. .env.local derives this URL
# from ENGINE_DB_PORT, so exported port overrides flow through both paths.
: "${EVAL_DB_URL_SYNC:?run-intent-golden-set: EVAL_DB_URL_SYNC is required}"
export EVAL_DB_URL_SYNC

# --- prerequisites -----------------------------------------------------------
if ! docker info >/dev/null 2>&1; then
  echo "run-intent-golden-set: docker is not reachable (socket denied / daemon down)" >&2
  exit 2
fi
if ! aws --region "${ALTER_REGION:-ap-south-1}" sts get-caller-identity >/dev/null 2>&1; then
  echo "run-intent-golden-set: AWS credentials not usable in ${ALTER_REGION:-ap-south-1}" >&2
  exit 2
fi
if ! command -v pnpm >/dev/null 2>&1 || ! node --version | grep -q '^v22\.'; then
  echo "run-intent-golden-set: pnpm and Node 22 are required (see .nvmrc)" >&2
  exit 2
fi

# --- dependency stack: engine-db (eval_db) + redis (cache) -------------------
docker compose --env-file "$ENV_FILE" up -d --build --wait \
  engine-db redis >/dev/null

# --- eval_db migrations + golden-set seed ------------------------------------
# alembic 0002_seed_launch_golden_sets seeds the 30-case intent golden set.
pnpm exec nx run eval-service:build >/dev/null
PY="$REPO_ROOT/apps/eval-service/.venv/bin/python"
if [ ! -x "$PY" ]; then
  echo "run-intent-golden-set: eval-service virtualenv missing after build" >&2
  exit 2
fi
pnpm exec nx run eval-service:migrate >/dev/null

# --- build the two eval processes ------------------------------------------
pnpm exec nx run model-gateway:build >/dev/null
pnpm exec nx run orchestration-service:build >/dev/null

MODEL_GW_DIST="$REPO_ROOT/dist/apps/model-gateway/eval_bootstrap_bedrock.js"
INTENT_DIST="$REPO_ROOT/dist/apps/orchestration-service/eval_intent_grpc_server.js"
if [ ! -f "$MODEL_GW_DIST" ] || [ ! -f "$INTENT_DIST" ]; then
  echo "run-intent-golden-set: eval builds missing ($MODEL_GW_DIST / $INTENT_DIST)" >&2
  exit 3
fi

# --- local M2M issuer (gRPC surfaces are behind ServiceAuthGuard) ------------
node scripts/local-mock-auth0/server.js >/tmp/alter-m2m.log 2>&1 &
M2M_PID=$!
export AUTH0_DOMAIN=alterx-local-m2m.test
export AUTH0_JWKS_URL=http://127.0.0.1:4999/.well-known/jwks.json
export API_AUDIENCE=https://engine.alter.local
export AUTH0_M2M_TOKEN_URL=http://127.0.0.1:4999/oauth/token
export AUTH0_M2M_AUDIENCE=https://engine.alter.local
export AUTH0_M2M_CLIENT_ID=local-dev-client
export AUTH0_M2M_CLIENT_SECRET=local-dev-secret
trap 'kill $M2M_PID 2>/dev/null || true' EXIT

free_port() { "$PY" -c "import socket; s=socket.socket(); s.bind(('127.0.0.1',0)); print(s.getsockname()[1]); s.close()"; }
MG_PORT=$(free_port); MG_HTTP=$(free_port); INTENT_PORT=$(free_port)

# --- model-gateway (Bedrock primary, qwen alias policy seeded in-process) ----
# eval_bootstrap_bedrock seeds PHASE_1_QWEN_POLICY into a mock mutable store
# read by OperationalConfigProvider with the same precedence the production
# SSM override (MODEL_POLICY_OVERRIDE_PARAMETER_NAME) uses. To bind the
# aliases on the PRODUCTION path too, run scripts/apply-model-alias-policy.sh.
ALTER_ENV=local ALTER_SERVICE_NAME=model-gateway ALTER_REGION="${ALTER_REGION:-ap-south-1}" \
ALTER_CONFIG_SOURCE=mock MODEL_GATEWAY_PORT="$MG_HTTP" MODEL_GATEWAY_GRPC_BIND_ADDRESS="127.0.0.1:$MG_PORT" \
  NODE_PATH="$REPO_ROOT/apps/model-gateway/node_modules:$REPO_ROOT/node_modules" \
  PATH="$PATH" \
  node "$MODEL_GW_DIST" >/tmp/alter-modelgw.log 2>&1 &
MG_PID=$!
trap 'kill $MG_PID 2>/dev/null || true' EXIT

# --- orchestration ConversationService.ClassifyIntent gRPC server ------------
NODE_PATH="$REPO_ROOT/apps/orchestration-service/node_modules:$REPO_ROOT/node_modules" \
  PATH="$PATH" \
  MODEL_GATEWAY_GRPC_TARGET="127.0.0.1:$MG_PORT" \
  GRPC_BIND_ADDRESS="127.0.0.1:$INTENT_PORT" \
  node "$INTENT_DIST" >/tmp/alter-intent.log 2>&1 &
INTENT_PID=$!
trap 'kill $INTENT_PID 2>/dev/null || true' EXIT

wait_port() {
  local port="$1" name="$2"
  for _ in $(seq 1 60); do
    if (echo >/dev/tcp/127.0.0.1/"$port") 2>/dev/null; then return 0; fi
    sleep 0.5
  done
  echo "run-intent-golden-set: $name on port $port never came up" >&2
  exit 3
}
wait_port "$MG_PORT" "model-gateway"
wait_port "$INTENT_PORT" "eval_intent_grpc_server"

export INTENT_GRPC_TARGET="127.0.0.1:$INTENT_PORT"
echo "=== Run 1 (cold cache) ==="
T0=$(date +%s.%N)
"$PY" "$REPO_ROOT/apps/eval-service/scripts/run_intent_golden_set.py" | tee /tmp/alter-golden-run1.txt
T1=$(date +%s.%N)

echo "=== Run 2 (cache warm -- compare timings/outputs) ==="
T2=$(date +%s.%N)
"$PY" "$REPO_ROOT/apps/eval-service/scripts/run_intent_golden_set.py" | tee /tmp/alter-golden-run2.txt
T3=$(date +%s.%N)

"$PY" - "$T0" "$T1" "$T2" "$T3" <<'PYEOF'
import sys
cold = float(sys.argv[2]) - float(sys.argv[1])
warm = float(sys.argv[4]) - float(sys.argv[3])
ratio = (cold / warm) if warm > 0 else float("inf")
print()
print(f"TIMING: run1={cold:.2f}s run2={warm:.2f}s ratio={ratio:.1f}x")
if ratio > 10:
    print("CACHE: second run was dramatically faster -- likely a semantic-cache hit,")
    print("       not a fast model (task 1.0's 80x speedup was exactly this).")
    print("       The model-gateway semantic cache threshold is 0.95; if golden-set")
    print("       cases resemble each other, cache hits return prior answers and")
    print("       the scores measure the cache, not the model. Report this; do")
    print("       not change the cache (Track C17 is the open decision).")
else:
    print("CACHE: no dramatic speedup -- second run did not hit the cache en masse.")
PYEOF

echo
echo "Done. Per-case reasons are grouped above; full output saved to /tmp/alter-golden-run{1,2}.txt"
