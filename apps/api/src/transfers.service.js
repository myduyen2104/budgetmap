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
exports.TransfersService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_js_1 = require("./prisma.service.js");
const dt = (v) => { const d = new Date(`${v}T00:00:00.000Z`); if (!/^\d{4}-\d{2}-\d{2}$/.test(v) || Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== v)
    throw new common_1.BadRequestException('INVALID_DATE'); return d; };
const amount = (v) => { const d = new client_1.Prisma.Decimal(v); if (!d.gt(0) || d.decimalPlaces() > 2 || d.precision(true) > 19)
    throw new common_1.BadRequestException('INVALID_AMOUNT'); return d; };
let TransfersService = class TransfersService {
    constructor(db) {
        this.db = db;
    }
    async wallets(uid, s, d) { if (s === d)
        throw new common_1.BadRequestException('TRANSFER_SAME_WALLET'); const rows = await this.db.wallet.findMany({ where: { id: { in: [s, d] }, userId: uid, archivedAt: null } }); if (rows.length !== 2)
        throw new common_1.NotFoundException('NOT_FOUND'); }
    out(t) { return { ...t, amount: t.amount.toFixed(2), transferDate: t.transferDate.toISOString().slice(0, 10) }; }
    async list(uid, q) { let from, to; if (q.month) {
        if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(q.month))
            throw new common_1.BadRequestException('INVALID_DATE');
        from = dt(`${q.month}-01`);
        const n = new Date(from);
        n.setUTCMonth(n.getUTCMonth() + 1);
        to = new Date(n.getTime() - 1);
    } const page = Math.max(1, Number(q.page ?? 1) || 1), pageSize = Math.min(100, Math.max(1, Number(q.pageSize ?? 20) || 20)); const where = { userId: uid, deletedAt: null, ...(q.walletId ? { OR: [{ sourceWalletId: q.walletId }, { destinationWalletId: q.walletId }] } : {}), ...((from || to) ? { transferDate: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } } : {}) }; const [items, total] = await Promise.all([this.db.walletTransfer.findMany({ where, include: { sourceWallet: { select: { id: true, name: true } }, destinationWallet: { select: { id: true, name: true } } }, orderBy: { transferDate: 'desc' }, skip: (page - 1) * pageSize, take: pageSize }), this.db.walletTransfer.count({ where })]); return { items: items.map(x => this.out(x)), page, pageSize, total }; }
    async get(uid, id) { const t = await this.db.walletTransfer.findFirst({ where: { id, userId: uid, deletedAt: null }, include: { sourceWallet: { select: { id: true, name: true } }, destinationWallet: { select: { id: true, name: true } } } }); if (!t)
        throw new common_1.NotFoundException('NOT_FOUND'); return this.out(t); }
    async create(uid, b) { await this.wallets(uid, b.sourceWalletId, b.destinationWalletId); const t = await this.db.walletTransfer.create({ data: { userId: uid, sourceWalletId: b.sourceWalletId, destinationWalletId: b.destinationWalletId, amount: amount(b.amount), transferDate: dt(b.transferDate), note: b.note }, include: { sourceWallet: { select: { id: true, name: true } }, destinationWallet: { select: { id: true, name: true } } } }); return this.out(t); }
    async update(uid, id, b) { const old = await this.db.walletTransfer.findFirst({ where: { id, userId: uid, deletedAt: null } }); if (!old)
        throw new common_1.NotFoundException('NOT_FOUND'); const s = b.sourceWalletId ?? old.sourceWalletId, d = b.destinationWalletId ?? old.destinationWalletId; await this.wallets(uid, s, d); const t = await this.db.walletTransfer.update({ where: { id }, data: { ...(b.sourceWalletId ? { sourceWallet: { connect: { id: b.sourceWalletId } } } : {}), ...(b.destinationWalletId ? { destinationWallet: { connect: { id: b.destinationWalletId } } } : {}), ...(b.amount ? { amount: amount(b.amount) } : {}), ...(b.transferDate ? { transferDate: dt(b.transferDate) } : {}), ...(b.note !== undefined ? { note: b.note } : {}) }, include: { sourceWallet: { select: { id: true, name: true } }, destinationWallet: { select: { id: true, name: true } } } }); return this.out(t); }
    async remove(uid, id) { const r = await this.db.walletTransfer.updateMany({ where: { id, userId: uid, deletedAt: null }, data: { deletedAt: new Date() } }); if (!r.count)
        throw new common_1.NotFoundException('NOT_FOUND'); }
};
exports.TransfersService = TransfersService;
exports.TransfersService = TransfersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(prisma_service_js_1.PrismaService)),
    __metadata("design:paramtypes", [prisma_service_js_1.PrismaService])
], TransfersService);
