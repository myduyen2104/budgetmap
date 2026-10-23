# BudgetMap responsive UI/UX audit

Audit date: 2026-10-16. This review covered the current local worktree and used the isolated Playwright E2E environment. Existing uncommitted work in the shared worktree was preserved.

## Route and component inventory

User-facing routes found under `apps/web/app`:

| Route | Main areas and shared UI | Responsive risks reviewed |
|---|---|---|
| `/` | Public entry/redirect, `AppShell` | Destination when authenticated; public/mobile canvas |
| `/login` | Public auth shell, form, password controls | Narrow form, action width, text wrapping |
| `/register` | Public auth shell, form and validation | Narrow form, multi-field vertical density |
| `/dashboard` | Page header/month picker, balance spotlight, wallets, recent movements, quick actions, category summary | Dense vertical flow, financial figures, fixed bottom navigation overlap |
| `/transactions` | Filters, history table/list, movement editor, select menus and date/month controls | Table columns, note width, filters, dialog and dropdown clipping |
| `/plans/[year]/[month]` | Month controls, editable budget/actual summaries, category rows and charts | Numeric fields and columns on narrow/tablet widths |
| `/analysis` | Period comparison, comparison summary, category comparison cards/list, month picker | Two-period labels, paired amounts, sticky comparison header, chart/list width |
| `/wallets` | Create/edit form, wallet type dropdown, wallet summary cards, archive confirmation | Dropdown clipping, wallet name/balance wrapping, card columns |
| `/categories` | Category tabs, create/edit form, icon/color selection and category list | Dense controls and list actions |
| `/settings` | Theme and preference controls | Toggle/option wrapping, theme contrast |
| `/profile` | Display-name and security sections, install prompt | Forms, notification/install surfaces and mobile viewport fit |

Shared components/states also examined: `AppShell` sidebar/drawer, topbar, mobile navigation, month picker, movement form/modal, reusable select field, wallet type selector, empty/loading/error states, confirmation/status messages, charts, and theme palette.

## Viewports and evidence

The automated browser sweep covers 19 viewport sizes: 320×568, 360×640, 393×852, 430×932, 600×960, 641×800, 760×900, 761×900, 767×1000, 768×1024, 834×1194, 1024×768, 1080×810, 1180×820, 1194×834, 1366×1024, 1280×800, 1440×900, and 1920×1080 CSS pixels. All eight authenticated pages are checked at small-phone, tablet-portrait, iPad-Pro-landscape, and 1440 desktop representatives; other widths use the four representative routes: dashboard, transactions, plans, and analysis.

Screenshots are in [`responsive-screenshots/before/`](responsive-screenshots/before/) and [`responsive-screenshots/after/`](responsive-screenshots/after/). After captures additionally include public routes, dark-theme captures, and wallet/transaction dropdown states. The baseline was captured from the same local UI before the responsive-specific patch; the baseline is an empty-account state. Public routes and dark-theme screenshots have after-only evidence. Full-page screenshots are useful for page density, but fixed navigation appears at its viewport coordinate in a full-page image; use the actual viewport/browser for overlay judgement.

## Findings and disposition

