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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_js_1 = require("./prisma.service.js");
const argon2_1 = __importDefault(require("argon2"));
const node_crypto_1 = require("node:crypto");
class TooManyRequestsException extends common_1.HttpException {
    constructor(message) { super(message, 429); }
}
let AuthService = class AuthService {
    db;
    constructor(db) {
        this.db = db;
    }
    attempts = new Map();
    hash(token) { return (0, node_crypto_1.createHash)('sha256').update(token).digest('hex'); }
    async register(email, password, displayName) { const normalized = email.trim().toLowerCase(); if (password.length < 8 || password.length > 128)
        throw new Error('invalid password'); try {
        const user = await this.db.$transaction(async (tx) => { const created = await tx.user.create({ data: { email: normalized, passwordHash: await argon2_1.default.hash(password, { type: argon2_1.default.argon2id }), displayName } }); await tx.category.createMany({ data: [{ userId: created.id, name: 'Salary', type: 'INCOME' }, { userId: created.id, name: 'Other income', type: 'INCOME' }, { userId: created.id, name: 'Food', type: 'EXPENSE' }, { userId: created.id, name: 'Housing', type: 'EXPENSE' }, { userId: created.id, name: 'Transport', type: 'EXPENSE' }] }); return created; });
        return this.publicUser(user);
    }
    catch {
        throw new common_1.ConflictException('email already exists');
    } }
    async login(email, password, ip = 'unknown') { const now = Date.now(), attempt = this.attempts.get(ip); if (attempt && attempt.until > now && attempt.count >= 5)
        throw new TooManyRequestsException('RATE_LIMITED'); if (attempt && attempt.until <= now)
        this.attempts.delete(ip); const user = await this.db.user.findUnique({ where: { email: email.trim().toLowerCase() } }); if (!user || !(await argon2_1.default.verify(user.passwordHash, password))) {
        const current = this.attempts.get(ip);
        this.attempts.set(ip, { count: (current?.count ?? 0) + 1, until: now + 900000 });
        throw new common_1.UnauthorizedException('invalid credentials');
    } this.attempts.delete(ip); const token = (0, node_crypto_1.randomBytes)(32).toString('base64url'); await this.db.session.create({ data: { userId: user.id, tokenHash: this.hash(token), expiresAt: new Date(Date.now() + 7 * 86400000) } }); return { user: this.publicUser(user), token }; }
    async fromToken(token) { if (!token)
        throw new common_1.UnauthorizedException(); const session = await this.db.session.findUnique({ where: { tokenHash: this.hash(token) }, include: { user: true } }); if (!session || session.expiresAt <= new Date())
        throw new common_1.UnauthorizedException(); await this.db.session.update({ where: { id: session.id }, data: { lastUsedAt: new Date() } }); return session.user; }
    async logout(token) { if (token)
        await this.db.session.deleteMany({ where: { tokenHash: this.hash(token) } }); }
    async updateProfile(id, data) { return this.publicUser(await this.db.user.update({ where: { id }, data })); }
    publicUser(user) { return { id: user.id, email: user.email, displayName: user.displayName, timezone: user.timezone }; }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(prisma_service_js_1.PrismaService)),
    __metadata("design:paramtypes", [prisma_service_js_1.PrismaService])
], AuthService);
