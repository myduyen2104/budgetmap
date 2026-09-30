"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const test_1 = require("@playwright/test");
const playwright_1 = require("@axe-core/playwright");
const routes = ['/login', '/register', '/dashboard', '/transactions', '/analysis', '/plans/2026/09', '/wallets', '/categories'];
for (const route of routes)
    (0, test_1.test)(`accessibility ${route}`, async ({ page }) => { await page.goto(route); const result = await new playwright_1.AxeBuilder({ page: page }).analyze(); (0, test_1.expect)(result.violations.filter(v => v.impact === 'critical' || v.impact === 'serious'), JSON.stringify(result.violations, null, 2)).toEqual([]); });
