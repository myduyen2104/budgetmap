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
exports.WalletsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_js_1 = require("./prisma.service.js");
let WalletsService = class WalletsService {
    constructor(db) {
        this.db = db;
    }
    async list(userId, includeArchived = false) { const rows = await this.db.wallet.findMany({ where: { userId, ...(includeArchived ? {} : { archivedAt: null }) }, include: { transactions: { where: { deletedAt: null }, select: { type: true, amount: true } }, outgoingTransfers: { where: { deletedAt: null }, select: { amount: true } }, incomingTransfers: { where: { deletedAt: null }, select: { amount: true } } }, orderBy: { name: 'asc' } }); return rows.map(w => { const currentBalance = w.transactions.reduce((b, t) => t.type === 'INCOME' ? b.plus(t.amount) : b.minus(t.amount), new client_1.Prisma.Decimal(w.initialBalance)).minus(w.outgoingTransfers.reduce((b, t) => b.plus(t.amount), new client_1.Prisma.Decimal(0))).plus(w.incomingTransfers.reduce((b, t) => b.plus(t.amount), new client_1.Prisma.Decimal(0))); return { ...w, initialBalance: w.initialBalance.toFixed(2), currentBalance: currentBalance.toFixed(2), totalIncome: w.transactions.filter(t => t.type === 'INCOME').reduce((sum, t) => sum.plus(t.amount), new client_1.Prisma.Decimal(0)).toFixed(2), totalExpense: w.transactions.filter(t => t.type === 'EXPENSE').reduce((sum, t) => sum.plus(t.amount), new client_1.Prisma.Decimal(0)).toFixed(2), incomingTransferAmount: w.incomingTransfers.reduce((sum, t) => sum.plus(t.amount), new client_1.Prisma.Decimal(0)).toFixed(2), outgoingTransferAmount: w.outgoingTransfers.reduce((sum, t) => sum.plus(t.amount), new client_1.Prisma.Decimal(0)).toFixed(2), transactions: undefined, outgoingTransfers: undefined, incomingTransfers: undefined }; }); }
    create(userId, b) { if (!b.name.trim())
        throw new common_1.ConflictException(); return this.db.wallet.create({ data: { userId, name: b.name.trim(), type: b.type, initialBalance: b.initialBalance } }).then(w => ({ ...w, initialBalance: w.initialBalance.toFixed(2) })); }
    async update(userId, id, b) { if (!await this.db.wallet.findFirst({ where: { id, userId } }))
        throw new common_1.NotFoundException(); return this.db.wallet.update({ where: { id }, data: b }); }
    async archive(userId, id) { if (!await this.db.wallet.findFirst({ where: { id, userId } }))
        throw new common_1.NotFoundException(); return this.db.wallet.update({ where: { id }, data: { archivedAt: new Date() } }); }
};
exports.WalletsService = WalletsService;
exports.WalletsService = WalletsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(prisma_service_js_1.PrismaService)),
    __metadata("design:paramtypes", [prisma_service_js_1.PrismaService])
], WalletsService);
