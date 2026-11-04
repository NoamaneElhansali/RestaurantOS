# RestaurantOS

RestaurantOS is a restaurant management SaaS **under active development**, designed for cafés and restaurants in Morocco. Phase 1 foundation is verified; Phase 2 identity and restaurant tenancy is implemented on a draft pull request and subject to final acceptance testing. This is not a production deployment.

## Implemented features

- Laravel 13 REST API, PostgreSQL 17, first-party session authentication with Sanctum, secure password hashing, CSRF defense, registration/login/logout, reset links, signed email verification, and session revocation after reset.
- Restaurant creation, selection, memberships, Owner/Manager/Waiter/Kitchen Staff/Menu Editor roles, explicit platform Super Admin, policies and scoped tenant resolution.
- React 19 + strict TypeScript, Vite 8, Tailwind v4 and React Router. Login, registration, password reset, verification, protected dashboard, restaurant selection and staff management.
- FR/AR/EN foundation shell and RTL support. Authentication/dashboard copy is currently English and will need localization review before a multilingual release.
- PostgreSQL-backed feature/security tests, frontend component/API tests, Docker Compose smoke tests and GitHub Actions CI.

**Not implemented:** QR menus, product catalogs, billing, order workflows or production mail delivery. These are not simulated. Do not start Phase 3 until Phase 2 acceptance passes.

## Local development

Requirements: Docker and Compose. Ports `5173`, `8000`, and `5432` must be available on loopback.

```bash
cp apps/api/.env.example apps/api/.env
# Configure a local-only POSTGRES_PASSWORD for postgres, and match DB_PASSWORD.
# Never use the example password in a public environment.
docker compose up --build -d
docker compose exec api php artisan migrate --force
```

Frontend: http://localhost:5173

API liveness: http://localhost:8000/api/v1/health

API readiness: http://localhost:8000/api/v1/ready

Authentication screens: `/register`, `/login`, `/forgot-password`, `/reset-password`, `/verify-email`, and protected `/dashboard`.

The frontend proxies `/api` and `/sanctum` through Vite, allowing `SameSite=Lax` first-party browser cookies. To register and sign in, use the frontend forms; the API requires a CSRF cookie before mutations. Passwords must be at least 12 characters with uppercase, lowercase and numbers.

**Development mail:** `MAIL_MAILER=log` writes verification and reset messages to the API container logs; it does not deliver real email. For live delivery, configure SMTP through private environment variables. You will need `FRONTEND_URL` pointing to the frontend's public origin for password reset and verification redirects.

## Run tests

```bash
npm run test:offline
cd apps/web
npm ci --legacy-peer-deps --no-audit --no-fund
npm run lint && npm run typecheck && npm test && npm run build
cd ../api
composer install --no-interaction --prefer-dist
vendor/bin/pint --test
php artisan migrate --force
php artisan test
```

On disposable GitHub Actions runners, the workflow also executes `tools/tests/phase1-compose-smoke.sh` and `tools/tests/phase2-compose-smoke.sh`. The latter deliberately removes its isolated Compose volumes. Do not run it on a machine with persistent data.

Both npm and Composer lockfiles are committed for reproducible dependency selection. The Docker web service also uses `npm ci`.

## Repository

```text
apps/api/    Laravel API, models, migrations, policies, middleware, feature tests
apps/web/    React Router SPA, auth client, screens, component/API tests
infra/       Docker and Nginx local development infrastructure
.github/     GitHub Actions lint/build/test and Compose integration
tools/tests/ Offline and isolated integration smoke checks
docs/        API contract, decisions, security and milestone reports
```

Read the [v1 API contract](docs/api.md), [security posture](docs/security.md), [tenancy architecture](docs/decisions/0002-identity-tenancy.md), [testing](docs/testing.md) and [deployment limitations](docs/deployment.md).
