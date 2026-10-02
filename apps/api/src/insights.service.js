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
exports.InsightsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_js_1 = require("./prisma.service.js");
const monthly_plans_service_js_1 = require("./monthly-plans.service.js");
const range = (month) => { if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month))
    throw new common_1.BadRequestException('INVALID_DATE'); const [y, m] = month.split('-').map(Number); return { year: y, month: m, from: new Date(Date.UTC(y, m - 1, 1)), to: new Date(Date.UTC(y, m, 1)) }; };
const zero = () => new client_1.Prisma.Decimal(0);
const s = (d) => d.toFixed(2);
const previous = (y, m) => { const d = new Date(Date.UTC(y, m - 2, 1)); return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1 }; };
let InsightsService = class InsightsService {
    constructor(db, plans) {
        this.db = db;
        this.plans = plans;
    }
    async data(uid, month) { const r = range(month); const tx = await this.db.transaction.findMany({ where: { userId: uid, deletedAt: null, transactionDate: { gte: r.from, lt: r.to } }, include: { wallet: { select: { id: true, name: true } }, category: { select: { id: true, name: true, type: true } } }, orderBy: [{ transactionDate: 'desc' }, { createdAt: 'desc' }] }); const income = tx.filter(x => x.type === client_1.TransactionType.INCOME).reduce((a, x) => a.plus(x.amount), zero()); const expense = tx.filter(x => x.type === client_1.TransactionType.EXPENSE).reduce((a, x) => a.plus(x.amount), zero()); const by = new Map(); tx.filter(x => x.type === client_1.TransactionType.EXPENSE).forEach(x => by.set(x.categoryId, (by.get(x.categoryId) ?? zero()).plus(x.amount))); let plan; try {
        plan = await this.plans.get(uid, r.year, r.month);
    }
    catch (e) {
        if (!(e instanceof common_1.NotFoundException))
            throw e;
    } const wallets = await this.db.wallet.findMany({ where: { userId: uid }, include: { transactions: { where: { deletedAt: null }, select: { type: true, amount: true } } } }); const walletBalances = wallets.map(w => ({ id: w.id, name: w.name, balance: s(w.transactions.reduce((a, x) => x.type === client_1.TransactionType.INCOME ? a.plus(x.amount) : a.minus(x.amount), new client_1.Prisma.Decimal(w.initialBalance))) })); const budgets = plan?.budgets ?? []; const overspending = budgets.filter(b => b.status === 'EXCEEDED' && b.overspendingAmount !== '0.00'); const chart = budgets.map(b => ({ categoryId: b.category.id, category: b.category.name, planned: b.plannedAmount, actual: b.actualAmount })); return { range: r, tx, income, expense, by, plan, walletBalances, budgets, overspending, chart }; }
    async dashboard(uid, month) { const d = await this.data(uid, month); const p = d.plan; return { month, plannedIncome: p?.plannedIncome ?? '0.00', actualIncome: s(d.income), plannedAvailableMoney: p?.plannedAvailableMoney ?? '0.00', actualAvailableMoney: s(d.income.plus(p ? new client_1.Prisma.Decimal(p.carryOver) : zero())), actualExpense: s(d.expense), remainingCashFlow: s(d.income.plus(p ? new client_1.Prisma.Decimal(p.carryOver) : zero()).minus(d.expense)), totalExpenseAllocated: p?.totalExpenseAllocated ?? '0.00', plannedSaving: p?.plannedSaving ?? '0.00', totalAllocated: p?.totalAllocated ?? '0.00', unallocatedAmount: p?.unallocatedAmount ?? '0.00', budgets: d.budgets, overspending: d.overspending, unbudgetedExpenses: d.budgets.filter(b => b.plannedAmount === '0.00' && b.actualAmount !== '0.00'), recentTransactions: d.tx.slice(0, 10).map(t => ({ ...t, amount: s(t.amount), transactionDate: t.transactionDate.toISOString().slice(0, 10) })), chart: d.chart, walletBalances: d.walletBalances }; }
    async monthly(uid, month) { return this.dashboard(uid, month); }
    async comparison(uid, month) { const r = range(month), pr = previous(r.year, r.month), cur = await this.data(uid, month), old = await this.data(uid, `${pr.year}-${String(pr.month).padStart(2, '0')}`); const ids = new Set([...cur.by.keys(), ...old.by.keys()]); const byCategory = [...ids].map(id => { const c = cur.tx.find(x => x.categoryId === id)?.category ?? old.tx.find(x => x.categoryId === id)?.category; const current = cur.by.get(id) ?? zero(), prior = old.by.get(id) ?? zero(); return { categoryId: id, category: c?.name ?? id, currentExpense: s(current), previousExpense: s(prior), isNew: prior.eq(0) && current.gt(0), isNoLongerUsed: current.eq(0) && prior.gt(0) }; }); const diff = cur.expense.minus(old.expense); return { month, previousMonth: `${pr.year}-${String(pr.month).padStart(2, '0')}`, currentExpense: s(cur.expense), previousExpense: s(old.expense), difference: s(diff), differencePercentage: old.expense.eq(0) ? null : Number(diff.times(100).dividedBy(old.expense).toFixed(2)), comparisonStatus: old.expense.eq(0) ? (cur.expense.eq(0) ? 'NO_SPENDING' : 'NEW_SPENDING') : 'COMPARED', byCategory }; }
};
exports.InsightsService = InsightsService;
exports.InsightsService = InsightsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(prisma_service_js_1.PrismaService)),
    __param(1, (0, common_1.Inject)(monthly_plans_service_js_1.MonthlyPlansService)),
    __metadata("design:paramtypes", [prisma_service_js_1.PrismaService, monthly_plans_service_js_1.MonthlyPlansService])
], InsightsService);
