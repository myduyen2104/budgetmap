import { PrismaClient, CategoryType } from "@prisma/client";
import { DEFAULT_CATEGORIES } from "../../../packages/shared/src/categories.js";

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const demo = await prisma.user.findUnique({
    where: { email: "demo@budgetmap.local" },
  });
  if (!demo) return;
  for (const category of DEFAULT_CATEGORIES) {
    const existing = await prisma.category.findFirst({ where: { userId: demo.id, name: category.name, type: category.type } });
    if (existing) await prisma.category.update({ where: { id: existing.id }, data: { icon: category.icon, color: category.color, archivedAt: null } });
    else await prisma.category.create({ data: { userId: demo.id, name: category.name, type: category.type, icon: category.icon, color: category.color } });
  }
}

main().finally(() => prisma.$disconnect());
