# Tests and validation

## Verified offline (2026-11-04)

- `npm run test:offline`: 11/11 tests passed using Node 22.16.0, with no package installation.
- `php tools/tests/php_health_controller_smoke.php`: 5 controller assertions passed using response/DB test doubles.
- PHP syntax check: 23 local PHP source files passed `php -l`.
- The standalone TypeScript API client passed strict type-checking, and initial JSON/YAML source files parsed.
- These results apply to the locally authored foundation; they are not GitHub Actions or framework integration results.

## Tests authored but not yet executed with dependencies

- Laravel HTTP tests at `apps/api/tests/Feature/HealthEndpointsTest.php`.
- React Testing Library status component tests.
- GitHub Actions CI jobs with PostgreSQL 17 service.

## Required release gates

1. Install npm and Composer packages, commit generated lockfiles, use `npm ci`.
2. Run `npm run lint && npm run typecheck && npm test && npm run build` from apps/web.
3. Run `vendor/bin/pint --test && php artisan migrate --force && php artisan test` from apps/api against disposable PostgreSQL.
4. Run `docker compose config`, `docker compose up --build`, API liveness and DB readiness smoke probes, and a database-outage/recovery test.

**No milestone approval** until checks pass. Containerized end-to-end integration has not been run.
