import { describe, expect, it } from 'vitest';
import { allocationResult, monthlyBudgetUsage, monthlyCashFlow, plannedAvailableMoney, totalAllocated, unallocatedAmount, validateMonth, validatePlanAllocation, validatePositiveAmount, walletBalance } from '../packages/shared/src/finance.js';
import { CATEGORY_COLORS, CATEGORY_ICONS, DEFAULT_CATEGORIES } from '../packages/shared/src/categories';

describe('budget calculations', () => {
  it('ships a complete Vietnamese category library with valid visual metadata', () => {
    expect(DEFAULT_CATEGORIES.filter((x) => x.type === 'EXPENSE').length).toBeGreaterThanOrEqual(15);
    expect(DEFAULT_CATEGORIES.filter((x) => x.type === 'INCOME').length).toBeGreaterThanOrEqual(6);
    expect(DEFAULT_CATEGORIES.every((x) => x.name && CATEGORY_ICONS.includes(x.icon) && CATEGORY_COLORS.includes(x.color))).toBe(true);
  });
  it.each([
    [3_000_000n, 2_000_000n, 66.67, 'SAFE'],
    [2_000_000n, 1_000_000n, 50, 'SAFE'],
    [1_000_000n, 2_000_000n, 200, 'EXCEEDED'],
    [3_000_000n, 3_000_000n, 100, 'AT_LIMIT'],
    [3_000_000n, 3_000_001n, 100, 'EXCEEDED'],
    [3_000_000n, 3_600_000n, 120, 'EXCEEDED'],
  ])('calculates planned=%s actual=%s', (planned, actual, usage, status) => {
    const result = allocationResult(planned, actual);
    expect(result.usagePercentage).toBe(usage);
    expect(result.status).toBe(status);
  });

  it('marks exactly 100% at limit and not overspending', () => {
    const result = allocationResult(3_000_000n, 3_000_000n);
    expect(result.remainingAmount).toBe(0n);
    expect(result.overspendingAmount).toBe(0n);
    expect(result.status).toBe('AT_LIMIT');
  });

  it('handles zero planned amount without infinity', () => {
    expect(allocationResult(0n, 0n).usagePercentage).toBe(0);
    const result = allocationResult(0n, 500_000n);
    expect(result.usagePercentage).toBeNull();
    expect(result.overspendingAmount).toBe(500_000n);
    expect(result.status).toBe('EXCEEDED');
  });

  it('keeps savings out of actual expense by using separate allocation types', () => {
    expect(monthlyBudgetUsage(5_000_000n, 9_000_000n)).toBe(55.55);
    expect(monthlyCashFlow(12_000_000n, 0n, 5_000_000n)).toBe(7_000_000n);
  });

  it('validates planned allocation', () => {
    expect(() => validatePlanAllocation(12_000_000n, 0n, 12_000_001n)).toThrow();
    expect(() => validatePlanAllocation(12_000_000n, -1n, 1n)).toThrow();
  });

  it('keeps planned saving separate while calculating allocation totals', () => {
    expect(plannedAvailableMoney(12_000_000n, 1_000_000n)).toBe(13_000_000n);
    expect(totalAllocated(8_000_000n, 3_000_000n)).toBe(11_000_000n);
    expect(unallocatedAmount(12_000_000n, 1_000_000n, 8_000_000n, 3_000_000n)).toBe(2_000_000n);
    expect(monthlyBudgetUsage(5_000_000n, 9_000_000n)).toBe(55.55);
  });

  it('supports an unbudgeted category without infinity', () => {
    const result = allocationResult(0n, 500_000n);
    expect(result.status).toBe('EXCEEDED');
    expect(result.usagePercentage).toBeNull();
  });

  it('calculates wallet balance from initial balance and transactions', () => {
    expect(walletBalance(5_000_000n, 2_000_000n, 1_000_000n)).toBe(6_000_000n);
  });

  it('validates positive transaction amounts and plan months', () => {
    expect(() => validatePositiveAmount(0n)).toThrow();
    expect(() => validatePositiveAmount(-1n)).toThrow();
    expect(() => validateMonth(2026, 13)).toThrow();
    expect(() => validateMonth(2026, 0)).toThrow();
    expect(() => validateMonth(2026, 8)).not.toThrow();
  });
});
