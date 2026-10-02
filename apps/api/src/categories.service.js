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
exports.CategoriesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_js_1 = require("./prisma.service.js");
const categories_js_1 = require("../../../packages/shared/src/categories.js");
let CategoriesService = class CategoriesService {
    constructor(db) {
        this.db = db;
    }
    async list(userId, includeArchived = false) { const rows = await this.db.category.findMany({ where: { userId, ...(includeArchived ? {} : { archivedAt: null }) }, orderBy: [{ type: 'asc' }, { name: 'asc' }] }); return rows.map((c) => { const fallback = (0, categories_js_1.defaultCategory)(c.name, c.type); return { ...c, icon: c.icon ?? fallback.icon, color: c.color ?? fallback.color }; }); }
    normalize(b) { const name = b.name.trim(); if (!name)
        throw new common_1.ConflictException('CATEGORY_NAME_REQUIRED'); if (b.icon && !categories_js_1.CATEGORY_ICONS.includes(b.icon))
        throw new common_1.BadRequestException('INVALID_CATEGORY_ICON'); if (b.color && !categories_js_1.CATEGORY_COLORS.includes(b.color))
        throw new common_1.BadRequestException('INVALID_CATEGORY_COLOR'); const fallback = (0, categories_js_1.defaultCategory)(name, b.type); return { name, type: b.type, icon: b.icon ?? fallback.icon, color: b.color ?? fallback.color }; }
    async create(userId, b) { const data = this.normalize(b); const duplicate = await this.db.category.findFirst({ where: { userId, type: data.type, name: { equals: data.name, mode: 'insensitive' }, archivedAt: null } }); if (duplicate)
        throw new common_1.ConflictException('CATEGORY_DUPLICATE'); return this.db.category.create({ data: { ...data, userId } }); }
    async update(userId, id, b) { const old = await this.db.category.findFirst({ where: { id, userId } }); if (!old)
        throw new common_1.NotFoundException(); const data = this.normalize({ name: b.name ?? old.name, type: b.type ?? old.type, icon: b.icon ?? old.icon ?? undefined, color: b.color ?? old.color ?? undefined }); const duplicate = await this.db.category.findFirst({ where: { userId, type: data.type, name: { equals: data.name, mode: 'insensitive' }, archivedAt: null, NOT: { id } } }); if (duplicate)
        throw new common_1.ConflictException('CATEGORY_DUPLICATE'); return this.db.category.update({ where: { id }, data }); }
    async archive(userId, id) { if (!await this.db.category.findFirst({ where: { id, userId } }))
        throw new common_1.NotFoundException(); return this.db.category.update({ where: { id }, data: { archivedAt: new Date() } }); }
};
exports.CategoriesService = CategoriesService;
exports.CategoriesService = CategoriesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(prisma_service_js_1.PrismaService)),
    __metadata("design:paramtypes", [prisma_service_js_1.PrismaService])
], CategoriesService);
