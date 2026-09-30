import {expect, Page} from '@playwright/test';
import {randomUUID} from 'node:crypto';
export const apiURL = `http://127.0.0.1:${process.env.E2E_API_PORT ?? '3102'}/api`;

export async function loginThroughUI(page: Page) {
  const username = `browser-${randomUUID()}`, password = 'E2ePassword123!';
  await page.goto('/register');await page.waitForLoadState('networkidle');
  await page.getByLabel('Tên tài khoản').fill(username);await page.getByLabel('Mật khẩu').fill(password);await page.getByLabel('Nhập lại mật khẩu').fill(password);
  await page.getByRole('button',{name:'Bắt đầu quản lý tiền'}).click();await expect(page.getByRole('status')).toContainText('Tạo tài khoản thành công'); await page.getByRole('link',{name:'Đăng nhập'}).click();await expect(page).toHaveURL(/\/login\/?$/);
  await page.waitForLoadState('networkidle');await page.getByLabel('Tên tài khoản').fill(username);await page.getByLabel('Mật khẩu').fill(password);
  await page.getByRole('button',{name:'Đăng nhập',exact:true}).click();await expect(page).toHaveURL(/\/wallets\/?$/);
  await expect(page.getByRole('heading',{name:'Ví tiền',exact:true})).toBeVisible();
  expect((await page.request.get(apiURL+'/auth/me')).status()).toBe(200);
  return {username,password};
}

export async function createWalletUI(page: Page, name:string, initial:string) {
  await page.goto('/wallets');await page.waitForLoadState('networkidle');
  await page.getByLabel('Tên ví', {exact:true}).fill(name);await page.getByLabel('Số dư ban đầu', {exact:true}).fill(initial);
  const responsePromise=page.waitForResponse(r=>r.url()===apiURL+'/wallets' && r.request().method()==='POST');
  await page.getByRole('button',{name:'Thêm ví',exact:true}).click();const response=await responsePromise;
  expect(response.status()).toBe(201);
  const wallet: {id:string} = await response.json();
  await expect(page.getByRole('article',{name:'Ví '+name,exact:true})).toBeVisible();
  return wallet.id;
}

export async function openTransfer(page: Page) {
  await page.goto('/transactions');await page.getByLabel('Tháng',{exact:true}).fill('2026-09');
  await expect(page.getByRole('button',{name:'Thêm giao dịch',exact:true})).toBeEnabled();
  await page.getByRole('button',{name:'Thêm giao dịch',exact:true}).click();
  await page.getByLabel('Loại giao dịch',{exact:true}).selectOption('TRANSFER');
  await expect(page.getByRole('form',{name:'Form giao dịch'}).getByLabel('Danh mục',{exact:true})).toHaveCount(0);
}
export async function fillTransfer(page:Page,source:string,destination:string,amount='1250000.50') {
  await page.getByLabel('Ví nguồn',{exact:true}).selectOption(source);
  await expect(page.getByLabel('Ví nhận',{exact:true}).locator(`option[value="${source}"]`)).toHaveCount(0);
  await page.getByLabel('Ví nhận',{exact:true}).selectOption(destination);
  await page.getByLabel('Số tiền',{exact:true}).fill(amount);await page.getByLabel('Ngày chuyển',{exact:true}).fill('2026-09-15');
  await page.getByLabel('Ghi chú',{exact:true}).fill('Chuyển tiền kiểm thử');
}
export async function expectNoOverflow(page:Page) {
  expect(await page.evaluate(()=>document.documentElement.scrollWidth <= window.innerWidth+1)).toBe(true);
}
