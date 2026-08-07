#!/usr/bin/env bash
set -euo pipefail

script_directory="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
repository_root="$(CDPATH= cd -- "$script_directory/.." && pwd)"
test_database_url="${TEST_DATABASE_URL:-}"

if [[ "${APP_MODE:-}" != 'test' || -z "$test_database_url" ]]; then
  printf '%s\n' 'Migration validation requires APP_MODE=test and an explicit TEST_DATABASE_URL.' >&2
  exit 2
fi
if [[ "$test_database_url" != postgres://* && "$test_database_url" != postgresql://* ]]; then
  printf '%s\n' 'Migration validation requires a PostgreSQL URL.' >&2
  exit 2
fi
normalized_url="$(printf '%s' "$test_database_url" | tr '[:upper:]' '[:lower:]')"
database_path="${normalized_url%%\?*}"
database_name="${database_path##*/}"
if [[ ! "$database_name" =~ (^|[_-])(test|ci)([_-]|$) || "$normalized_url" =~ (prod|production|live|makaan\.eg) ]]; then
  printf '%s\n' 'Refusing migration validation against a non-disposable or production-looking database.' >&2
  exit 2
fi

cd "$repository_root"
npm --workspace backend run test -- --runInBand backend/tests/integration/migrations.spec.ts
