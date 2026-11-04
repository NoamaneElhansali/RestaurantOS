#!/usr/bin/env bash
set -euo pipefail
if [[ "${CI:-}" != "true" ]]; then
  echo "This destructive test must run on a disposable CI runner." >&2
  exit 1
fi

cd "$(dirname "$0")/../.."
compose=(docker compose -p restaurantos-phase2-ci)

cleanup() {
  rc=$?
  if [[ "$rc" != 0 ]]; then "${compose[@]}" ps >&2 || true; fi
  "${compose[@]}" down --volumes --remove-orphans >/dev/null 2>&1 || true
  exit "$rc"
}
trap cleanup EXIT

"${compose[@]}" config -q
"${compose[@]}" up --build -d

ready=false
for attempt in {1..60}; do
  code=$(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:8000/api/v1/health || true)
  if [[ "$code" == "200" ]]; then ready=true; break; fi
  sleep 2
done
if [[ "$ready" != "true" ]]; then echo 'API readiness timeout' >&2; exit 1; fi

"${compose[@]}" exec -T api php artisan migrate --force
python3 tools/tests/phase2-http-smoke.py
