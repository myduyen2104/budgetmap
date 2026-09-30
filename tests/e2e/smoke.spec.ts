import { test, expect } from '@playwright/test';
import { randomUUID } from 'node:crypto';
test('browser authentication and wallet smoke', async ({ page }) => {
  const username = `e2e-${randomUUID()}`, password = 'E2ePassword123!';
  await page.goto('/register'); await page.getByLabel('Tên tài khoản').fill(username); await page.getByLabel('Mật khẩu').fill(password); await page.getByLabel('Nhập lại mật khẩu').fill(password); await page.getByRole('button', { name: 'Bắt đầu quản lý tiền' }).click();
  await expect(page.getByRole('status')).toContainText('Tạo tài khoản thành công'); await page.getByRole('link', { name: 'Đăng nhập' }).click(); await expect(page).toHaveURL(/login/); await page.waitForLoadState('networkidle'); await page.getByLabel('Tên tài khoản').fill(username); await page.getByLabel('Mật khẩu').fill(password); await page.getByRole('button', { name: 'Đăng nhập' }).click();
  await expect(page).toHaveURL(/wallets/); await expect(page.getByRole('heading', { name: 'Ví tiền' })).toBeVisible();
  const response = await page.evaluate(async () => (await fetch('http://127.0.0.1:3102/api/wallets', { credentials: 'include' })).status); expect(response).toBe(200);
});
