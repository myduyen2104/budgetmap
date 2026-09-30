# MVP ERD

## Entities

### User

Owns all financial data. One user has many wallets, categories, transactions and monthly plans.

### Wallet

`id`, `userId`, `name`, `type`, `initialBalance`, `archivedAt`, timestamps. Current balance is derived from initial balance and transactions.

### Category

`id`, `userId`, `name`, `type` (`INCOME | EXPENSE`), optional icon/color, `archivedAt`, timestamps. Categories are copied into each user account.

### Transaction

`id`, `userId`, `walletId`, `categoryId`, `type` (`INCOME | EXPENSE`), positive `amount`, `transactionDate` as business date, optional note, timestamps and optional deletion marker.

### MonthlyPlan

`id`, `userId`, `year`, `month`, `plannedIncome`, `carryOver`, `plannedSaving`, timestamps. Unique per `(userId, year, month)`. `plannedSaving` is a planning input, not a transaction.

### MonthlyBudgetAllocation

`id`, `monthlyPlanId`, `categoryId`, `plannedAmount`, timestamps. This entity only represents Expense Budget; there is no saving allocation. `categoryId` must reference an EXPENSE category. Unique per `(monthlyPlanId, categoryId)` in MVP.

## Relationships

```text
User 1──N Wallet
User 1──N Category
User 1──N Transaction
User 1──N MonthlyPlan 1──N MonthlyBudgetAllocation
Wallet 1──N Transaction
Category 1──N Transaction
Category 1──N MonthlyBudgetAllocation
```

## Integrity and deletion

- User deletion cascades all owned records.
- Wallet/category archive blocks new writes but preserves history.
- Used wallet/category is not hard-deleted.
- Allocation belongs to one plan and one category.
- Backend must verify that every referenced wallet/category/plan belongs to the authenticated user.
- Domain/database validation must enforce positive transaction amount, non-negative planning amounts and valid month.

## Explicitly excluded from ERD

Transfer group, savings goal, saving progress, recurring transaction, debt, notification, bank account integration and shared wallet entities. `WalletTransfer` is the supported wallet-to-wallet movement entity.
