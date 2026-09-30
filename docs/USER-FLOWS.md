# User Flows

## First-time user

1. Register → login.
2. System creates user-owned default categories.
3. User creates first wallet and enters initial balance.
4. User opens current month and creates a plan.
5. User enters planned income and carry-over.
6. User enters planned saving and adds expense budget allocations.
7. User records income and expenses.
8. Dashboard shows actual state and budget status.

## Tạo kế hoạch tháng

Dashboard → Create monthly plan → choose month → enter planned income → enter carry-over → enter planned saving → review planned available money → save.

The plan is unique per user/month. It is not automatically cloned from the previous month.

## Phân bổ ngân sách

Monthly Plan → Add expense budget → choose an EXPENSE category → enter planned amount → review total expense allocated, planned saving and unallocated money → save.

The system rejects `totalExpenseAllocated + plannedSaving` greater than planned available money. Actual spending can later exceed an expense budget.

## Thêm khoản thu

Dashboard/Transactions → Add income → choose wallet and income category → enter amount and business date → save. Actual income changes; planned income does not.

## Thêm khoản chi

Dashboard/Transactions → Add expense → choose wallet and expense category → enter amount and business date → save. Actual expense, wallet balance and relevant budget status recalculate.

## Sửa/xóa giao dịch

Open transaction → edit amount/category/wallet/date/type or delete → confirm → recalculate every affected wallet, category and month. A date change from 31/08 to 01/09 updates both months.

## Chuyển tiền giữa các ví

Transactions → Add transfer → choose source and destination wallets → enter amount and date → confirm. Transfers update both wallet balances but are excluded from income, expense and budget aggregates.

## Xem dashboard

Dashboard → choose month → view planned/actual income, actual expense, remaining cash flow, expense budget usage, budget table, overspending and recent transactions.

## Phát hiện xài lố

When actual category spending exceeds its planned amount, status becomes EXCEEDED and the dashboard shows overspending amount. At exactly 100%, status is AT_LIMIT and overspending is zero.

## Xem phân tích tháng

Monthly Analysis → select month → view plan, actual expense, remaining cash flow, category variance and categories without budget.

## So sánh tháng trước

Monthly Analysis → compare current month → show current versus previous month total expense and expense by category. If previous amount is zero, show “New spending” rather than divide by zero.

## Bắt đầu tháng mới

At the start of a new month, user creates a new plan, enters new planned income/carry-over and allocates again. Auto-copy is P1.
