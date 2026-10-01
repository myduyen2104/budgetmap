# BudgetMap

BudgetMap is a personal finance application that helps users plan monthly money, allocate budgets, record actual income and expenses, and identify overspending categories.

## Current status

This is an MVP release candidate with a web interface, API, PostgreSQL/Prisma, authentication, user data isolation, wallets, categories, transactions, wallet transfers, monthly plans, dashboard, analysis, and automated tests. It is suitable for staging or controlled internal use.

Read the documentation in this order: [PRD](docs/PRD.md) → [MVP Scope](docs/MVP-SCOPE.md) → [Business Rules](docs/BUSINESS-RULES.md) → [User Flows](docs/USER-FLOWS.md) → [Screen List](docs/SCREEN-LIST.md) → [ERD](docs/ERD.md) → [Data Dictionary](docs/DATA-DICTIONARY.md) → [API Contract](docs/API-CONTRACT.md) → [Error Catalog](docs/ERROR-CATALOG.md) → [Database Migration Plan](docs/DATABASE-MIGRATION-PLAN.md) → [Frontend UX Spec](docs/FRONTEND-UX-SPEC.md) → [Auth & Security](docs/AUTH-SECURITY.md) → [Environment Setup](docs/ENVIRONMENT-SETUP.md) → [Architecture](docs/ARCHITECTURE.md) → [Test Plan](docs/TEST-PLAN.md) → [Implementation Checklist](docs/IMPLEMENTATION-CHECKLIST.md) → [Roadmap](docs/ROADMAP.md).

Local PostgreSQL uses host port `5434` (`localhost:5434` from the host, `postgres:5432` from a container). The API/Prisma workflow is designed to run directly on the host.

Browser tests use Playwright with the isolated `budgetmap_test` database. Install the browser once with `npx playwright install chromium`; browser files are stored outside the repository. Run `npm run test:e2e` and `npm run test:a11y`.

Release status: MVP release candidate — approved for staging/controlled internal use. It is not approved for production; current development and dependency risks are documented in `docs/SECURITY-AUDIT.md`.

## Interface and test environment

### Icon attribution

BudgetMap uses the free [Flaticon Uicons](https://www.flaticon.com/uicons) Regular Rounded icon set for navigation and actions. Flaticon/Freepik provides these icons under a free license requiring attribution. See the [Flaticon license](https://www.flaticon.com/license/license.pdf).

Run `./install-dev.sh` to set up the local environment and start the API/web applications. PostgreSQL is the only supporting service; Strapi and Medusa are not required. The script uses Docker PostgreSQL at `127.0.0.1:5434`, the API at port `2311`, and Next.js at port `2310`; it does not stop or remove PostgreSQL. Open [http://127.0.0.1:2310/login](http://127.0.0.1:2310/login). Run `npm run test:e2e` and `npm run test:a11y` for browser tests. See [UI QA](docs/UI-QA.md) and the [staging runbook](docs/STAGING-RUNBOOK.md) for viewport checks, environment variables, migrations, health checks, and the single-API-instance limit.

## Release conditions

`GET /health` checks the API and PostgreSQL. Production must run a single API instance while rate limits remain in memory, use `prisma migrate deploy`, never seed production data, and configure HTTPS/CORS/secure cookies. See [Security Audit](docs/SECURITY-AUDIT.md), [Operations](docs/OPERATIONS.md), and [Release Checklist](docs/RELEASE-CHECKLIST.md).

## Product promise

BudgetMap must answer both questions: how much money the user has left according to actual cash flow, and which categories are overspending even when total money remains.

## Available functionality

- Registration, login, logout, profile, and secure session cookies.
- Multiple wallets, derived balances, income/expense categories, and archiving.
- Income/expense transactions: create, filter, paginate, edit, and soft-delete.
- Transfers between two active wallets owned by the same user.
- Monthly plans with planned income, carry-over, planned saving, and expense budgets.
- Dashboard, budget status, overspending, charts, and monthly analysis.

Not included are recurring transactions, plan copying, password reset, CSV export, bank synchronization, OCR, AI assistant, multi-currency, shared wallets, native mobile apps, and offline mode. See `docs/MVP-SCOPE.md`.

## Staging deployment

The repository has no provider-specific deployment manifest, so staging must be provisioned separately. Use a managed PostgreSQL database, one Node.js 22 API process, and one Next.js process behind HTTPS. Copy `.env.staging.example` into the platform environment configuration and set secrets through its secret manager; never commit real credentials.

```bash
npm ci --no-audit --no-fund
npm run db:validate
npm run db:generate
DATABASE_URL="$STAGING_DATABASE_URL" npm exec prisma migrate deploy --schema=packages/api/prisma/schema.prisma
npm run build --workspace=@budgetmap/api
npm run build --workspace=@budgetmap/web
npm run start --workspace=@budgetmap/api
npm run start --workspace=@budgetmap/web
```

Configure the proxy health check with `GET /health`, keep `CORS_ORIGIN` equal to the staging web origin, do not run `install-dev.sh` on staging, and do not seed staging without approval. See [docs/STAGING-RUNBOOK.md](docs/STAGING-RUNBOOK.md) and [docs/OPERATIONS.md](docs/OPERATIONS.md) for smoke checks, service shutdown, and recovery.
