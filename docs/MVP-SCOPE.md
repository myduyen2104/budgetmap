# MVP Scope

## P0 — MVP bắt buộc

### Identity and ownership

- Register, login, logout, current user và basic profile.
- Dữ liệu tách biệt tuyệt đối theo user.

### Financial setup

- Một user có nhiều wallet.
- Initial balance tại thời điểm bắt đầu tracking.
- Archive wallet.
- Default category được tạo riêng cho từng user.
- Custom category và archive category.

### Monthly planning

- Một plan cho mỗi user/tháng.
- `plannedIncome`.
- `carryOver` không âm.
- Expense budget allocation.
- `plannedSaving` trên MonthlyPlan để earmark tiền tiết kiệm.
- Planned available, allocated và unallocated.

### Actual activity

- `INCOME` và `EXPENSE` transaction.
- Add, edit, delete.
- Wallet, category, amount, business date và note.
- Derived wallet balance.

### Insight

- Dashboard summary.
- Planned versus actual.
- Remaining cash flow.
- Remaining budget theo category.
- SAFE/WARNING/AT_LIMIT/EXCEEDED.
- Category không có budget nhưng có expense.
- Monthly analysis và previous-month expense comparison.

## P1 — Sau MVP

- Forgot password.
- Transfer giữa wallets.
- Copy previous month plan.
- Category hierarchy.
- Fixed/flexible expense.
- Recurring transactions.
- Savings goal/account.
- CSV export và search transaction note.

## P2 — Nâng cao

- Bank synchronization/Open Banking.
- OCR receipt.
- AI assistant/categorization.
- Investment, stock, cryptocurrency.
- Debt/loan management.
- Multi-currency and exchange rates.
- Shared/family wallet.
- Native mobile, offline mode, advanced forecasting và notifications.

## Explicitly out of scope for MVP

Transfer transaction/entity, recurring transaction automation, debt/loan, bank sync, OCR, AI, multi-currency, shared wallet, investment, crypto, native mobile, offline mode, PDF reporting và complex notification system.
