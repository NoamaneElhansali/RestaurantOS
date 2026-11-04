# Milestone 1 — Foundation (2026-11-04)

## Scope
The linked GitHub repository was empty when this implementation was prepared. Phase 1 is authored in a new monorepo; no earlier application code was overwritten.

## Delivered
- Laravel API scaffold, PHP 8.3+ requirement, Sanctum dependency, versioned health and readiness controller and initial user migration.
- React 19 + strict TypeScript + Vite 8 UI with real API status, error/retry/loading states and FR/AR/EN RTL support.
- Tailwind tokens, design components, local Docker Compose with PostgreSQL 17, Nginx and PHP-FPM.
- Test sources, CI and documentation.

## Local verification

| Check | Result |
| --- | --- |
| Node dependency-free tests | 11 passed |
| PHP controller smoke assertions (test doubles) | 5 passed |
| PHP syntax checks | 23 passed |
| Standalone TS health client | Strict type-check passed |
| npm registry | Blocked (DNS EAI_AGAIN) |
| Composer install, Laravel HTTP tests | Not run |
| Full frontend build, Docker/PostgreSQL | Not run |
| GitHub Actions | Pending |

**Decision: MILESTONE NOT COMPLETE.** Both dependency lockfiles are missing. Runtime compatibility and database migration are unverified.

## Definition of done
To close the milestone: generate and commit package-lock/composer.lock, make CI reproducible, run and fix npm lint/TS/Vitest/build, run PHPUnit/Pint/PostgreSQL migration, verify local Docker Compose and real API responses. Only afterward begin Phase 2 Identity and Multi-Tenancy.

## Remaining security limitations
No restaurant auth, tenant isolation, permissions, entitlements, media handling or production deployment exists. Do not advertise this milestone as production-ready.
