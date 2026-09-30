"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    const demo = await prisma.user.findUnique({ where: { email: 'demo@budgetmap.local' } });
    if (!demo)
        return;
    for (const [name, type] of [['Salary', client_1.CategoryType.INCOME], ['Food', client_1.CategoryType.EXPENSE], ['Housing', client_1.CategoryType.EXPENSE], ['Transport', client_1.CategoryType.EXPENSE]]) {
        await prisma.category.upsert({ where: { id: `${demo.id}-${type}-${name.toLowerCase()}` }, update: {}, create: { id: `${demo.id}-${type}-${name.toLowerCase()}`, userId: demo.id, name, type } });
    }
}
main().finally(() => prisma.$disconnect());
