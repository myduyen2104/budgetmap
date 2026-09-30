import { Prisma, PrismaClient } from "@prisma/client";
import argon2 from "argon2";
import { DEFAULT_CATEGORIES, type DefaultCategory } from "../packages/shared/src/categories.js";

const prisma = new PrismaClient();
const username = "budgetmap-demo";
const password = "BudgetMapDemo2026!";
const extras: DefaultCategory[] = [
  { name: "Tiền trọ", type: "EXPENSE", icon: "house", color: "purple" },
  { name: "Cho ba mẹ", type: "EXPENSE", icon: "users", color: "pink" },
  { name: "Gói 4G", type: "EXPENSE", icon: "phone", color: "blue" },
  { name: "Đi chơi", type: "EXPENSE", icon: "plane", color: "violet" },
  { name: "Sửa xe", type: "EXPENSE", icon: "wrench", color: "orange" },
  { name: "Cà phê", type: "EXPENSE", icon: "utensils", color: "amber" },
  { name: "Phạt giao thông", type: "EXPENSE", icon: "car", color: "red" },
];

type Expense = { category: string; total: number; wallet: "bank" | "cash"; day: number; note: string; count?: number; label?: string };
type Month = {
  month: string; income: number; salary: number; freelance?: number; carry: number;
  saving: number; transfer: number; budgets: Record<string, number>; expenses: Expense[];
};

