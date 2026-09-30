import {test, expect} from '@playwright/test';
import {AxeBuilder} from '@axe-core/playwright';
import type {Page as AxePage} from 'playwright-core';
import type {Page} from '@playwright/test';
import {apiURL, createWalletUI, expectNoOverflow, fillTransfer, loginThroughUI, openTransfer} from './transfer-helpers';

async function scan(page:Page) {
  const result=await new AxeBuilder({page:page as unknown as AxePage}).analyze();
  expect(result.violations.filter(v=>v.impact==='critical'||v.impact==='serious'),JSON.stringify(result.violations,null,2)).toEqual([]);
  await expectNoOverflow(page);
}
const publicRoutes=['/login','/register'];
const protectedRoutes=['/dashboard','/transactions','/analysis','/plans/2026/09','/wallets','/categories'];
for(const route of [...publicRoutes,...protectedRoutes]) test('accessibility '+route,async({page})=>{
  test.setTimeout(90000);
  const serverErrors:string[]=[];
  page.on('response',r=>{if(r.url().startsWith(apiURL) && r.status()>=500)serverErrors.push(`${r.status()} ${r.url()}`);});
  if(protectedRoutes.includes(route)) await loginThroughUI(page);
  await page.goto(route);await page.waitForLoadState('networkidle');
  await expect(page).toHaveURL(new RegExp(route+'/?$'));await expect(page).toHaveTitle('BudgetMap');
  expect(serverErrors,'Protected pages must load real data, not a server-error screen').toEqual([]);
  await scan(page);
});

test('accessible transfer form, validation, confirmation and wallet summary',async({page},testInfo)=>{
  test.setTimeout(120000);
  await loginThroughUI(page);
  const source=await createWalletUI(page,'Ví nguồn kiểm tra','1000000.10'),destination=await createWalletUI(page,'Ví nhận kiểm tra','0');
  await openTransfer(page);await fillTransfer(page,source,destination);
  await scan(page);
  for(const value of ['0','-1']) {
    await page.getByLabel('Số tiền',{exact:true}).fill(value);
    await page.getByRole('button',{name:'Chuyển tiền',exact:true}).click();
    const validation=page.getByRole('form',{name:'Form giao dịch'}).getByRole('alert');
    await expect(validation).toContainText('Số tiền phải lớn hơn 0');
    await expect(validation).toBeFocused();await scan(page);
  }
  await page.getByLabel('Số tiền',{exact:true}).fill('250000.50');
  await page.getByRole('button',{name:'Chuyển tiền',exact:true}).click();
  const history=page.getByRole('region',{name:'Lịch sử chuyển tiền'});
  await expect(history.getByText('Chuyển tiền kiểm thử')).toBeVisible();await scan(page);
  await page.screenshot({path:testInfo.outputPath('transfer-history.png'),fullPage:true});
  await history.getByRole('button',{name:'Xóa',exact:true}).click();
  const dialog=page.getByRole('dialog',{name:'Xóa chuyển tiền?'});
  await expect(dialog).toBeVisible();await expect(dialog.getByRole('button',{name:'Hủy'})).toBeFocused();await scan(page);
  await page.keyboard.press('Shift+Tab');await expect(dialog.getByRole('button',{name:'Xác nhận xóa'})).toBeFocused();
  await page.keyboard.press('Tab');await expect(dialog.getByRole('button',{name:'Hủy'})).toBeFocused();
  await page.keyboard.press('Escape');await expect(dialog).toHaveCount(0);await expect(history.getByRole('button',{name:'Xóa',exact:true})).toBeFocused();
  await page.goto('/wallets');await expect(page.getByRole('article',{name:'Ví Ví nguồn kiểm tra',exact:true})).toContainText('749.999,60 ₫');
  await expect(page.getByRole('article',{name:'Ví Ví nhận kiểm tra',exact:true})).toContainText('250.000,50 ₫');
  await scan(page);await page.screenshot({path:testInfo.outputPath('wallet-summary.png'),fullPage:true});
});
