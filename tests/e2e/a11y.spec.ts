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

test('loading surfaces follow the active palette and color mode',async({page})=>{
  await loginThroughUI(page);
  await page.goto('/dashboard');
  const gradients=await page.evaluate(()=>{
    const root=document.documentElement;
    const skeleton=document.createElement('div');
    const cardSkeleton=document.createElement('div');
    skeleton.className='loading-skeleton';
    cardSkeleton.className='card loading-skeleton';
    document.body.append(skeleton,cardSkeleton);
    const read=()=>[
      getComputedStyle(skeleton).backgroundImage,
      getComputedStyle(cardSkeleton).backgroundImage,
    ];
    root.dataset.theme='light';
    root.dataset.themeColor='burgundy';
    root.style.setProperty('--theme-surface','#fff');
    root.style.setProperty('--theme-primary','#800020');
    const burgundyLight=read();
    root.dataset.themeColor='blue';
    root.style.setProperty('--theme-primary','#82aee0');
    const blueLight=read();
    root.dataset.theme='dark';
    root.dataset.themeColor='burgundy';
    root.style.setProperty('--theme-surface','#1a1d21');
    root.style.setProperty('--theme-primary','#941f40');
    const burgundyDark=read();
    skeleton.remove();cardSkeleton.remove();
    return{burgundyLight,blueLight,burgundyDark};
  });
  expect(gradients.blueLight).not.toEqual(gradients.burgundyLight);
  expect(gradients.burgundyDark).not.toEqual(gradients.burgundyLight);
  expect(gradients.burgundyDark.every(value=>!value.includes('rgb(255, 255, 255)'))).toBe(true);
});

test('mobile analysis comparison follows the active theme instead of a fixed brown palette',async({page})=>{
  await page.setViewportSize({width:393,height:852});
  await loginThroughUI(page);
  await page.goto('/analysis');
  const comparison=page.locator('.analysis-page > .analysis-compare.card');
  await expect(comparison).toBeVisible();
  const surfaces=await comparison.evaluate((element)=>{
    const root=document.documentElement;
    const read=()=>({
      background:getComputedStyle(element).backgroundImage,
      color:getComputedStyle(element).color,
    });
    root.style.setProperty('--theme-primary-soft','#fff3ec');
    root.style.setProperty('--theme-surface','#ffffff');
    const orange=read();
    root.style.setProperty('--theme-primary-soft','#eef5ff');
    const blue=read();
    root.style.setProperty('--theme-primary-soft','#262b31');
    root.style.setProperty('--theme-surface','#1a1d21');
    const dark=read();
    return{orange,blue,dark};
  });
  expect(surfaces.orange.background).not.toEqual(surfaces.blue.background);
  expect(surfaces.dark.background).not.toEqual(surfaces.orange.background);
  expect(surfaces.orange.background).not.toContain('rgb(37, 17, 26)');
  expect(surfaces.orange.background).not.toContain('rgb(75, 16, 32)');
});

test('mobile exceeded-budget bars sit inside the red row marker',async({page})=>{
  await page.setViewportSize({width:393,height:852});
  await page.goto('/login');
  await page.evaluate(()=>{
    const card=document.createElement('section');
    card.className='expense-budget-card';
    card.innerHTML='<div class="chart-row is-exceeded"><div class="bars"></div></div>';
    document.body.append(card);
  });
  const exceededRow=page.locator('.expense-budget-card .chart-row.is-exceeded').first();
  await expect(exceededRow).toBeVisible();
  const spacing=await exceededRow.evaluate((row)=>({
    markerInset:getComputedStyle(row,'::before').left,
    barsInset:getComputedStyle(row.querySelector('.bars')!).paddingLeft,
  }));
  expect(spacing.markerInset).toBe('4px');
  expect(spacing.barsInset).toBe('16px');
});

