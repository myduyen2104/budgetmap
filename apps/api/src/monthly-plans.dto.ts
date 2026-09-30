import {IsArray,IsOptional,IsString,Matches} from 'class-validator';
export class PlanDto { @Matches(/^\d+(\.\d{1,2})?$/) plannedIncome!:string; @Matches(/^\d+(\.\d{1,2})?$/) carryOver!:string; @IsOptional() @Matches(/^\d+(\.\d{1,2})?$/) plannedSaving?:string; }
export class AllocationItemDto { @IsString() categoryId!:string; @Matches(/^\d+(\.\d{1,2})?$/) plannedAmount!:string; }
export class AllocationsDto { @IsArray() allocations!:AllocationItemDto[]; }
