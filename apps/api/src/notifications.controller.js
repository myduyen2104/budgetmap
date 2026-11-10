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
exports.NotificationsController = void 0;
const common_1 = require("@nestjs/common");
const auth_service_js_1 = require("./auth.service.js");
const notifications_service_js_1 = require("./notifications.service.js");
let NotificationsController = class NotificationsController {
    constructor(auth, service) {
        this.auth = auth;
        this.service = service;
    }
    async uid(req) { return (await this.auth.fromToken(req.cookies?.budgetmap_session)).id; }
    async list(req) { return this.service.list(await this.uid(req)); }
    async updateReminder(req, body) { return this.service.updateReminder(await this.uid(req), body); }
    key() { return { publicKey: process.env.VAPID_PUBLIC_KEY ?? null }; }
    async subscribe(req, body) { return this.service.subscribe(await this.uid(req), body); }
    async testPush(req) { return this.service.sendTestPush(await this.uid(req)); }
    async unsubscribe(req) { return this.service.unsubscribe(await this.uid(req)); }
    async readAll(req) { return this.service.markAllRead(await this.uid(req)); }
    async read(req, id) { return this.service.markRead(await this.uid(req), id); }
    dispatch(authorization) { return this.service.dispatch(authorization); }
};
exports.NotificationsController = NotificationsController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], NotificationsController.prototype, "list", null);
__decorate([
    (0, common_1.Patch)('reminder'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], NotificationsController.prototype, "updateReminder", null);
__decorate([
    (0, common_1.Get)('vapid-public-key'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], NotificationsController.prototype, "key", null);
__decorate([
    (0, common_1.Post)('subscribe'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], NotificationsController.prototype, "subscribe", null);
__decorate([
    (0, common_1.Post)('test'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], NotificationsController.prototype, "testPush", null);
__decorate([
    (0, common_1.Delete)('subscribe'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], NotificationsController.prototype, "unsubscribe", null);
__decorate([
    (0, common_1.Patch)('read-all'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], NotificationsController.prototype, "readAll", null);
__decorate([
    (0, common_1.Patch)(':id/read'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], NotificationsController.prototype, "read", null);
__decorate([
    (0, common_1.Get)('dispatch'),
    __param(0, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], NotificationsController.prototype, "dispatch", null);
exports.NotificationsController = NotificationsController = __decorate([
    (0, common_1.Controller)('notifications'),
    __param(0, (0, common_1.Inject)(auth_service_js_1.AuthService)),
    __param(1, (0, common_1.Inject)(notifications_service_js_1.NotificationsService)),
    __metadata("design:paramtypes", [auth_service_js_1.AuthService, notifications_service_js_1.NotificationsService])
], NotificationsController);
