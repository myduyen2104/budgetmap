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
exports.InsightsController = void 0;
const common_1 = require("@nestjs/common");
const auth_service_js_1 = require("./auth.service.js");
const insights_service_js_1 = require("./insights.service.js");
let InsightsController = class InsightsController {
    auth;
    service;
    constructor(auth, service) {
        this.auth = auth;
        this.service = service;
    }
    uid(r) { return this.auth.fromToken(r.cookies?.budgetmap_session); }
    dashboard(r, m) { return this.uid(r).then(u => this.service.dashboard(u.id, m)); }
    monthly(r, m) { return this.uid(r).then(u => this.service.monthly(u.id, m)); }
    comparison(r, m) { return this.uid(r).then(u => this.service.comparison(u.id, m)); }
};
exports.InsightsController = InsightsController;
__decorate([
    (0, common_1.Get)('dashboard'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('month')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], InsightsController.prototype, "dashboard", null);
__decorate([
    (0, common_1.Get)('reports/monthly'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('month')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], InsightsController.prototype, "monthly", null);
__decorate([
    (0, common_1.Get)('reports/monthly-comparison'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('month')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], InsightsController.prototype, "comparison", null);
exports.InsightsController = InsightsController = __decorate([
    (0, common_1.Controller)(),
    __param(0, (0, common_1.Inject)(auth_service_js_1.AuthService)),
    __param(1, (0, common_1.Inject)(insights_service_js_1.InsightsService)),
    __metadata("design:paramtypes", [auth_service_js_1.AuthService, insights_service_js_1.InsightsService])
], InsightsController);
