#!/usr/bin/env bash
set -euo pipefail

if [[ $# -ne 1 ]]; then
  echo "Usage: $0 /path/to/firebase-admin.json"
  exit 1
fi

SOURCE_JSON="$1"
PROJECT_ROOT="${PROJECT_ROOT:-/home/ubuntu/pethub}"
ENV_FILE="${PROJECT_ROOT}/.env.production"
SECRETS_DIR="${PROJECT_ROOT}/secrets"
TARGET_JSON="${SECRETS_DIR}/firebase-admin.json"
CONTAINER_FIREBASE_PATH="${CONTAINER_FIREBASE_PATH:-/run/secrets/firebase-admin.json}"

if [[ ! -f "$SOURCE_JSON" ]]; then
  echo "Input file not found: $SOURCE_JSON"
  exit 1
fi

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Env file not found: $ENV_FILE"
  exit 1
fi

python3 - "$SOURCE_JSON" <<'PY'
import json
import pathlib
import sys

path = pathlib.Path(sys.argv[1])
payload = json.loads(path.read_text(encoding='utf-8'))
required = ('project_id', 'client_email', 'private_key')
missing = [k for k in required if not payload.get(k)]
if missing:
    raise SystemExit(f"Invalid service account JSON. Missing: {', '.join(missing)}")
print("Validated Firebase service account JSON")
PY

mkdir -p "$SECRETS_DIR"
chmod 700 "$SECRETS_DIR"

SOURCE_REALPATH="$(realpath "$SOURCE_JSON")"
TARGET_REALPATH="$(realpath -m "$TARGET_JSON")"

if [[ "$SOURCE_REALPATH" == "$TARGET_REALPATH" ]]; then
  chmod 600 "$TARGET_JSON"
  echo "Source JSON is already in secrets path; skipping copy."
else
  install -m 600 "$SOURCE_JSON" "$TARGET_JSON"
fi

if grep -q '^FIREBASE_SERVICE_ACCOUNT_PATH=' "$ENV_FILE"; then
  sed -i "s|^FIREBASE_SERVICE_ACCOUNT_PATH=.*|FIREBASE_SERVICE_ACCOUNT_PATH=${CONTAINER_FIREBASE_PATH}|" "$ENV_FILE"
else
  echo "FIREBASE_SERVICE_ACCOUNT_PATH=${CONTAINER_FIREBASE_PATH}" >> "$ENV_FILE"
fi

cd "$PROJECT_ROOT"
sudo docker compose --env-file "$ENV_FILE" -f docker-compose.production.yml up -d --build api worker nginx
sudo docker compose --env-file "$ENV_FILE" -f docker-compose.production.yml restart nginx

echo "Firebase Admin credential installed."
echo "Health check:"
curl -sS -i http://127.0.0.1/api/health | head -n 10
