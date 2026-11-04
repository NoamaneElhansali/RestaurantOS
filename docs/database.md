# RestaurantOS Phase 2 database model

PostgreSQL 17, shared database with strict server-side restaurant membership resolution.

## Schema

- `users`: identity, hashed password, verified email timestamp, protected `is_super_admin` flag, `session_version` for reset-based session revocation.
- `password_reset_tokens`: Laravel password broker tokens, expiring/single-use.
- `restaurants`: unique public-safe slug, display name, timestamps.
- `restaurant_memberships`: unique `(restaurant_id, user_id)`, cascading FKs, role constrained to `owner`, `manager`, `waiter`, `kitchen_staff`, or `menu_editor`. One user can be in multiple restaurants; multiple users can own a restaurant.
- `migrations`: Laravel migration history.

No restaurant entities are seeded by default, and no default admin passwords exist. Tenant creation and its Owner membership occur atomically in a transaction. Later tenant-owned tables must contain `restaurant_id`, enforce foreign keys, and be queried through the authenticated tenant context. Super Admin is never automatically mapped to an individual restaurant.

Run `php artisan migrate --force` after installing dependencies and starting PostgreSQL. The schema does not yet include Phase 3 menu/products, orders, billing or payment tables.
