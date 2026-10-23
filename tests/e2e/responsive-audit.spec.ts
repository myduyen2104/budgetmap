import { expect, test } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { loginThroughUI } from "./transfer-helpers";

const routes = [
  { name: "dashboard", path: "/dashboard" },
  { name: "transactions", path: "/transactions" },
  { name: "monthly-plan", path: "/plans/2026/10" },
  { name: "analysis", path: "/analysis" },
  { name: "wallets", path: "/wallets" },
  { name: "categories", path: "/categories" },
  { name: "settings", path: "/settings" },
  { name: "profile", path: "/profile" },
];

const viewports = [
  { width: 320, height: 568, group: "small-mobile" },
  { width: 360, height: 640, group: "small-mobile" },
  { width: 393, height: 852, group: "mobile" },
  { width: 430, height: 932, group: "large-mobile" },
  { width: 600, height: 960, group: "large-mobile" },
  { width: 641, height: 800, group: "mobile" },
  { width: 760, height: 900, group: "mobile" },
  { width: 761, height: 900, group: "mobile" },
  { width: 767, height: 1000, group: "mobile" },
  { width: 768, height: 1024, group: "tablet-portrait" },
  { width: 834, height: 1194, group: "tablet-portrait" },
  { width: 1024, height: 768, group: "tablet-landscape" },
  { width: 1080, height: 810, group: "tablet-landscape" },
  { width: 1180, height: 820, group: "tablet-landscape" },
  { width: 1194, height: 834, group: "tablet-landscape" },
  { width: 1366, height: 1024, group: "ipad-pro-landscape" },
  { width: 1280, height: 800, group: "desktop" },
  { width: 1440, height: 900, group: "desktop" },
  { width: 1920, height: 1080, group: "desktop" },
];

const representativeRoutes = new Set([
  "/dashboard",
  "/transactions",
  "/analysis",
  "/plans/2026/10",
]);

