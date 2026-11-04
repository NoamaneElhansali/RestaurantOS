# Security posture — Foundation

The foundation offers no privileged or tenant-data endpoints. Neither registration nor authenticated access exists yet.

- Laravel's exception handler returns JSON for API paths.
- CORS credentials are allowed only for configured origins, never wildcard.
- React uses same-origin credentials; Sanctum stateful middleware is provisioned for later cookie sessions.
- `.env` and generated dependencies are excluded from source control.
- Readiness errors respond with a generic 503; internal details are logged server-side.
- Nginx restricts access to Laravel's public directory and blocks dotfiles.

**Not production-ready.** TLS, secure session domains, authenticated routes, email verification, policies, rate limits, tenant scoping, audit logs and isolation tests belong to future milestones. Example test APP_KEY is not a production secret.
