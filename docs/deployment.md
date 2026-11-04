# Deployment

The included Docker Compose stack is intended for **local development only** and binds service ports to loopback. Run `docker compose up --build`; then `docker compose exec api php artisan migrate`.

For production: TLS ingress, hardened containers, managed PostgreSQL, secret storage, tenant-scoped object storage, workers/scheduler, backup/restore rehearsals, rollback, monitoring and reviewed environment settings are prerequisites. Lockfiles must be generated and committed before a reproducible build can be claimed.