test("responsive route and viewport audit", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === "mobile", "Run the viewport sweep once per browser engine.");
  test.setTimeout(600_000);

  await page.addInitScript(() => {
    if (!localStorage.getItem("budgetmap-theme")) localStorage.setItem("budgetmap-theme", "light");
    if (!localStorage.getItem("budgetmap-theme-color")) localStorage.setItem("budgetmap-theme-color", "burgundy");
  });
  await loginThroughUI(page);

  const phase = process.env.RESPONSIVE_CAPTURE === "after" ? "after" : "before";
  const screenshotRoot = path.join(process.cwd(), "docs/responsive-screenshots", phase);
  await mkdir(screenshotRoot, { recursive: true });
  const measurements: Array<Record<string, unknown>> = [];

  for (const viewport of viewports) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    const routesForViewport =
      viewport.group === "small-mobile" ||
      viewport.group === "tablet-portrait" ||
      viewport.group === "ipad-pro-landscape" ||
      (viewport.group === "desktop" && viewport.width === 1440)
        ? routes
        : routes.filter(({ path: routePath }) => representativeRoutes.has(routePath));

    for (const route of routesForViewport) {
      await page.goto(route.path, { waitUntil: "domcontentloaded" });
      await page.waitForLoadState("networkidle");
      await page.locator("main").first().waitFor({ state: "visible" });

      const layout = await page.evaluate(() => {
        const box = (selector: string) => {
          const element = document.querySelector<HTMLElement>(selector);
          if (!element) return null;
          const rect = element.getBoundingClientRect();
          const style = getComputedStyle(element);
          return {
            x: Math.round(rect.x),
            y: Math.round(rect.y),
            width: Math.round(rect.width),
            height: Math.round(rect.height),
            display: style.display,
            position: style.position,
          };
        };
        return {
          viewport: `${innerWidth}x${innerHeight}`,
          documentWidth: document.documentElement.scrollWidth,
          horizontalOverflow: document.documentElement.scrollWidth > innerWidth + 1,
          sidebar: box(".sidebar"),
          topbar: box(".topbar"),
          page: box(".page"),
          mobileNav: box(".mobile-nav"),
        };
      });
      measurements.push({ route: route.path, group: viewport.group, ...layout });
      if (phase === "after") {
        expect(layout.horizontalOverflow, `${route.path} overflows at ${layout.viewport}`).toBe(false);
        const mobileNav = page.locator(".mobile-nav");
        const menuButton = page.getByRole("button", { name: "Mở menu" });
        if (viewport.width <= 767) {
          await expect(mobileNav, `mobile navigation missing at ${layout.viewport}`).toBeVisible();
          await expect(menuButton, `menu button missing at ${layout.viewport}`).toBeVisible();
        } else {
          await expect(mobileNav, `mobile navigation unexpectedly visible at ${layout.viewport}`).toBeHidden();
        }
        if (viewport.width >= 768 && viewport.width <= 1023) {
          expect(layout.sidebar?.width, `tablet rail width at ${layout.viewport}`).toBe(84);
        } else if (viewport.width >= 1024) {
          expect(layout.sidebar?.width, `desktop sidebar width at ${layout.viewport}`).toBe(238);
        }
      }

      if ([393, 834, 1366, 1440].includes(viewport.width)) {
        await page.screenshot({
          path: path.join(screenshotRoot, `${route.name}-${viewport.width}x${viewport.height}.png`),
          fullPage: true,
          animations: "disabled",
        });
      }
    }

    if (viewport.group === "small-mobile" || viewport.group === "mobile") {
      await page.goto("/dashboard", { waitUntil: "domcontentloaded" });
      const monthTrigger = page.getByRole("button", { name: "Chọn tháng" });
      await monthTrigger.click();
      await expect(page.getByRole("dialog", { name: "Chọn tháng" })).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(page.getByRole("dialog", { name: "Chọn tháng" })).toHaveCount(0);

      const menuTrigger = page.getByRole("button", { name: "Mở menu" });
      if (await menuTrigger.isVisible()) {
        await menuTrigger.click();
        await expect(page.locator(".sidebar.open")).toBeVisible();
        await page.getByRole("button", { name: "Đóng menu" }).click();
      }
    }
    if ([320, 393, 768, 834, 1366].includes(viewport.width)) {
      await page.goto("/wallets", { waitUntil: "domcontentloaded" });
      await page.waitForLoadState("networkidle");
      const walletType = page.locator(".wallet-type-trigger");
      await expect(walletType).toBeVisible();
      await walletType.click();
      await expect(walletType).toHaveAttribute("aria-expanded", "true");
      const walletMenu = page.getByRole("listbox", { name: "Loại ví" });
      await expect(walletMenu).toBeVisible();
      const walletMenuBounds = await walletMenu.boundingBox();
      expect(walletMenuBounds).not.toBeNull();
      expect(walletMenuBounds!.x).toBeGreaterThanOrEqual(0);
      expect(walletMenuBounds!.x + walletMenuBounds!.width).toBeLessThanOrEqual(viewport.width + 1);
      if (viewport.width === 393 && phase === "after") {
        await page.screenshot({
          path: path.join(screenshotRoot, "wallet-type-dropdown-393x852.png"),
          animations: "disabled",
        });
      }
      await page.getByRole("option", { name: "Tiền mặt" }).click();

      await page.goto("/transactions", { waitUntil: "domcontentloaded" });
      await page.waitForLoadState("networkidle");
      await page.getByRole("button", { name: /Thêm giao dịch/ }).click();
      const movementDialog = page.locator(".movement-edit-modal .movement-editor");
      await expect(movementDialog).toBeVisible();
      const kindTrigger = movementDialog.getByRole("button", { name: "Loại giao dịch" });
      await kindTrigger.click();
      const kindMenu = movementDialog.locator(".select-menu");
      await expect(kindMenu).toBeVisible();
      const kindMenuBounds = await kindMenu.boundingBox();
      expect(kindMenuBounds).not.toBeNull();
      expect(kindMenuBounds!.x).toBeGreaterThanOrEqual(0);
      expect(kindMenuBounds!.x + kindMenuBounds!.width).toBeLessThanOrEqual(viewport.width + 1);
      if (viewport.width === 393 && phase === "after") {
        await page.screenshot({
          path: path.join(screenshotRoot, "transaction-dropdown-393x852.png"),
          animations: "disabled",
        });
      }
      await page.keyboard.press("Escape");
      await movementDialog.getByRole("button", { name: "Hủy", exact: true }).click();
    }
  }

  for (const viewport of viewports.filter(({ width }) => [393, 834, 1366, 1440].includes(width))) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    for (const route of ["/", "/login", "/register"]) {
      await page.goto(route, { waitUntil: "domcontentloaded" });
      await page.waitForLoadState("networkidle");
      await page.locator("main").first().waitFor({ state: "visible" });
      if (phase === "after") {
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
        expect(overflow, `${route} overflows at ${viewport.width}x${viewport.height}`).toBe(false);
      }
      await page.screenshot({
        path: path.join(screenshotRoot, `${route === "/" ? "home-redirect" : route.slice(1)}-${viewport.width}x${viewport.height}.png`),
        fullPage: true,
        animations: "disabled",
      });
    }
  }

  if (phase === "after") {
    const darkRoot = path.join(screenshotRoot, "dark");
    await mkdir(darkRoot, { recursive: true });
    for (const viewport of viewports.filter(({ width }) => [393, 834, 1366, 1440].includes(width))) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto("/dashboard", { waitUntil: "domcontentloaded" });
      await page.waitForLoadState("networkidle");
      const themeToggle = page.getByRole("button", { name: "Chuyển sáng tối" });
      if ((await page.locator("html").getAttribute("data-theme")) !== "dark") {
        await themeToggle.click();
      }
      await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
      for (const route of routes) {
        await page.goto(route.path, { waitUntil: "domcontentloaded" });
        await page.waitForLoadState("networkidle");
        await page.locator("main").first().waitFor({ state: "visible" });
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
        expect(overflow, `${route.path} overflows in dark mode at ${viewport.width}x${viewport.height}`).toBe(false);
        await page.screenshot({
          path: path.join(darkRoot, `${route.name}-${viewport.width}x${viewport.height}.png`),
          fullPage: true,
          animations: "disabled",
        });
      }
    }
  }

  await writeFile(
    path.join(screenshotRoot, "layout-metrics.json"),
    JSON.stringify(measurements, null, 2),
  );
  console.log(`RESPONSIVE_AUDIT_${phase.toUpperCase()}_ROUTES=${measurements.length}`);
});
