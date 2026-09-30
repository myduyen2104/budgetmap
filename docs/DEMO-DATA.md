# Local demo data

Use this fixture to review the UI with three months of sample activity.

- URL: `http://127.0.0.1:2310/login`
- Username: `budgetmap-demo`
- Password: `BudgetMapDemo2026!`
- Seed command: `npm run db:seed:demo`

The seed command is restricted to the local `localhost:5434/budgetmap` database and refuses to run with `NODE_ENV=production`. Re-running it rebuilds the wallets, categories, monthly plans, transfers and transactions for this dedicated demo user. It leaves every other account untouched.

The fixture covers July, August and September 2026, including monthly rent, support for parents, workplace parking, utilities and phone/data; variable food, coffee, transport, outings, shopping, repairs, healthcare and a one-off traffic fine; different expected budgets; more than 20 actual transactions per month for pagination; and transfers between a bank wallet and cash wallet.
