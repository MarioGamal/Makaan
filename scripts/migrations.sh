#!/usr/bin/env bash
set -euo pipefail

script_directory="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
repository_root="$(CDPATH= cd -- "$script_directory/.." && pwd)"
backend_directory="$repository_root/backend"
typeorm_cli="$repository_root/node_modules/.bin/typeorm-ts-node-commonjs"
action="${1:-}"
database_url="${DATABASE_URL:-}"

if [[ "$action" != 'run' && "$action" != 'revert' ]]; then
  printf '%s\n' 'Usage: scripts/migrations.sh <run|revert>' >&2
  exit 2
fi
if [[ -z "$database_url" || ( "$database_url" != postgres://* && "$database_url" != postgresql://* ) ]]; then
  printf '%s\n' 'DATABASE_URL must be an explicit PostgreSQL URL.' >&2
  exit 2
fi
if [[ ! -x "$typeorm_cli" ]]; then
  printf '%s\n' 'TypeORM CLI is unavailable; run npm install first.' >&2
  exit 1
fi

normalized_url="$(printf '%s' "$database_url" | tr '[:upper:]' '[:lower:]')"
if [[ "$action" == 'revert' ]]; then
  if [[ "${APP_MODE:-}" == 'production' || "$normalized_url" =~ (prod|production|live|makaan\.eg) ]]; then
    printf '%s\n' 'Production migration reverts are prohibited by this developer command.' >&2
    exit 2
  fi
  if [[ "${MAKAAN_ALLOW_MIGRATION_REVERT:-}" != '1' ]]; then
    printf '%s\n' 'Set MAKAAN_ALLOW_MIGRATION_REVERT=1 for an intentional non-production revert.' >&2
    exit 2
  fi
fi

cd "$backend_directory"
exec "$typeorm_cli" "migration:$action" -d src/database/data-source.ts
