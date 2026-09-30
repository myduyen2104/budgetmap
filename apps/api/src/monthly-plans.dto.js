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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AllocationsDto = exports.AllocationItemDto = exports.PlanDto = void 0;
const class_validator_1 = require("class-validator");
class PlanDto {
    plannedIncome;
    carryOver;
    plannedSaving;
}
exports.PlanDto = PlanDto;
__decorate([
    (0, class_validator_1.Matches)(/^\d+(\.\d{1,2})?$/),
    __metadata("design:type", String)
], PlanDto.prototype, "plannedIncome", void 0);
__decorate([
    (0, class_validator_1.Matches)(/^\d+(\.\d{1,2})?$/),
    __metadata("design:type", String)
], PlanDto.prototype, "carryOver", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.Matches)(/^\d+(\.\d{1,2})?$/),
    __metadata("design:type", String)
], PlanDto.prototype, "plannedSaving", void 0);
class AllocationItemDto {
    categoryId;
    plannedAmount;
}
exports.AllocationItemDto = AllocationItemDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AllocationItemDto.prototype, "categoryId", void 0);
__decorate([
    (0, class_validator_1.Matches)(/^\d+(\.\d{1,2})?$/),
    __metadata("design:type", String)
], AllocationItemDto.prototype, "plannedAmount", void 0);
class AllocationsDto {
    allocations;
}
exports.AllocationsDto = AllocationsDto;
__decorate([
    (0, class_validator_1.IsArray)(),
    __metadata("design:type", Array)
], AllocationsDto.prototype, "allocations", void 0);
