# RestaurantOS security posture (Phase 2)

The API uses hashed passwords, verified-email requirements, Laravel Sanctum browser sessions, session rotation, CSRF protection, short-lived signed verification and reset links, rate limiting and tenant-scoped authorization. Full external delivery, security review and production deployment are not included.

The `users.is_super_admin` flag is not mass assignable. Platform administration is separate from restaurant ownership and has no implicit cross-tenant override. Restaurant owner/manager roles are enforced through Laravel policies, with nested memberships resolved through the parent restaurant. Database foreign keys, uniqueness and a CHECK constraint backstop roles.

Any authenticated restaurant-scoped operation must use the resolved membership, not raw client-selected IDs. A 404 is returned for inaccessible tenant IDs to prevent enumeration. Users cannot delete or demote a restaurant's last owner.

CI covers identity and IDOR tests with PostgreSQL, and the disposable Phase 2 Compose smoke test verifies actual cookie/CSRF/HTTP behavior. CI does not substitute for production hardening.

Production requires TLS, HTTPS-only cookies, domain configuration, trusted proxies, real SMTP credentials supplied via secret manager, centralized logs without tokens, backup/restore rehearsal and rate-limit observability. Development `MAIL_MAILER=log` writes links to server logs and **does not deliver real email**. Avoid exposing development logs or sending live tokens to third-party monitoring.

See [ADR 0002](decisions/0002-identity-tenancy.md) and [API contract](api.md).
