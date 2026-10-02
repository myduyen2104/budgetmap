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
exports.TransfersController = void 0;
const common_1 = require("@nestjs/common");
const auth_service_js_1 = require("./auth.service.js");
const transfers_service_js_1 = require("./transfers.service.js");
const transfers_dto_js_1 = require("./transfers.dto.js");
let TransfersController = class TransfersController {
    constructor(auth, service) {
        this.auth = auth;
        this.service = service;
    }
    uid(r) { return this.auth.fromToken(r.cookies?.budgetmap_session).then(x => x.id); }
    list(r, q) { return this.uid(r).then(id => this.service.list(id, q)); }
    get(r, id) { return this.uid(r).then(uid => this.service.get(uid, id)); }
    create(r, b) { return this.uid(r).then(uid => this.service.create(uid, b)); }
    update(r, id, b) { return this.uid(r).then(uid => this.service.update(uid, id, b)); }
    remove(r, id) { return this.uid(r).then(uid => this.service.remove(uid, id)); }
};
exports.TransfersController = TransfersController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], TransfersController.prototype, "list", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], TransfersController.prototype, "get", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, transfers_dto_js_1.TransferCreateDto]),
    __metadata("design:returntype", void 0)
], TransfersController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, transfers_dto_js_1.TransferUpdateDto]),
    __metadata("design:returntype", void 0)
], TransfersController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.HttpCode)(204),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], TransfersController.prototype, "remove", null);
exports.TransfersController = TransfersController = __decorate([
    (0, common_1.Controller)('transfers'),
    __param(0, (0, common_1.Inject)(auth_service_js_1.AuthService)),
    __param(1, (0, common_1.Inject)(transfers_service_js_1.TransfersService)),
    __metadata("design:paramtypes", [auth_service_js_1.AuthService, transfers_service_js_1.TransfersService])
], TransfersController);
