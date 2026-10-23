import { test, expect } from '@playwright/test';
import { randomUUID } from 'node:crypto';
test('browser authentication and wallet smoke', async ({ page }) => {
  const username = `e${randomUUID().replaceAll('-', '').slice(0, 12)}`, password = 'E2ePassword123!';
  await page.goto('/register'); await page.getByLabel('Tên tài khoản').fill(username); await page.getByRole('textbox', { name: 'Mật khẩu', exact: true }).fill(password); await page.getByRole('textbox', { name: 'Nhập lại mật khẩu', exact: true }).fill(password); await page.getByRole('button', { name: 'Bắt đầu quản lý tiền' }).click();
  await expect(page).toHaveURL(/\/login\?registered=1/); await expect(page.getByRole('status')).toContainText('Tạo tài khoản thành công'); await page.getByLabel('Tên tài khoản').fill(username); await page.getByRole('textbox', { name: 'Mật khẩu', exact: true }).fill(password); await page.getByRole('button', { name: 'Bắt đầu quản lý tiền', exact: true }).click();
  await expect(page).toHaveURL(/profile\?welcome=1/); await expect(page.getByRole('heading', { name: 'Hồ sơ' })).toBeVisible();
  const response = await page.evaluate(async () => (await fetch('http://127.0.0.1:3102/api/wallets', { credentials: 'include' })).status); expect(response).toBe(200);
});
