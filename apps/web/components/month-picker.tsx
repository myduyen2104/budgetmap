"use client";

import { useEffect, useMemo, useRef, useState } from "react";

const MONTHS = [
  "Tháng 1",
  "Tháng 2",
  "Tháng 3",
  "Tháng 4",
  "Tháng 5",
  "Tháng 6",
  "Tháng 7",
  "Tháng 8",
  "Tháng 9",
  "Tháng 10",
  "Tháng 11",
  "Tháng 12",
];

const parseMonth = (value: string) => {
  const [year, month] = value.split("-").map(Number);
  const now = new Date();
  return {
    year: Number.isFinite(year) ? year : now.getFullYear(),
    month: Number.isFinite(month) && month >= 1 && month <= 12 ? month - 1 : now.getMonth(),
  };
};

const monthValue = (year: number, month: number) => `${year}-${String(month + 1).padStart(2, "0")}`;

export function MonthPicker({
  value,
  onChange,
  className = "",
  id,
  "aria-label": ariaLabel,
}: {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  id?: string;
  "aria-label"?: string;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const selected = useMemo(() => parseMonth(value), [value]);
  const [open, setOpen] = useState(false);
  const [year, setYear] = useState(selected.year);
  const today = new Date();
  const todayValue = monthValue(today.getFullYear(), today.getMonth());

  useEffect(() => {
    if (!open) return;
    setYear(selected.year);
  }, [open, selected.year]);

  useEffect(() => {
    if (!open) return;
    const closeOnOutside = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", closeOnOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  const chooseMonth = (month: number) => {
    onChange(monthValue(year, month));
    setOpen(false);
  };

  return (
    <div className={`month-picker ${className}`.trim()} ref={rootRef}>
      <button
        type="button"
        id={id}
        className="month-picker-trigger"
        aria-label={ariaLabel ?? "Chọn tháng"}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <span>{MONTHS[selected.month]} {selected.year}</span>
        <i className="fi-rr-calendar" aria-hidden="true" />
      </button>
      {open && (
        <div className="month-picker-popover" role="dialog" aria-label="Chọn tháng">
          <div className="month-picker-head">
            <span className="month-picker-caption">Chọn tháng</span>
            <div className="month-picker-year-control">
              <button type="button" aria-label="Năm trước" onClick={() => setYear((current) => current - 1)}>
                <i className="fi-rr-angle-small-left" aria-hidden="true" />
              </button>
              <strong>{year}</strong>
              <button type="button" aria-label="Năm sau" onClick={() => setYear((current) => current + 1)}>
                <i className="fi-rr-angle-small-right" aria-hidden="true" />
              </button>
            </div>
          </div>
          <div className="month-picker-grid">
            {MONTHS.map((label, month) => {
              const isSelected = selected.year === year && selected.month === month;
              const isToday = todayValue === monthValue(year, month);
              return (
                <button
                  type="button"
                  className={`month-picker-option${isSelected ? " selected" : ""}${isToday ? " today" : ""}`}
                  key={label}
                  aria-label={`${label} ${year}${isSelected ? ", đang chọn" : ""}`}
                  aria-current={isSelected ? "date" : undefined}
                  onClick={() => chooseMonth(month)}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
