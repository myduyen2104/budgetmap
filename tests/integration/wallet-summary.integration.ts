import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {PrismaService} from '../../apps/api/src/prisma.service.js';
import {TransfersService} from '../../apps/api/src/transfers.service.js';
import {WalletsService} from '../../apps/api/src/wallets.service.js';
import {InsightsService} from '../../apps/api/src/insights.service.js';
import {MonthlyPlansService} from '../../apps/api/src/monthly-plans.service.js';

async function main() {
  const db = new PrismaService();
  const ids: string[] = [];
  const wallets = new WalletsService(db), transfers = new TransfersService(db);
  const insights = new InsightsService(db, new MonthlyPlansService(db));
  try {
    const owner = await db.user.create({data:{email:`summary-${randomUUID()}@test.local`,passwordHash:'fixture'}}); ids.push(owner.id);
    const other = await db.user.create({data:{email:`summary-other-${randomUUID()}@test.local`,passwordHash:'fixture'}}); ids.push(other.id);
    const source = await db.wallet.create({data:{userId:owner.id,name:'Source',type:'CASH',initialBalance:'5000000.10'}});
    const destination = await db.wallet.create({data:{userId:owner.id,name:'Destination',type:'BANK',initialBalance:'1000000.20'}});
    const untouched = await db.wallet.create({data:{userId:owner.id,name:'Untouched',type:'CASH',initialBalance:'12.34'}});
    const inc = await db.category.create({data:{userId:owner.id,name:'Income',type:'INCOME'}});
    const exp = await db.category.create({data:{userId:owner.id,name:'Expense',type:'EXPENSE'}});
    await db.transaction.createMany({data:[
      {userId:owner.id,walletId:source.id,categoryId:inc.id,type:'INCOME',amount:'2000000.15',transactionDate:new Date('2026-09-01')},
      {userId:owner.id,walletId:source.id,categoryId:exp.id,type:'EXPENSE',amount:'1000000.05',transactionDate:new Date('2026-09-02')},
      {userId:owner.id,walletId:source.id,categoryId:exp.id,type:'EXPENSE',amount:'9000000',transactionDate:new Date('2026-09-03'),deletedAt:new Date()}
    ]});
    const transfer = await transfers.create(owner.id,{sourceWalletId:source.id,destinationWalletId:destination.id,amount:'1250000.50',transferDate:'2026-09-04'});
    const check = async(outgoing:string, balance:string, receivedBalance:string, reverseTransferAmount='0.00') => {
      const result = await wallets.list(owner.id);
      const dashboard = await insights.dashboard(owner.id,'2026-09');
      const src = result.find(w=>w.id===source.id), dst = result.find(w=>w.id===destination.id);
      assert.ok(src && dst);
      assert.equal(src.totalIncome,'2000000.15');assert.equal(src.totalExpense,'1000000.05');
      assert.equal(src.outgoingTransferAmount,outgoing);assert.equal(src.incomingTransferAmount,reverseTransferAmount);assert.equal(src.currentBalance,balance);
      assert.equal(dst.incomingTransferAmount,outgoing);assert.equal(dst.outgoingTransferAmount,reverseTransferAmount);assert.equal(dst.currentBalance,receivedBalance);
      assert.equal(dst.totalIncome,'0.00');assert.equal(dst.totalExpense,'0.00');
      assert.equal(result.find(w=>w.id===untouched.id)?.currentBalance,'12.34');
      assert.deepEqual(
        dashboard.walletBalances.map(w=>[w.id,w.balance]).sort(([a],[b])=>a.localeCompare(b)),
        result.map(w=>[w.id,w.currentBalance]).sort(([a],[b])=>a.localeCompare(b)),
      );
      for(const w of result) for(const key of ['currentBalance','initialBalance','totalIncome','totalExpense','incomingTransferAmount','outgoingTransferAmount'] as const) assert.match(w[key],/^-?\d+\.\d{2}$/);
    };
    await check('1250000.50','4749999.70','2250000.70');
    assert.deepEqual(await wallets.list(other.id),[]);
    const reverseTransfer = await transfers.create(owner.id,{sourceWalletId:destination.id,destinationWalletId:source.id,amount:'0.10',transferDate:'2026-09-05'});
    await check('1250000.50','4749999.80','2250000.60','0.10');
    await transfers.update(owner.id,transfer.id,{amount:'2000000.25'});
    await check('2000000.25','4000000.05','3000000.35','0.10');
    await transfers.remove(owner.id,transfer.id);
    await check('0.00','6000000.30','1000000.10','0.10');
    await transfers.remove(owner.id,reverseTransfer.id);
    await check('0.00','6000000.20','1000000.20');
    await db.wallet.update({where:{id:source.id},data:{archivedAt:new Date()}});
    assert.equal((await wallets.list(owner.id)).length,2);
    assert.equal((await wallets.list(owner.id,true)).length,3);
    console.log('integration wallet summary: PASS (shared dashboard/wallet balances, bidirectional transfers, exact cents, soft-delete, isolation, archive)');
  } finally {
    await db.walletTransfer.deleteMany({where:{userId:{in:ids}}});
    await db.transaction.deleteMany({where:{userId:{in:ids}}});
    await db.wallet.deleteMany({where:{userId:{in:ids}}});
    await db.category.deleteMany({where:{userId:{in:ids}}});
    await db.user.deleteMany({where:{id:{in:ids}}});
    await db.$disconnect();
  }
}
main().catch(error=>{console.error(error);process.exitCode=1;});
