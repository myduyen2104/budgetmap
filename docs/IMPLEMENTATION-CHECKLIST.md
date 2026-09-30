# MVP Implementation Checklist

## Phase 1 — Foundation

- [ ] Project/workspace setup and environment validation
- [ ] PostgreSQL, Prisma schema and migrations
- [ ] Seed default categories
- [ ] Register/login/logout/current user
- [ ] Session security and user isolation
- [ ] Wallet CRUD/archive and derived balance
- [ ] Category CRUD/archive

## Phase 2 — Core activity

- [ ] Transaction create/list/read/update/soft delete
- [ ] Type, ownership, archive and amount validation
- [ ] Edit/delete recalculation across month/category/wallet
- [ ] Date range/month filters, pagination and empty/error states

## Phase 3 — Planning and budget

- [ ] Monthly plan uniqueness and validation
- [ ] plannedSaving on MonthlyPlan
- [x] Expense-only allocations
- [x] Atomic allocation replacement and available-money validation
- [ ] Derived planned/actual/unallocated/budget status metrics

## Phase 4 — Insight

- [x] Dashboard summary and recent transactions
- [x] Monthly analysis
- [x] Previous-month comparison and zero-baseline handling
- [x] Accessible focused Planned vs Actual expense chart

## Phase 5 — Hardening

- [ ] Security/authorization tests
- [ ] Financial regression tests
- [ ] Accessibility audit
- [ ] Desktop/mobile responsive QA
- [ ] Migration, backup, logging, monitoring and production checklist
- [x] WalletTransfer migration and ownership API
- [x] Wallet transfer integration/E2E/accessibility coverage
