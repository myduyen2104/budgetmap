import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {PrismaService} from '../../apps/api/src/prisma.service.js';
import {TransfersService} from '../../apps/api/src/transfers.service.js';
import {WalletsService} from '../../apps/api/src/wallets.service.js';

async function main() {
  const db = new PrismaService();
  const ids: string[] = [];
  const wallets = new WalletsService(db), transfers = new TransfersService(db);
  try {
    const owner = await db.user.create({data:{email:`summary-${randomUUID()}@test.local`,passwordHash:'fixture'}}); ids.push(owner.id);
    const other = await db.user.create({data:{email:`summary-other-${randomUUID()}@test.local`,passwordHash:'fixture'}}); ids.push(other.id);
    const source = await db.wallet.create({data:{userId:owner.id,name:'Source',type:'CASH',initialBalance:'5000000.10'}});
    const destination = await db.wallet.create({data:{userId:owner.id,name:'Destination',type:'BANK',initialBalance:'1000000.20'}});
    const inc = await db.category.create({data:{userId:owner.id,name:'Income',type:'INCOME'}});
    const exp = await db.category.create({data:{userId:owner.id,name:'Expense',type:'EXPENSE'}});
    await db.transaction.createMany({data:[
      {userId:owner.id,walletId:source.id,categoryId:inc.id,type:'INCOME',amount:'2000000.15',transactionDate:new Date('2026-09-01')},
      {userId:owner.id,walletId:source.id,categoryId:exp.id,type:'EXPENSE',amount:'1000000.05',transactionDate:new Date('2026-09-02')},
      {userId:owner.id,walletId:source.id,categoryId:exp.id,type:'EXPENSE',amount:'9000000',transactionDate:new Date('2026-09-03'),deletedAt:new Date()}
    ]});
    const transfer = await transfers.create(owner.id,{sourceWalletId:source.id,destinationWalletId:destination.id,amount:'1250000.50',transferDate:'2026-09-04'});
    const check = async(outgoing:string, balance:string, receivedBalance:string) => {
      const result = await wallets.list(owner.id);
      const src = result.find(w=>w.id===source.id), dst = result.find(w=>w.id===destination.id);
      assert.ok(src && dst);
      assert.equal(src.totalIncome,'2000000.15');assert.equal(src.totalExpense,'1000000.05');
      assert.equal(src.outgoingTransferAmount,outgoing);assert.equal(src.incomingTransferAmount,'0.00');assert.equal(src.currentBalance,balance);
      assert.equal(dst.incomingTransferAmount,outgoing);assert.equal(dst.outgoingTransferAmount,'0.00');assert.equal(dst.currentBalance,receivedBalance);
      assert.equal(dst.totalIncome,'0.00');assert.equal(dst.totalExpense,'0.00');
      for(const w of result) for(const key of ['currentBalance','initialBalance','totalIncome','totalExpense','incomingTransferAmount','outgoingTransferAmount'] as const) assert.match(w[key],/^-?\d+\.\d{2}$/);
    };
    await check('1250000.50','4749999.70','2250000.70');
    assert.deepEqual(await wallets.list(other.id),[]);
    await transfers.update(owner.id,transfer.id,{amount:'2000000.25'});
    await check('2000000.25','3999999.95','3000000.45');
    await transfers.remove(owner.id,transfer.id);
    await check('0.00','6000000.20','1000000.20');
    await db.wallet.update({where:{id:source.id},data:{archivedAt:new Date()}});
    assert.equal((await wallets.list(owner.id)).length,1);
    assert.equal((await wallets.list(owner.id,true)).length,2);
    console.log('integration wallet summary: PASS (exact Decimal totals, edit/delete, isolation, archive)');
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
