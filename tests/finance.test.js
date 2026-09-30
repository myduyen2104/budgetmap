"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const finance_js_1 = require("../packages/shared/src/finance.js");
(0, vitest_1.describe)('budget calculations', () => {
    vitest_1.it.each([
        [3000000n, 2000000n, 66.67, 'SAFE'],
        [2000000n, 1000000n, 50, 'SAFE'],
        [1000000n, 2000000n, 200, 'EXCEEDED'],
        [3000000n, 3000000n, 100, 'AT_LIMIT'],
        [3000000n, 3000001n, 100, 'EXCEEDED'],
        [3000000n, 3600000n, 120, 'EXCEEDED'],
    ])('calculates planned=%s actual=%s', (planned, actual, usage, status) => {
        const result = (0, finance_js_1.allocationResult)(planned, actual);
        (0, vitest_1.expect)(result.usagePercentage).toBe(usage);
        (0, vitest_1.expect)(result.status).toBe(status);
    });
    (0, vitest_1.it)('marks exactly 100% at limit and not overspending', () => {
        const result = (0, finance_js_1.allocationResult)(3000000n, 3000000n);
        (0, vitest_1.expect)(result.remainingAmount).toBe(0n);
        (0, vitest_1.expect)(result.overspendingAmount).toBe(0n);
        (0, vitest_1.expect)(result.status).toBe('AT_LIMIT');
    });
    (0, vitest_1.it)('handles zero planned amount without infinity', () => {
        (0, vitest_1.expect)((0, finance_js_1.allocationResult)(0n, 0n).usagePercentage).toBe(0);
        const result = (0, finance_js_1.allocationResult)(0n, 500000n);
        (0, vitest_1.expect)(result.usagePercentage).toBeNull();
        (0, vitest_1.expect)(result.overspendingAmount).toBe(500000n);
        (0, vitest_1.expect)(result.status).toBe('EXCEEDED');
    });
    (0, vitest_1.it)('keeps savings out of actual expense by using separate allocation types', () => {
        (0, vitest_1.expect)((0, finance_js_1.monthlyBudgetUsage)(5000000n, 9000000n)).toBe(55.55);
        (0, vitest_1.expect)((0, finance_js_1.monthlyCashFlow)(12000000n, 0n, 5000000n)).toBe(7000000n);
    });
    (0, vitest_1.it)('validates planned allocation', () => {
        (0, vitest_1.expect)(() => (0, finance_js_1.validatePlanAllocation)(12000000n, 0n, 12000001n)).toThrow();
        (0, vitest_1.expect)(() => (0, finance_js_1.validatePlanAllocation)(12000000n, -1n, 1n)).toThrow();
    });
    (0, vitest_1.it)('keeps planned saving separate while calculating allocation totals', () => {
        (0, vitest_1.expect)((0, finance_js_1.plannedAvailableMoney)(12000000n, 1000000n)).toBe(13000000n);
        (0, vitest_1.expect)((0, finance_js_1.totalAllocated)(8000000n, 3000000n)).toBe(11000000n);
        (0, vitest_1.expect)((0, finance_js_1.unallocatedAmount)(12000000n, 1000000n, 8000000n, 3000000n)).toBe(2000000n);
        (0, vitest_1.expect)((0, finance_js_1.monthlyBudgetUsage)(5000000n, 9000000n)).toBe(55.55);
    });
    (0, vitest_1.it)('supports an unbudgeted category without infinity', () => {
        const result = (0, finance_js_1.allocationResult)(0n, 500000n);
        (0, vitest_1.expect)(result.status).toBe('EXCEEDED');
        (0, vitest_1.expect)(result.usagePercentage).toBeNull();
    });
    (0, vitest_1.it)('calculates wallet balance from initial balance and transactions', () => {
        (0, vitest_1.expect)((0, finance_js_1.walletBalance)(5000000n, 2000000n, 1000000n)).toBe(6000000n);
    });
    (0, vitest_1.it)('validates positive transaction amounts and plan months', () => {
        (0, vitest_1.expect)(() => (0, finance_js_1.validatePositiveAmount)(0n)).toThrow();
        (0, vitest_1.expect)(() => (0, finance_js_1.validatePositiveAmount)(-1n)).toThrow();
        (0, vitest_1.expect)(() => (0, finance_js_1.validateMonth)(2026, 13)).toThrow();
        (0, vitest_1.expect)(() => (0, finance_js_1.validateMonth)(2026, 0)).toThrow();
        (0, vitest_1.expect)(() => (0, finance_js_1.validateMonth)(2026, 8)).not.toThrow();
    });
});
