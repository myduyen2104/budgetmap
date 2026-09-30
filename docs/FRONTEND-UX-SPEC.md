# Frontend UX Specification — MVP

## Transfer UI (2026-09-07)

`/transactions` offers “Thêm giao dịch” and a shared editor for Thu nhập / Chi tiêu / Chuyển tiền. Transfer shows active source/destination wallets, amount, business date and note; it hides category and excludes the selected source from destination options. Invalid/zero/negative amounts receive Vietnamese feedback. Transfer requests use `/transfers`; income/expense requests retain their existing payload. Editing cannot convert a transfer into an income/expense record.

History has two independently paginated tables, Thu nhập và chi tiêu and Chuyển tiền giữa ví (20 items per page), using their existing APIs. Month and wallet filters apply to both; transfer wallet filtering matches either endpoint. Category filtering applies only to income/expense and hides transfers. Transfers show a purple label, source → destination, exact VND amount, date, note and edit/delete actions. Mobile tables become labeled cards. Delete uses a native accessible dialog with cancel, keyboard focus containment, Escape and focus restoration. Mutations show success feedback; errors preserve input and support retry.

`/wallets` cards show current/initial balance and four separate lifetime totals: income, expense, transfer received and transfer sent. Totals are supplied by the API, with no floating-point money calculations in the browser. Wallet data reloads on navigation/window focus. Decimal fractions are retained when present, e.g. `1.250.000,50 ₫`.

Routes: `/login`, `/register`, `/dashboard`, `/transactions`, `/transactions/new`, `/transactions/:id/edit`, `/wallets`, `/categories`, `/plans/:year/:month`, `/analysis/:year/:month`, `/profile`. Authenticated routes share a responsive shell with sidebar on desktop and a bottom navigation/menu on mobile.

Dashboard shows month selector, planned/actual income, actual expense, remaining cash flow, allocation summary, budget table, overspending alert, one expense-by-category chart and recent transactions. Primary actions are Add income, Add expense and Create plan.

Components: AppShell, MonthPicker, SummaryCard, BudgetTable, StatusBadge, TransactionTable, TransactionForm, WalletForm, CategoryForm, PlanForm, AllocationEditor, Chart, EmptyState, ErrorState, LoadingSkeleton and ConfirmModal. Forms validate required fields, positive transaction amount, non-negative plan values, valid date, type compatibility and allocation total. Messages should identify the field in plain Vietnamese.

## Visual system

The shared visual identity uses pastel purple tokens: primary `#9B8AFB`, hover `#806FE5`, dark text/action `#5B4BB7`, soft background `#F5F1FF`, border `#DDD5FF`, page `#FAF9FC`, card `#FFFFFF`, text `#29243A` and muted text `#746D82`. Tokens live in `apps/web/app/globals.css`; screens must consume them rather than scattering hex values. Semantic success, warning, error and info colors remain distinct from brand purple. Primary purple is used for navigation, actions, focus, tabs and chart accents without turning the whole page purple.

Money displays VND with no decimals (e.g. `3.600.000đ`), while inputs accept digits and normalize to decimal strings. Business dates remain `YYYY-MM-DD`. Loading uses skeletons; empty states explain the next action; destructive archive/delete requires confirmation; failed mutations preserve form input and offer retry.

Status colors: SAFE green, WARNING amber, AT_LIMIT blue/neutral, EXCEEDED red. Never rely on color alone: include text/icon and accessible labels. Dashboard uses a responsive grouped horizontal Planned/Actual expense bar chart with VND tooltips, neutral Planned bars, highlighted Actual bars and an accessible detail table fallback. Wallet transfers use a distinct movement label, source/destination wallets, and never display a category field. Long category names remain readable in the scrollable chart area. Charts require textual summaries, keyboard-accessible controls, visible focus, labels, semantic headings, adequate contrast and mobile horizontal scrolling only where necessary. Dashboard and analysis show loading, empty and error states and use month selectors; zero previous expense is labeled New spending. MVP excludes recurring, bank sync, OCR, AI and savings goals.
