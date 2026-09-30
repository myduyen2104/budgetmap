export type BudgetStatus = 'SAFE' | 'WARNING' | 'AT_LIMIT' | 'EXCEEDED';
export type AllocationResult = {
  plannedAmount: bigint; actualAmount: bigint; remainingAmount: bigint;
  usagePercentage: number | null; overspendingAmount: bigint; status: BudgetStatus;
};

function percentageToTwoDecimals(value: bigint, total: bigint): number {
  return Number((value * 10000n + total / 2n) / total) / 100;
}

export function budgetStatus(planned: bigint, actual: bigint): BudgetStatus {
  if (planned === 0n) return actual > 0n ? 'EXCEEDED' : 'SAFE';
  const usage = percentageToTwoDecimals(actual, planned);
  if (usage < 80) return 'SAFE';
  if (usage < 100) return 'WARNING';
  if (actual === planned) return 'AT_LIMIT';
  return 'EXCEEDED';
}

export function allocationResult(planned: bigint, actual: bigint): AllocationResult {
  if (planned < 0n) throw new Error('plannedAmount must be non-negative');
  if (actual < 0n) throw new Error('actualAmount must be non-negative');
  return {
    plannedAmount: planned,
    actualAmount: actual,
    remainingAmount: planned - actual,
    usagePercentage: planned === 0n ? (actual === 0n ? 0 : null) : percentageToTwoDecimals(actual, planned),
    overspendingAmount: actual > planned ? actual - planned : 0n,
    status: budgetStatus(planned, actual),
  };
}

export function monthlyBudgetUsage(actualExpenseCoveredByBudget: bigint, totalExpenseAllocated: bigint): number | null {
  return totalExpenseAllocated === 0n ? null : Number(actualExpenseCoveredByBudget * 10000n / totalExpenseAllocated) / 100;
}

export function validatePlanAllocation(plannedIncome: bigint, carryOver: bigint, totalAllocated: bigint): void {
  if (plannedIncome < 0n) throw new Error('plannedIncome must be non-negative');
  if (carryOver < 0n) throw new Error('carryOver must be non-negative');
  if (totalAllocated < 0n) throw new Error('totalAllocated must be non-negative');
  if (totalAllocated > plannedIncome + carryOver) throw new Error('totalAllocated cannot exceed plannedAvailableMoney');
}

export function plannedAvailableMoney(plannedIncome: bigint, carryOver: bigint): bigint {
  if (plannedIncome < 0n || carryOver < 0n) throw new Error('planning amounts must be non-negative');
  return plannedIncome + carryOver;
}

export function totalAllocated(totalExpenseAllocated: bigint, plannedSaving: bigint): bigint {
  if (totalExpenseAllocated < 0n || plannedSaving < 0n) throw new Error('allocated amounts must be non-negative');
  return totalExpenseAllocated + plannedSaving;
}

export function unallocatedAmount(plannedIncome: bigint, carryOver: bigint, totalExpenseAllocated: bigint, plannedSaving: bigint): bigint {
  return plannedAvailableMoney(plannedIncome, carryOver) - totalAllocated(totalExpenseAllocated, plannedSaving);
}

export function walletBalance(initialBalance: bigint, income: bigint, expense: bigint): bigint {
  return initialBalance + income - expense;
}

export function monthlyCashFlow(actualIncome: bigint, carryOver: bigint, actualExpense: bigint): bigint {
  return actualIncome + carryOver - actualExpense;
}

export function validatePositiveAmount(amount: bigint, field = 'amount'): void {
  if (amount <= 0n) throw new Error(`${field} must be greater than zero`);
}

export function validateMonth(year: number, month: number): void {
  if (!Number.isInteger(year) || year < 1) throw new Error('year must be a positive integer');
  if (!Number.isInteger(month) || month < 1 || month > 12) throw new Error('month must be between 1 and 12');
}
