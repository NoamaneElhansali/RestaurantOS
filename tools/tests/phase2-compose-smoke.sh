#!/usr/bin/env bash
set -euo pipefail

# This uses an isolated Compose project and destroys its volumes.
if [[ "${CI:-}" != "true" ]]; then
  echo "This destructive test must run on a disposable CI runner." >&2
  exit 1
fi
cd "$(dirname "$0")/../.."
compose=(docker compose -p restaurantos-phase2-ci)
jar="$(mktemp)"
body="$(mktemp)"
cleanup() {
  rc=$?
  if [[ "$rc" != 0 ]]; then "${compose[@]}" ps >&2 || true; fi
  "${compose[@]}" down --volumes --remove-orphans >/dev/null 2>&1 || true
  rm -f "$jar" "$body"
  exit "$rc"
}
trap cleanup EXIT

"${compose[@]}" config -q
"${compose[@]}" up --build -d
check_status() {
  local expected="$1" path="$2" attempts="${3:-25}"
  for ((i = 0; i < attempts; i++)); do
    status=$(curl --silent --show-error --cookie "$jar" --cookie-jar "$jar" --output "$body" --write-out '%{http_code}' "http://127.0.0.1:8000$path" || true)
    if [[ "$status" == "$expected" ]]; then return 0; fi
    sleep 2
  done
  echo "Expected $expected at $path, got $status" >&2
  return 1
}

check_status 200 /api/v1/health 45
"${compose[@]}" exec -T api php artisan migrate --force
check_status 401 /api/v1/auth/me

check_status 204 /sanctum/csrf-cookie
token=$(python3 - "$jar" <<'PY'
import sys
from urllib.parse import unquote
for line in open(sys.argv[1], encoding='utf-8'):
    parts = line.strip().split('\t')
    if len(parts) == 7 and parts[5] == 'XSRF-TOKEN':
        print(unquote(parts[6]))
        break
else:
    raise SystemExit('CSRF cookie missing')
PY
)
register='{"name":"Docker Test","email":"docker-identity@example.test","password":"StrongPassphrase123","password_confirmation":"StrongPassphrase123"}'

post_json() {
  local path="$1" data="$2" csrf="${3:-true}"
  if [[ "$csrf" == "true" ]]; then
    check_status 204 /sanctum/csrf-cookie
    token=$(python3 - "$jar" <<'PY'
import sys
from urllib.parse import unquote
for line in open(sys.argv[1], encoding='utf-8'):
    parts = line.strip().split('\\t')
    if len(parts) == 7 and parts[5] == 'XSRF-TOKEN':
        print(unquote(parts[6]))
        break
else:
    raise SystemExit('CSRF cookie missing')
PY
)
  fi
  args=(--silent --show-error --cookie "$jar" --cookie-jar "$jar" --output "$body" --write-out '%{http_code}' -X POST -H "Content-Type: application/json" -H "Accept: application/json" -d "$data")
  if [[ "$csrf" == "true" ]]; then args+=(-H "X-XSRF-TOKEN: $token"); fi
  curl "${args[@]}" "http://127.0.0.1:8000$path"
}

status=$(post_json /api/v1/auth/register "$register" false)
[[ "$status" == "419" ]] || { echo "CSRF protection failed: $status" >&2; exit 1; }
status=$(post_json /api/v1/auth/register "$register")
[[ "$status" == "201" ]] || { echo "Registration failed: $status" >&2; exit 1; }
grep -q '"email_verified":false' "$body"
check_status 200 /api/v1/auth/me
check_status 403 /api/v1/restaurants

status=$(post_json /api/v1/auth/logout '{}')
[[ "$status" == "200" ]] || { echo "Logout failed: $status" >&2; exit 1; }
check_status 401 /api/v1/auth/me

check_status 204 /sanctum/csrf-cookie
token=$(python3 - "$jar" <<'PY'
import sys
from urllib.parse import unquote
for line in open(sys.argv[1], encoding='utf-8'):
    parts = line.strip().split('\t')
    if len(parts) == 7 and parts[5] == 'XSRF-TOKEN':
        print(unquote(parts[6]))
        break
else:
    raise SystemExit('CSRF cookie missing')
PY
)
status=$(post_json /api/v1/auth/login '{"email":"docker-identity@example.test","password":"StrongPassphrase123"}')
[[ "$status" == "200" ]] || { echo "Login failed: $status" >&2; exit 1; }
check_status 200 /api/v1/auth/me
echo "PASS: Docker Phase 2 registration, CSRF enforcement, verified gate, login and logout"
