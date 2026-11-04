# RestaurantOS

RestaurantOS is a multi-tenant QR menu SaaS **under development** for restaurants and cafés in Morocco. This repository contains the **Phase 1 / Foundation** implementation, not a deployed or production-ready product.

## What exists

- Laravel 13 REST API with public `GET /api/v1/health` and `GET /api/v1/ready` (PostgreSQL probe).
- React 19 + TypeScript strict + Vite 8 + Tailwind v4, real API status query, loading/error/retry states, FR/AR/EN UI and Arabic RTL.
- PostgreSQL 17, PHP-FPM, Nginx and Vite local Docker Compose configuration.
- API and component test sources, offline unit tests and GitHub Actions CI.
- No registration, tenant isolation, billing, menu management or ordering is implemented.

**Milestone incomplete:** dependency installation, lockfiles, Laravel integration tests, React build and PostgreSQL migrations have not been verified. Do not proceed to Phase 2 before these are passing. See [milestone report](docs/milestone-1.md).

## Local development

Requires Docker with Compose. Or PHP 8.3+ + Composer 2 + PostgreSQL 17 + Node.js 22.12+.

```bash
cp apps/api/.env.example apps/api/.env
# Configure a local-only POSTGRES_PASSWORD and match DB_PASSWORD.
docker compose up --build
docker compose exec api php artisan migrate
```

Frontend: http://localhost:5173

API liveness: http://localhost:8000/api/v1/health

Database readiness: http://localhost:8000/api/v1/ready

The stack is local-only and uses example credentials. Do not use these in production.

## Tests

```bash
npm run test:offline
php tools/tests/php_health_controller_smoke.php
cd apps/web && npm install && npm run lint && npm run typecheck && npm test && npm run build
cd ../api && composer install && vendor/bin/pint --test && php artisan test
```

Lockfiles are intentionally not fabricated: `apps/web/package-lock.json` and `apps/api/composer.lock` must be generated with package registry access, then committed. Until then CI installs are non-reproducible.

## Project layout

```text
apps/api/    Laravel REST API, user migration, health endpoints
apps/web/    React UI and health client
infra/       Docker and Nginx local configuration
.github/     CI workflow
tools/tests/ Dependency-free test harnesses
docs/        Architecture, security, testing, decisions and milestone report
```

Read [architecture](docs/architecture.md), [API](docs/api.md), [security](docs/security.md), [testing](docs/testing.md), [design system](docs/design-system.md), and [deployment](docs/deployment.md).
