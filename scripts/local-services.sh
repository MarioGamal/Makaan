#!/usr/bin/env bash
set -euo pipefail

script_directory="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
repository_root="$(CDPATH= cd -- "$script_directory/.." && pwd)"
compose_file="$repository_root/infrastructure/docker/docker-compose.yml"
project_name="${MAKAAN_COMPOSE_PROJECT:-makaan_local}"

usage() {
  cat <<'EOF'
Usage: scripts/local-services.sh <up|down|status|purge> [--tools]

Use --tools with up to start the optional PgAdmin profile. `purge` removes
volumes only for a generated disposable validation project and requires
MAKAAN_DISPOSABLE_VALIDATION=1.
EOF
}

require_docker() {
  if ! command -v docker >/dev/null 2>&1; then
    printf '%s\n' 'Docker Engine with Compose v2 is required. Install/start Docker, then retry.' >&2
    exit 1
  fi
  if ! docker compose version >/dev/null 2>&1; then
    printf '%s\n' 'Docker Compose v2 is required. Install the Docker Compose plugin, then retry.' >&2
    exit 1
  fi
}

if [[ ! -f "$compose_file" ]]; then
  printf 'Compose file is missing: %s\n' "$compose_file" >&2
  exit 1
fi

if [[ ! "$project_name" =~ ^[a-z0-9][a-z0-9_-]*$ ]]; then
  printf '%s\n' 'MAKAAN_COMPOSE_PROJECT must contain only lowercase letters, digits, underscores, or hyphens.' >&2
  exit 1
fi

action="${1:-status}"
shift || true
tools_profile=false
for argument in "$@"; do
  case "$argument" in
    --tools) tools_profile=true ;;
    --help|-h) usage; exit 0 ;;
    *) printf 'Unknown option: %s\n' "$argument" >&2; usage >&2; exit 2 ;;
  esac
done

require_docker
compose=(docker compose --project-name "$project_name" --file "$compose_file")

case "$action" in
  up)
    if [[ "$tools_profile" == true ]]; then
      compose+=(--profile tools)
    fi
    "${compose[@]}" up --detach --wait
    ;;
  down)
    "${compose[@]}" down --remove-orphans
    ;;
  status)
    "${compose[@]}" ps
    ;;
  purge)
    if [[ "${MAKAAN_DISPOSABLE_VALIDATION:-}" != '1' || ! "$project_name" =~ ^makaan_validate_[a-z0-9_-]+$ ]]; then
      printf '%s\n' 'Refusing volume deletion: purge is limited to generated makaan_validate_* projects with MAKAAN_DISPOSABLE_VALIDATION=1.' >&2
      exit 2
    fi
    "${compose[@]}" down --volumes --remove-orphans
    ;;
  *)
    printf 'Unknown action: %s\n' "$action" >&2
    usage >&2
    exit 2
    ;;
esac
