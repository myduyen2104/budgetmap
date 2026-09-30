# UI QA

Post-UI-patch verification covers desktop and mobile Playwright runs plus axe scans for login, register, dashboard, transactions, monthly plan, analysis, wallets and categories. The current Transfer validation result is E2E 4/4 (desktop/mobile smoke plus lifecycle) and axe 18/18, including real wallet balance changes, validation errors, confirmation dialog focus, and mobile overflow. The app uses `127.0.0.1` for E2E API/web traffic and keeps session cookies HttpOnly; no session token is stored in localStorage.

Manual viewport checklist: 1440px desktop, 768px tablet, 390px mobile. Check navigation, active route, forms, loading/empty/error states, confirmations, chart fallback, reload session, and horizontal overflow before each staging promotion.

Visual QA also verifies the pastel-purple token system: `#9B8AFB` identity, `#5B4BB7` accessible action text, neutral page/card surfaces, and separate semantic success/warning/error colors. Verify focus rings and contrast with axe; purple is an accent, not the page background. Check Dashboard planned-vs-actual chart, readable fallback table, cards/tables, Transfer source/destination form, transfer summary metrics, profile retry state, and mobile navigation at all three viewports.
