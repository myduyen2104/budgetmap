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
const client_1 = require("@prisma/client");
const prisma_service_js_1 = require("./prisma.service.js");
const argon2_1 = __importDefault(require("argon2"));
const node_crypto_1 = require("node:crypto");
const categories_js_1 = require("../../../packages/shared/src/categories.js");
class TooManyRequestsException extends common_1.HttpException {
    constructor(message) { super(message, 429); }
}
let AuthService = class AuthService {
    constructor(db) {
        this.db = db;
        this.attempts = new Map();
    }
    hash(token) { return (0, node_crypto_1.createHash)('sha256').update(token).digest('hex'); }
    async register(username, password, displayName) { const normalized = username.trim().toLowerCase(); if (password.length < 8 || password.length > 128)
        throw new Error('invalid password'); try {
        const user = await this.db.$transaction(async (tx) => { const created = await tx.user.create({ data: { username: normalized, passwordHash: await argon2_1.default.hash(password, { type: argon2_1.default.argon2id }), displayName } }); await tx.category.createMany({ data: categories_js_1.DEFAULT_CATEGORIES.map((c) => ({ userId: created.id, name: c.name, type: c.type, icon: c.icon, color: c.color })) }); return created; });
        return this.publicUser(user);
    }
    catch (error) {
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === 'P2002')
            throw new common_1.ConflictException('username already exists');
        throw new common_1.InternalServerErrorException('registration failed');
    } }
    async login(username, password, ip = 'unknown') { const now = Date.now(), attempt = this.attempts.get(ip); if (attempt && attempt.until > now && attempt.count >= 5)
        throw new TooManyRequestsException('RATE_LIMITED'); if (attempt && attempt.until <= now)
        this.attempts.delete(ip); const normalized = username.trim().toLowerCase(); const user = await this.db.user.findFirst({ where: { OR: [{ username: normalized }, { email: normalized }] } }); if (!user || !(await argon2_1.default.verify(user.passwordHash, password))) {
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
    async changePassword(id, currentPassword, newPassword) {
        if (currentPassword === newPassword)
            throw new common_1.HttpException('NEW_PASSWORD_MUST_DIFFER', 400);
        const user = await this.db.user.findUnique({ where: { id } });
        if (!user || !(await argon2_1.default.verify(user.passwordHash, currentPassword))) {
            throw new common_1.UnauthorizedException('INVALID_CURRENT_PASSWORD');
        }
        await this.db.user.update({
            where: { id },
            data: { passwordHash: await argon2_1.default.hash(newPassword, { type: argon2_1.default.argon2id }) },
        });
    }
    publicUser(user) { return { id: user.id, username: user.username, email: user.email, displayName: user.displayName }; }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(prisma_service_js_1.PrismaService)),
    __metadata("design:paramtypes", [prisma_service_js_1.PrismaService])
], AuthService);
