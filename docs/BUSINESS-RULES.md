# Business Rules — Source of Truth

If the UI, API, ERD, or tests describe something differently from this document, update the decision before development.

## Source of truth

- Planning inputs: `plannedIncome`, `carryOver`, allocations.
- Actual inputs: income/expense transactions, wallet initial balance.
- Dashboard and report metrics are derived.
- Do not persist `actualIncome`, `actualExpense`, `currentBalance`, `remainingCashFlow`, `remainingBudget`, `usagePercentage`, or `overspendingAmount` as the source of truth.

## Glossary and examples

### Planned income

The amount the user expects to receive during the month, such as an expected salary of VND 12,000,000. This is used for planning before the money actually arrives.

### Actual income

The total of actual `INCOME` transactions during the month. If the user expects VND 12,000,000 but has received only VND 10,000,000, planned income remains VND 12,000,000 and actual income is VND 10,000,000.

### Carry-over

The amount from before the current month that the user deliberately carries into the new plan. If the user has VND 50,000,000 in the bank but wants to include only VND 2,000,000 in the plan, carry-over is VND 2,000,000, not VND 50,000,000. The MVP does not allow negative carry-over.

### Planned available money

The amount the user expects to be available for allocation:

`plannedIncome + carryOver`

For example, VND 12,000,000 planned income + VND 1,000,000 carry-over = VND 13,000,000.

### Actual expense

The total actually spent through `EXPENSE` transactions during the month. Planned allocations do not increase actual expense.

### Actual available money

The view based on actual activity:

`actualIncome + carryOver`

For example, actual income of VND 10,000,000 plus VND 1,000,000 carry-over gives actual available money of VND 11,000,000.

### Remaining cash flow

Remaining money based on actual data:

`actualIncome + carryOver - actualExpense`

Planned income is not used in this formula.

### Expense budget

The amount the user plans to assign to an expense category, such as VND 3,000,000 for Food. A budget is not a transaction and does not reduce the wallet balance.

### Remaining budget

`plannedAmount - actualExpense(category)`.

If Food is planned at VND 3,000,000 and actual spending is VND 2,000,000, remaining budget is VND 1,000,000.

### Overspending

This occurs only when actual expense exceeds the planned amount:

`max(actualAmount - plannedAmount, 0)`.

Food planned at VND 3,000,000 and actual spending at VND 3,600,000 results in VND 600,000 overspending.

### Planned saving

The amount the user plans to earmark for savings, entered directly on MonthlyPlan. It is not an actual savings transaction and is not an Expense in the MVP. If planned saving is VND 3,000,000 and actual expense is VND 5,000,000, actual expense remains VND 5,000,000.

The MVP has no savings goal or savings wallet; wallet transfers are supported as a separate movement. Do not display planned saving as money that has already been transferred.

### Unallocated money

Money in planned available money that has not been assigned to an expense budget or planned saving:

`plannedAvailableMoney - totalAllocated`.

`totalAllocated = totalExpenseAllocated + plannedSaving`.

### Category without a budget but with spending

If Health has no allocation but has VND 500,000 in expenses: planned amount = 0, actual amount = VND 500,000, usage = N/A/null, status = EXCEEDED, and overspending = VND 500,000. Do not display Infinity%.

## Wallet rules

`initialBalance` is the wallet balance when the user starts tracking. Do not enter the same money as both initial balance and an income transaction.

`walletBalance = initialBalance + income - expense`.

Archiving a wallet only prevents new transactions; historical transactions and balances remain included.

## Allocation rules

- MonthlyBudgetAllocation represents only an Expense Budget and must reference an EXPENSE category.
- There is no savings allocation in the MVP; plannedSaving is only a MonthlyPlan field.
- `totalExpenseAllocated = SUM(MonthlyBudgetAllocation.plannedAmount)`.
- `totalAllocated = totalExpenseAllocated + plannedSaving`.
- `plannedSaving >= 0`.
- `totalExpenseAllocated + plannedSaving <= plannedAvailableMoney`.
- Actual spending may exceed an allocation.
- Planned saving is not included in actual expense, expense budget usage, or wallet balance.
- The MVP has no actualSaving, savings progress, or savings transaction.

## Status rules

- `SAFE`: usage < 80%.
- `WARNING`: 80% <= usage < 100%.
- `AT_LIMIT`: usage = 100%.
- `EXCEEDED`: usage > 100%.

100% is not overspending. Planned 0/actual 0 → SAFE, usage 0. Planned 0/actual > 0 → EXCEEDED, usage N/A/null.

## Dates, ownership and recalculation

`transactionDate` is the business date that determines the reporting month; `createdAt` does not determine the month. Changing a transaction from 08/31 to 09/01 must decrease August and increase September. Changing amount/category/wallet or deleting must also recalculate affected aggregates.

The backend must derive user identity from the auth context and check ownership for every read, create, update, and delete.
A wallet transfer is a separate movement between two active wallets owned by the same user. The source and destination must differ; a soft-deleted transfer no longer affects balances and is never included in income/expense aggregates.

## Precision

The MVP uses PostgreSQL `NUMERIC(19,2)`/Decimal to avoid floating-point errors and preserve scalability. The API uses decimal strings; the VND UI displays no decimal places.
