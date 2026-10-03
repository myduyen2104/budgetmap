"use client";
import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { ExpenseBudgetChart } from "../../components/expense-budget-chart";
import { CategoryBadge } from "../../components/category";
import { MonthPicker } from "../../components/month-picker";
import { GettingStarted } from "../../components/getting-started";
import { EmptyState, ErrorState, LoadingSkeleton } from "../../components/ui";
import { currentMonth, formatDate } from "../../lib/movements";

type Category = { name: string; icon?: string | null; color?: string | null };
type Row = { categoryId: string; category: string; planned: string; actual: string; status?: string; icon?: string | null; color?: string | null };
type D = { plannedIncome: string; actualIncome: string; actualExpense: string; remainingCashFlow: string; plannedSaving: string; overspending: { category: Category; overspendingAmount: string }[]; unbudgetedExpenses: { category: Category; actualAmount: string }[]; recentTransactions: { id: string; transactionDate: string; amount: string; type: string; category: Category }[]; chart: Row[]; walletBalances: { id: string; name: string; balance: string }[] };
const money = (v: string) => { const [n, d] = v.split("."); return n.replace(/\B(?=(\d{3})+(?!\d))/g, ".") + (d && d !== "00" ? "," + d : "") + "đ"; };
const sumMoney = (values: string[]) => { const cents = values.reduce((t, value) => { const [whole, fraction = ""] = value.replace(/^-/, "").split("."); const amount = BigInt(whole || "0") * 100n + BigInt((fraction + "00").slice(0, 2)); return t + (value.startsWith("-") ? -amount : amount); }, 0n); const absolute = cents < 0n ? -cents : cents; return `${cents < 0n ? "-" : ""}${absolute / 100n}.${(absolute % 100n).toString().padStart(2, "0")}`; };
const percent = (actual: string, planned: string) => { const toCents = (v: string) => { const [w, f = ""] = v.replace(/^-/, "").split("."); return BigInt(w || "0") * 100n + BigInt((f + "00").slice(0, 2)); }; const p = toCents(planned); return p === 0n ? 0 : Number((toCents(actual) * 10000n) / p) / 100; };
const monthLabel = (value: string) => { const [year, month] = value.split("-"); return `${month}/${year}`; };

export default function Dashboard() {
  const [month, setMonth] = useState(currentMonth), [data, setData] = useState<D | null>(null), [error, setError] = useState(""), [loading, setLoading] = useState(true);
  const load = () => { setLoading(true); api<D>(`/dashboard?month=${month}`).then(setData).catch(() => setError("Không thể tải dashboard.")).finally(() => setLoading(false)); };
  useEffect(load, [month]);
  if (loading) return <main><LoadingSkeleton label="Đang tải dashboard…" /></main>;
  if (error || !data) return <main><ErrorState message={error || "Không có dữ liệu."} onRetry={load} /></main>;
  return <main>
    <div className="planner-welcome"><div><h1>Xin chào! <span aria-hidden="true">👋</span></h1><p className="muted">Cùng nhìn lại kế hoạch tháng này nhé.</p></div><div className="planner-month"><MonthPicker value={month} onChange={setMonth} /></div></div>
    <GettingStarted month={month} hasWallet={data.walletBalances.length > 0} hasPlan={data.chart.length > 0} hasTransactions={data.recentTransactions.length > 0} />
    <section className="planner-budget-card card"><div><p className="eyebrow">TỔNG TÀI SẢN HIỆN TẠI</p><strong>{money(sumMoney(data.walletBalances.map((x) => x.balance)))}</strong><p className="planner-period">Số liệu thu chi tháng {monthLabel(month)}</p><div className="planner-metrics"><span>Thu nhập tháng<strong>{money(data.actualIncome)}</strong></span><span>Đã chi tháng<strong>{money(data.actualExpense)}</strong></span><span>Dòng tiền tháng<strong>{money(data.remainingCashFlow)}</strong></span></div></div><div className="planner-progress"><span style={{ width: `${Math.min(100, percent(data.actualExpense, data.plannedIncome))}%` }} /></div><small>Chi tiêu so với thu nhập tháng {monthLabel(month)}</small></section>
    <section className="card wallet-overview"><div className="section-heading"><div><h2>Ví tiền</h2><p className="muted">Số dư hiện tại ở từng nơi</p></div><a href="/wallets">Quản lý ví</a></div><div className="wallet-overview-grid">{data.walletBalances.map((x) => <div key={x.id}><span>{x.name}</span><strong>{money(x.balance)}</strong></div>)}</div></section>
    <section className="card planner-recent"><div className="section-heading"><div><h2>Giao dịch gần đây</h2><p className="muted">Những khoản mới nhất</p></div><a href="/transactions">Xem tất cả</a></div>{data.recentTransactions.length === 0 ? <EmptyState title="Chưa có giao dịch" description="Ghi nhận khoản thu hoặc chi đầu tiên." action={<a href="/transactions">Thêm giao dịch</a>} /> : data.recentTransactions.slice(0, 6).map((x) => <div className="planner-transaction" key={x.id}><CategoryBadge category={x.category} compact /><small>{formatDate(x.transactionDate)}</small><b className={x.type === "INCOME" ? "income" : "expense"}>{x.type === "INCOME" ? "+" : "-"}{money(x.amount)}</b></div>)}</section>
    <div className="planner-actions"><a href="/transactions?type=EXPENSE">＋ Thêm khoản chi</a><a href={`/plans/${month.split("-")[0]}/${month.split("-")[1]}`}>＋ Mở kế hoạch tháng</a></div>
    <section className="planner-chart"><ExpenseBudgetChart data={data.chart} /></section>
    <div className="planner-alerts"><section className="card"><h2>Vượt ngân sách</h2>{data.overspending.length === 0 ? <p className="muted">Chưa có danh mục vượt ngân sách.</p> : data.overspending.map((x) => <p key={x.category.name}><CategoryBadge category={x.category} compact /> · vượt {money(x.overspendingAmount)}</p>)}</section><section className="card"><h2>Chi chưa lập ngân sách</h2>{data.unbudgetedExpenses.length === 0 ? <p className="muted">Tất cả khoản chi đã có ngân sách.</p> : data.unbudgetedExpenses.map((x) => <p key={x.category.name}><CategoryBadge category={x.category} compact /> · {money(x.actualAmount)}</p>)}</section></div>
  </main>;
}
