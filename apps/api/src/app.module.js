"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const auth_controller_js_1 = require("./auth.controller.js");
const auth_service_js_1 = require("./auth.service.js");
const wallets_controller_js_1 = require("./wallets.controller.js");
const wallets_service_js_1 = require("./wallets.service.js");
const categories_controller_js_1 = require("./categories.controller.js");
const categories_service_js_1 = require("./categories.service.js");
const transactions_controller_js_1 = require("./transactions.controller.js");
const transactions_service_js_1 = require("./transactions.service.js");
const monthly_plans_controller_js_1 = require("./monthly-plans.controller.js");
const monthly_plans_service_js_1 = require("./monthly-plans.service.js");
const insights_controller_js_1 = require("./insights.controller.js");
const insights_service_js_1 = require("./insights.service.js");
const health_controller_js_1 = require("./health.controller.js");
const health_service_js_1 = require("./health.service.js");
const prisma_module_js_1 = require("./prisma.module.js");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({ imports: [prisma_module_js_1.PrismaModule], controllers: [health_controller_js_1.HealthController, auth_controller_js_1.AuthController, wallets_controller_js_1.WalletsController, categories_controller_js_1.CategoriesController, transactions_controller_js_1.TransactionsController, monthly_plans_controller_js_1.MonthlyPlansController, insights_controller_js_1.InsightsController], providers: [health_service_js_1.HealthService, auth_service_js_1.AuthService, wallets_service_js_1.WalletsService, categories_service_js_1.CategoriesService, transactions_service_js_1.TransactionsService, monthly_plans_service_js_1.MonthlyPlansService, insights_service_js_1.InsightsService] })
], AppModule);
