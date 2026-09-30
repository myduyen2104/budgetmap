"use client";
import { useEffect, useRef, useState } from "react";

export type SelectOption = { value: string; label: string };
export function SelectField({ value, options, onChange, ariaLabel, placeholder = "Chọn" }: { value: string; options: SelectOption[]; onChange: (value: string) => void; ariaLabel: string; placeholder?: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { const close = (event: MouseEvent) => { if (!ref.current?.contains(event.target as Node)) setOpen(false); }; document.addEventListener("mousedown", close); return () => document.removeEventListener("mousedown", close); }, []);
  const selected = options.find((option) => option.value === value);
  return <div className="select-field" ref={ref}>
    <button type="button" className="select-trigger" aria-label={ariaLabel} aria-expanded={open} onClick={() => setOpen(!open)}>{selected?.label ?? placeholder}<span aria-hidden="true">⌄</span></button>
    {open && <div className="select-menu" role="listbox" aria-label={ariaLabel}>{options.map((option) => <button type="button" role="option" aria-selected={option.value === value} className={option.value === value ? "selected" : ""} key={option.value} onClick={() => { onChange(option.value); setOpen(false); }}>{option.label}</button>)}</div>}
  </div>;
}
