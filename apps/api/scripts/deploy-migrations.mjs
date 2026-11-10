import { execFileSync } from 'node:child_process';
import { PrismaClient } from '@prisma/client';

const schema = '../../packages/api/prisma/schema.prisma';
const migration = '20261003180000_category_groups';
const prisma = new PrismaClient();

try {
  const [migrationTable] = await prisma.$queryRaw`
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.tables
      WHERE table_schema = current_schema()
        AND table_name = '_prisma_migrations'
    ) AS present
  `;

  if (migrationTable?.present) {
    const [failedMigration] = await prisma.$queryRaw`
      SELECT "finished_at", "rolled_back_at"
      FROM "_prisma_migrations"
      WHERE "migration_name" = ${migration}
      ORDER BY "started_at" DESC
      LIMIT 1
    `;

    if (failedMigration && !failedMigration.finished_at && !failedMigration.rolled_back_at) {
      const existingColumn = await prisma.$queryRaw`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_schema = current_schema()
          AND table_name = 'Category'
          AND column_name = 'groupId'
      `;

      const resolution = existingColumn.length ? '--applied' : '--rolled-back';
      execFileSync('npx', [
        'prisma', 'migrate', 'resolve', resolution, migration, '--schema', schema,
      ], { stdio: 'inherit' });
    }
  }
} finally {
  await prisma.$disconnect();
}

execFileSync('npx', ['prisma', 'migrate', 'deploy', '--schema', schema], {
  stdio: 'inherit',
});
