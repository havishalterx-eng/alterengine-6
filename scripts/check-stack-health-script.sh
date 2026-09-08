#!/usr/bin/env bash
# Driver for scripts/verify-local-stack-health.sh (Project Revive task C16).
#
# docs/verification-standard.md requirement 2: an unwired check is verifyChain()
# again -- machinery with no caller. The full health check needs a running
# docker stack, which CI's gate job does not have, so the full check runs
# wherever a stack is up (developer machines; the C16 coexistence proof
# command in docs/phase-1-task-c16-report.md). THIS script is what CI runs
# on every PR to keep the health check honest without a stack:
#
#   1. verify-local-stack-health.sh is syntactically valid (sh -n).
#   2. Every dependency host port docker-compose.yml parameterises appears in
#      the health script with the same var name and default -- so the two
#      sources cannot drift. If someone adds a port to compose but forgets the
#      health script (the exact failure C16 fixes), this fails the gate.
#   3. No dependency port is still a bare literal in compose (all must be
#      ${VAR:-default}).
#
# It does not claim the stack is healthy -- it has no stack. It claims the
# health check is wired to the same ports compose uses and will run when a
# stack exists. That is the driver-exists proof the standard requires.
set -euo pipefail

cd "$(dirname "$0")/.."

HEALTH=scripts/verify-local-stack-health.sh
COMPOSE=docker-compose.yml

[ -f "$HEALTH" ] || { echo "check-stack-health-script: $HEALTH missing" >&2; exit 2; }
[ -f "$COMPOSE" ] || { echo "check-stack-health-script: $COMPOSE missing" >&2; exit 2; }

# 1. syntax
sh -n "$HEALTH" || { echo "check-stack-health-script: $HEALTH has syntax errors" >&2; exit 1; }

# 2. collect dependency port vars from compose port mappings: ${VAR:-NNNN}
compose_vars="$(grep -oE '\$\{[A-Z_][A-Z0-9_]*_PORT:-[0-9]+\}' "$COMPOSE" \
  | sed -E 's/\$\{([A-Z_][A-Z0-9_]*):-.*/\1/' | sort -u)"

# 3. no bare-literal host ports remain in compose
bare="$(grep -nE '"127\.0\.0\.1:[0-9]+:[0-9]+"' "$COMPOSE" || true)"
if [ -n "$bare" ]; then
  echo "check-stack-health-script: bare literal host port(s) in $COMPOSE (must be \${VAR:-default}):" >&2
  echo "$bare" >&2
  exit 1
fi

# 4. every compose dependency port var must be read by the health script
missing=0
for v in $compose_vars; do
  if ! grep -qE "\\\$\{$v:-" "$HEALTH"; then
    echo "check-stack-health-script: $v is parameterised in $COMPOSE but NOT read by $HEALTH" >&2
    missing=1
  fi
done
[ "$missing" -eq 0 ] || exit 1

echo "check-stack-health-script ok: $HEALTH syntax valid, all $(echo "$compose_vars" | wc -l | tr -d ' ') compose dependency port(s) read by the health script, no bare-literal ports."
