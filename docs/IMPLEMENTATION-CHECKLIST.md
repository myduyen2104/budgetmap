# MVP Implementation Checklist

## Phase 1 — Foundation

- [x] Project/workspace setup and environment validation
- [x] PostgreSQL, Prisma schema and migrations
- [x] Seed default categories
- [x] Register/login/logout/current user
- [x] Session security and user isolation
- [x] Wallet CRUD/archive and derived balance
- [x] Category CRUD/archive

## Phase 2 — Core activity

- [x] Transaction create/list/read/update/soft delete
- [x] Type, ownership, archive and amount validation
- [x] Edit/delete recalculation across month/category/wallet
- [x] Date range/month filters, pagination and empty/error states

## Phase 3 — Planning and budget

- [x] Monthly plan uniqueness and validation
- [x] plannedSaving on MonthlyPlan
- [x] Expense-only allocations
- [x] Atomic allocation replacement and available-money validation
- [x] Derived planned/actual/unallocated/budget status metrics

## Phase 4 — Insight

- [x] Dashboard summary and recent transactions
- [x] Monthly analysis
- [x] Previous-month comparison and zero-baseline handling
- [x] Accessible focused Planned vs Actual expense chart

## Phase 5 — Hardening

- [x] Security/authorization tests
- [x] Financial regression tests
- [x] Accessibility audit
- [x] Desktop/mobile responsive QA
- [ ] Migration, backup, logging, monitoring and production checklist
- [x] WalletTransfer migration and ownership API
- [x] Wallet transfer integration/E2E/accessibility coverage
