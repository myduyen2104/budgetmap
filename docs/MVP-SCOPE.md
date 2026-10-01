# MVP Scope

## P0 — Required MVP

### Identity and ownership

- Register, login, logout, current user, and basic profile.
- All data is strictly isolated by user.

### Financial setup

- A user can have multiple wallets.
- Initial balance at the start of tracking.
- Archive wallet.
- Default categories are created for each user.
- Custom categories and category archiving.

### Monthly planning

- One plan per user per month.
- `plannedIncome`.
- `carryOver` is non-negative.
- Expense budget allocation.
- `plannedSaving` on MonthlyPlan to earmark savings.
- Planned available, allocated, and unallocated money.

### Actual activity

- `INCOME` and `EXPENSE` transactions.
- Add, edit, delete.
- Wallet, category, amount, business date, and note.
- Derived wallet balance.

### Insight

- Dashboard summary.
- Planned versus actual.
- Remaining cash flow.
- Remaining budget theo category.
- SAFE/WARNING/AT_LIMIT/EXCEEDED.
- Categories with expenses but no budget.
- Monthly analysis and previous-month expense comparison.

## P1 — Post-MVP

- Forgot password.
- Copy previous month plan.
- Category hierarchy.
- Fixed/flexible expense.
- Recurring transactions.
- Savings goal/account.
- CSV export and transaction-note search.

## P2 — Advanced

- Bank synchronization/Open Banking.
- OCR receipt.
- AI assistant/categorization.
- Investment, stock, cryptocurrency.
- Debt/loan management.
- Multi-currency and exchange rates.
- Shared/family wallet.
- Native mobile, offline mode, advanced forecasting, and notifications.

## Explicitly out of scope for MVP

Recurring transaction automation, debt/loan, bank sync, OCR, AI, multi-currency, shared wallet, investment, crypto, native mobile, offline mode, PDF reporting, and complex notification systems.
