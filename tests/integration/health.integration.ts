import assert from 'node:assert/strict';
import {PrismaService} from '../../apps/api/src/prisma.service.js';
import {HealthService} from '../../apps/api/src/health.service.js';
async function run():Promise<void>{const prisma=new PrismaService();const health=new HealthService(prisma);await prisma.$connect();assert.equal(await health.isDatabaseReady(),true);await prisma.$disconnect();const unavailable=new PrismaService({datasources:{db:{url:'postgresql://invalid:invalid@127.0.0.1:1/missing'}}});assert.equal(await new HealthService(unavailable).isDatabaseReady(),false);await unavailable.$disconnect();console.log('integration health: PASS');}
void run();
