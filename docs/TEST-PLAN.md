# MVP Test Plan Direction

No test implementation is part of Phase 0. This document defines acceptance scenarios for later development.

## Financial calculations

- 3m planned / 2m actual → remaining 1m, 66.67%, SAFE.
- 3m / 3m → remaining 0, 100%, AT_LIMIT, overspending 0.
- 3m / 3.6m → remaining -600k, 120%, EXCEEDED, overspending 600k.
- 0 / 0 → usage 0, SAFE.
- 0 / 500k → N/A usage, EXCEEDED, overspending 500k.
- planned income 12m and actual income 10m remain separate.
- positive carry-over works; negative carry-over is rejected.
- allocation over planned available is rejected.
- planned saving never enters actual expense, expense budget usage or wallet balance.
- planned saving must be non-negative.
- expense budgets plus planned saving cannot exceed planned available money.

## Domain mutation scenarios

Changing transaction amount, category, wallet, type or business month updates every affected derived view; deleting does the same. A category or wallet archived after historical use remains reportable but rejects new use.

## Product scenarios

Test first-time onboarding, plan creation, dashboard empty states, category with no allocation, overall positive cash flow with one exceeded category, previous month equal to zero, and a new month without automatic plan cloning.

## Security scenarios

User A cannot read, create, update or delete data using User B's wallet, category, transaction or monthly plan identifiers.
