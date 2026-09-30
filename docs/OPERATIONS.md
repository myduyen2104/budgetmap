# Operations

# Operations

Staging is platform-agnostic in this repository: use a managed PostgreSQL staging database, one Node.js 22 API instance, and one Next.js process behind HTTPS. Set `NODE_ENV=production`, a staging-only `DATABASE_URL`, `AUTH_SESSION_SECRET` from a secret manager, exact `CORS_ORIGIN`, and `NEXT_PUBLIC_API_URL`. Run `npm ci`, `prisma migrate deploy`, then the API `start` script and web `next start`; do not seed staging automatically.

Use `GET /health` for readiness. It returns 200 only when PostgreSQL is reachable and 503 otherwise, without exposing secrets or stack traces. `enableShutdownHooks()` lets the API stop accepting new work and disconnect Prisma after in-flight requests. Send SIGTERM and allow the process to drain.

Logs must exclude passwords, cookies, tokens, secrets and `DATABASE_URL`. Run PostgreSQL backups and restore drills. The in-memory login limiter requires a single API instance; do not scale horizontally until a shared store exists. Run E2E against `budgetmap_test` on host port 5434, never development data; migrate it with `db:test:migrate` first.

For rollback, redeploy the previous application artifact. Treat migrations as forward-only and use a backup plus a reviewed corrective migration for database recovery. Review accepted dependency risks before production release. This MVP is approved for staging/internal deployment, not production release-ready.
