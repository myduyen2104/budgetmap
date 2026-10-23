# BudgetMap responsive UI/UX testing record

Date: 2026-10-16. Evidence was generated using Playwright against local development servers and a disposable local test database. No production database, credentials, or deployment target was used.

## Test matrix

- Authenticated pages: `/dashboard`, `/transactions`, `/plans/2026/10`, `/analysis`, `/wallets`, `/categories`, `/settings`, `/profile`.
- Public pages: `/`, `/login`, `/register`.
- Viewports: 320×568, 360×640, 393×852, 430×932, 600×960, 641×800, 760×900, 761×900, 767×1000, 768×1024, 834×1194, 1024×768, 1080×810, 1180×820, 1194×834, 1366×1024, 1280×800, 1440×900, and 1920×1080.
- Theme modes: light and dark at 393, 834, 1366, and 1440 CSS px.
- Interactive checks: phone drawer open/close; mobile nav; month picker dismissal; wallet type dropdown bounds; transaction-type dropdown bounds and dismissal; transfer lifecycle via UI, including decimal-cent values and updated wallet summaries.

## Commands and results

| Check | Result |
|---|---|
| `npm run build` | Passed across API and web workspaces. Next emitted an existing Autoprefixer warning at `globals.css:1619` (`end` mixed support; use `flex-end`). |
| `npm run typecheck` | Passed. |
| `npm test` | 31 passed, 2 failed in `tests/transfer-presentation.test.ts`; both relate to the existing `positiveAmount` validation/maximum mismatch. Details below. |
| Transfer lifecycle E2E | 2 passed (desktop and mobile), including decimal balances, transfer edit/delete, account isolation and responsive custom controls. |
| Smoke + transfer E2E (`npm run test:e2e`) | 4 passed (desktop and mobile for both suites). |
| Integration (`npm run test:integration`) | 7 suites passed, including shared wallet/dashboard balance, bidirectional transfers, cents, soft deletes, empty wallet, archive and owner isolation. Script enforces the isolated `budgetmap_test` database. |
| Accessibility (`npm run test:a11y`) | 18 route/transfer checks passed on desktop and mobile. The added theme-loading regression also passed independently on desktop and mobile (20 checks total across these runs). Axe critical/serious violations and horizontal overflow checks were clear. |
| Responsive route/viewport sweep | Passed: 100 authenticated route/viewport combinations, zero horizontal overflow; phone/tablet/desktop shell checks and dropdown/drawer/month interactions passed. Public route checks at four widths and dark-theme checks on all eight private routes also passed. Captures are under `docs/responsive-screenshots/after/`. |
| `git diff --check` | Passed after code changes; rerun after final documentation updates. |
| Lint | No lint script is configured in the root package scripts. |

### Unresolved unit failures

1. `positiveAmount('1.001')` returns `'1001.00'` although the test calls it invalid. The current parser explicitly interprets a dot followed by three or more digits as a grouped integer (e.g. `1.234`), so it parses this ambiguous input as 1,001. This comes from the uncommitted money-input parser change and is not a wallet-balance-calculation failure; the test fixture disagrees with the documented parser rule.
2. `positiveAmount('99999999999999999.99')` returns `null`, while the test expects the `NUMERIC(19,2)` maximum. The same uncommitted UI helper explicitly caps values at `MAX_MONEY_AMOUNT = 1_000_000_000_000n` (10^12), lower than that fixture. The test also expects a `₫` suffix from `formatVnd`, while the current helper deliberately omits the suffix; execution stops at the earlier max assertion. Both failures are in existing money-input/display changes, not the shared wallet balance helper. No financial limit or parser policy was changed during this pass.

The relevant money helper and tests were already modified in the shared worktree before this responsive pass. These failures are money-input/display behavior, not caused by the shared wallet balance calculation, responsive CSS, or E2E dropdown fix, and were not changed here. The max-value expectation needs to be reconciled with the explicit product cap; the `1.001` expectation needs to follow or intentionally revise the established Vietnamese grouping convention.

## Final visual/accessibility fixes

- The common muted text color was slightly below WCAG AA for normal text on the light surface; the semantic muted token and legacy `--muted-2` were darkened to `#70697e`.
- Category names use a text-safe blend with the theme text while their icons retain the user-selected category hue.
- Form validation text now uses a darker red on the light alert background; the dark-theme `.error` override remains light red on a dark surface.
- Loading skeleton gradients (including the profile card skeleton) now mix the active theme surface and primary color instead of fading through hard-coded white. A desktop/mobile regression test verifies changes across Burgundy/Blue and Light/Dark.
- Removed unsupported ARIA value/expanded attributes from the custom date textbox. The calendar trigger retains the dialog/expanded state semantics.
- The accessibility transfer test now follows the actual product flow: edit transfer → delete from editor → confirmation; wallet assertions match the current amount rendering, which does not show a currency suffix inside wallet cards.

## Known limitations

- Viewports are browser-emulated, not physical iPhone/iPad devices. Dynamic browser chrome, safe-area behavior, and mobile Safari installation still need on-device validation.
- Screenshots use test accounts and mostly empty states; populated transfer flows are separately exercised, but fully populated planner/analysis screens should get fixture-specific visual review.
- Full-page captures pin fixed navigation at viewport coordinates; use viewport captures or browser interaction when judging occlusion.
- Accessibility sweeps and physical assistive-technology checks are separate from visual viewport assertions.
- The suite reports two pre-existing money-parser/maximum expectation failures described above; no lint script is available.
