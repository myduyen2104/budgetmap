"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "../../lib/api";
import { CategoryBadge } from "../../components/category";
import { MonthPicker } from "../../components/month-picker";
import {
  EmptyState,
  ErrorState,
  LoadingSkeleton,
  PageHeader,
} from "../../components/ui";
import { currentMonth } from "../../lib/movements";

type Category = {
  id: string;
  name: string;
  type?: "INCOME" | "EXPENSE";
  icon?: string | null;
  color?: string | null;
};

type Comparison = {
  month: string;
  currentExpense: string;
  byCategory: {
    categoryId: string;
    category: string;
    currentExpense: string;
  }[];
};

const money = (value: string | number) => {
  const [integer, decimal] = String(value).split(".");
  return `${integer.replace(/\B(?=(\d{3})+(?!\d))/g, ".")}${decimal && decimal !== "00" ? `,${decimal}` : ""}`;
};

const monthLabel = (value: string) => {
  const [year, month] = value.split("-");
  return `${month}/${year}`;
};

const previousMonth = (value: string) => {
  const [year, month] = value.split("-").map(Number);
  const date = new Date(year, month - 2, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
};

function TrendArrow({ direction }: { direction: "up" | "down" }) {
  return (
    <svg
      className="analysis-trend-arrow"
      data-direction={direction}
      aria-hidden="true"
      viewBox="0 0 20 20"
      fill="none"
    >
      <path d="M10 16V4m0 0L5.5 8.5M10 4l4.5 4.5" />
    </svg>
  );
}

export default function Analysis() {
  const initialMonth = currentMonth();
  const [monthA, setMonthA] = useState(initialMonth);
  const [monthB, setMonthB] = useState(previousMonth(initialMonth));
  const [dataA, setDataA] = useState<Comparison | null>(null);
  const [dataB, setDataB] = useState<Comparison | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const requestId = useRef(0);
  const comparisonStickySentinel = useRef<HTMLDivElement>(null);
  const [comparisonHeaderStuck, setComparisonHeaderStuck] = useState(false);

  const load = () => {
    const currentRequest = ++requestId.current;
    setLoading(true);
    setError("");
    Promise.all([
      api<Comparison>(`/reports/monthly-comparison?month=${monthA}`),
      api<Comparison>(`/reports/monthly-comparison?month=${monthB}`),
      api<{ items: Category[] }>("/categories"),
    ])
      .then(([a, b, categoryData]) => {
        if (currentRequest !== requestId.current) return;
        setDataA(a);
        setDataB(b);
        setCategories(categoryData.items);
      })
      .catch(() => {
        if (currentRequest === requestId.current) {
          setError("Không thể tải dữ liệu so sánh. Vui lòng thử lại.");
        }
      })
      .finally(() => {
        if (currentRequest === requestId.current) setLoading(false);
      });
  };

  useEffect(() => {
    load();
    return () => {
      requestId.current += 1;
    };
    // load intentionally follows only the selected comparison periods.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monthA, monthB]);

  useEffect(() => {
    const sentinel = comparisonStickySentinel.current;
    if (!sentinel || !window.matchMedia("(max-width: 760px)").matches) {
      setComparisonHeaderStuck(false);
      return;
    }

    const isPhone = window.matchMedia("(max-width: 640px)").matches;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setComparisonHeaderStuck(
          entry.boundingClientRect.top < (entry.rootBounds?.top ?? 0),
        );
      },
      {
        root: isPhone ? null : document.querySelector(".content"),
        rootMargin: `${isPhone ? -64 : -76}px 0px 0px 0px`,
        threshold: 0,
      },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [dataA, dataB]);

  const rows = useMemo(() => {
    if (!dataA || !dataB) return [];
    const byId = new Map<
      string,
      { id: string; name: string; expenseA: number; expenseB: number }
    >();
    for (const item of dataA.byCategory) {
      byId.set(item.categoryId, {
        id: item.categoryId,
        name: item.category,
        expenseA: Number(item.currentExpense),
        expenseB: 0,
      });
    }
    for (const item of dataB.byCategory) {
      const row = byId.get(item.categoryId);
      if (row) row.expenseB = Number(item.currentExpense);
      else {
        byId.set(item.categoryId, {
          id: item.categoryId,
          name: item.category,
          expenseA: 0,
          expenseB: Number(item.currentExpense),
        });
      }
    }
    return [...byId.values()]
      .filter((row) => row.expenseA > 0 || row.expenseB > 0)
      .sort(
        (left, right) =>
          right.expenseA + right.expenseB - left.expenseA - left.expenseB,
      );
  }, [dataA, dataB]);

  const totalA = Number(dataA?.currentExpense ?? 0);
  const totalB = Number(dataB?.currentExpense ?? 0);
  // A negative delta means lower spending in the period currently being viewed.
  const difference = totalA - totalB;
  const differencePercent = totalB === 0 ? null : (difference / totalB) * 100;

  if (loading && !dataA) {
    return (
      <main>
        <PageHeader
          title="So sánh chi tiêu"
          description="Chọn hai tháng để đối chiếu dòng tiền và từng danh mục."
        />
        <LoadingSkeleton label="Đang tải dữ liệu so sánh…" />
      </main>
    );
  }

  return (
    <main className="analysis-page">
      <PageHeader
        title="So sánh chi tiêu"
        description="Đặt hai tháng cạnh nhau để thấy khoản nào thay đổi rõ nhất."
      />

      {error ? (
        <ErrorState message={error} onRetry={load} />
      ) : dataA && dataB ? (
        <>
          <section
            className={`analysis-compare card${loading ? " is-loading" : ""}`}
            aria-label="Chọn hai tháng so sánh"
            aria-busy={loading}
          >
            <div className="analysis-period-grid">
              <article className="analysis-period analysis-period-a">
                <div className="analysis-period-heading">
                  <div>
                    <p className="eyebrow">Kỳ đang xem</p>
                  </div>
                </div>
                <MonthPicker
                  value={monthA}
                  onChange={(value) => {
                    setMonthA(value);
                    if (value === monthB) setMonthB(previousMonth(value));
                  }}
                />
                <p className="analysis-period-total-label">Tổng chi tiêu</p>
                <strong className="analysis-period-total">{money(totalA)}</strong>
              </article>

              <article className="analysis-period analysis-period-b">
                <div className="analysis-period-heading">
                  <div>
                    <p className="eyebrow">Kỳ đối chiếu</p>
                  </div>
                </div>
                <MonthPicker
                  value={monthB}
                  onChange={(value) => {
                    setMonthB(value);
                    if (value === monthA) setMonthA(previousMonth(value));
                  }}
                />
                <p className="analysis-period-total-label">Tổng chi tiêu</p>
                <strong className="analysis-period-total">{money(totalB)}</strong>
              </article>
            </div>

            {loading && <p className="analysis-loading-note" role="status">Đang cập nhật số liệu…</p>}

            <div className="analysis-difference" aria-live="polite">
              <span>
                {difference > 0
                  ? `Kỳ ${monthLabel(monthA)} chi nhiều hơn`
                  : difference < 0
                    ? `Kỳ ${monthLabel(monthA)} chi ít hơn`
                    : "Chi tiêu hai kỳ bằng nhau"}
              </span>
              <strong className={difference > 0 ? "is-increase" : "is-decrease"}>
                {difference !== 0 && <TrendArrow direction={difference > 0 ? "up" : "down"} />}
                {money(Math.abs(difference))}
              </strong>
              <small>
                {differencePercent === null
                  ? "Chưa có dữ liệu kỳ B để tính tỷ lệ thay đổi"
                  : `${differencePercent > 0 ? "+" : "−"}${Math.abs(differencePercent).toFixed(1)}% so với kỳ B`}
              </small>
            </div>
          </section>

          <section className="analysis-category-comparison card">
            <div className="section-heading">
              <div>
                <h2>So sánh theo danh mục</h2>
                <p className="muted">Đối chiếu cùng danh mục giữa hai tháng.</p>
              </div>
              <span className="analysis-category-count">{rows.length} danh mục</span>
            </div>

            {rows.length === 0 ? (
              <EmptyState
                title="Chưa có khoản chi để so sánh"
                description="Khi có giao dịch chi tiêu ở một trong hai tháng, danh mục sẽ xuất hiện tại đây."
              />
            ) : (
              <>
                <div
                  className="analysis-sticky-sentinel"
                  ref={comparisonStickySentinel}
                  aria-hidden="true"
                />
                <div
                  className={`analysis-comparison-columns${comparisonHeaderStuck ? " is-stuck" : ""}`}
                  aria-hidden="true"
                >
                  <span>Danh mục</span>
                  <span>{monthLabel(monthA)}</span>
                  <span>{monthLabel(monthB)}</span>
                  <span>Chênh lệch</span>
                </div>
                <div className="analysis-comparison-list">
                  {rows.map((row) => {
                    const category = categories.find((item) => item.id === row.id);
                    const delta = row.expenseA - row.expenseB;
                    return (
                      <article className="analysis-comparison-row" key={row.id}>
                        <div className="analysis-comparison-category">
                          <CategoryBadge
                            category={category ?? { name: row.name, type: "EXPENSE" }}
                            compact
                          />
                        </div>
                        <div className="analysis-comparison-value" data-label={monthLabel(monthA)}>
                          <strong>{money(row.expenseA)}</strong>
                        </div>
                        <div className="analysis-comparison-value" data-label={monthLabel(monthB)}>
                          <strong>{money(row.expenseB)}</strong>
                        </div>
                        <div className={`analysis-comparison-delta${delta > 0 ? " is-increase" : delta < 0 ? " is-decrease" : ""}`}>
                          {delta !== 0 ? <TrendArrow direction={delta > 0 ? "up" : "down"} /> : "—"}
                          {delta === 0 ? "" : money(Math.abs(delta))}
                        </div>
                      </article>
                    );
                  })}
                </div>
              </>
            )}
          </section>
        </>
      ) : null}
    </main>
  );
}
