# Foundation architecture

RestaurantOS starts as a modular monolith: React + Vite front end, Laravel API and PostgreSQL.

```mermaid
flowchart LR
  B[Browser - React] -->|/api/v1| N[Nginx]
  N --> A[Laravel PHP-FPM API]
  A --> D[(PostgreSQL 17)]
```

Only `/api/v1/health` and `/api/v1/ready` business-independent endpoints exist. There is no tenant-owned data or private API in the foundation. Future modules (Identity, Tenancy, Restaurants, Menus, QR, Billing, Orders) remain planned. Tenant access must be validated server-side, and queued work must restore tenant context before processing.
