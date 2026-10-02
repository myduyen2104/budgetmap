"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MonthlyPlansService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_js_1 = require("./prisma.service.js");
const finance_js_1 = require("../../../packages/shared/src/finance.js");
const money = (s) => { const d = new client_1.Prisma.Decimal(s); if (d.isNegative() || d.decimalPlaces() > 2 || d.precision(true) > 19)
    throw new common_1.BadRequestException('INVALID_AMOUNT'); return d; };
const cents = (d) => BigInt(d.mul(100).toFixed(0));
const period = (y, m) => { if (!Number.isInteger(y) || y < 1 || !Number.isInteger(m) || m < 1 || m > 12)
    throw new common_1.BadRequestException('INVALID_DATE'); return { from: new Date(Date.UTC(y, m - 1, 1)), to: new Date(Date.UTC(y, m, 1)) }; };
const text = (d) => d.toFixed(2);
let MonthlyPlansService = class MonthlyPlansService {
    constructor(db) {
        this.db = db;
    }
    async get(uid, y, m) { const { from, to } = period(y, m); const plan = await this.db.monthlyPlan.findUnique({ where: { userId_year_month: { userId: uid, year: y, month: m } } }); if (!plan)
        throw new common_1.NotFoundException('NOT_FOUND'); const tx = await this.db.transaction.findMany({ where: { userId: uid, deletedAt: null, transactionDate: { gte: from, lt: to } }, select: { type: true, amount: true, categoryId: true } }); const income = tx.filter(x => x.type === client_1.TransactionType.INCOME).reduce((s, x) => s.plus(x.amount), new client_1.Prisma.Decimal(0)); const expense = tx.filter(x => x.type === client_1.TransactionType.EXPENSE).reduce((s, x) => s.plus(x.amount), new client_1.Prisma.Decimal(0)); const allocations = await this.db.monthlyBudgetAllocation.findMany({ where: { monthlyPlanId: plan.id }, include: { category: { select: { id: true, name: true, type: true } } } }); const cats = await this.db.category.findMany({ where: { userId: uid, type: 'EXPENSE', archivedAt: null }, select: { id: true, name: true, type: true } }); const actual = new Map(); for (const x of tx.filter(x => x.type === client_1.TransactionType.EXPENSE))
        actual.set(x.categoryId, (actual.get(x.categoryId) ?? new client_1.Prisma.Decimal(0)).plus(x.amount)); const ids = new Set(allocations.map(x => x.categoryId)); const budgets = [...allocations.map(x => ({ category: x.category, plannedAmount: x.plannedAmount })), ...cats.filter(x => !ids.has(x.id) && actual.has(x.id)).map(category => ({ category, plannedAmount: new client_1.Prisma.Decimal(0) }))].map(x => { const a = actual.get(x.category.id) ?? new client_1.Prisma.Decimal(0); const r = (0, finance_js_1.allocationResult)(cents(x.plannedAmount), cents(a)); return { category: x.category, plannedAmount: text(x.plannedAmount), actualAmount: text(a), remainingBudget: text(x.plannedAmount.minus(a)), usagePercentage: r.usagePercentage, overspendingAmount: text(x.plannedAmount.lt(a) ? a.minus(x.plannedAmount) : new client_1.Prisma.Decimal(0)), status: r.status }; }); const total = allocations.reduce((s, x) => s.plus(x.plannedAmount), new client_1.Prisma.Decimal(0)); const available = plan.plannedIncome.plus(plan.carryOver); return { ...plan, plannedIncome: text(plan.plannedIncome), carryOver: text(plan.carryOver), plannedSaving: text(plan.plannedSaving), plannedAvailableMoney: text(available), totalExpenseAllocated: text(total), totalAllocated: text(total.plus(plan.plannedSaving)), unallocatedAmount: text(available.minus(total).minus(plan.plannedSaving)), actualIncome: text(income), actualExpense: text(expense), remainingCashFlow: text(income.plus(plan.carryOver).minus(expense)), budgets }; }
    async put(uid, y, m, b) { period(y, m); const plan = await this.db.monthlyPlan.upsert({ where: { userId_year_month: { userId: uid, year: y, month: m } }, create: { userId: uid, year: y, month: m, plannedIncome: money(b.plannedIncome), carryOver: money(b.carryOver), plannedSaving: money(b.plannedSaving ?? '0') }, update: { plannedIncome: money(b.plannedIncome), carryOver: money(b.carryOver), plannedSaving: money(b.plannedSaving ?? '0') } }); return this.get(uid, plan.year, plan.month); }
    async allocations(uid, y, m, b) { period(y, m); const plan = await this.db.monthlyPlan.findUnique({ where: { userId_year_month: { userId: uid, year: y, month: m } } }); if (!plan)
        throw new common_1.NotFoundException('NOT_FOUND'); const vals = b.allocations.map(x => ({ categoryId: x.categoryId, plannedAmount: money(x.plannedAmount) })); if (new Set(vals.map(x => x.categoryId)).size !== vals.length)
        throw new common_1.BadRequestException('VALIDATION_ERROR'); const cats = await this.db.category.findMany({ where: { id: { in: vals.map(x => x.categoryId) }, userId: uid, type: 'EXPENSE', archivedAt: null } }); if (cats.length !== vals.length)
        throw new common_1.NotFoundException('NOT_FOUND'); const total = vals.reduce((s, x) => s.plus(x.plannedAmount), new client_1.Prisma.Decimal(0)).plus(plan.plannedSaving); if (total.gt(plan.plannedIncome.plus(plan.carryOver)))
        throw new common_1.BadRequestException('ALLOCATION_EXCEEDS_AVAILABLE'); await this.db.$transaction(async (tx) => { await tx.monthlyBudgetAllocation.deleteMany({ where: { monthlyPlanId: plan.id } }); if (vals.length)
        await tx.monthlyBudgetAllocation.createMany({ data: vals.map(x => ({ ...x, monthlyPlanId: plan.id })) }); }); return this.get(uid, y, m); }
};
exports.MonthlyPlansService = MonthlyPlansService;
exports.MonthlyPlansService = MonthlyPlansService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(prisma_service_js_1.PrismaService)),
    __metadata("design:paramtypes", [prisma_service_js_1.PrismaService])
], MonthlyPlansService);
