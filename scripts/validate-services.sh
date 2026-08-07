#!/usr/bin/env bash
set -euo pipefail

script_directory="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
local_services="$script_directory/local-services.sh"
validation_project="makaan_validate_$(date +%s)_$$"
services_started=false
validation_database='makaan_test_validation'
validation_user='makaan_validation'
validation_password='makaan_validation_password'

validation_environment=(
  MAKAAN_COMPOSE_PROJECT="$validation_project"
  MAKAAN_DISPOSABLE_VALIDATION=1
  MAKAAN_POSTGRES_PORT=0
  MAKAAN_REDIS_PORT=0
  MAKAAN_POSTGRES_DB="$validation_database"
  MAKAAN_POSTGRES_USER="$validation_user"
  MAKAAN_POSTGRES_PASSWORD="$validation_password"
)

cleanup() {
  if [[ "$services_started" != true ]]; then
    return
  fi
  env "${validation_environment[@]}" bash "$local_services" purge || true
}

trap cleanup EXIT

env "${validation_environment[@]}" bash "$local_services" up
services_started=true

compose_file="$script_directory/../infrastructure/docker/docker-compose.yml"
postgres_binding="$(env "${validation_environment[@]}" docker compose --project-name "$validation_project" --file "$compose_file" port postgres 5432)"
redis_binding="$(env "${validation_environment[@]}" docker compose --project-name "$validation_project" --file "$compose_file" port redis 6379)"
postgres_port="${postgres_binding##*:}"
redis_port="${redis_binding##*:}"
if [[ ! "$postgres_port" =~ ^[0-9]+$ || ! "$redis_port" =~ ^[0-9]+$ ]]; then
  printf '%s\n' 'Could not resolve disposable validation service ports.' >&2
  exit 1
fi

test_database_url="postgresql://${validation_user}:${validation_password}@127.0.0.1:${postgres_port}/${validation_database}"
test_redis_url="redis://127.0.0.1:${redis_port}/0"

if [[ "$#" -gt 0 ]]; then
  env \
    APP_MODE=test \
    NODE_ENV=test \
    DATABASE_URL="$test_database_url" \
    TEST_DATABASE_URL="$test_database_url" \
    REDIS_URL="$test_redis_url" \
    "$@"
else
  env "${validation_environment[@]}" bash "$local_services" status
fi
