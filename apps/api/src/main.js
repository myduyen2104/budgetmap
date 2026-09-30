"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const app_module_js_1 = require("./app.module.js");
async function bootstrap() { const app = await core_1.NestFactory.create(app_module_js_1.AppModule); app.enableShutdownHooks(); app.setGlobalPrefix('api', { exclude: [{ path: 'health', method: common_1.RequestMethod.GET }] }); app.use((0, cookie_parser_1.default)()); const allowedOrigin = process.env.CORS_ORIGIN ?? process.env.NEXT_PUBLIC_WEB_URL ?? 'http://localhost:3000'; app.enableCors({ origin: allowedOrigin, credentials: true }); app.use((req, res, next) => { res.setHeader('X-Content-Type-Options', 'nosniff'); res.setHeader('X-Frame-Options', 'DENY'); res.setHeader('Referrer-Policy', 'no-referrer'); res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()'); if (process.env.NODE_ENV === 'production' && !['GET', 'HEAD', 'OPTIONS'].includes(req.method) && req.headers.origin !== allowedOrigin)
    throw new common_1.ForbiddenException('FORBIDDEN'); next(); }); app.useGlobalPipes(new common_1.ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true })); await app.listen(Number(process.env.API_PORT ?? 3001)); }
void bootstrap();
