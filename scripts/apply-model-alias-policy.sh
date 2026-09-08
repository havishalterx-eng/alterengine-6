#!/usr/bin/env bash
# Bind the four model aliases (FAST/STANDARD/ADVANCED/CEILING) to a real Bedrock
# model by writing the Phase 1 alias policy to the SSM parameter the
# model-gateway's OperationalConfigProvider reads as its live override.
#
# Why this is the binding mechanism (not obvious from the code alone):
#   apps/model-gateway/src/operations/operational-config-provider.ts
#     resolveModelAlias() -> loadOverride() -> readPolicy(parameterName)
#   reads an SSM parameter named by MODEL_POLICY_OVERRIDE_PARAMETER_NAME
#   (default /alter/<env>/model-gateway/model-policy) and, if present and
#   parseable, returns its bindings with PRECEDENCE over the AppConfig
#   baseline (AwsAppConfigConfigProvider). When the override parameter is
#   absent, resolveModelAlias falls back to the AppConfig baseline. So
#   BOTH are involved, but the SSM override wins -- writing the policy
#   here is what makes a live model-gateway resolve every alias to qwen.
#
# Usage:
#   scripts/apply-model-alias-policy.sh [alter_env] [policy_file] [parameter_name]
#
# Defaults:
#   alter_env       = local
#   policy_file     = infrastructure/model-alias-policy/phase-1-qwen-all-aliases.json
#   parameter_name  = /alter/<alter_env>/model-gateway/model-policy
#
# Requires real AWS credentials with ssm:PutParameter in ALTER_REGION
# (ap-south-1). Never commits a credential. The policy file contains no
# secrets -- only model ids and capability tags.
#
# Phase 1 deliberately starts every alias on qwen.qwen3-32b-v1:0 so the
# first golden-set number measures the ENGINE rather than a tier-mapping
# guess. fallback_chain is omitted (empty): FallbackProviderSchema is
# z.enum(["anthropic","openai"]), Anthropic is out of scope by decision,
# and OpenAI-on-Bedrock returned no text in testing -- so the chain cannot
# currently express a working non-Anthropic provider. See Track C20.

set -euo pipefail

ALTER_ENV="${1:-local}"
POLICY_FILE="${2:-infrastructure/model-alias-policy/phase-1-qwen-all-aliases.json}"
if [ "$#" -ge 3 ]; then
  PARAMETER_NAME="$3"
else
  PARAMETER_NAME="/alter/${ALTER_ENV}/model-gateway/model-policy"
fi

REGION="${ALTER_REGION:-ap-south-1}"

if [ ! -f "$POLICY_FILE" ]; then
  echo "apply-model-alias-policy: policy file not found: $POLICY_FILE" >&2
  exit 1
fi

# Validate the file parses as JSON before pushing it anywhere.
if ! jq -e . "$POLICY_FILE" >/dev/null 2>&1; then
  echo "apply-model-alias-policy: $POLICY_FILE is not valid JSON" >&2
  exit 1
fi

echo "Applying model alias policy:"
echo "  file          : $POLICY_FILE"
echo "  parameter     : $PARAMETER_NAME"
echo "  region        : $REGION"
echo "  bindings       : $(jq -c '.bindings | to_entries | map({key, model_id: .value.model_id}) | from_entries' "$POLICY_FILE")"

aws --region "$REGION" ssm put-parameter \
  --name "$PARAMETER_NAME" \
  --value "file://${POLICY_FILE}" \
  --type String \
  --overwrite >/dev/null

echo "Applied. A running model-gateway picks this up on its next resolveModelAlias() call (loadOverride refreshes every resolution)."