test('transaction rows use compact mobile cards and aligned tablet records',async({page})=>{
  await page.goto('/login');
  await page.evaluate(()=>{
    const section=document.createElement('section');
    section.className='history-section';
    section.innerHTML=`<table class="movement-table"><tbody><tr>
      <td data-label="Ngày">26/10/2026</td>
      <td class="movement-kind-cell" data-label="Loại / Danh mục"><div class="movement-kind-stack"><span class="badge movement-expense">Chi tiêu</span><span class="category-badge"><span class="category-icon">P</span><span>Gửi xe</span></span></div></td>
      <td data-label="Ví">Tiền mặt</td><td data-label="Số tiền">−20.000</td>
      <td data-label="Ghi chú">Gửi xe 08</td>
      <td data-label="Thao tác"><div class="row-actions"><button class="icon-action-button" aria-label="Sửa giao dịch">Sửa</button></div></td>
    </tr></tbody></table>`;
    document.body.append(section);
  });

  await page.setViewportSize({width:393,height:852});
  const row=page.locator('.history-section .movement-table tbody tr');
  await expect(row).toBeVisible();
  const mobile=await row.evaluate((element)=>({
    display:getComputedStyle(element).display,
    width:element.getBoundingClientRect().width,
    actionWidth:element.querySelector<HTMLButtonElement>('.icon-action-button')!.getBoundingClientRect().width,
    documentWidth:document.documentElement.scrollWidth,
    dateTop:element.querySelector<HTMLElement>('[data-label="Ngày"]')!.getBoundingClientRect().top,
    typeTop:element.querySelector<HTMLElement>('.movement-expense')!.getBoundingClientRect().top,
    iconLeft:element.querySelector<HTMLElement>('.category-icon')!.getBoundingClientRect().left,
    categoryTextLeft:element.querySelector<HTMLElement>('.category-badge > span:last-child')!.getBoundingClientRect().left,
    categoryTop:element.querySelector<HTMLElement>('.category-badge')!.getBoundingClientRect().top,
    amountTop:element.querySelector<HTMLElement>('[data-label="Số tiền"]')!.getBoundingClientRect().top,
  }));
  expect(mobile.display).toBe('grid');
  expect(mobile.actionWidth).toBe(40);
  expect(mobile.documentWidth).toBeLessThanOrEqual(394);
  expect(mobile.width).toBeLessThanOrEqual(393);
  expect(mobile.dateTop).toBeLessThan(mobile.categoryTop);
  expect(mobile.iconLeft).toBeLessThan(mobile.categoryTextLeft);
  expect(Math.abs(mobile.categoryTop-mobile.typeTop)).toBeLessThan(8);
  expect(Math.abs(mobile.amountTop-mobile.categoryTop)).toBeLessThan(8);
  await page.setViewportSize({width:834,height:1194});
  const tablet=await row.evaluate((element)=>({
    display:getComputedStyle(element).display,
    areas:getComputedStyle(element).gridTemplateAreas,
    documentWidth:document.documentElement.scrollWidth,
    iconLeft:element.querySelector<HTMLElement>('.category-icon')!.getBoundingClientRect().left,
    categoryTextLeft:element.querySelector<HTMLElement>('.category-badge > span:last-child')!.getBoundingClientRect().left,
    typeLeft:element.querySelector<HTMLElement>('.movement-expense')!.getBoundingClientRect().left,
  }));
  expect(tablet.display).toBe('grid');
  expect(tablet.areas).toContain('wallet');
  expect(tablet.documentWidth).toBeLessThanOrEqual(835);
  expect(tablet.iconLeft).toBeLessThan(tablet.categoryTextLeft);
  expect(tablet.categoryTextLeft).toBeLessThan(tablet.typeLeft);
});

