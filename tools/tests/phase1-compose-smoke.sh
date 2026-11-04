#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../.."

cleanup() {
  rc=$?
  if [ "$rc" -ne 0 ]; then
    echo "Compose smoke failed: collecting redacted service status" >&2
    docker compose ps >&2 || true
  fi
  docker compose down --volumes --remove-orphans >/dev/null 2>&1 || true
  exit "$rc"
}
trap cleanup EXIT

docker compose config -q
docker compose up --build -d

wait_status() {
  local url=$1 expected=$2 attempts=${3:-90}
  for ((i=0; i<attempts; i++)); do
    code=$(curl --silent --output /tmp/restaurantos-http.json --write-out '%{http_code}' "$url" || true)
    if [[ "$code" == "$expected" ]]; then return 0; fi
    sleep 2
  done
  echo "Expected $expected at $url, got $code" >&2
  return 1
}

wait_status http://127.0.0.1:8000/api/v1/health 200
grep -q '"status":"ok"' /tmp/restaurantos-http.json

docker compose exec -T api php artisan migrate --force
wait_status http://127.0.0.1:8000/api/v1/ready 200
grep -q '"status":"ready"' /tmp/restaurantos-http.json

docker compose exec -T api php artisan migrate:rollback --step=1 --force
docker compose exec -T api php artisan migrate --force

docker compose stop postgres
wait_status http://127.0.0.1:8000/api/v1/ready 503 30
grep -q '"status":"unavailable"' /tmp/restaurantos-http.json
wait_status http://127.0.0.1:8000/api/v1/health 200
grep -q '"status":"ok"' /tmp/restaurantos-http.json

docker compose start postgres
wait_status http://127.0.0.1:8000/api/v1/ready 200
grep -q '"status":"ready"' /tmp/restaurantos-http.json
echo "PASS: Compose boot, migration, rollback, live, readiness, DB outage and recovery"