const months: Month[] = [
  {
    month: "2026-07", income: 32_000_000, salary: 32_000_000, carry: 0, saving: 4_000_000, transfer: 6_000_000,
    budgets: {
      "Tiền trọ": 6_000_000, "Cho ba mẹ": 3_000_000, "Gửi xe": 500_000, "Điện nước": 1_800_000,
      Internet: 300_000, "Điện thoại": 100_000, "Gói 4G": 100_000, "Ăn uống": 5_000_000,
      "Đi chơi": 900_000, "Mua sắm": 1_000_000, "Sửa xe": 500_000, "Di chuyển": 600_000,
      "Cà phê": 500_000, "Sức khỏe": 500_000, "Quà tặng": 300_000, Khác: 300_000,
    },
    expenses: [
      { category: "Tiền trọ", total: 6_000_000, wallet: "bank", day: 2, note: "Tiền trọ tháng 7" },
      { category: "Cho ba mẹ", total: 3_000_000, wallet: "bank", day: 3, note: "Gửi ba mẹ tháng 7" },
      { category: "Gửi xe", total: 450_000, wallet: "cash", day: 4, note: "Gửi xe tại chỗ làm tháng 7" },
      { category: "Điện nước", total: 1_650_000, wallet: "bank", day: 6, note: "Điện nước tháng 6" },
      { category: "Internet", total: 300_000, wallet: "bank", day: 8, note: "Cước internet tháng 7" },
      { category: "Điện thoại", total: 100_000, wallet: "bank", day: 10, note: "Nạp điện thoại" },
      { category: "Gói 4G", total: 90_000, wallet: "bank", day: 11, note: "Gói data 4G tháng 7" },
      { category: "Ăn uống", total: 5_100_000, wallet: "cash", day: 2, count: 16, label: "Bữa ăn", note: "Ăn uống" },
      { category: "Đi chơi", total: 650_000, wallet: "cash", day: 16, count: 2, label: "Đi chơi cuối tuần", note: "Đi chơi" },
      { category: "Mua sắm", total: 1_250_000, wallet: "bank", day: 20, note: "Mua đồ dùng cá nhân" },
      { category: "Sửa xe", total: 1_250_000, wallet: "bank", day: 22, note: "Thay lốp và bảo dưỡng xe" },
      { category: "Di chuyển", total: 420_000, wallet: "cash", day: 5, count: 4, label: "Xe công nghệ", note: "Đi lại" },
      { category: "Cà phê", total: 360_000, wallet: "cash", day: 7, count: 4, label: "Cà phê với đồng nghiệp", note: "Cà phê" },
      { category: "Khác", total: 280_000, wallet: "cash", day: 14, count: 2, label: "Đồ lặt vặt", note: "Chi tiêu lặt vặt" },
    ],
  },
  {
    month: "2026-08", income: 33_000_000, salary: 32_000_000, freelance: 2_000_000,
    carry: 11_100_000, saving: 5_000_000, transfer: 7_000_000,
    budgets: {
      "Tiền trọ": 6_000_000, "Cho ba mẹ": 3_000_000, "Gửi xe": 500_000, "Điện nước": 1_800_000,
      Internet: 300_000, "Điện thoại": 100_000, "Gói 4G": 100_000, "Ăn uống": 5_800_000,
      "Đi chơi": 1_200_000, "Mua sắm": 1_200_000, "Sửa xe": 500_000, "Di chuyển": 700_000,
      "Cà phê": 600_000, "Sức khỏe": 500_000, "Quà tặng": 300_000, Khác: 300_000,
    },
    expenses: [
      { category: "Tiền trọ", total: 6_000_000, wallet: "bank", day: 2, note: "Tiền trọ tháng 8" },
      { category: "Cho ba mẹ", total: 3_000_000, wallet: "bank", day: 3, note: "Gửi ba mẹ tháng 8" },
      { category: "Gửi xe", total: 450_000, wallet: "cash", day: 4, note: "Gửi xe tại chỗ làm tháng 8" },
      { category: "Điện nước", total: 1_900_000, wallet: "bank", day: 6, note: "Điện nước tháng 7" },
      { category: "Internet", total: 300_000, wallet: "bank", day: 8, note: "Cước internet tháng 8" },
      { category: "Điện thoại", total: 100_000, wallet: "bank", day: 10, note: "Nạp điện thoại" },
      { category: "Gói 4G", total: 100_000, wallet: "bank", day: 11, note: "Gói data 4G tháng 8" },
      { category: "Ăn uống", total: 6_450_000, wallet: "cash", day: 2, count: 19, label: "Bữa ăn", note: "Ăn uống" },
      { category: "Đi chơi", total: 2_100_000, wallet: "cash", day: 12, count: 3, label: "Đi chơi cuối tuần", note: "Đi chơi" },
      { category: "Di chuyển", total: 780_000, wallet: "cash", day: 5, count: 5, label: "Xe công nghệ", note: "Đi lại" },
      { category: "Cà phê", total: 540_000, wallet: "cash", day: 7, count: 5, label: "Cà phê với đồng nghiệp", note: "Cà phê" },
      { category: "Sức khỏe", total: 680_000, wallet: "bank", day: 18, note: "Khám và mua thuốc" },
      { category: "Quà tặng", total: 1_200_000, wallet: "bank", day: 22, note: "Quà sinh nhật người thân" },
      { category: "Phạt giao thông", total: 250_000, wallet: "cash", day: 24, note: "Phí phạt giao thông phát sinh" },
    ],
  },
  {
    month: "2026-09", income: 32_000_000, salary: 32_000_000, carry: 21_250_000,
    saving: 6_000_000, transfer: 6_000_000,
    budgets: {
      "Tiền trọ": 6_000_000, "Cho ba mẹ": 3_000_000, "Gửi xe": 500_000, "Điện nước": 1_800_000,
      Internet: 300_000, "Điện thoại": 100_000, "Gói 4G": 100_000, "Ăn uống": 4_800_000,
      "Đi chơi": 800_000, "Mua sắm": 1_800_000, "Sửa xe": 500_000, "Di chuyển": 500_000,
      "Cà phê": 500_000, "Sức khỏe": 400_000, "Quà tặng": 400_000, Khác: 300_000,
    },
    expenses: [
      { category: "Tiền trọ", total: 6_000_000, wallet: "bank", day: 2, note: "Tiền trọ tháng 9" },
      { category: "Cho ba mẹ", total: 3_000_000, wallet: "bank", day: 3, note: "Gửi ba mẹ tháng 9" },
      { category: "Gửi xe", total: 450_000, wallet: "cash", day: 4, note: "Gửi xe tại chỗ làm tháng 9" },
      { category: "Điện nước", total: 1_700_000, wallet: "bank", day: 6, note: "Điện nước tháng 8" },
      { category: "Internet", total: 300_000, wallet: "bank", day: 8, note: "Cước internet tháng 9" },
      { category: "Điện thoại", total: 100_000, wallet: "bank", day: 10, note: "Nạp điện thoại" },
      { category: "Gói 4G", total: 90_000, wallet: "bank", day: 11, note: "Gói data 4G tháng 9" },
      { category: "Ăn uống", total: 4_200_000, wallet: "cash", day: 2, count: 14, label: "Bữa ăn", note: "Ăn uống" },
      { category: "Di chuyển", total: 300_000, wallet: "cash", day: 5, count: 3, label: "Xe công nghệ", note: "Đi lại" },
      { category: "Cà phê", total: 240_000, wallet: "cash", day: 7, count: 3, label: "Cà phê với đồng nghiệp", note: "Cà phê" },
      { category: "Mua sắm", total: 2_750_000, wallet: "bank", day: 16, note: "Mua giày và đồ dùng cá nhân" },
      { category: "Sửa xe", total: 720_000, wallet: "bank", day: 19, note: "Thay nhớt và kiểm tra phanh" },
      { category: "Khác", total: 450_000, wallet: "cash", day: 12, count: 2, label: "Đồ lặt vặt", note: "Chi tiêu lặt vặt" },
    ],
  },
];

const dateFor = (month: string, day: number) =>
  new Date(month + "-" + String(day).padStart(2, "0") + "T00:00:00.000Z");

