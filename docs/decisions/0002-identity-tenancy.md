# ADR 0002 — Browser identity and restaurant-scoped authorization

Status: implemented in Phase 2, acceptance testing underway. Date: 2026-11-04.

## Authentication

Use **Laravel Sanctum's first-party session flow**, not persistent browser bearer tokens. Vite reverse-proxies API and Sanctum CSRF traffic on localhost. Laravel's `web` middleware verifies CSRF for mutations. Session IDs rotate on login and registration and are invalidated on logout. Password reset increments `users.session_version`; each protected request checks the persisted value, revoking sessions predating the password change. Sessions are encrypted, HTTP-only, SameSite=Lax, and Secure on HTTPS production.

Registration requires a verified email to access restaurants. Laravel notifications generate signed, expiring verification URLs; reset tokens are single-use and expire according to `config/auth.php`. A generic forgot-password response prevents account enumeration.

SMTP is an **environment configuration requirement**, not an assumed external service. The local development mailer logs messages; do not treat it as real external delivery.

## Tenant authorization

Model `users` and `restaurants` with a unique `restaurant_memberships(restaurant_id,user_id)` join containing a checked `role` value. A restaurant can have multiple owners. A transaction establishes a new restaurant and owner membership atomically.

On `/restaurants/{restaurant}`, `ResolveRestaurantTenant` queries **the authenticated user's own memberships** for the exact restaurant ID. It returns 404 when absent; a controller never performs an unrestricted `Restaurant::find($id)` to satisfy user-selected tenant IDs. Laravel `RestaurantPolicy` checks the user's current role on the exact model. Nested membership IDs are always queried through the already-authorized restaurant relationship. No platform role implicitly bypasses tenant membership. The frontend's active restaurant selection is a convenience, not a security decision.

## Roles

Platform: `is_super_admin` is never request-assignable and is only consulted by a separate explicit platform listing endpoint. Staff: Owner, Manager, Waiter, Kitchen Staff, Menu Editor. Phase 2 enforces viewing, restaurant updating and membership management; later capabilities such as editing menus, service and kitchen operations require their own resource policies in their respective milestones.

| Ability | Owner | Manager | Waiter | Kitchen | Menu Editor |
| --- | --- | --- | --- | --- | --- |
| View own restaurant | Yes | Yes | Yes | Yes | Yes |
| Change restaurant details | Yes | Yes | No | No | No |
| Manage members | Yes | No | No | No | No |

The last owner cannot be removed or demoted. All roles are enforced by the backend; the UI role display is only a convenience.

## Threat model and tests

- Horizontal IDOR: other-restaurant IDs return 404 for show/update/switch/member list.
- Nested IDOR: other-restaurant membership IDs return 404 on mutation.
- Vertical access: managers cannot administer members; non-managers cannot edit restaurant.
- Session fixation/replay: session regeneration and versioned reset revocation.
- Email-link replay/tampering: Laravel signed URLs and password broker tokens.
- CSRF: same-origin session mutations with XSRF cookie, HTTP 419 on invalid token.
- Multi-tenant admin: Super Admin has a separate platform endpoint, no automatic access to tenants.

Future feature modules must add tenant-scoped repositories, policies and negative IDOR tests before exposing new resources.

## Operational limitations

No public signup grants Super Admin. No demo credentials are seeded. Production mail and TLS are not supplied by the repository. Phase 2 is not accepted until CI, HTTP Docker checks, lint, migration, and security tests pass.
