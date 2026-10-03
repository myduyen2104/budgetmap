"use client";
import { Fragment, use, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "../../../../lib/api";
import { CategoryBadge, CategoryPicker } from "../../../../components/category";
import { MonthPicker } from "../../../../components/month-picker";
type Budget = {
  category: { id: string; name: string; icon?: string | null; color?: string | null };
  plannedAmount: string;
  actualAmount: string;
  remainingBudget: string;
  usagePercentage: number | null;
  status: string;
};
type Category = { id: string; name: string; type: "INCOME" | "EXPENSE"; groupId?: string | null; icon?: string | null; color?: string | null };
type CategoryGroupDefinition = {
  id: string;
  name: string;
  description: string;
  names: string[];
};

const CATEGORY_GROUPS: CategoryGroupDefinition[] = [
  { id: "housing", name: "Nhà cửa & tiện ích", description: "Các khoản cố định cho nơi ở và dịch vụ hằng tháng.", names: ["Nhà cửa", "Tiền trọ", "Điện nước", "Internet", "Điện thoại", "Gói 4G", "Gia dụng"] },
  { id: "food", name: "Ăn uống", description: "Ăn uống hằng ngày và các khoản cà phê.", names: ["Ăn uống", "Cà phê"] },
  { id: "transport", name: "Di chuyển", description: "Đi lại, gửi xe và bảo dưỡng phương tiện.", names: ["Di chuyển", "Gửi xe", "Taxi / xe công nghệ", "Sửa xe", "Phạt giao thông"] },
  { id: "family", name: "Gia đình & quà tặng", description: "Các khoản dành cho gia đình và người thân.", names: ["Gia đình", "Cho ba mẹ", "Quà tặng", "Em bé"] },
  { id: "pets", name: "Thú cưng", description: "Chi phí chăm sóc và nuôi thú cưng.", names: ["Thú cưng"] },
  { id: "shopping", name: "Mua sắm & cá nhân", description: "Đồ dùng, quần áo và nhu cầu cá nhân.", names: ["Mua sắm", "Quần áo"] },
  { id: "work-study", name: "Công việc & học tập", description: "Thiết bị, công cụ và chi phí học tập.", names: ["Công nghệ / Thiết bị", "Giáo dục"] },
  { id: "digital", name: "AI & dịch vụ số", description: "Công cụ AI, phần mềm và các dịch vụ trực tuyến.", names: ["AI & công cụ số", "Phần mềm & dịch vụ số", "Lưu trữ đám mây"] },
  { id: "health", name: "Sức khỏe & bảo vệ", description: "Chăm sóc sức khỏe và các khoản bảo hiểm.", names: ["Sức khỏe", "Bảo hiểm", "Bác sĩ & nha khoa", "Thuốc"] },
  { id: "sports", name: "Thể thao", description: "Tập luyện, vận động và các hoạt động thể chất.", names: ["Gym & thể thao", "Bơi lội", "Chạy bộ", "Đạp xe", "Thể thao khác"] },
  { id: "personal-care", name: "Chăm sóc cá nhân", description: "Spa, massage và các dịch vụ làm đẹp.", names: ["Spa & massage", "Chăm sóc cá nhân"] },
  { id: "fun", name: "Giải trí & trải nghiệm", description: "Đi chơi, du lịch và dịch vụ định kỳ.", names: ["Giải trí", "Du lịch", "Đi chơi", "Subscription"] },
  { id: "finance", name: "Tài chính", description: "Khoản trả nợ, phí và đầu tư.", names: ["Trả nợ", "Phí ngân hàng", "Đầu tư"] },
  { id: "other", name: "Khác", description: "Các khoản chưa thuộc nhóm nào.", names: ["Khác"] },
];

const DEFAULT_PLAN_CATEGORY_NAMES = ["Nhà cửa", "Tiền trọ", "Ăn uống", "Điện nước", "Internet", "Điện thoại", "Gửi xe"];

type Plan = {
  plannedIncome: string;
  carryOver: string;
  plannedSaving: string;
  plannedAvailableMoney: string;
  totalExpenseAllocated: string;
  totalAllocated: string;
  unallocatedAmount: string;
  actualIncome: string;
  actualExpense: string;
  remainingCashFlow: string;
  budgets: Budget[];
};
const fmt = (v: string) => {
  const [w, d] = v.split(".");
  return (
    w.replace(/\B(?=(\d{3})+(?!\d))/g, ".") +
    (d && d !== "00" ? "," + d : "") +
    "đ"
  );
};
const inputAmount = (v: string) => {
  const digits = v.replace(/\D/g, "").replace(/^0+(?=\d)/, "");
  return digits ? `${digits}.00` : "";
};
const inputLabel = (v: string) => {
  const digits = v.split(".")[0].replace(/\D/g, "");
  return digits ? digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".") : "";
};
const statusLabel = (status: string) => ({
  SAFE: "Trong ngân sách",
  WARNING: "Gần giới hạn",
  AT_LIMIT: "Đã chạm ngân sách",
  EXCEEDED: "Vượt ngân sách",
}[status] ?? status);
const month = (y: number, m: number) => {
  const d = new Date(y, m - 1, 1);
  return {
    year: d.getFullYear(),
    month: String(d.getMonth() + 1).padStart(2, "0"),
  };
};
export default function PlanPage({
  params,
}: {
  params: Promise<{ year: string; month: string }>;
}) {
  const r = use(params),
    router = useRouter(),
    [plan, setPlan] = useState<Plan | null>(null),
    [cats, setCats] = useState<Category[]>([]),
    [income, setIncome] = useState("0"),
    [carry, setCarry] = useState("0"),
    [saving, setSaving] = useState("0"),
    [draft, setDraft] = useState<Record<string, string>>({}),
    [initial, setInitial] = useState<Record<string, string>>({}),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [missing, setMissing] = useState(false),
    [toast, setToast] = useState(""),

    [showCategoryPicker, setShowCategoryPicker] = useState(false),
    [showCustomCategory, setShowCustomCategory] = useState(false),
    [newCategoryName, setNewCategoryName] = useState(""),
    [newCategoryGroup, setNewCategoryGroup] = useState("other"),
    [newCategoryIcon, setNewCategoryIcon] = useState("tag"),
    [newCategoryColor, setNewCategoryColor] = useState("slate"),
    [categoryError, setCategoryError] = useState("");
  const load = () => {
    setLoading(true);
    Promise.all([
      api<Plan>(`/monthly-plans/${r.year}/${r.month}`),
      api<{ items: Category[] }>("/categories"),
    ])
      .then(([p, c]) => {
        const blank =
          p.budgets.length === 0 &&
          [p.plannedIncome, p.carryOver, p.plannedSaving, p.actualIncome, p.actualExpense]
            .every((value) => Number(value) === 0);
        setPlan(blank ? null : p);
        setMissing(blank);
        setIncome(p.plannedIncome);
        setCarry(p.carryOver);
        setSaving(p.plannedSaving);
        const expenseCats = c.items.filter((x) => x.type === "EXPENSE");
        const d = Object.fromEntries(p.budgets.map((b) => [b.category.id, b.plannedAmount]));
        const nextDraft = blank
          ? Object.fromEntries(expenseCats.filter((x) => DEFAULT_PLAN_CATEGORY_NAMES.includes(x.name)).map((x) => [x.id, "0.00"]))
          : d;
        setDraft(nextDraft);
        setInitial(nextDraft);
        setCats(expenseCats);
      })
      .catch(() => {
        setPlan(null);
        setMissing(true);
        api<{ items: Category[] }>("/categories")
          .then((c) => { const expenseCats = c.items.filter((x) => x.type === "EXPENSE"); setCats(expenseCats); const defaults = Object.fromEntries(expenseCats.filter((x) => DEFAULT_PLAN_CATEGORY_NAMES.includes(x.name)).map((x) => [x.id, "0.00"])); setDraft(defaults); setInitial(defaults); })
          .catch(() => setError("Không thể tải danh mục."));
      })
      .finally(() => setLoading(false));
  };
  useEffect(load, [r.year, r.month]);
  const available = useMemo(() => {
    try {
      return (
        BigInt(income.split(".")[0] || "0") + BigInt(carry.split(".")[0] || "0")
      );
    } catch {
      return 0n;
    }
  }, [income, carry]);
  const allocated = useMemo(
    () =>
      Object.values(draft).reduce((s, v) => {
        try {
          return s + BigInt(v.split(".")[0] || "0");
        } catch {
          return s;
        }
      }, 0n),
    [draft],
  );
  const over = allocated + BigInt(saving.split(".")[0] || "0") > available;
  const hasAmount = (value?: string) => value !== undefined && Number(value) !== 0;
  const visibleCats = cats.filter((c) => {
    const budget = plan?.budgets.find((x) => x.category.id === c.id);
    return draft[c.id] !== undefined || Boolean(budget) || hasAmount(budget?.actualAmount);
  });
  const categoryGroups = useMemo(() => {
    const assigned = new Set<string>();
    const groups = CATEGORY_GROUPS.map((group) => {
      const categories = visibleCats.filter((category) => {
        const matched = category.groupId === group.id || (!category.groupId && group.names.includes(category.name));
        if (matched) assigned.add(category.id);
        return matched;
      }).sort((a, b) => group.names.indexOf(a.name) - group.names.indexOf(b.name));
      return { ...group, categories };
    }).filter((group) => group.categories.length > 0);
    const uncategorized = visibleCats.filter((category) => !assigned.has(category.id));
    if (uncategorized.length > 0) {
      const fallback = groups.find((group) => group.id === "other");
      if (fallback) fallback.categories.push(...uncategorized);
      else groups.push({ id: "uncategorized", name: "Khác", description: "Các khoản chưa thuộc nhóm nào.", names: [], categories: uncategorized });
    }
    return groups;
  }, [visibleCats]);

  const availableCats = cats.filter((category) => !visibleCats.some((selected) => selected.id === category.id));

  const removeCategory = (category: Category) => {
    if (window.confirm("Bỏ " + category.name + " khỏi kế hoạch tháng này? Các giao dịch thực tế vẫn được giữ nguyên.")) {
      const next = { ...draft };
      delete next[category.id];
      setDraft(next);
    }
  };

  const addCategory = (categoryId: string) => {
    setDraft({ ...draft, [categoryId]: "0.00" });
    setShowCategoryPicker(false);
    setShowCustomCategory(false);
  };
  const createCustomCategory = async () => {
    const name = newCategoryName.trim();
    if (!name) { setCategoryError("Nhập tên danh mục trước khi tạo."); return; }
    try {
      const created = await api<Category>("/categories", { method: "POST", body: JSON.stringify({ name, type: "EXPENSE", groupId: newCategoryGroup, icon: newCategoryIcon, color: newCategoryColor }) });
      setCats([...cats, created]);
      setDraft({ ...draft, [created.id]: "0.00" });
      setInitial({ ...initial, [created.id]: "0.00" });
      setNewCategoryName("");
      setNewCategoryGroup("other");
      setCategoryError("");
      setShowCategoryPicker(false);
      setShowCustomCategory(false);
    } catch (e) {
      setCategoryError(e instanceof Error && e.message === "CATEGORY_DUPLICATE" ? "Danh mục này đã tồn tại." : "Không thể tạo danh mục.");
    }
  };

  const save = async () => {
    setError("");
    if (over) {
      const message = "Tổng ngân sách và tiết kiệm vượt số tiền khả dụng.";
      setError(message);
      setToast("Chưa lưu: " + message);
      return;
    }
    try {
      await api(`/monthly-plans/${r.year}/${r.month}`, {
        method: "PUT",
        body: JSON.stringify({
          plannedIncome: income || "0.00",
          carryOver: carry || "0.00",
          plannedSaving: saving || "0.00",
        }),
      });
      await api(`/monthly-plans/${r.year}/${r.month}/allocations`, {
        method: "PUT",
        body: JSON.stringify({
          allocations: Object.entries(draft)
            .filter(([, v]) => v !== "")
            .map(([categoryId, plannedAmount]) => ({
              categoryId,
              plannedAmount,
            })),
        }),
      });
      setToast("Đã lưu kế hoạch tháng " + r.month + "/" + r.year + ".");
      load();
    } catch (e) {
      const message = e instanceof Error ? e.message : "Không thể lưu kế hoạch.";
      setError(message);
      setToast("Lưu kế hoạch không thành công.");
    }
  };
  const cancel = () => {
    setDraft(initial);
    if (plan) {
      setIncome(plan.plannedIncome);
      setCarry(plan.carryOver);
      setSaving(plan.plannedSaving);
    }
    setError("");
    setToast("Đã hủy các thay đổi chưa lưu.");
  };
  if (loading)
    return (
      <main>
        <p aria-live="polite">Đang tải kế hoạch…</p>
      </main>
    );
  return (
    <main>
      <div className="plan-page-header">
        <div className="plan-intro"><h1>
          Kế hoạch tháng {r.month}/{r.year}
        </h1><p className="muted">Đặt dự định trước, rồi quay lại xem thực tế đang đi gần hay xa kế hoạch.</p></div>
        <div className="planner-month plan-month-picker">
          <MonthPicker
            value={`${r.year}-${r.month}`}
            onChange={(value) => {
              const [year, selectedMonth] = value.split("-");
              router.push(`/plans/${year}/${selectedMonth}`);
            }}
          />
        </div>
      </div>
      {error && <p role="alert">{error}</p>}
      {toast && <p role="status" className="feedback-toast">{toast}</p>}
      {missing && !plan ? (
        <>
          <p>Tháng này chưa có kế hoạch. Hãy tạo kế hoạch trước, sau đó nhập thu nhập dự kiến và ngân sách cho từng danh mục.</p>
          <button
            onClick={() => {
              setMissing(false);
              setPlan({
                plannedIncome: "0.00",
                carryOver: "0.00",
                plannedSaving: "0.00",
                plannedAvailableMoney: "0.00",
                totalExpenseAllocated: "0.00",
                totalAllocated: "0.00",
                unallocatedAmount: "0.00",
                actualIncome: "0.00",
                actualExpense: "0.00",
                remainingCashFlow: "0.00",
                budgets: [],
              });
            }}
          >
            Tạo kế hoạch tháng này
          </button>
        </>
      ) : (
        <>
          <section className="plan-inputs card">
            <label>
              Thu nhập dự kiến
              <small>Tổng thu nhập trong tháng</small>
              <input inputMode="numeric" value={inputLabel(income)} onChange={(e) => setIncome(inputAmount(e.target.value))} />
            </label>
            <label>
              Số dư chuyển tháng trước
              <small>Khoản còn lại có thể sử dụng</small>
              <input inputMode="numeric" value={inputLabel(carry)} onChange={(e) => setCarry(inputAmount(e.target.value))} />
            </label>
            <label>
              Mục tiêu tiết kiệm
              <small>Số tiền muốn giữ lại</small>
              <input inputMode="numeric" value={inputLabel(saving)} onChange={(e) => setSaving(inputAmount(e.target.value))} />
            </label>
          </section>
          <p className="plan-availability card">
            Khả dụng: {fmt(available.toString())} · Phân bổ nháp:{" "}
            {fmt(allocated.toString())}
            {over && <strong role="alert"> — Vượt giới hạn</strong>}
          </p>
          {plan && <section className="plan-actual-summary card"><div><span>Thu nhập thực tế</span><strong>{fmt(plan.actualIncome)}</strong></div><div><span>Chi tiêu thực tế</span><strong>{fmt(plan.actualExpense)}</strong></div><div><span>Dòng tiền ròng</span><strong>{fmt(plan.remainingCashFlow)}</strong></div></section>}
          <div className="allocation-heading">
            <div>
              <h2>Phân bổ theo danh mục</h2>
              <p className="muted">Đặt ngân sách trước khi chi, rồi theo dõi số thực tế trong tháng.</p>
            </div>
            <div className="allocation-heading-actions">
              <span>{visibleCats.length} danh mục đã thêm</span>
              {visibleCats.length > 0 && cats.length > visibleCats.length && (
                <button type="button" className="allocation-add-category" onClick={() => setShowCategoryPicker(true)}>
                  ＋ Thêm danh mục dự kiến
                </button>
              )}
            </div>
          </div>
          {showCategoryPicker && <div className="category-budget-picker" role="dialog" aria-modal="true" aria-label="Thêm danh mục vào kế hoạch">
            <div className="category-budget-picker-head"><div>{showCustomCategory && <button type="button" className="category-budget-picker-back" onClick={() => setShowCustomCategory(false)}>← Danh sách danh mục</button>}<strong>{showCustomCategory ? "Tạo danh mục riêng" : "Thêm khoản chi vào kế hoạch"}</strong><span>{showCustomCategory ? "Danh mục này chỉ xuất hiện khi bạn chọn thêm vào kế hoạch." : "Chọn một mục có sẵn hoặc tạo mục riêng cho bạn."}</span></div><div className="category-budget-picker-actions">{!showCustomCategory && <button type="button" className="category-budget-create-custom" onClick={() => setShowCustomCategory(true)}>＋ Tạo danh mục riêng</button>}<button type="button" className="category-budget-picker-close" aria-label="Đóng" onClick={() => { setShowCategoryPicker(false); setShowCustomCategory(false); }}>×</button></div></div>
            {!showCustomCategory ? <>
            <div className="category-budget-options">
              {CATEGORY_GROUPS.map((group) => {
                const options = availableCats.filter((category) => group.names.includes(category.name));
                if (!options.length) return null;
                return <div className="category-budget-option-group" key={group.id}><strong>{group.name}</strong><div>{options.map((category) => <button type="button" className="category-budget-option" key={category.id} onClick={() => addCategory(category.id)}><CategoryBadge category={category} compact /><span>＋</span></button>)}</div></div>;
              })}
              {availableCats.filter((category) => !CATEGORY_GROUPS.some((group) => group.names.includes(category.name))).length > 0 && <div className="category-budget-custom-options">{availableCats.filter((category) => !CATEGORY_GROUPS.some((group) => group.names.includes(category.name))).map((category) => <button type="button" className="category-budget-option" key={category.id} onClick={() => addCategory(category.id)}><CategoryBadge category={category} compact /><span>＋</span></button>)}</div>}
              {!availableCats.length && <p className="muted">Bạn đã thêm tất cả danh mục hiện có.</p>}
            </div>
            </> : <div className="category-budget-custom"><ol className="category-budget-guide"><li>Nhập tên khoản chi dễ nhớ.</li><li>Chọn icon và màu để nhận biết nhanh.</li><li>Chọn nhóm để dễ quản lý trong kế hoạch.</li></ol><input aria-label="Tên danh mục chi mới" placeholder="Ví dụ: Tiền cho thú cưng" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} /><label className="category-budget-group-field">Nhóm danh mục<select value={newCategoryGroup} onChange={(e) => setNewCategoryGroup(e.target.value)}>{CATEGORY_GROUPS.map((group) => <option value={group.id} key={group.id}>{group.name}</option>)}</select></label><CategoryPicker name={newCategoryName} icon={newCategoryIcon} color={newCategoryColor} onIconChange={setNewCategoryIcon} onColorChange={setNewCategoryColor} />{categoryError && <p className="form-error" role="alert">{categoryError}</p>}<button type="button" onClick={createCustomCategory}>Tạo và thêm vào kế hoạch</button></div>}
          </div>}

          {visibleCats.length > 0 && <div className="allocation-columns" aria-hidden="true">
            <span>Danh mục</span>
            <span>Ngân sách tháng</span>
            <span>So sánh kế hoạch và thực tế</span>
          </div>}
          {visibleCats.length === 0 ? (
            <div className="allocation-empty-list">
              <strong>Chưa có danh mục trong kế hoạch</strong>
              <span>Bạn vẫn có thể lập ngân sách trước khi phát sinh giao dịch.</span>
              <button type="button" className="allocation-add-category" onClick={() => setShowCategoryPicker(true)}>
                ＋ Thêm danh mục dự kiến
              </button>
            </div>
          ) : (
          <ul className="allocation-list">
            {categoryGroups.map((group) => (
              <Fragment key={group.id}>
                <li className="allocation-group-row"><div><strong>{group.name}</strong><span>{group.description}</span></div><small>{group.categories.length} khoản</small></li>
                {group.categories.map((c) => {
              const b = plan?.budgets.find((x) => x.category.id === c.id);
              return (
                <li className={`allocation-child ${b?.status === "EXCEEDED" ? "is-over" : ""} ${b ? "" : "is-empty"}`.trim()} key={c.id}>
                  <div className="allocation-header">
                    <CategoryBadge category={c} compact />
                    {b && <span className={`allocation-status status-${b.status.toLowerCase()}`}>{b.plannedAmount === "0.00" ? "Chưa lập ngân sách" : statusLabel(b.status)}</span>}
                  </div>
                  <div className="allocation-body">
                    <label className="allocation-field">
                      <span>Ngân sách tháng</span>
                      <input
                        inputMode="numeric"
                        value={draft[c.id] === undefined ? "" : inputLabel(draft[c.id])}
                        placeholder="0"
                        onChange={(e) => setDraft({ ...draft, [c.id]: inputAmount(e.target.value) })}
                      />
                    </label>
                    {b ? (
                      <div className="allocation-details">
                        <div className="allocation-metric"><span>Dự kiến</span><strong>{fmt(b.plannedAmount)}</strong></div>
                        <div className="allocation-metric"><span>Đã chi</span><strong>{fmt(b.actualAmount)}</strong></div>
                        <div className="allocation-metric"><span>Còn lại</span><strong className={Number(b.remainingBudget) < 0 ? "negative" : ""}>{fmt(b.remainingBudget)}</strong></div>
                        <div className="allocation-usage">
                          <div className="allocation-usage-label"><span>Mức sử dụng</span><b>{b.usagePercentage === null ? "—" : `${Math.round(b.usagePercentage)}%`}</b></div>
                          <div className="allocation-progress"><i className={b.status === "EXCEEDED" ? "is-over" : ""} style={{ width: `${Math.min(100, Math.max(0, b.usagePercentage ?? 0))}%` }} /></div>
                        </div>
                        <button className="allocation-delete" aria-label={"Bỏ ngân sách " + c.name} title="Bỏ phân bổ ngân sách, không xóa giao dịch" onClick={() => removeCategory(c)}>Bỏ ngân sách</button>
                      </div>
                    ) : (
                      <div className="allocation-empty"><span>Chưa có ngân sách hoặc giao dịch trong tháng này</span>{draft[c.id] !== undefined && <button className="allocation-delete" type="button" onClick={() => removeCategory(c)}>Bỏ mục</button>}</div>
                    )}
                  </div>
                </li>
              );
            })}
              </Fragment>
            ))}
          </ul>
          )}
          <div className="plan-actions">
            <button onClick={save}>Lưu</button>
            <button onClick={cancel}>Hủy thay đổi</button>
            {JSON.stringify(draft) !== JSON.stringify(initial) && (
              <span> Chưa lưu</span>
            )}
          </div>
          {plan &&
            plan.budgets
              .filter((b) => !cats.some((c) => c.id === b.category.id))
              .map((b) => (
                <p key={b.category.id}>
                  Chi ngoài ngân sách: <CategoryBadge category={b.category} compact /> — {fmt(b.actualAmount)} — CHƯA LẬP NGÂN SÁCH
                </p>
              ))}
        </>
      )}
    </main>
  );
}
