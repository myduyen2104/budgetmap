# Staging Runbook

## Target

The repository does not contain a provider-specific deployment manifest. This is a deployment plan and validation runbook; no staging deployment is performed automatically. Use a managed PostgreSQL staging instance plus one Node.js 22 API process and one Next.js 15 process behind an HTTPS reverse proxy. Keep exactly one API instance because login rate limiting is in-memory.

## Configuration

Copy `.env.staging.example` into the platform's secret/environment configuration and replace every placeholder through the platform secret manager. Required values are `NODE_ENV=production`, a staging-only `DATABASE_URL`, a random `AUTH_SESSION_SECRET`, `API_PORT`, the exact browser origin in `CORS_ORIGIN`, and the API origin plus `/api` in `NEXT_PUBLIC_API_URL`. Use the staging database only; never reuse development or production credentials. With HTTPS, production cookies are secure automatically.

## Release steps

1. Provision the staging database and confirm the application can connect. Do not use the development database.
2. Use Node.js 22 and run `npm ci --no-audit --no-fund`.
3. Run `npm run db:validate` and `npm run db:generate`.
4. Run `DATABASE_URL="$STAGING_DATABASE_URL" npm exec prisma migrate deploy --schema=packages/api/prisma/schema.prisma`. This is forward-only; never run `migrate reset`.
5. Build with `npm run build --workspace=@budgetmap/api` and `npm run build --workspace=@budgetmap/web`.
6. Start the API in production mode with `npm run start --workspace=@budgetmap/api` and the web with `npm run start --workspace=@budgetmap/web` (`next start`, not `next dev`).
7. Configure the proxy health check as `GET /health`; expect HTTP 200 only when PostgreSQL is reachable. HTTP 503 is correct when it is unavailable.
8. Run the smoke flow: register/login, create wallet, add income and expense, create a monthly plan, open dashboard, and logout. Do not seed staging unless explicitly approved.

Local development uses `./install-dev.sh`, PostgreSQL host port 5434, database `budgetmap`, and isolated test database `budgetmap_test`. `install-dev.sh` is not a staging deployment script and must not be pointed at staging.

## Rollback

Rollback the application by redeploying the previous tested API/web artifact. Prisma migrations are forward-only: take a database backup before deployment, and use a reviewed corrective migration for schema/data rollback. Restore a staging backup only with an explicit incident decision. Do not delete containers, volumes, or databases as a rollback shortcut.

Operational security controls, shutdown behavior, backups, and accepted dependency risks are documented in `docs/OPERATIONS.md`, `docs/SECURITY-AUDIT.md`, and `docs/DEPENDENCY-UPGRADE-PLAN.md`.
