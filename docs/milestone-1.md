# Milestone 1 — Foundation (verification report, 2026-11-04)

## Repository inspection and scope

The linked GitHub repository was empty. A minimal bootstrap README was committed to `main`, and all foundation code was added to `feat/phase-1-foundation` for review in [draft PR #1](https://github.com/NoamaneElhansali/RestaurantOS/pull/1). No existing business logic was overwritten. Phase 2 Identity and Multi-Tenancy has **not** been started.

## Implemented

- Laravel 13 API foundation, Sanctum dependency, versioned health and PostgreSQL readiness routes, and initial user/password-reset migration.
- React 19, strict TypeScript, Vite 8, Tailwind v4, TanStack Query, translated FR/AR/EN UI including RTL, real API liveness check, error/loading/retry states and component tests.
- PostgreSQL 17, Nginx, PHP-FPM, Vite local Compose configuration, CI workflow, security and architecture documentation.
- Dependency fixes: Collision and Mockery for Laravel feature testing; Testing Library DOM dependency, correct TanStack Query function signature, Vitest/Node test separation and React test cleanup; Pint formatting corrections.

## Verification

GitHub Actions [run 41791920315](https://github.com/NoamaneElhansali/RestaurantOS/actions/runs/41791920315) on commit `d19f120626928a33153ac86512335c4fc8f19fa0`:

| Job | Status | What it checks |
| --- | --- | --- |
| web | PASS | npm installation, ESLint, TypeScript strict typecheck, Vitest component tests, Vite build |
| api | PASS | Composer installation, Laravel Pint, PostgreSQL 17 migration, Laravel PHPUnit feature tests |
| offline | PASS | Dependency-free Node foundation tests (11 passed locally as well) |

Additional local checks: 11 offline Node tests passed, five PHP controller smoke assertions passed with response/DB test doubles, 23 PHP source files passed syntax checks, and the standalone TypeScript API client passed strict checking. These local tests are not a substitute for framework integration.

## Unclosed definition of done

- **Missing lockfiles:** `apps/web/package-lock.json` and `apps/api/composer.lock` were not generated due to package registry DNS restrictions in the authoring environment. GitHub Actions currently installs from version ranges; until lockfiles are committed, builds are not fully reproducible.
- **Full Compose stack unverified:** GitHub Actions tested a real PostgreSQL service and Laravel migration, but did not execute `docker compose up --build` with Nginx, PHP-FPM and Vite containers together.
- **External HTTP smoke/outage checks unverified:** direct requests to a running local Docker stack, temporary DB outage, restart and migration rollback remain to be tested.

**Decision: PHASE 1 NOT YET ACCEPTED.** Do not merge PR #1 or start Phase 2 until the above gates pass.

## Remaining steps

1. Resolve and commit npm/Composer lockfiles from a network-enabled machine, then switch CI to `npm ci` and locked Composer install.
2. Run `docker compose config && docker compose up --build` locally, migrate on PostgreSQL, verify `/api/v1/health` and `/api/v1/ready`, and exercise readiness outage/recovery.
3. Verify rollback and re-run CI on the final commit; only then approve the milestone.

No restaurant authentication, tenancy, menu CRUD, QR ordering, billing or production deployment is claimed to exist.
