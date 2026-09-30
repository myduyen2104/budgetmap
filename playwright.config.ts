import { defineConfig, devices } from "@playwright/test";
const apiPort = process.env.E2E_API_PORT ?? "3102";
const webPort = process.env.E2E_WEB_PORT ?? "3101";
const baseURL = process.env.E2E_BASE_URL ?? `http://127.0.0.1:${webPort}`;
const testDatabase =
  process.env.DATABASE_TEST_URL ??
  "postgresql://budgetmap:budgetmap@127.0.0.1:5434/budgetmap_test?schema=public";
// Playwright may be launched from a desktop process whose PATH still points
// at the system Node. Keep the E2E server on the project's supported Node 22.
const node22Bin = "/home/duyen/.nvm/versions/node/v22.23.2/bin";
const npm22 = `${node22Bin}/npm`;
const e2ePath = `PATH=${node22Bin}:$PATH`;
export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 60_000,
  fullyParallel: false,
  retries: 0,
  reporter: "list",
  use: { baseURL, actionTimeout: 15000, trace: "retain-on-failure" },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    {
      name: "mobile",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 390, height: 844 },
        isMobile: true,
      },
    },
  ],
  webServer: [
    {
      command: `${e2ePath} DATABASE_URL=${testDatabase} AUTH_SESSION_SECRET=e2e-test-secret-32-bytes API_PORT=${apiPort} CORS_ORIGIN=${baseURL} NODE_ENV=test ${npm22} run dev --workspace=@budgetmap/api`,
      url: `http://127.0.0.1:${apiPort}/health`,
      reuseExistingServer: false,
      timeout: 60_000,
    },
    {
      command: `${e2ePath} BUDGETMAP_NEXT_DIST=.next-e2e NEXT_PUBLIC_API_URL=http://127.0.0.1:${apiPort}/api NEXT_PUBLIC_E2E_API_URL=http://127.0.0.1:${apiPort}/api ${npm22} run dev --workspace=@budgetmap/web -- --port ${webPort}`,
      url: `${baseURL}/login`,
      reuseExistingServer: false,
      timeout: 60_000,
    },
  ],
});
