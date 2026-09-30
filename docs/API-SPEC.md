# MVP API Direction

This is a short implementation direction. The normative endpoint contract is [API-CONTRACT.md](API-CONTRACT.md). All protected operations derive the authenticated user from auth context; clients never provide a trusted `userId`.

## Resource groups

- Auth: register, login, logout, current user; profile update.
- Wallets: list, create, update, archive.
- Categories: list, create, update, archive.
- Transactions: list, create, read, update, delete.
- Monthly plans: read/create/update `plannedIncome`, `carryOver` and `plannedSaving`; replace Expense Budget allocations.
- Dashboard: selected month summary, budget status, overspending, recent transactions and chart data.
- Reports: selected month and previous-month expense comparison.

## Query direction

Transaction listing should support month/date range, type, category, wallet, page and page size. Month reporting uses `YYYY-MM`; business dates use `YYYY-MM-DD`.

## Response direction

Money is serialized as decimal strings. Dashboard/report responses expose derived values and must distinguish null/N/A usage from zero usage. Validation, ownership and domain errors need stable error categories.

Saving progress/actual saving, Transfer and all P1/P2 endpoints are excluded from the MVP contract. `plannedSaving` is only a MonthlyPlan input.
