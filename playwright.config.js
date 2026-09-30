"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const test_1 = require("@playwright/test");
const apiPort = process.env.E2E_API_PORT ?? "3102";
const webPort = process.env.E2E_WEB_PORT ?? "3101";
const baseURL = process.env.E2E_BASE_URL ?? `http://127.0.0.1:${webPort}`;
const testDatabase =
  process.env.DATABASE_TEST_URL ??
  "postgresql://budgetmap:budgetmap@127.0.0.1:5434/budgetmap_test?schema=public";
exports.default = (0, test_1.defineConfig)({
  testDir: "./tests/e2e",
  timeout: 60_000,
  fullyParallel: false,
  retries: 0,
  reporter: "list",
  use: { baseURL, trace: "retain-on-failure" },
  projects: [
    { name: "desktop", use: { ...test_1.devices["Desktop Chrome"] } },
    {
      name: "mobile",
      use: {
        ...test_1.devices["Desktop Chrome"],
        viewport: { width: 390, height: 844 },
        isMobile: true,
      },
    },
  ],
  webServer: [
    {
      command: `DATABASE_URL=${testDatabase} AUTH_SESSION_SECRET=e2e-test-secret-32-bytes API_PORT=${apiPort} CORS_ORIGIN=${baseURL} NODE_ENV=test npm run dev --workspace=@budgetmap/api`,
      url: `http://127.0.0.1:${apiPort}/health`,
      reuseExistingServer: true,
      timeout: 60_000,
    },
    {
      command: `NEXT_PUBLIC_API_URL=http://127.0.0.1:${apiPort}/api NEXT_PUBLIC_E2E_API_URL=http://127.0.0.1:${apiPort}/api npm run dev --workspace=@budgetmap/web -- --port ${webPort}`,
      url: `${baseURL}/login`,
      reuseExistingServer: true,
      timeout: 60_000,
    },
  ],
});
