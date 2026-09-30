"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.budgetStatus = budgetStatus;
exports.allocationResult = allocationResult;
exports.monthlyBudgetUsage = monthlyBudgetUsage;
exports.validatePlanAllocation = validatePlanAllocation;
exports.plannedAvailableMoney = plannedAvailableMoney;
exports.totalAllocated = totalAllocated;
exports.unallocatedAmount = unallocatedAmount;
exports.walletBalance = walletBalance;
exports.monthlyCashFlow = monthlyCashFlow;
exports.validatePositiveAmount = validatePositiveAmount;
exports.validateMonth = validateMonth;
function percentageToTwoDecimals(value, total) {
    return Number((value * 10000n + total / 2n) / total) / 100;
}
function budgetStatus(planned, actual) {
    if (planned === 0n)
        return actual > 0n ? 'EXCEEDED' : 'SAFE';
    const usage = percentageToTwoDecimals(actual, planned);
    if (usage < 80)
        return 'SAFE';
    if (usage < 100)
        return 'WARNING';
    if (actual === planned)
        return 'AT_LIMIT';
    return 'EXCEEDED';
}
function allocationResult(planned, actual) {
    if (planned < 0n)
        throw new Error('plannedAmount must be non-negative');
    if (actual < 0n)
        throw new Error('actualAmount must be non-negative');
    return {
        plannedAmount: planned,
        actualAmount: actual,
        remainingAmount: planned - actual,
        usagePercentage: planned === 0n ? (actual === 0n ? 0 : null) : percentageToTwoDecimals(actual, planned),
        overspendingAmount: actual > planned ? actual - planned : 0n,
        status: budgetStatus(planned, actual),
    };
}
function monthlyBudgetUsage(actualExpenseCoveredByBudget, totalExpenseAllocated) {
    return totalExpenseAllocated === 0n ? null : Number(actualExpenseCoveredByBudget * 10000n / totalExpenseAllocated) / 100;
}
function validatePlanAllocation(plannedIncome, carryOver, totalAllocated) {
    if (plannedIncome < 0n)
        throw new Error('plannedIncome must be non-negative');
    if (carryOver < 0n)
        throw new Error('carryOver must be non-negative');
    if (totalAllocated < 0n)
        throw new Error('totalAllocated must be non-negative');
    if (totalAllocated > plannedIncome + carryOver)
        throw new Error('totalAllocated cannot exceed plannedAvailableMoney');
}
function plannedAvailableMoney(plannedIncome, carryOver) {
    if (plannedIncome < 0n || carryOver < 0n)
        throw new Error('planning amounts must be non-negative');
    return plannedIncome + carryOver;
}
function totalAllocated(totalExpenseAllocated, plannedSaving) {
    if (totalExpenseAllocated < 0n || plannedSaving < 0n)
        throw new Error('allocated amounts must be non-negative');
    return totalExpenseAllocated + plannedSaving;
}
function unallocatedAmount(plannedIncome, carryOver, totalExpenseAllocated, plannedSaving) {
    return plannedAvailableMoney(plannedIncome, carryOver) - totalAllocated(totalExpenseAllocated, plannedSaving);
}
function walletBalance(initialBalance, income, expense) {
    return initialBalance + income - expense;
}
function monthlyCashFlow(actualIncome, carryOver, actualExpense) {
    return actualIncome + carryOver - actualExpense;
}
function validatePositiveAmount(amount, field = 'amount') {
    if (amount <= 0n)
        throw new Error(`${field} must be greater than zero`);
}
function validateMonth(year, month) {
    if (!Number.isInteger(year) || year < 1)
        throw new Error('year must be a positive integer');
    if (!Number.isInteger(month) || month < 1 || month > 12)
        throw new Error('month must be between 1 and 12');
}
