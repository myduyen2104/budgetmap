# BudgetMap MVP API Contract

Base URL `/api`; JSON UTF-8. All endpoints except register/login use the authenticated user from the server session. Clients never send a trusted `userId`. Money is a decimal string (`"3600000.00"`); dates are `YYYY-MM-DD`; months are `YYYY-MM`.

## Common conventions

Success responses use the resource directly (or `{items, page, pageSize, total}` for lists). `204` has no body. Errors follow [ERROR-CATALOG.md](ERROR-CATALOG.md). IDs are opaque strings. All writes validate ownership and active wallet/category state in one server-side transaction.

### Auth

| Method | Path | Body / query | Success |
|---|---|---|---|
| POST | `/auth/register` | `{email,password,displayName?}` | `201 {user}`; creates default categories |
| POST | `/auth/login` | `{email,password}` | `200 {user}`; establishes session |
| POST | `/auth/logout` | none | `204` |
| GET | `/auth/me` | none | `200 {user}` |
| PATCH | `/auth/me` | `{displayName?}` | `200 {user}` |

Passwords are validated server-side; email is normalized. Invalid login returns the same generic error for unknown email or wrong password.

### Wallets and categories

`GET /wallets` and `GET /categories` return `{items:[...]}`; optional query `includeArchived=true`. `POST /wallets` body `{name,type,initialBalance}`. `PATCH /wallets/:id` body `{name?,type?}`. `POST /wallets/:id/archive` has no body. Wallet type is a documented string; `initialBalance >= 0`.

Wallet list rows additionally return `totalIncome`, `totalExpense`, `incomingTransferAmount`, and `outgoingTransferAmount`. All four are decimal strings with two fraction digits, accumulated across all dates and excluding soft-deleted records. Existing fields remain unchanged. `currentBalance = initialBalance + totalIncome - totalExpense + incomingTransferAmount - outgoingTransferAmount`. Transfer amounts never contribute to `totalIncome` or `totalExpense`.

`POST /categories` body `{name,type,icon?,color?}`; `PATCH /categories/:id` accepts the same optional fields; archive has no body. `type` is `INCOME|EXPENSE`. Names must be non-empty and owned. Archived records remain readable for history but cannot be selected for new writes. Success is `200` for reads/updates and `201` for creates.

### Transactions

`GET /transactions` query: `month=YYYY-MM` or `from/to=YYYY-MM-DD`, `type`, `categoryId`, `walletId`, `page` (default 1), `pageSize` (default 20, max 100), and optional `sort` (`transactionDate:asc|desc`). Returns `{items:[{id,type,amount,wallet,category,transactionDate,note,createdAt}],page,pageSize,total}`.

`GET /transactions/:id` returns `200 {transaction}`. `POST /transactions` body `{type,amount,walletId,categoryId,transactionDate,note?}`. `PATCH` accepts these fields optionally; `DELETE` soft-deletes and returns `204`. Amount must be positive; type must match the category; wallet/category must be owned and active. Date changes recalculate both affected months. Create returns `201`, update `200`.

### Wallet transfers

`GET /transfers` supports `month`, `walletId`, `page` and `pageSize` and returns `{items,page,pageSize,total}`. `GET /transfers/:id` returns one owned, non-deleted transfer. `POST /transfers` body is `{sourceWalletId,destinationWalletId,amount,transferDate,note?}`; `PATCH` accepts the same fields optionally and `DELETE` soft-deletes with `204`. Transfers require two distinct active wallets owned by the current user, use Decimal strings, and are wallet movements only: they are excluded from income, expense and budget aggregates.

### Monthly plans

`GET /monthly-plans/:year/:month` returns the plan or `404`; `PUT` body `{plannedIncome,carryOver,plannedSaving}` and creates/replaces the unique user/month plan (`200`). All three amounts are non-negative and month is 1–12.

`PUT /monthly-plans/:year/:month/allocations` body `{allocations:[{categoryId,plannedAmount}]}`. It atomically replaces all expense allocations. Categories must be owned, active, type `EXPENSE`, unique in the list, and amounts non-negative. `sum(plannedAmount)+plannedSaving <= plannedIncome+carryOver`; otherwise `ALLOCATION_EXCEEDS_AVAILABLE`. Returns the refreshed plan with derived totals and `budgets`; there is no separate delete-allocation endpoint.

### Dashboard and reports

`GET /dashboard?month=YYYY-MM` returns derived decimal-string totals (`plannedIncome`, `actualIncome`, `plannedAvailableMoney`, `actualAvailableMoney`, `actualExpense`, `remainingCashFlow`, `totalExpenseAllocated`, `plannedSaving`, `totalAllocated`, `unallocatedAmount`), `budgets`, `overspending`, `unbudgetedExpenses`, `recentTransactions`, `chart` and `walletBalances`. It is valid without a plan, wallet or transaction. `GET /reports/monthly?month=YYYY-MM` returns the same derived monthly analysis. `GET /reports/monthly-comparison?month=YYYY-MM` returns current/previous expense strings, `difference`, `differencePercentage`, `comparisonStatus` (`NEW_SPENDING`, `NO_SPENDING` or `COMPARED`) and the union of category rows with `isNew`/`isNoLongerUsed`. Zero previous values never divide by zero. Derived metrics are computed from non-deleted transactions using `transactionDate`.

These endpoints return `200`; invalid month/filter is `400`, missing owned resources are `404`/`403` per the error policy.
