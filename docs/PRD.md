# Product Requirements Document — BudgetMap MVP

**Status:** MVP release candidate — implementation aligned with source  
**Phase:** MVP release candidate — implementation and hardening  
**Primary user:** An individual managing personal finances
**Currency:** VND

## Problem

Typical income/expense trackers only answer “how much was spent.” Users also need to know how the money available at the beginning of the month was planned, how much remains in each category, which categories are overspending, and how that overspending affects the remaining money.

## Product goal

Take a user from planned income to a monthly plan, record actual activity, and compare planned versus actual values at both the overall and category levels.

## Core flow

`Planned income → Carry-over → Planned saving and expense budgets → Income/expense transactions → Dashboard → Overspending → Monthly analysis`

## User outcomes

- Know the planned available money at the beginning of the month.
- Know actual income and expenses for the month.
- Know the remaining cash flow.
- Know the planned, actual, and remaining values for each expense category.
- Identify categories that have spending without a budget.
- Compare the current month’s expenses with the previous month.

## Product principles

- Planning inputs and transactions are source data.
- Financial metrics are derived from source data rather than entered redundantly.
- Total remaining money and category budgets are different views.
- Do not expand the MVP with automation or external integrations.
- History is retained when a wallet or category is archived.

## Success criteria for MVP

- A user can complete the plan, allocation, and transaction-recording flow.
- The dashboard correctly displays planned, actual, remaining, and overspending values.
- Exactly 100% is distinguished from overspending.
- Editing/deleting a transaction updates the correct month, category, and wallet reports.
- A user cannot access another user’s data.
