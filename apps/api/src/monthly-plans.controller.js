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
exports.MonthlyPlansController = void 0;
const common_1 = require("@nestjs/common");
const auth_service_js_1 = require("./auth.service.js");
const monthly_plans_dto_js_1 = require("./monthly-plans.dto.js");
const monthly_plans_service_js_1 = require("./monthly-plans.service.js");
let MonthlyPlansController = class MonthlyPlansController {
    constructor(auth, service) {
        this.auth = auth;
        this.service = service;
    }
    uid(r) { return this.auth.fromToken(r.cookies?.budgetmap_session); }
    get(r, y, m) { return this.uid(r).then(u => this.service.get(u.id, Number(y), Number(m))); }
    put(r, y, m, b) { return this.uid(r).then(u => this.service.put(u.id, Number(y), Number(m), b)); }
    alloc(r, y, m, b) { return this.uid(r).then(u => this.service.allocations(u.id, Number(y), Number(m), b)); }
};
exports.MonthlyPlansController = MonthlyPlansController;
__decorate([
    (0, common_1.Get)(':year/:month'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('year')),
    __param(2, (0, common_1.Param)('month')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], MonthlyPlansController.prototype, "get", null);
__decorate([
    (0, common_1.Put)(':year/:month'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('year')),
    __param(2, (0, common_1.Param)('month')),
    __param(3, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, monthly_plans_dto_js_1.PlanDto]),
    __metadata("design:returntype", void 0)
], MonthlyPlansController.prototype, "put", null);
__decorate([
    (0, common_1.Put)(':year/:month/allocations'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('year')),
    __param(2, (0, common_1.Param)('month')),
    __param(3, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, monthly_plans_dto_js_1.AllocationsDto]),
    __metadata("design:returntype", void 0)
], MonthlyPlansController.prototype, "alloc", null);
exports.MonthlyPlansController = MonthlyPlansController = __decorate([
    (0, common_1.Controller)('monthly-plans'),
    __param(0, (0, common_1.Inject)(auth_service_js_1.AuthService)),
    __param(1, (0, common_1.Inject)(monthly_plans_service_js_1.MonthlyPlansService)),
    __metadata("design:paramtypes", [auth_service_js_1.AuthService, monthly_plans_service_js_1.MonthlyPlansService])
], MonthlyPlansController);
