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
exports.TransactionsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_js_1 = require("./prisma.service.js");
const date = (value) => { const d = new Date(`${value}T00:00:00.000Z`); if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== value)
    throw new common_1.BadRequestException('INVALID_DATE'); return d; };
const money = (value) => { const d = new client_1.Prisma.Decimal(value); if (!d.gt(0) || d.decimalPlaces() > 2 || d.precision(true) > 19)
    throw new common_1.BadRequestException('INVALID_AMOUNT'); return d; };
const output = (t) => ({ ...t, amount: t.amount.toFixed(2), transactionDate: t.transactionDate.toISOString().slice(0, 10) });
let TransactionsService = class TransactionsService {
    db;
    constructor(db) {
        this.db = db;
    }
    async refs(userId, walletId, categoryId, type, active = true) { const [wallet, category] = await Promise.all([this.db.wallet.findFirst({ where: { id: walletId, userId, ...(active ? { archivedAt: null } : {}) } }), this.db.category.findFirst({ where: { id: categoryId, userId, ...(active ? { archivedAt: null } : {}) } })]); if (!wallet)
        throw new common_1.NotFoundException('NOT_FOUND'); if (!category)
        throw new common_1.NotFoundException('NOT_FOUND'); if (category.type !== type)
        throw new common_1.BadRequestException('CATEGORY_TYPE_MISMATCH'); return { wallet, category }; }
    async list(userId, f) { let from = f.fromDate ? date(f.fromDate) : undefined; let to = f.toDate ? date(f.toDate) : undefined; if (f.month) {
        if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(f.month))
            throw new common_1.BadRequestException('INVALID_DATE');
        from = date(`${f.month}-01`);
        const next = new Date(from);
        next.setUTCMonth(next.getUTCMonth() + 1);
        to = new Date(next.getTime() - 1);
    } const page = Math.max(1, Number(f.page ?? 1) || 1); const pageSize = Math.min(100, Math.max(1, Number(f.pageSize ?? 20) || 20)); const where = { userId, deletedAt: null, ...(f.type ? { type: f.type } : {}), ...(f.categoryId ? { categoryId: f.categoryId } : {}), ...(f.walletId ? { walletId: f.walletId } : {}), ...((from || to) ? { transactionDate: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } } : {}) }; const [rows, total] = await Promise.all([this.db.transaction.findMany({ where, include: { wallet: { select: { id: true, name: true } }, category: { select: { id: true, name: true, type: true } }, }, orderBy: [{ transactionDate: f.sort === 'transactionDate:asc' ? 'asc' : 'desc' }, { createdAt: 'desc' }], skip: (page - 1) * pageSize, take: pageSize }), this.db.transaction.count({ where })]); return { items: rows.map(output), page, pageSize, total }; }
    async get(userId, id) { const t = await this.db.transaction.findFirst({ where: { id, userId, deletedAt: null }, include: { wallet: { select: { id: true, name: true } }, category: { select: { id: true, name: true, type: true } } } }); if (!t)
        throw new common_1.NotFoundException('NOT_FOUND'); return output(t); }
    async create(userId, b) { const amount = money(b.amount), transactionDate = date(b.transactionDate), type = b.type; await this.refs(userId, b.walletId, b.categoryId, type); const t = await this.db.transaction.create({ data: { userId, type, amount, walletId: b.walletId, categoryId: b.categoryId, transactionDate, note: b.note }, include: { wallet: { select: { id: true, name: true } }, category: { select: { id: true, name: true, type: true } } } }); return output(t); }
    async update(userId, id, b) { const old = await this.db.transaction.findFirst({ where: { id, userId, deletedAt: null } }); if (!old)
        throw new common_1.NotFoundException('NOT_FOUND'); const type = (b.type ?? old.type); const walletId = b.walletId ?? old.walletId; const categoryId = b.categoryId ?? old.categoryId; if (b.walletId || b.categoryId || b.type)
        await this.refs(userId, walletId, categoryId, type); const data = { ...(b.amount ? { amount: money(b.amount) } : {}), ...(b.type ? { type } : {}), ...(b.walletId ? { wallet: { connect: { id: b.walletId } } } : {}), ...(b.categoryId ? { category: { connect: { id: b.categoryId } } } : {}), ...(b.transactionDate ? { transactionDate: date(b.transactionDate) } : {}), ...(b.note !== undefined ? { note: b.note } : {}) }; const t = await this.db.transaction.update({ where: { id }, data, include: { wallet: { select: { id: true, name: true } }, category: { select: { id: true, name: true, type: true } } } }); return output(t); }
    async remove(userId, id) { const r = await this.db.transaction.updateMany({ where: { id, userId, deletedAt: null }, data: { deletedAt: new Date() } }); if (!r.count)
        throw new common_1.NotFoundException('NOT_FOUND'); }
};
exports.TransactionsService = TransactionsService;
exports.TransactionsService = TransactionsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(prisma_service_js_1.PrismaService)),
    __metadata("design:paramtypes", [prisma_service_js_1.PrismaService])
], TransactionsService);
