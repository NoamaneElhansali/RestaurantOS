# ADR 0001 — Foundation implementation

Status: provisional pending runtime checks (2026-11-04).

Use a modular Laravel 13 + PostgreSQL 17 monolith and React 19 + strict TypeScript + Vite 8, within a single `apps/api` / `apps/web` monorepo. Use versioned `/api/v1` routes, Sanctum for later first-party cookie sessions, TanStack Query for client-side server state, i18next for FR/AR/EN and semantic Tailwind v4 tokens.

Only the foundation health contract is delivered. Tenant access, authentication, menus and billing are not implemented. Lack of lockfiles and integration verification is a release blocker.
