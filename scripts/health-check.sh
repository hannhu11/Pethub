#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/home/ubuntu/pethub}"
ENV_FILE="${ENV_FILE:-.env.production}"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.production.yml}"
DOCKER_BIN="${DOCKER_BIN:-docker}"

cd "$APP_DIR"

expected_services=(api nginx postgres redis web worker)
running_services="$("$DOCKER_BIN" compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" ps --services --status running || true)"
need_recover=0

for service in "${expected_services[@]}"; do
  if ! grep -qx "$service" <<<"$running_services"; then
    echo "$(date -Is) service down: $service"
    need_recover=1
  fi
done

if ! curl -fsS --max-time 8 http://127.0.0.1/api/health >/dev/null; then
  echo "$(date -Is) health endpoint failed"
  need_recover=1
fi

if [[ "$need_recover" -eq 1 ]]; then
  echo "$(date -Is) recovering stack"
  "$DOCKER_BIN" compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" up -d --remove-orphans
fi
