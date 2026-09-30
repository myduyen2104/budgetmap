# BudgetMap

BudgetMap là ứng dụng quản lý tài chính cá nhân giúp người dùng lập kế hoạch tiền theo tháng, phân bổ ngân sách, ghi nhận thu/chi thực tế và nhận biết category nào đang xài lố.

## Phase 0 status

Project hiện đang ở **Requirement & Design Review**. Documentation là source of truth. Chưa bắt đầu development runtime.

Đọc tài liệu theo thứ tự: [PRD](docs/PRD.md) → [MVP Scope](docs/MVP-SCOPE.md) → [Business Rules](docs/BUSINESS-RULES.md) → [User Flows](docs/USER-FLOWS.md) → [Screen List](docs/SCREEN-LIST.md) → [ERD](docs/ERD.md) → [Data Dictionary](docs/DATA-DICTIONARY.md) → [API Contract](docs/API-CONTRACT.md) → [Error Catalog](docs/ERROR-CATALOG.md) → [Database Migration Plan](docs/DATABASE-MIGRATION-PLAN.md) → [Frontend UX Spec](docs/FRONTEND-UX-SPEC.md) → [Auth & Security](docs/AUTH-SECURITY.md) → [Environment Setup](docs/ENVIRONMENT-SETUP.md) → [Architecture](docs/ARCHITECTURE.md) → [Test Plan](docs/TEST-PLAN.md) → [Implementation Checklist](docs/IMPLEMENTATION-CHECKLIST.md) → [Roadmap](docs/ROADMAP.md).

Local PostgreSQL dùng host port `5434` (`localhost:5434` từ máy host, `postgres:5432` từ container). API/Prisma hiện được thiết kế chạy trực tiếp trên máy host.

Browser validation uses Playwright with an isolated `budgetmap_test` database. Install browser binaries once with `npx playwright install chromium`; binaries remain outside the repository. Run `npm run test:e2e` and `npm run test:a11y`.

Release status: MVP release candidate — approved for staging/internal deployment. Production release is not approved; accepted build/dev audit risks remain documented in `docs/SECURITY-AUDIT.md`.

## UI and staging

### Icon attribution

BudgetMap uses the free [Flaticon Uicons](https://www.flaticon.com/uicons) Regular Rounded set for interface navigation and actions. The icon set is provided by Flaticon/Freepik and is used under the free license with attribution. See the [Flaticon license](https://www.flaticon.com/license/license.pdf).

Run `./install-dev.sh` for local setup and to start the API/Web development processes. PostgreSQL is the only supporting service; no Strapi or Medusa is required. The script uses Docker PostgreSQL at `127.0.0.1:5434`, API at `2311`, and Next.js at `2310`. It does not stop or remove PostgreSQL. Open [http://127.0.0.1:2310/login](http://127.0.0.1:2310/login). Run `npm run test:e2e` and `npm run test:a11y` for browser validation. See [UI QA](docs/UI-QA.md) and [Staging Runbook](docs/STAGING-RUNBOOK.md) for viewport checks, environment variables, migrations, health checks and single-instance limits.

## Release readiness

`GET /health` kiểm tra API và PostgreSQL. Production cần chạy một API instance khi rate limiter còn in-memory, dùng `prisma migrate deploy`, không seed production, và cấu hình HTTPS/CORS/cookie an toàn. Xem [Security Audit](docs/SECURITY-AUDIT.md), [Operations](docs/OPERATIONS.md) và [Release Checklist](docs/RELEASE-CHECKLIST.md).

## Product promise

BudgetMap phải trả lời được đồng thời: người dùng còn bao nhiêu tiền theo dòng tiền thực tế, và category nào đã xài lố dù tổng tiền vẫn còn.

## Phase 0 non-goals

Không tạo frontend, backend runtime, migration, database implementation, dependency setup hoặc production deployment trong phase này.

## Staging deployment

No provider-specific deployment is configured in this repository, so staging must be provisioned explicitly. Use a separate managed PostgreSQL database, one Node.js 22 API instance, and one Next.js process behind HTTPS. Copy `.env.staging.example` into the platform environment and set secrets via its secret manager; do not commit real credentials.

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

Configure the proxy health check as `GET /health`, keep `CORS_ORIGIN` equal to the exact staging web origin, and do not run `install-dev.sh` against staging. Do not seed staging unless explicitly approved. See [docs/STAGING-RUNBOOK.md](docs/STAGING-RUNBOOK.md) and [docs/OPERATIONS.md](docs/OPERATIONS.md) for smoke testing, shutdown and rollback.
