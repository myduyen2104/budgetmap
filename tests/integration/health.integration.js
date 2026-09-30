"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const prisma_service_js_1 = require("../../apps/api/src/prisma.service.js");
const health_service_js_1 = require("../../apps/api/src/health.service.js");
async function run() { const prisma = new prisma_service_js_1.PrismaService(); const health = new health_service_js_1.HealthService(prisma); await prisma.$connect(); strict_1.default.equal(await health.isDatabaseReady(), true); await prisma.$disconnect(); const unavailable = new prisma_service_js_1.PrismaService({ datasources: { db: { url: 'postgresql://invalid:invalid@127.0.0.1:1/missing' } } }); strict_1.default.equal(await new health_service_js_1.HealthService(unavailable).isDatabaseReady(), false); await unavailable.$disconnect(); console.log('integration health: PASS'); }
void run();
