# Phase 1 — Changed files

The GitHub review branch contains **new files only**, in these areas:

- Root: `README.md`, `.editorconfig`, `.gitignore`, `package.json`, `compose.yaml`.
- GitHub CI: `.github/workflows/ci.yml`.
- Laravel: `apps/api/composer.json`, `artisan`, `bootstrap/`, `app/`, `config/`, `routes/`, `database/migrations/`, `tests/`, `phpunit.xml`, `pint.json`, `public/index.php`, `.env.example`, `.env.testing.example`.
- React: `apps/web/package.json`, `tsconfig.json`, `vite.config.ts`, `eslint.config.js`, `index.html`, `.env.example`, `src/App.tsx`, `src/main.tsx`, `src/styles.css`, `src/i18n.ts`, `src/components/`, `src/lib/`, `src/tests/`.
- Infrastructure: `infra/docker/`, `infra/nginx/`.
- Offline tests: `tools/tests/`.
- Docs: `docs/architecture.md`, `docs/api.md`, `docs/database.md`, `docs/security.md`, `docs/design-system.md`, `docs/deployment.md`, `docs/testing.md`, `docs/milestone-1.md`, `docs/decisions/`.

No existing application files were overwritten. Compare against the base branch for the authoritative per-file list. Missing lockfiles and unverified integration checks block approval.