function splitTotal(total: number, count: number): number[] {
  const weights = Array.from({ length: count }, (_, i) => 4 + ((i * 7) % 8));
  const sum = weights.reduce((a, b) => a + b, 0);
  let assigned = 0;
  return weights.map((weight, i) => {
    const amount = i === count - 1 ? total - assigned : Math.floor(total * weight / sum);
    assigned += amount;
    return amount;
  });
}

async function main(): Promise<void> {
  if (process.env.NODE_ENV === "production") throw new Error("Demo seed is disabled in production.");
  const rawUrl = process.env.DATABASE_URL;
  if (!rawUrl) throw new Error("DATABASE_URL is required.");
  const url = new URL(rawUrl);
  if (!["localhost", "127.0.0.1"].includes(url.hostname) || url.port !== "5434" || url.pathname !== "/budgetmap") {
    throw new Error("Demo seed is restricted to localhost:5434/budgetmap.");
  }

  const passwordHash = await argon2.hash(password, { type: argon2.argon2id });
  const user = await prisma.user.upsert({
    where: { username },
    create: { username, displayName: "Minh Anh · Demo", passwordHash },
    update: { displayName: "Minh Anh · Demo", passwordHash },
  });

  // Rebuild this dedicated demo account only; all other users are untouched.
  await prisma.$transaction(async (tx) => {
    await tx.walletTransfer.deleteMany({ where: { userId: user.id } });
    await tx.transaction.deleteMany({ where: { userId: user.id } });
    await tx.monthlyPlan.deleteMany({ where: { userId: user.id } });
    await tx.wallet.deleteMany({ where: { userId: user.id } });
    await tx.category.deleteMany({ where: { userId: user.id } });
  });

  await prisma.category.createMany({
    data: [...DEFAULT_CATEGORIES, ...extras].map((category) => ({ userId: user.id, ...category })),
  });
  const categories = await prisma.category.findMany({
    where: { userId: user.id }, select: { id: true, name: true, type: true },
  });
  const ids = new Map(categories.map((category) => [category.type + ":" + category.name, category.id]));
  const categoryId = (name: string, type: "INCOME" | "EXPENSE"): string => {
    const id = ids.get(type + ":" + name);
    if (!id) throw new Error("Missing category: " + name);
    return id;
  };

  const bank = await prisma.wallet.create({
    data: { userId: user.id, name: "Tài khoản ngân hàng", type: "BANK", initialBalance: "25000000" },
  });
  const cash = await prisma.wallet.create({
    data: { userId: user.id, name: "Tiền mặt", type: "CASH", initialBalance: "5000000" },
  });
  const walletIds = { bank: bank.id, cash: cash.id };
  const transactions: Prisma.TransactionCreateManyInput[] = [];

  for (const month of months) {
    await prisma.monthlyPlan.create({
      data: {
        userId: user.id, year: 2026, month: Number(month.month.slice(5)),
        plannedIncome: String(month.income), carryOver: String(month.carry), plannedSaving: String(month.saving),
        allocations: { create: Object.entries(month.budgets).map(([name, amount]) => ({
          categoryId: categoryId(name, "EXPENSE"), plannedAmount: String(amount),
        })) },
      },
    });
    transactions.push({
      userId: user.id, walletId: walletIds.bank, categoryId: categoryId("Lương", "INCOME"),
      type: "INCOME", amount: String(month.salary), transactionDate: dateFor(month.month, 1),
      note: "Lương tháng " + month.month.slice(5),
    });
    if (month.freelance) transactions.push({
      userId: user.id, walletId: walletIds.bank, categoryId: categoryId("Freelance", "INCOME"),
      type: "INCOME", amount: String(month.freelance), transactionDate: dateFor(month.month, 16),
      note: "Thu nhập dự án ngoài",
    });
    for (const expense of month.expenses) {
      const count = expense.count ?? 1;
      const amounts = count > 1 ? splitTotal(expense.total, count) : [expense.total];
      amounts.forEach((amount, index) => {
        const day = count > 1 ? 2 + Math.floor(index * 24 / (count - 1)) : expense.day;
        const note = expense.label
          ? expense.label + " " + String(index + 1).padStart(2, "0")
          : expense.note;
        transactions.push({
          userId: user.id, walletId: walletIds[expense.wallet],
          categoryId: categoryId(expense.category, "EXPENSE"), type: "EXPENSE",
          amount: String(amount), transactionDate: dateFor(month.month, day), note,
        });
      });
    }
    await prisma.walletTransfer.create({
      data: {
        userId: user.id, sourceWalletId: walletIds.bank, destinationWalletId: walletIds.cash,
        amount: String(month.transfer), transferDate: dateFor(month.month, 5),
        note: "Rút tiền mặt để chi tiêu trong tháng",
      },
    });
  }

  await prisma.transaction.createMany({ data: transactions });
  console.log("Seeded " + username + ": " + transactions.length + " transactions, 3 monthly plans.");
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
}).finally(() => prisma.$disconnect());
