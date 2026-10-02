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
exports.WalletsController = void 0;
const common_1 = require("@nestjs/common");
const auth_service_js_1 = require("./auth.service.js");
const wallets_service_js_1 = require("./wallets.service.js");
const dtos_js_1 = require("./dtos.js");
let WalletsController = class WalletsController {
    constructor(auth, service) {
        this.auth = auth;
        this.service = service;
    }
    async uid(r) { return (await this.auth.fromToken(r.cookies?.budgetmap_session)).id; }
    async list(r, a) { return { items: await this.service.list(await this.uid(r), a === 'true') }; }
    async create(r, b) { return this.service.create(await this.uid(r), b); }
    async update(r, id, b) { return this.service.update(await this.uid(r), id, b); }
    async archive(r, id) { return this.service.archive(await this.uid(r), id); }
};
exports.WalletsController = WalletsController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('includeArchived')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], WalletsController.prototype, "list", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, dtos_js_1.WalletDto]),
    __metadata("design:returntype", Promise)
], WalletsController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, dtos_js_1.WalletUpdateDto]),
    __metadata("design:returntype", Promise)
], WalletsController.prototype, "update", null);
__decorate([
    (0, common_1.Post)(':id/archive'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], WalletsController.prototype, "archive", null);
exports.WalletsController = WalletsController = __decorate([
    (0, common_1.Controller)('wallets'),
    __param(0, (0, common_1.Inject)(auth_service_js_1.AuthService)),
    __param(1, (0, common_1.Inject)(wallets_service_js_1.WalletsService)),
    __metadata("design:paramtypes", [auth_service_js_1.AuthService, wallets_service_js_1.WalletsService])
], WalletsController);
