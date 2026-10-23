"use client";
import { useEffect, useRef, useState } from "react";

export type SelectOption = { value: string; label: string };
export function SelectField({
  value,
  options,
  onChange,
  ariaLabel,
  placeholder = "Chọn",
  disabled = false,
  className = "",
}: {
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  ariaLabel: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const close = (event: PointerEvent) => {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, []);
  useEffect(() => {
    if (open) {
      const selectedOption = menuRef.current?.querySelector<HTMLButtonElement>(".select-option.selected");
      selectedOption?.scrollIntoView({ block: "nearest" });
      selectedOption?.focus();
    }
  }, [open, value]);
  const selected = options.find((option) => option.value === value);
  function handleOptionKeyDown(event: React.KeyboardEvent<HTMLButtonElement>, index: number) {
    if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
      triggerRef.current?.focus();
      return;
    }
    let nextIndex: number | null = null;
    if (event.key === "ArrowDown") nextIndex = (index + 1) % options.length;
    if (event.key === "ArrowUp") nextIndex = (index - 1 + options.length) % options.length;
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = options.length - 1;
    if (nextIndex !== null) {
      event.preventDefault();
      menuRef.current?.querySelectorAll<HTMLButtonElement>(".select-option")[nextIndex]?.focus();
    }
  }
  return (
    <div className={`select-field${className ? ` ${className}` : ""}`} ref={ref}>
      <button
        type="button"
        className="select-trigger"
        ref={triggerRef}
        aria-label={ariaLabel}
        aria-expanded={open}
        disabled={disabled}
        onClick={() => setOpen(!open)}
        onKeyDown={(event) => {
          if (event.key === "Escape" && open) {
            event.preventDefault();
            setOpen(false);
          }
          if (event.key === "ArrowDown" && !open) {
            event.preventDefault();
            setOpen(true);
          }
        }}
      >
        {selected?.label ?? placeholder}
        <span className="select-arrow-icon" aria-hidden="true" />
      </button>
      {open && (
        <div className="select-menu" ref={menuRef} role="listbox" aria-label={ariaLabel}>
          {options.map((option, index) => (
            <button
              type="button"
              role="option"
              aria-selected={option.value === value}
              className={`select-option${option.value === value ? " selected" : ""}`}
              key={option.value}
              onKeyDown={(event) => handleOptionKeyDown(event, index)}
              onClick={(event) => {
                // SelectField is commonly rendered inside a <label>. Prevent
                // the label's default activation from re-clicking its trigger
                // after the user chooses an option.
                event.preventDefault();
                onChange(option.value);
                setOpen(false);
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
