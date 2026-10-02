# Local Environment Setup

Use Node.js 22 LTS, npm (lockfile to be committed), and PostgreSQL 16. Docker publishes PostgreSQL on host port `5434` while the container remains on `5432`. When API/Prisma runs directly on the host, use `postgresql://budgetmap:budgetmap@localhost:5434/budgetmap?schema=public`; a service running inside Compose must use `postgresql://budgetmap:budgetmap@postgres:5432/budgetmap?schema=public`. Required environment values are `DATABASE_URL`, `AUTH_SESSION_SECRET` (random, production-only secret), and frontend `NEXT_PUBLIC_API_URL` (for example `http://localhost:3001/api`). Never commit `.env` files or secrets.

After dependencies and runtime packages are added, the expected commands are:

```bash
npm install
npx prisma migrate dev
npx prisma db seed
npm test
npm run typecheck
npm run build
```

Local development runs the web and API through `install-dev.sh` and the workspace scripts documented in `README.md`. CI runs install, migration validation, tests, typecheck and build against an isolated PostgreSQL database. For release, set `CORS_ORIGIN` to the exact HTTPS frontend origin, keep `AUTH_SESSION_SECRET` outside source control, run `prisma migrate deploy`, and never seed production.

E2E uses `127.0.0.1:5434/budgetmap_test`, API port `3102`, web port `3101`, and `CORS_ORIGIN=http://127.0.0.1:3101`. Prepare with `DATABASE_URL=postgresql://budgetmap:budgetmap@127.0.0.1:5434/budgetmap_test?schema=public npm run db:test:migrate`, then run `npm run test:e2e` or `npm run test:a11y`. Copy `.env.test.example` only for local test configuration; never use `.env` development credentials for E2E.

## Vercel deployment

The Vercel NestJS service starts `apps/api/src/main.js`. Keep the generated API
JavaScript files in that directory synchronized with the TypeScript source by
running `npm run build` after API changes and committing the resulting JS files.

Set these Production environment variables in Vercel:

```text
NODE_ENV=production
DATABASE_URL=<managed PostgreSQL connection string>
AUTH_SESSION_SECRET=<long random secret>
CORS_ORIGIN=https://budgetmap-myduyen.vercel.app
NEXT_PUBLIC_API_URL=https://budgetmap-myduyen.vercel.app/api
```

Before testing registration, migrate the production database from a trusted
shell or CI job:

```bash
DATABASE_URL="<production connection string>" \
  npx prisma migrate deploy --schema packages/api/prisma/schema.prisma
```

Do not use the local Docker URL, `prisma migrate dev`, or demo seeding for
Vercel production.