test('transaction month picker stays inside narrow mobile viewports',async({page})=>{
  await page.setViewportSize({width:393,height:852});
  await loginThroughUI(page);
  await page.goto('/transactions');

  await expect(page.locator('.transaction-mobile-search input')).toBeVisible();
  await expect(page.locator('.transaction-mobile-search input')).toHaveAttribute('placeholder','Tìm giao dịch...');
  const searchInputStyle=await page.locator('.transaction-mobile-search input').evaluate(input=>({
    border:getComputedStyle(input).borderTopWidth,
    background:getComputedStyle(input).backgroundColor,
    inputBounds:input.getBoundingClientRect().toJSON(),
    frameBounds:input.parentElement!.getBoundingClientRect().toJSON(),
  }));
  expect(searchInputStyle.border).toBe('0px');
  expect(searchInputStyle.background).toBe('rgba(0, 0, 0, 0)');
  expect(searchInputStyle.inputBounds.left).toBeGreaterThanOrEqual(searchInputStyle.frameBounds.left);
  expect(searchInputStyle.inputBounds.right).toBeLessThanOrEqual(searchInputStyle.frameBounds.right);
  const filterToggle=page.locator('.transactions-page .transaction-filter-toggle');
  await filterToggle.click();
  await expect(page.getByRole('region',{name:'Bộ lọc'}).getByLabel('Loại')).toBeVisible();
  await expect(page.getByRole('region',{name:'Bộ lọc'}).getByLabel('Tìm giao dịch')).toBeHidden();
  await filterToggle.click();

  for(const width of [320,393,768]) {
    await page.setViewportSize({width,height:852});
    await expectNoOverflow(page);
    const toolbarLayout=await page.locator('.transactions-page .transactions-mobile-controls').evaluate(element=>{
      const controls=element.getBoundingClientRect();
      const search=element.querySelector('.transaction-mobile-search')!.getBoundingClientRect();
      const actions=element.querySelector('.transaction-mobile-actions')!.getBoundingClientRect();
      return {controlsLeft:controls.left,controlsRight:controls.right,searchLeft:search.left,searchRight:search.right,actionsLeft:actions.left,actionsRight:actions.right,searchWidth:search.width};
    });
    expect(toolbarLayout.searchLeft).toBeCloseTo(toolbarLayout.controlsLeft,0);
    expect(toolbarLayout.actionsRight).toBeCloseTo(toolbarLayout.controlsRight,0);
    expect(toolbarLayout.searchRight).toBeLessThan(toolbarLayout.actionsLeft);
    expect(toolbarLayout.searchWidth).toBeGreaterThan(120);
    const iconAlignment=await page.locator('.transactions-page .transactions-mobile-controls button').evaluateAll((buttons,centerMonthIcon)=>buttons.flatMap(button=>{
      if(!centerMonthIcon && button.classList.contains('month-picker-trigger')) return [];
      const icon=button.querySelector<SVGElement|HTMLElement>('svg, i');
      if(!icon) return [];
      const buttonBounds=button.getBoundingClientRect();
      const iconBounds=icon.getBoundingClientRect();
      return [{
        horizontal:Math.abs((buttonBounds.left+buttonBounds.width/2)-(iconBounds.left+iconBounds.width/2)),
        vertical:Math.abs((buttonBounds.top+buttonBounds.height/2)-(iconBounds.top+iconBounds.height/2)),
      }];
    }),width<=640);
    expect(iconAlignment).toHaveLength(width<=640?3:2);
    for(const alignment of iconAlignment) {
      expect(alignment.horizontal).toBeLessThanOrEqual(1);
      expect(alignment.vertical).toBeLessThanOrEqual(1);
    }

    await expect(filterToggle.locator('i')).toHaveClass(/fi-rr-settings-sliders/);
    await filterToggle.click();
    await expect(filterToggle).toHaveAttribute('aria-expanded','true');
    await expect(filterToggle.locator('i')).toHaveClass(/fi-rr-settings-sliders/);
    await filterToggle.click();
    await expect(filterToggle).toHaveAttribute('aria-expanded','false');
    await expect(filterToggle.locator('i')).toHaveClass(/fi-rr-settings-sliders/);

    const trigger=page.locator('.transactions-page .transaction-mobile-month-picker .month-picker-trigger');
    await trigger.click();
    const popover=page.locator('.transactions-page .transaction-mobile-month-picker .month-picker-popover');
    await expect(popover).toBeVisible();
    const bounds=await popover.evaluate(element=>{
      const rect=element.getBoundingClientRect();
      return {left:rect.left,right:rect.right,viewportWidth:window.innerWidth};
    });
    expect(bounds.left).toBeGreaterThanOrEqual(8);
    expect(bounds.right).toBeLessThanOrEqual(bounds.viewportWidth-8);
    await page.keyboard.press('Escape');
  }
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
  await history.getByRole('button',{name:'Sửa chuyển tiền',exact:true}).click();
  await page.getByRole('button',{name:'Xóa giao dịch',exact:true}).click();
  const dialog=page.getByRole('dialog',{name:'Xóa chuyển tiền?'});
  await expect(dialog).toBeVisible();await expect(dialog.getByRole('button',{name:'Hủy'})).toBeFocused();await scan(page);
  await page.keyboard.press('Shift+Tab');await expect(dialog.getByRole('button',{name:'Xác nhận xóa'})).toBeFocused();
  await page.keyboard.press('Tab');await expect(dialog.getByRole('button',{name:'Hủy'})).toBeFocused();
  await page.keyboard.press('Escape');await expect(dialog).toHaveCount(0);await expect(page.getByRole('button',{name:'Xóa giao dịch',exact:true})).toBeFocused();
  await page.goto('/wallets');await expect(page.getByRole('article',{name:'Ví Ví nguồn kiểm tra',exact:true})).toContainText('749.999,60');
  await expect(page.getByRole('article',{name:'Ví Ví nhận kiểm tra',exact:true})).toContainText('250.000,50');
  await scan(page);await page.screenshot({path:testInfo.outputPath('wallet-summary.png'),fullPage:true});
});
