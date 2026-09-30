# Data Dictionary

| Entity | Field | Status | Meaning / rule |
|---|---|---|---|
| User | id, username, email, passwordHash, displayName | Persisted | Account identity; financial data is user-owned |
| Wallet | initialBalance | Persisted | Balance when tracking starts; Decimal >= 0 |
| Wallet | currentBalance | Derived | initial + income - expense |
| Category | type | Persisted | INCOME or EXPENSE |
| Transaction | type | Persisted | INCOME or EXPENSE only |
| Transaction | amount | Persisted | Positive Decimal |
| Transaction | transactionDate | Persisted | Business date used for reporting month |
| Transaction | createdAt | Persisted | Audit timestamp, never reporting month |
| MonthlyPlan | plannedIncome | Persisted | Forecast for the month, Decimal >= 0 |
| MonthlyPlan | carryOver | Persisted | User-selected prior money, Decimal >= 0 |
| MonthlyPlan | plannedSaving | Persisted | Planned amount earmarked for saving, Decimal >= 0; not a transaction |
| MonthlyPlan | actualIncome | Derived | Sum of income transactions in month |
| MonthlyPlan | plannedAvailableMoney | Derived | plannedIncome + carryOver |
| MonthlyPlan | actualAvailableMoney | Derived | actualIncome + carryOver |
| MonthlyPlan | actualExpense | Derived | Sum of expense transactions in month |
| MonthlyPlan | remainingCashFlow | Derived | actualIncome + carryOver - actualExpense |
| MonthlyPlan | totalExpenseAllocated | Derived | Sum of MonthlyBudgetAllocation planned amounts |
| MonthlyPlan | totalAllocated | Derived | totalExpenseAllocated + plannedSaving |
| MonthlyPlan | unallocatedAmount | Derived | plannedAvailableMoney - totalAllocated |
| Allocation | plannedAmount | Persisted | Non-negative Expense Budget amount |
| Allocation | actualAmount | Derived | Actual expense for the referenced EXPENSE category |
| Allocation | remainingBudget | Derived | plannedAmount - actualAmount |
| Allocation | usagePercentage | Derived | Null/N/A for zero planned with positive actual |
| Allocation | overspendingAmount | Derived | max(actualAmount - plannedAmount, 0) |
| Allocation | status | Derived | SAFE, WARNING, AT_LIMIT or EXCEEDED |

Allocation has no type field: every allocation is an expense budget. Savings planning is represented only by `MonthlyPlan.plannedSaving`.

## Representation

Money uses PostgreSQL `NUMERIC(19,2)`/Decimal. API representation is decimal string, such as `"3600000.00"`; VND UI shows `3.600.000đ`.
`WalletTransfer.amount` also uses `NUMERIC(19,2)` and is serialized as a decimal string. Its source/destination wallet movement affects wallet balances but never income or expense aggregates.
