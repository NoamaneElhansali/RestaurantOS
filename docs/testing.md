# RestaurantOS CI and test strategy

Run the following commands against the exact branch being accepted.

## Framework and frontend

```bash
cd apps/api
composer install --no-interaction --prefer-dist
vendor/bin/pint --test
php artisan migrate --force
php artisan test

cd ../web
npm ci --legacy-peer-deps --no-audit --no-fund
npm run lint
npm run typecheck
npm run test
npm run build
```

The API tests cover registration, duplicate/weak credentials, bad login, logout, password broker reset, session revocation, invalid reset tokens, signed verification, verified-only tenant access, tenant switching, last-owner invariants, role restrictions, horizontal IDOR, nested membership IDOR, and Super Admin isolation. Frontend tests cover health status, first-party cookie and XSRF handling, HTTP validation errors, and protected-route access.

## Docker integration

`tools/tests/phase1-compose-smoke.sh` tests the real Nginx/PHP/PostgreSQL/Vite stack including migrations, rollback, live/ready endpoints, database shutdown and recovery.

`tools/tests/phase2-compose-smoke.sh` uses an isolated disposable Compose project and tests HTTP registration with CSRF rejection, valid CSRF registration, verified-email restrictions, login and logout. **Destructive script; CI=true and isolated volumes required.**

GitHub Actions executes independent `web`, `api`, `offline`, `compose-smoke`, and `phase2-compose-smoke` jobs. The GitHub Actions run URL and result are authoritative; do not claim a job passed until GitHub reports success.

## Remaining production verification

A staging SMTP transport, real browser E2E tests, structured audit-log review, secure HTTPS deployment, and independent penetration testing must be performed before production release.
