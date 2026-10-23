import {expect, Page} from '@playwright/test';
import {randomUUID} from 'node:crypto';
export const apiURL = `http://127.0.0.1:${process.env.E2E_API_PORT ?? '3102'}/api`;
export async function selectCustomOption(page: Page, label: string, optionName: string) {
  const form = page.getByRole('form', { name: 'Form giao dịch' });
  const trigger = form.getByRole('button', { name: label, exact: true });
  await trigger.click();
  await form.getByRole('option', { name: optionName }).click();
  await expect(trigger).toHaveAttribute('aria-expanded', 'false');
}
export async function chooseMonth(page: Page, monthName: string) {
  await page.getByRole('button', { name: 'Chọn tháng' }).click();
  await page.getByRole('dialog', { name: 'Chọn tháng' }).getByRole('button', { name: new RegExp(monthName) }).click();
}

export async function loginThroughUI(page: Page) {
  const username = `b${randomUUID().replaceAll('-', '').slice(0, 12)}`, password = 'E2ePassword123!';
  await page.goto('/register');await page.waitForLoadState('networkidle');
  await page.getByLabel('Tên tài khoản').fill(username);await page.getByRole('textbox',{name:'Mật khẩu',exact:true}).fill(password);await page.getByRole('textbox',{name:'Nhập lại mật khẩu',exact:true}).fill(password);
  await page.getByRole('button',{name:'Bắt đầu quản lý tiền'}).click();await expect(page).toHaveURL(/\/login\?registered=1$/);await expect(page.getByRole('status')).toContainText('Tạo tài khoản thành công');
  await page.waitForLoadState('networkidle');await page.getByLabel('Tên tài khoản').fill(username);await page.getByRole('textbox',{name:'Mật khẩu',exact:true}).fill(password);
  await page.getByRole('button',{name:'Bắt đầu quản lý tiền',exact:true}).click();await expect(page).toHaveURL(/\/profile\?welcome=1$/);
  await expect(page.getByRole('status')).toContainText('Chào mừng bạn đến với BudgetMap');
  await page.getByLabel('Tên hiển thị').fill('Người dùng kiểm thử');
  await page.getByRole('button',{name:'Lưu thay đổi',exact:true}).click();
  await expect(page.getByText('Đã lưu thay đổi.', { exact: true })).toBeVisible();
  await page.goto('/dashboard');
  const tourClose=page.getByRole('button',{name:'Đóng hướng dẫn'});
  await tourClose.waitFor({state:'visible',timeout:3000}).catch(()=>{});
  if(await tourClose.isVisible()) await tourClose.click();
  await page.goto('/wallets');await expect(page.getByRole('heading',{name:'Ví tiền',exact:true})).toBeVisible();
  expect((await page.request.get(apiURL+'/auth/me')).status()).toBe(200);
  return {username,password};
}

export async function createWalletUI(page: Page, name:string, initial:string) {
  await page.goto('/wallets');await page.waitForLoadState('networkidle');
  await page.getByLabel('Tên ví', {exact:true}).fill(name);await page.getByLabel('Số dư ban đầu', {exact:true}).fill(initial);
  const responsePromise=page.waitForResponse(r=>new URL(r.url()).pathname.replace(/\/+$/, '').endsWith('/wallets') && r.request().method()==='POST');
  await page.getByRole('button',{name:'Thêm ví',exact:true}).click();const response=await responsePromise;
  expect(response.status()).toBe(201);
  const wallet: {id:string} = await response.json();
  await expect(page.getByRole('article',{name:'Ví '+name,exact:true})).toBeVisible();
  return wallet.id;
}

export async function openTransfer(page: Page) {
  await page.goto('/transactions');await chooseMonth(page, 'Tháng 9 2026');
  await expect(page.getByRole('button',{name:/Thêm giao dịch/})).toBeEnabled();
  await page.getByRole('button',{name:/Thêm giao dịch/}).click();
  await selectCustomOption(page, 'Loại giao dịch', 'Chuyển tiền');
  await expect(page.getByRole('form',{name:'Form giao dịch'}).getByLabel('Danh mục',{exact:true})).toHaveCount(0);
}
export async function fillTransfer(page:Page,source:string,destination:string,amount='1250000.50') {
  const walletNames = await page.request.get(apiURL+'/wallets');
  const wallets: {items:{id:string;name:string}[]} = await walletNames.json();
  const sourceName = wallets.items.find((wallet) => wallet.id === source)?.name;
  const destinationName = wallets.items.find((wallet) => wallet.id === destination)?.name;
  if (!sourceName || !destinationName) throw new Error('Transfer test wallets are missing.');
  await selectCustomOption(page, 'Ví nguồn', sourceName);
  await selectCustomOption(page, 'Ví nhận', destinationName);
  await page.getByLabel('Số tiền',{exact:true}).fill(amount);await page.getByLabel('Ngày chuyển',{exact:true}).fill('2026-09-15');
  await page.getByLabel('Ghi chú',{exact:true}).fill('Chuyển tiền kiểm thử');
}
export async function expectNoOverflow(page:Page) {
  expect(await page.evaluate(()=>document.documentElement.scrollWidth <= window.innerWidth+1)).toBe(true);
}
