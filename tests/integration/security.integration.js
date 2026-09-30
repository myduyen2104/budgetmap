"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const argon2_1 = __importDefault(require("argon2"));
const prisma_service_js_1 = require("../../apps/api/src/prisma.service.js");
const auth_service_js_1 = require("../../apps/api/src/auth.service.js");
async function main() { const db = new prisma_service_js_1.PrismaService(); await db.$connect(); const auth = new auth_service_js_1.AuthService(db), email = `sec${Date.now()}@test.local`, u = await db.user.create({ data: { email, passwordHash: await argon2_1.default.hash('password123', { type: argon2_1.default.argon2id }) } }); const login = await auth.login(email, 'password123', 'security-test'); strict_1.default.equal((await auth.fromToken(login.token)).id, u.id); await auth.logout(login.token); await strict_1.default.rejects(() => auth.fromToken(login.token)); const expiredLogin = await auth.login(email, 'password123', 'expired-test'); await db.session.updateMany({ where: { userId: u.id }, data: { expiresAt: new Date(Date.now() - 1000) } }); await strict_1.default.rejects(() => auth.fromToken(expiredLogin.token)); for (let i = 0; i < 5; i++)
    await strict_1.default.rejects(() => auth.login(email, 'wrong', 'rate-test')); await strict_1.default.rejects(() => auth.login(email, 'wrong', 'rate-test')); await db.user.delete({ where: { id: u.id } }); await db.$disconnect(); console.log('integration security: PASS'); }
main().catch(async (e) => { console.error(e); process.exitCode = 1; });
