# Screen List

## Login

- Purpose: authenticate.
- Main information: email, password.
- Main actions: login, go to register.
- Empty state: none.
- Error state: invalid credentials, rate limit.
- Data dependency: auth API.

## Register

- Purpose: create account.
- Main information: email, password, display name.
- Main actions: register, go to login.
- Empty state: none.
- Error state: duplicate email, validation failure.
- Data dependency: auth API and default category creation.

## Dashboard

- Purpose: answer current financial status quickly.
- Main information: planned income, actual income, actual expense, remaining cash flow, expense budget usage, status table, overspending, recent transactions, one focused chart.
- Main actions: select month, add income/expense, create plan.
- Empty state: no wallet, no plan, no transaction.
- Error state: failed summary or partial data load.
- Data dependency: dashboard, monthly plan, transactions, wallets.

## Transactions

- Purpose: inspect actual activity.
- Main information: date, type, amount, wallet, category, note.
- Main actions: filter, paginate, add, edit, delete.
- Empty state: “Thêm giao dịch đầu tiên”.
- Error state: invalid filter or load failure.
- Data dependency: transaction, wallet and category data.

## Add/Edit Transaction

- Purpose: record or correct income/expense.
- Main information: type, amount, wallet, category, business date, note.
- Main actions: save, cancel, delete when editing.
- Empty state: none.
- Error state: amount/date/ownership/category/wallet validation.
- Data dependency: active wallets/categories and transaction API.

## Wallets

- Purpose: manage places holding money.
- Main information: name, type, initial/current derived balance, archived state.
- Main actions: create, edit, archive.
- Empty state: “Tạo ví đầu tiên”.
- Error state: duplicate/invalid name or archive failure.
- Data dependency: wallets and derived transactions.

## Categories

- Purpose: manage income and expense labels.
- Main information: name, type, icon/color optional, active/archived state.
- Main actions: create, edit, archive.
- Empty state: defaults should exist; otherwise prompt creation.
- Error state: invalid type/name or archive failure.
- Data dependency: categories, transaction/allocation history.

## Monthly Plan

- Purpose: enter planned income, carry-over and allocations.
- Main information: planned income, carry-over, planned saving, planned available, expense budgets, total expense allocated, total allocated and unallocated.
- Main actions: create/edit plan, enter planned saving, add/edit/remove expense budget.
- Empty state: “Bạn chưa lập kế hoạch cho tháng này”.
- Error state: duplicate month, negative input, allocation over available.
- Month plan supports previous/next/current month navigation, an explicit create state for months without a plan, draft allocation editing with cancel/confirmation, and derived budget status.
- Data dependency: monthly plan, active categories and derived actuals.

## Monthly Analysis

- Purpose: understand a selected month and its change from prior month.
- Main information: planned/actual values, remaining cash flow, category planned/actual/remaining/usage/status, current versus previous expense.
- Main actions: select month, compare previous month.
- Empty state: no plan or no transactions.
- Error state: report query failure.
- Data dependency: monthly plan, transactions, wallets, categories.

## Profile

- Purpose: manage basic user information.
- Main information: username and display name.
- Main actions: update profile, logout.
- Empty state: none.
- Error state: validation or save failure.
- Data dependency: current-user/profile API.
