#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/home/ubuntu/pethub}"
ENV_FILE="${ENV_FILE:-$APP_DIR/.env.production}"
BACKUP_DIR="${BACKUP_DIR:-$APP_DIR/backups/postgres}"
RETENTION_DAYS="${RETENTION_DAYS:-7}"
DOCKER_BIN="${DOCKER_BIN:-docker}"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing env file: $ENV_FILE" >&2
  exit 1
fi

POSTGRES_PASSWORD="$(grep '^POSTGRES_PASSWORD=' "$ENV_FILE" | head -n1 | cut -d'=' -f2-)"
if [[ -z "${POSTGRES_PASSWORD:-}" ]]; then
  echo "POSTGRES_PASSWORD is empty in $ENV_FILE" >&2
  exit 1
fi

mkdir -p "$BACKUP_DIR"

timestamp="$(date +'%Y%m%d_%H%M%S')"
backup_file="$BACKUP_DIR/pethub_${timestamp}.sql.gz"

"$DOCKER_BIN" exec -e PGPASSWORD="$POSTGRES_PASSWORD" pethub-postgres \
  pg_dump -U pethub -d pethub --no-owner --no-privileges | gzip -9 > "$backup_file"

find "$BACKUP_DIR" -type f -name 'pethub_*.sql.gz' -mtime +"$RETENTION_DAYS" -delete

echo "Backup created: $backup_file"
