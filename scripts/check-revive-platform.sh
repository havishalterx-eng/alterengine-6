#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
# Platform DB must be migrated (CI does this before this gate).
# Build dependencies even on documentation-only PRs where nx affected builds none.
pnpm exec nx run-many -t build -p auth,contracts,shared-clients,tenancy,adapters,observability --parallel=2
# The HTTP integration suite creates its own isolated Engine Postgres container.
pnpm --dir apps/platform-web exec vitest run src/api/revive-platform.spec.ts src/features/human-actions/pages/human-actions-list.spec.tsx
pnpm exec vitest run --config apps/platform-api/vitest.config.ts apps/platform-api/src/runs/run.controller.spec.ts apps/platform-api/src/projects/project.controller.spec.ts
pnpm exec vitest run tests/integration/platform
