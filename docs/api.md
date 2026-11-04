# API contract — implemented Foundation endpoints only

| Method | Path | Authorization | Behavior |
| --- | --- | --- | --- |
| GET | `/api/v1/health` | Public | Process liveness; no DB probe |
| GET | `/api/v1/ready` | Public | Database readiness; returns 503 if DB unavailable |

Liveness 200: `{"service":"restaurantos-api","status":"ok","version":"v1"}`

Readiness 200: `{"service":"restaurantos-api","status":"ready"}`

Readiness 503: `{"service":"restaurantos-api","status":"unavailable"}`

Both are uncached JSON responses. They must not be used to authenticate tenants or infer private data. All business routes described in the blueprint are reserved for future milestones and **do not exist yet**.
