# RestaurantOS REST API — v1

Implemented Phase 1 and 2 endpoints. All responses use JSON except the signed email-verification URL, which redirects to the frontend after successful verification.

## Public health and session endpoints

| Method | Path | Authentication | Result |
| --- | --- | --- | --- |
| GET | `/api/v1/health` | Public | Liveness JSON (200) |
| GET | `/api/v1/ready` | Public | DB readiness JSON (200/503) |
| GET | `/sanctum/csrf-cookie` | Public | Sets first-party XSRF cookie (204) |
| POST | `/api/v1/auth/register` | CSRF cookie | Create unverified user and browser session (201) |
| POST | `/api/v1/auth/login` | CSRF cookie | Validate credentials, rotate session (200) |
| POST | `/api/v1/auth/forgot-password` | CSRF cookie | Generic non-enumerating response (200) |
| POST | `/api/v1/auth/reset-password` | CSRF cookie | Consume reset token and revoke old sessions (200) |

### Registration body

```json
{"name":"Example","email":"member@example.test","password":"StrongPassphrase123","password_confirmation":"StrongPassphrase123"}
```

Password length at least 12 with upper and lower case and numbers. Password reset accepts `email`, `token`, `password`, `password_confirmation`. A reset notification points to `FRONTEND_URL/reset-password?token=...&email=...`; do not log URLs with live tokens.

### Authenticated browser sessions

All routes below require **an authenticated web session** via `auth:sanctum` and `auth:web`, plus a persisted session version check. The API does not issue bearer tokens for the browser.

| Method | Path | Result |
| --- | --- | --- |
| GET | `/api/v1/auth/me` | Minimal current user |
| POST | `/api/v1/auth/logout` | Session invalidation |
| POST | `/api/v1/auth/email/verification-notification` | Send signed verification mail |
| GET | `/api/v1/email/verify/{id}/{hash}?expires=...&signature=...` | Signed verification; redirect to frontend |

## Verified-user restaurant endpoints

All routes below require verified email. Every restaurant-ID route resolves the target **through the signed-in user's membership** before invoking any controller action.

| Method | Path | Access |
| --- | --- | --- |
| GET | `/api/v1/restaurants` | Own memberships only |
| POST | `/api/v1/restaurants` | Verified user, becomes Owner |
| GET | `/api/v1/restaurants/active` | Active membership only |
| GET | `/api/v1/restaurants/{restaurant}/` | Member of restaurant |
| POST | `/api/v1/restaurants/{restaurant}/switch` | Member of restaurant |
| PATCH | `/api/v1/restaurants/{restaurant}/` | Owner or Manager |
| GET | `/api/v1/restaurants/{restaurant}/members` | Owner |
| POST | `/api/v1/restaurants/{restaurant}/members` | Owner, existing verified account |
| PATCH | `/api/v1/restaurants/{restaurant}/members/{member}` | Owner |
| DELETE | `/api/v1/restaurants/{restaurant}/members/{member}` | Owner |
| GET | `/api/v1/platform/restaurants` | Platform Super Admin only |

Restaurant creation body is `{"name":"Restaurant name"}`. Member creation body is `{"email":"employee@example.test","role":"waiter"}`. Valid restaurant roles: `owner`, `manager`, `waiter`, `kitchen_staff`, `menu_editor`. The last owner cannot be removed or demoted.

### Error contract

- `401`: Not authenticated, revoked session.
- `403`: Authenticated but unverified or lacks required role.
- `404`: Unknown restaurant, nonmember restaurant or out-of-tenant member ID. No cross-tenant existence leak.
- `419`: Missing or invalid CSRF token.
- `422`: Invalid input or business invariant (last owner).
- `429`: Request rate limited.

The current active restaurant is **only a session preference**, never proof of authorization. The request's path restaurant ID and membership are checked on the server on every access. Do not infer tenant scope from local storage, a request header, or a client-side filter.

## Local browser origins

Use Vite at `http://localhost:5173` and API at `http://localhost:8000`. Vite proxies `/api` and `/sanctum` so the browser sends same-origin cookies. HTTPS production installations must configure `APP_URL`, `FRONTEND_URL`, `SANCTUM_STATEFUL_DOMAINS`, `FRONTEND_ORIGINS`, `SESSION_DOMAIN`, `SESSION_SECURE_COOKIE=true`, trusted reverse-proxy settings and functional SMTP delivery.

See Laravel docs: [Sanctum SPA authentication](https://laravel.com/docs/13.x/sanctum#spa-authentication), [Email verification](https://laravel.com/docs/13.x/verification), [Authorization](https://laravel.com/docs/13.x/authorization).
