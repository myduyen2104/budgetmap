# Responsive UI/UX implementation summary

Date: 2026-10-16.

## Breakpoint contract

- Phone: ≤767 CSS px; drawer + five-item bottom navigation.
- Tablet: 768–1023 CSS px; compact 84px icon rail and tablet canvas.
- Desktop: ≥1024 CSS px; full 238px sidebar and desktop workspace. iPad Pro landscape at 1366×1024 uses this layout by viewport width, not device detection.
- Reduced-motion preferences disable the mobile navigation/header transitions.

## Changes made for this responsive pass

- Added [`apps/web/app/responsive.css`](../apps/web/app/responsive.css) after the existing accessibility stylesheet. It defines the responsive contract, narrows excessive phone card/page padding, prevents minimum-width leaks, resets movement-table transforms and fixed note width, keeps wallet dropdowns within the viewport, and restores visible keyboard focus on the phone menu button.
- Filled the legacy 641–767px navigation gap: the sidebar becomes a drawer, the menu button is visible, and the bottom navigation stays available through the declared phone breakpoint.
- Updated [`apps/web/components/app-shell.tsx`](../apps/web/components/app-shell.tsx) so unmatched routes do not show a false active mobile-nav indicator, and exposed active page links with `aria-current`.
- Suppressed the install prompt on login/register after browser testing showed it could cover the primary authentication action. Fixed transaction dropdown option clicks so label activation does not re-open the select; guarded date-entry handling when browser `InputEvent.inputType` is absent.
- Improved contrast for muted copy, user-colored category labels, and light-theme validation messages. The category icon itself keeps its chosen hue; dark-theme validation remains light text on dark alert surfaces. Removed invalid ARIA attributes from the custom date textbox while keeping state semantics on its calendar trigger.
- Replaced the loading skeleton's hard-coded white shimmer stop with a subtle gradient mixed from the active theme surface and primary accent; the more specific profile card skeleton is covered too. Added a desktop/mobile regression check across light/dark and Burgundy/Blue palettes.
- Removed the 400px fixed notes column in `globals.css` and a -30px movement-column transform in `theme.css`; these were structural causes of narrow table misalignment.
- Added a Playwright route/viewport audit in [`tests/e2e/responsive-audit.spec.ts`](../tests/e2e/responsive-audit.spec.ts), with route screenshots, overflow assertions, navigation geometry checks at breakpoint edges, dropdown bounds, month-picker Escape, and drawer open/close behavior.

## Layout decisions

Phone uses one-column page flow and keeps the familiar drawer and bottom navigation. Tablet portrait uses an icon rail rather than a 238px desktop sidebar, preserving more usable space for forms and charts. At 1024px and above the desktop shell is restored, so large iPad Pro landscape uses desktop navigation/content hierarchy while remaining touch-operable. Tables may wrap descriptive notes instead of forcing a fixed-width column; financial values are not reformatted by these responsive rules.

No business logic, API contract, or financial calculation was intentionally changed as part of the responsive-specific patch. Existing dirty worktree changes outside this pass were preserved.

## Desktop compatibility

Desktop sidebar remains 238px at 1024px and above; screenshots and overflow checks cover 1280×800, 1366×1024, 1440×900, and 1920×1080. Theme colors and the user's white active-navigation foreground preference were preserved. Common text contrast issues found by axe were corrected; contrast for every selectable accent palette still needs a separate palette-by-palette policy review.

## Known limitations

- The global stylesheets still contain a large legacy cascade with repeated breakpoints. The new file isolates this pass but does not consolidate the entire cascade.
- Responsive screenshots use an empty test account. Populated wallet/transaction flows are covered separately by E2E tests, but dense analysis/planner states need more visual fixtures.
- Full-page screenshots can place fixed navigation over the middle of a long rendered screenshot; judge fixed-element overlap in viewport captures/browser, not solely in a full-page image.
- Physical iOS Safari/iPad testing, modal focus trapping/screen-reader verification, and contrast checks for every theme palette remain follow-up work.
