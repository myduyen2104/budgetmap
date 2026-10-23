import {test, expect, request} from '@playwright/test';
import {randomUUID} from 'node:crypto';
import {apiURL, chooseMonth, createWalletUI, expectNoOverflow, fillTransfer, loginThroughUI, openTransfer, selectCustomOption} from './transfer-helpers';

test('transfer lifecycle, wallet summaries and session isolation',async({page})=>{
  test.setTimeout(120000);
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  const account=await loginThroughUI(page);
  const source=await createWalletUI(page,'Ví nguồn QA','5000000.10');
  const destination=await createWalletUI(page,'Ví nhận QA','1000000.20');
  const archived=await createWalletUI(page,'Ví lưu trữ QA','0');
  expect((await page.request.post(apiURL+'/wallets/'+archived+'/archive')).ok()).toBe(true);
  // Verify unchanged income/expense payloads through the same UI.
  for(const [type,amount] of [['INCOME','1000.15'],['EXPENSE','500.05']]) {
    await page.goto('/transactions');await expect(page.getByRole('button',{name:/Thêm giao dịch/})).toBeEnabled();await page.getByRole('button',{name:/Thêm giao dịch/}).click();
    await selectCustomOption(page, 'Loại giao dịch', type === 'INCOME' ? 'Thu nhập' : 'Chi tiêu');await page.getByLabel('Số tiền',{exact:true}).fill(amount);
    const walletResponse=await page.request.get(apiURL+'/wallets');const walletName=((await walletResponse.json()) as {items:{id:string;name:string}[]}).items.find((wallet)=>wallet.id===source)?.name;
    if (!walletName) throw new Error('Transaction test wallet is missing.');
    await selectCustomOption(page, 'Ví', walletName);
    const movementForm=page.getByRole('form',{name:'Form giao dịch'});
    await movementForm.getByLabel('Danh mục',{exact:true}).click();await movementForm.getByRole('option').first().click();await movementForm.getByLabel('Ngày',{exact:true}).fill('2026-09-01');
    const saved=page.waitForResponse(r=>new URL(r.url()).pathname.replace(/\/+$/, '').endsWith('/transactions') && r.request().method()==='POST');
    await page.getByRole('button',{name:'Lưu giao dịch',exact:true}).click();const response=await saved;expect(response.status()).toBe(201);
    const body=response.request().postDataJSON();expect(body).not.toHaveProperty('sourceWalletId');expect(body).not.toHaveProperty('destinationWalletId');expect(body).toHaveProperty('categoryId');
  }
  await openTransfer(page);
  await expect(page.getByLabel('Ví nguồn',{exact:true}).locator(`option[value="${archived}"]`)).toHaveCount(0);
  await fillTransfer(page,source,destination);
  const created=page.waitForResponse(r=>new URL(r.url()).pathname.replace(/\/+$/, '').endsWith('/transfers') && r.request().method()==='POST');
  await page.getByRole('button',{name:'Chuyển tiền',exact:true}).click();const response=await created;expect(response.status()).toBe(201);
  expect(response.request().postDataJSON()).not.toHaveProperty('categoryId');expect(response.request().postDataJSON()).not.toHaveProperty('walletId');
  const transfer:{id:string;amount:string}=await response.json();expect(transfer.amount).toBe('1250000.50');
  const history=page.getByRole('region',{name:'Lịch sử chuyển tiền'});
  await expect(history.getByText('Ví nguồn QA → Ví nhận QA')).toBeVisible();await expect(page.getByRole('status')).toContainText('Đã chuyển tiền');await expectNoOverflow(page);
  const filters=page.getByRole('region',{name:'Bộ lọc'});
  await filters.getByLabel('Ví').click();await filters.getByRole('option',{name:'Ví nhận QA'}).click();await expect(history.getByText('Chuyển tiền kiểm thử')).toBeVisible();
  await chooseMonth(page,'Tháng 8 2026');await expect(history.getByText('Chưa có chuyển tiền',{exact:true})).toBeVisible();
  await chooseMonth(page,'Tháng 9 2026');await expect(history.getByText('Chuyển tiền kiểm thử')).toBeVisible();
  const attacker=await request.newContext();
  try {
    const username=`o${randomUUID().replaceAll('-','').slice(0,12)}`, password='E2ePassword123!';
    expect((await attacker.post(apiURL+'/auth/register',{data:{username,password}})).ok()).toBe(true);expect((await attacker.post(apiURL+'/auth/login',{data:{username,password}})).ok()).toBe(true);
    expect((await attacker.get(apiURL+'/transfers/'+transfer.id)).status()).toBe(404);
    expect((await attacker.patch(apiURL+'/transfers/'+transfer.id,{data:{amount:'1'}})).status()).toBe(404);
    expect((await attacker.delete(apiURL+'/transfers/'+transfer.id)).status()).toBe(404);
    const isolated=await attacker.get(apiURL+'/wallets');expect((await isolated.json()).items).toEqual([]);
  } finally {await attacker.dispose();}
  async function balances(sourceBalance:string,destBalance:string,outgoing:string) {
    await page.goto('/wallets');await expect(page.getByRole('article',{name:'Ví Ví nguồn QA',exact:true})).toBeVisible();
    const r=await page.request.get(apiURL+'/wallets');expect(r.status()).toBe(200);
    const data:{items:{id:string;currentBalance:string;incomingTransferAmount:string;outgoingTransferAmount:string;totalIncome:string;totalExpense:string}[]}=await r.json();
    const src=data.items.find(w=>w.id===source),dst=data.items.find(w=>w.id===destination);
    expect(src).toMatchObject({currentBalance:sourceBalance,outgoingTransferAmount:outgoing,totalIncome:'1000.15',totalExpense:'500.05'});
    expect(dst).toMatchObject({currentBalance:destBalance,incomingTransferAmount:outgoing,totalIncome:'0.00',totalExpense:'0.00'});
    for (const endpoint of ['/dashboard','/reports/monthly']) {
      const report=await page.request.get(apiURL+endpoint+'?month=2026-09');
      expect(report.status()).toBe(200);
      expect(await report.json()).toMatchObject({actualIncome:'1000.15',actualExpense:'500.05'});
    }
    await expectNoOverflow(page);
  }
  await balances('3750499.70','2250000.70','1250000.50');
  await expect(page.getByRole('article',{name:'Ví Ví nguồn QA',exact:true})).toContainText('3.750.499,70');
  await page.goto('/transactions');await chooseMonth(page,'Tháng 9 2026');
  await history.getByRole('button',{name:'Sửa chuyển tiền',exact:true}).click();await expect(page.getByLabel('Số tiền',{exact:true})).toHaveValue('1.250.000,50');
  await page.getByLabel('Số tiền',{exact:true}).fill('2000000.25');await page.getByRole('button',{name:'Cập nhật',exact:true}).click();await expect(page.getByRole('status')).toContainText('Đã cập nhật');
  await balances('3000499.95','3000000.45','2000000.25');
  await page.goto('/transactions');await chooseMonth(page,'Tháng 9 2026');await history.getByRole('button',{name:'Sửa chuyển tiền',exact:true}).click();
  await page.getByRole('button',{name:'Xóa giao dịch',exact:true}).click();
  const deleteDialog=page.getByRole('dialog',{name:'Xóa chuyển tiền?'});
  await expect(deleteDialog).toBeVisible();await expect(deleteDialog.getByRole('button',{name:'Hủy',exact:true})).toBeFocused();
  await page.keyboard.press('Escape');await expect(deleteDialog).toHaveCount(0);await expect(page.getByRole('button',{name:'Xóa giao dịch',exact:true})).toBeFocused();
  await page.getByRole('button',{name:'Xóa giao dịch',exact:true}).click();await page.getByRole('button',{name:'Xác nhận xóa',exact:true}).click();await expect(history.getByText('Chưa có chuyển tiền',{exact:true})).toBeVisible();
  await balances('5000500.20','1000000.20','0.00');
  await page.reload();expect((await page.request.get(apiURL+'/auth/me')).status()).toBe(200);expect((await (await page.request.get(apiURL+'/auth/me')).json()).username).toBe(account.username);
  expect((await page.request.get(apiURL+'/transfers/'+transfer.id)).status()).toBe(404);
  const menu=page.getByRole('button',{name:'Mở menu',exact:true});if(await menu.isVisible()) await menu.click();
  await page.getByRole('button',{name:/Đăng xuất/}).click();await expect(page).toHaveURL(/\/login\/?$/);expect((await page.request.get(apiURL+'/wallets')).status()).toBe(401);
  expect(errors).toEqual([]);
});