| Severity | Finding and root cause | Affected surfaces | Disposition |
|---|---|---|---|
| P1 | Responsive rules accumulated in long, repeated global/theme stylesheets with different cutoffs (640, 760, 767, 900, 1100px). The 641–767px range therefore mixed phone content rules with legacy drawer/navigation behavior. | App shell and all authenticated pages | Added a unified 641–767 phone-navigation bridge and edge-breakpoint assertions. Tablet remains 768–1023; desktop begins at 1024. |
| P1 | Transaction table columns used fixed widths/transforms (including a 400px notes column), making the table fragile at phone/tablet widths. | Transactions and shared movement table | Removed the fixed notes width and reset column transforms at phone/tablet breakpoints; allow notes to wrap. Still verify with long realistic notes and populated data. |
| P1 | Tablet portrait inherited a full-width desktop sidebar, reducing useful canvas width. | All authenticated routes at 768–1023px | Use a compact 84px icon rail with accessible link titles; restore the 238px labeled sidebar at ≥1024px. |
| P1 | iPad-Pro landscape could otherwise inherit tablet constraints if the breakpoint relied on device class rather than CSS width. | All routes at ≥1366 CSS px | Width-based desktop layout starts at 1024px; 1366×1024 reports a 238px desktop sidebar. |
| P2 | Wallet type menu and transaction type menu could extend beyond the visible viewport or be clipped by surrounding cards. | Wallet create form and movement dialog | Wallet menu receives a bounded, scrollable mobile position; browser tests assert both menus remain within viewport at 320, 393, 768, 834 and 1366px. |
| P2 | Transaction select options were nested inside labels. Native label activation re-clicked the trigger after selecting an option, leaving the menu open over the next field. | Transaction editor: type, wallet, and other `SelectField` uses | Prevented the label's default activation on option click and asserted the trigger closes; desktop and mobile transfer lifecycle tests pass. |
| P2 | The delayed PWA installation prompt could appear on login/register and cover the primary action. | `/login`, `/register` on mobile | Install prompt is suppressed on auth routes; E2E sign-up/login smoke checks pass on desktop and mobile. |
| P3 | Date entry assumed `InputEvent.inputType` was always present; automated/native event variants could cause a runtime exception while typing a date. | Transaction editor date field | Added a type guard and verified there are no page errors during the transfer lifecycle. |
| P2 | Mobile bottom-nav indicator implied the first destination was active on routes not represented in the five-item nav. | Settings/profile and non-bottom-nav routes | `no-active` hides the moving indicator when no bottom-nav route matches. Sidebar and bottom links now expose `aria-current` on the active page. |
| P2 | Fixed bottom navigation can cover content near the viewport edge; full-page captures make the overlap look stronger because fixed elements remain viewport-positioned. | Phone navigation and long pages | Page bottom padding is retained; verify on physical devices and populated long pages before treating overlap as fully resolved. |
| P2 | Selected theme accents vary in brightness, but active controls generally use a fixed light foreground; some non-burgundy palette combinations can be low contrast. | Theme selector, active navigation, buttons, selected month/calendar items | Not changed because this needs a palette-by-palette contrast policy and must preserve the user's explicit white active-text preference. Requires a focused visual/accessibility decision. |
| P2 | Muted copy, category labels, and form-validation text had insufficient foreground contrast in automated axe checks. | Multiple pages, category surfaces, transaction validation | Darkened muted text, blended category labels toward the theme text without changing icon hues, and darkened light-theme validation copy. The full desktop/mobile accessibility suite now passes; verify all selectable theme palettes separately. |
| P2 | Shared loading skeleton faded through hard-coded pure white, causing an untinted flash in the selected palette; the profile card variant could also inherit the generic card surface. | Dashboard, analysis, transactions, wallets, profile loading states | Both regular and card skeletons now use the active theme surface/primary colors. Desktop/mobile regression checks cover multiple palettes and both color modes. |
| P2 | Several dialogs/popovers use custom markup and do not show a consistent focus trap/restore contract. | Movement editor, install guide, confirmation dialogs, dropdowns | Dropdown Escape/selection behavior is exercised; a full keyboard/screen-reader modal audit remains open. |
| P3 | Repeated CSS overrides make later responsive changes hard to reason about and can reintroduce regressions. | `globals.css`, `theme.css` | New responsive rules are isolated in `responsive.css`; consolidating the legacy cascade is deferred to avoid broad desktop/theme regressions. |

## Agency/ECC review

Actual Agency agents reviewed separate concerns: UX architecture, visual design, accessibility, and frontend implementation. They independently highlighted breakpoint/cascade fragmentation, transaction-column constraints, tablet canvas width, active-navigation semantics, contrast, and missing dialog focus management. A Code Reviewer subsequently identified the 641–767px navigation gap and the lack of expected-layout assertions; both were addressed in responsive CSS/test coverage.

Relevant ECC skills used: `frontend-patterns`, `frontend-design-direction`, `accessibility`, `browser-qa`, and `e2e-testing`.

## Remaining audit limits

This is browser-emulated touch/viewport testing, not physical iPhone/iPad testing. The responsive route sweep uses an authorized disposable test account and empty-state screenshots; the separate transfer E2E tests exercise populated wallet and transaction behavior. The exact iOS Safari install flow, screen-reader navigation, long-content combinations, and every palette/color pair still need dedicated validation. No production credentials or production database were used.

## Archived-wallet behavior review

`WalletsService.list()` excludes `archivedAt` wallets by default (with an explicit include-archived option); `InsightsService` includes all owner wallets in dashboard balances. The business rules say archiving prevents new transactions while preserving historical balances. This difference is consistent with an active-wallet-management view versus total owned assets, but the dashboard wallet overview does not make the archived status visible. Recommended policy: keep archived balances included in total assets (money remains owned), label/separate archived wallets in dashboard breakdowns, and provide an archived filter in wallet management. No archive policy or UI behavior was changed in this audit.
