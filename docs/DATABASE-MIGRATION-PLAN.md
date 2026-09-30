# Database Implementation Plan

Use PostgreSQL 16 (or the current supported 16.x image) with Prisma migrations. `prisma migrate dev` is for local development; CI and production use committed migrations with `prisma migrate deploy`. Never edit production schema manually.

Money is PostgreSQL `NUMERIC(19,2)` and API decimal strings; convert Prisma Decimal explicitly at the API boundary. Business dates use `DATE` and month selection is explicit in the UI. Add a migration for `MonthlyPlan.plannedSaving NOT NULL DEFAULT 0`, remove `AllocationType`, remove `MonthlyBudgetAllocation.allocationType`, and remove the unused `User.timezone` field.

Foreign keys: user-owned records cascade on user deletion; transaction wallet/category and allocation category restrict deletion; plans cascade allocations. Transactions use `deletedAt` soft delete, and every aggregate/list excludes non-null values. Archive uses `archivedAt`; history remains queryable.

Keep unique `(userId,year,month)` and `(monthlyPlanId,categoryId)`. Add/retain indexes on transaction `(userId,transactionDate,type)`, `(userId,walletId,transactionDate)`, `(userId,categoryId,transactionDate)`, and active wallet/category lookup. Enforce cross-row ownership, category type, archive rules and allocation totals in the service transaction; database constraints enforce scalar non-negativity where practical.

Seed only deterministic development data: no real passwords; create a documented demo user, wallets and default income/expense categories. Production seed must never create demo accounts. Dashboard queries aggregate actual income/expense by month; wallet balance aggregates all non-deleted transactions; monthly reports aggregate by category and join allocations, including unbudgeted expense categories.
