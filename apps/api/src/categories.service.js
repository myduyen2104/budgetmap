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
let CategoriesService = class CategoriesService {
    db;
    constructor(db) {
        this.db = db;
    }
    list(userId, includeArchived = false) { return this.db.category.findMany({ where: { userId, ...(includeArchived ? {} : { archivedAt: null }) }, orderBy: [{ type: 'asc' }, { name: 'asc' }] }); }
    create(userId, b) { if (!b.name.trim())
        throw new common_1.ConflictException(); return this.db.category.create({ data: { ...b, name: b.name.trim(), userId } }); }
    async update(userId, id, b) { if (!await this.db.category.findFirst({ where: { id, userId } }))
        throw new common_1.NotFoundException(); return this.db.category.update({ where: { id }, data: b }); }
    async archive(userId, id) { if (!await this.db.category.findFirst({ where: { id, userId } }))
        throw new common_1.NotFoundException(); return this.db.category.update({ where: { id }, data: { archivedAt: new Date() } }); }
};
exports.CategoriesService = CategoriesService;
exports.CategoriesService = CategoriesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(prisma_service_js_1.PrismaService)),
    __metadata("design:paramtypes", [prisma_service_js_1.PrismaService])
], CategoriesService);
