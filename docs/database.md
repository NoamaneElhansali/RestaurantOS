# Database foundation

PostgreSQL 17 is the intended single shared database. Only the initial Laravel `users` and `password_reset_tokens` tables and the migrations history are introduced in the foundation. Tenant-owned entities must be introduced with server-enforced tenant isolation in Phase 2. No seed data is included.

Run `php artisan migrate` after installing Composer dependencies and starting PostgreSQL. Monetary values in later phases will use integer minor currency units and explicit MAD currency.
