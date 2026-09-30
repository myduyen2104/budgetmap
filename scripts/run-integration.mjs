import {spawnSync} from 'node:child_process';

const database = process.env.DATABASE_TEST_URL ?? 'postgresql://budgetmap:budgetmap@127.0.0.1:5434/budgetmap_test?schema=public';
if (new URL(database).pathname !== '/budgetmap_test') throw new Error('Integration tests require the isolated budgetmap_test database.');
const env = {...process.env, DATABASE_URL:database, NODE_ENV:'test'};
function run(args) {
  const result = spawnSync(process.execPath,args,{env,stdio:'inherit'});
  if(result.error) throw result.error;
  if(result.status !== 0) process.exit(result.status ?? 1);
}
run(['node_modules/prisma/build/index.js','migrate','deploy','--schema','packages/api/prisma/schema.prisma']);
for(const suite of ['transactions','transfers','wallet-summary','monthly-plans','insights','security','health']) {
  run(['node_modules/tsx/dist/cli.mjs',`tests/integration/${suite}.integration.ts`]);
}
