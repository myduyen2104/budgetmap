"use client";
import { FormEvent, KeyboardEvent as ReactKeyboardEvent, useEffect, useRef, useState } from "react";
import { api } from "../lib/api";
import { formatMoneyInput, isMoneyInputWithinLimit, MAX_MONEY_AMOUNT, normalizeMoneyInput, positiveAmount } from "../lib/money";
import { CategorySelect } from "./category";
import { SelectField } from "./select-field";
import { ReceiptImporter } from "./receipt-importer";
import type {
  CategoryColor,
  CategoryIcon,
} from "../../../packages/shared/src/categories";
import {
  CategoryRef,
  Editing,
  errorMessage,
  Kind,
  today,
  WalletRef,
} from "../lib/movements";

const CALENDAR_MONTHS = [
  "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6",
  "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12",
];
const CALENDAR_WEEKDAYS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

function dateFromIso(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || month < 1 || month > 12) return null;
  const parsed = new Date(year, month - 1, day);
  return parsed.getFullYear() === year && parsed.getMonth() === month - 1 && parsed.getDate() === day
    ? parsed
    : null;
}

function localIsoDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function dateYearBounds() {
  const currentYear = new Date().getFullYear();
  return { first: currentYear - 40, last: currentYear + 10 };
}

const DATE_SLOT_POSITIONS = [0, 1, 3, 4, 6, 7, 8, 9];
const DATE_MASK_CHARS = ["D", "D", "/", "M", "M", "/", "Y", "Y", "Y", "Y"];

function dateSlotsFromIso(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  return match ? [...match[3], ...match[2], ...match[1]] : Array<string>(8).fill("");
}

function dateSlotsFromInput(value: string) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return dateSlotsFromIso(value);
  const digits = value.replace(/\D/g, "").slice(0, 8);
  return [...digits, ...Array<string>(8 - digits.length).fill("")];
}

function dateSlotsToIso(slots: string[]) {
  if (slots.length !== 8 || slots.some((digit) => !/^\d$/.test(digit))) return "";
  const [dayTens, dayOnes, monthTens, monthOnes, yearThousands, yearHundreds, yearTens, yearOnes] = slots;
  const iso = `${yearThousands}${yearHundreds}${yearTens}${yearOnes}-${monthTens}${monthOnes}-${dayTens}${dayOnes}`;
  const year = Number(iso.slice(0, 4));
  const { first, last } = dateYearBounds();
  if (year < first || year > last) return "";
  const parsed = dateFromIso(iso);
  return parsed && localIsoDate(parsed) === iso ? iso : "";
}

function slotAtCaret(position: number) {
  const slot = DATE_SLOT_POSITIONS.findIndex((slotPosition) => slotPosition >= position);
  return slot === -1 ? DATE_SLOT_POSITIONS.length : slot;
}

function TransactionDatePicker({
  value,
  onChange,
  label,
  onValidationNotice,
}: {
  value: string;
  onChange: (value: string) => void;
  label: string;
  onValidationNotice: (message: string) => void;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [dateSlots, setDateSlots] = useState(() => dateSlotsFromIso(value));
  const [activeSlot, setActiveSlot] = useState(0);
  const [open, setOpen] = useState(false);
  const [viewDate, setViewDate] = useState(() => dateFromIso(value) ?? new Date());
  const [focusedDate, setFocusedDate] = useState(value || localIsoDate(new Date()));
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const selectedDate = dateFromIso(value);
  const dateDraft = DATE_MASK_CHARS.map((mask, index) =>
    mask === "/" ? "/" : dateSlots[DATE_SLOT_POSITIONS.indexOf(index)] || mask,
  ).join("");
  const today = localIsoDate(new Date());
  const firstDayOffset = (new Date(year, month, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cellCount = Math.ceil((firstDayOffset + daysInMonth) / 7) * 7;
  const calendarDays = Array.from({ length: cellCount }, (_, index) =>
    new Date(year, month, index - firstDayOffset + 1),
  );
  const { first: firstYear, last: lastYear } = dateYearBounds();
  const years = Array.from({ length: 51 }, (_, index) => firstYear + index);
  const isYearAllowed = (calendarYear: number) => calendarYear >= firstYear && calendarYear <= lastYear;

  useEffect(() => {
    if (selectedDate) setDateSlots(dateSlotsFromIso(value));
  }, [value]);

  useEffect(() => {
    if (!selectedDate) return;
    if (!isYearAllowed(selectedDate.getFullYear())) {
      onValidationNotice(`Năm cần nằm trong khoảng ${firstYear}–${lastYear}. Vui lòng kiểm tra lại năm.`);
    }
  }, [value]);

  useEffect(() => {
    inputRef.current?.setSelectionRange(DATE_SLOT_POSITIONS[activeSlot] ?? 10, DATE_SLOT_POSITIONS[activeSlot] ?? 10);
  }, [activeSlot, dateDraft]);

  useEffect(() => {
    if (open) {
      const initial = selectedDate ?? new Date();
      const boundedYear = Math.max(firstYear, Math.min(lastYear, initial.getFullYear()));
      setViewDate(new Date(boundedYear, initial.getMonth(), 1));
      setFocusedDate(localIsoDate(initial));
    }
  }, [open, value]);

  useEffect(() => {
    if (!open) return;
    const closeOnOutside = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("mousedown", closeOnOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    rootRef.current
      ?.querySelector<HTMLButtonElement>(`[data-calendar-date="${focusedDate}"]`)
      ?.focus();
  }, [focusedDate, open]);

  const moveMonth = (amount: number) => {
    const index = Math.max(firstYear * 12, Math.min(lastYear * 12 + 11, year * 12 + month + amount));
    setViewDate(new Date(Math.floor(index / 12), index % 12, 1));
  };

  const chooseDate = (date: Date) => {
    if (!isYearAllowed(date.getFullYear())) return;
    onChange(localIsoDate(date));
    onValidationNotice("");
    setOpen(false);
    triggerRef.current?.focus();
  };

  const applySlots = (nextSlots: string[], nextActiveSlot: number) => {
    setDateSlots(nextSlots);
    setActiveSlot(Math.max(0, Math.min(nextActiveSlot, DATE_SLOT_POSITIONS.length)));
    onChange(dateSlotsToIso(nextSlots));
    onValidationNotice("");
  };

  const insertDigits = (text: string) => {
    const digits = text.replace(/\D/g, "").slice(0, 8);
    if (!digits) return;
    const nextSlots = [...dateSlots];
    let targetSlot = activeSlot;
    for (const digit of digits) {
      if (targetSlot >= nextSlots.length) break;
      if (targetSlot === 0 && Number(digit) > 3) {
        onValidationNotice("Ngày phải nằm trong khoảng 01–31.");
        return;
      }
      if (targetSlot === 1) {
        const dayNumber = Number(`${nextSlots[0]}${digit}`);
        if (dayNumber < 1 || dayNumber > 31) {
          onValidationNotice("Ngày phải nằm trong khoảng 01–31.");
          return;
        }
      }
      if (targetSlot === 2 && Number(digit) > 1) {
        onValidationNotice("Tháng phải nằm trong khoảng 01–12.");
        return;
      }
      if (targetSlot === 3) {
        const monthNumber = Number(`${nextSlots[2]}${digit}`);
        if (monthNumber < 1 || monthNumber > 12) {
          onValidationNotice("Tháng phải nằm trong khoảng 01–12.");
          return;
        }
      }
      if ((targetSlot === 0 || targetSlot === 2) && nextSlots[targetSlot] !== digit) {
        nextSlots[targetSlot + 1] = "";
      }
      nextSlots[targetSlot] = digit;
      if (targetSlot === 7 && dateSlotsToIso(nextSlots) === "" && isYearAllowed(Number(nextSlots.slice(4, 8).join("")))) {
        onValidationNotice("Ngày không tồn tại trong tháng đã chọn. Vui lòng kiểm tra lại ngày.");
        return;
      }
      targetSlot += 1;
    }
    applySlots(nextSlots, targetSlot);
    if (targetSlot > 7) {
      const enteredYear = Number(nextSlots.slice(4, 8).join(""));
      if (!isYearAllowed(enteredYear)) {
        onValidationNotice(`Năm cần nằm trong khoảng ${firstYear}–${lastYear}. Vui lòng kiểm tra lại năm.`);
      }
    }
  };

  const handleDateKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    if (/^\d$/.test(event.key)) {
      event.preventDefault();
      insertDigits(event.key);
      return;
    }
    if (event.key === "Backspace" || event.key === "Delete") {
      event.preventDefault();
      const input = inputRef.current;
      const start = input?.selectionStart ?? 0;
      const end = input?.selectionEnd ?? start;
      const nextSlots = [...dateSlots];
      const selected = DATE_SLOT_POSITIONS
        .map((position, slot) => (position >= start && position < end ? slot : -1))
        .filter((slot) => slot >= 0);
      if (selected.length) {
        selected.forEach((slot) => { nextSlots[slot] = ""; });
        applySlots(nextSlots, selected[0]);
      } else {
        const slot = event.key === "Backspace" ? slotAtCaret(start) - 1 : slotAtCaret(start);
        if (slot >= 0 && slot < nextSlots.length) {
          nextSlots[slot] = "";
          applySlots(nextSlots, slot);
        }
      }
      return;
    }
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      const delta = event.key === "ArrowLeft" ? -1 : 1;
      const caret = inputRef.current?.selectionStart ?? 0;
      setActiveSlot(Math.max(0, Math.min(8, slotAtCaret(caret) + delta)));
      return;
    }
    if (event.key === "Tab" || event.key === "Home" || event.key === "End") return;
    if (event.key.length === 1) event.preventDefault();
  };

  const handleDateBeforeInput = (event: React.FormEvent<HTMLInputElement>) => {
    const inputEvent = event.nativeEvent as InputEvent;
    if (
      typeof inputEvent.inputType === "string" &&
      inputEvent.inputType.startsWith("insert") &&
      inputEvent.data
    ) {
      event.preventDefault();
      insertDigits(inputEvent.data);
    }
  };

  const handleDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const text = event.currentTarget.value;
    const nextSlots = dateSlotsFromInput(text);
    const filledSlots = nextSlots.filter(Boolean).length;
    const dayText = nextSlots.slice(0, 2).join("");
    const monthText = nextSlots.slice(2, 4).join("");
    const yearText = nextSlots.slice(4, 8).join("");
    const day = Number(dayText);
    const month = Number(monthText);
    const year = Number(yearText);
    if ((dayText.length === 1 && day > 3) || (dayText.length === 2 && (day < 1 || day > 31))) {
      onValidationNotice("Ngày phải nằm trong khoảng 01–31.");
      return;
    }
    if ((monthText.length === 1 && month > 1) || (monthText.length === 2 && (month < 1 || month > 12))) {
      onValidationNotice("Tháng phải nằm trong khoảng 01–12.");
      return;
    }
    if (yearText.length === 4 && !isYearAllowed(year)) {
      onValidationNotice(`Năm cần nằm trong khoảng ${firstYear}–${lastYear}. Vui lòng kiểm tra lại năm.`);
      return;
    }
    if (filledSlots === 8 && !dateSlotsToIso(nextSlots)) {
      onValidationNotice("Ngày không tồn tại trong tháng đã chọn. Vui lòng kiểm tra lại ngày.");
      return;
    }
    applySlots(nextSlots, Math.min(filledSlots, 8));
  };

  const handleDayKeyDown = (event: ReactKeyboardEvent<HTMLButtonElement>, date: Date) => {
    const offsets: Record<string, number> = {
      ArrowLeft: -1,
      ArrowRight: 1,
      ArrowUp: -7,
      ArrowDown: 7,
    };
    const offset = offsets[event.key];
    if (!offset) return;
    event.preventDefault();
    const nextDate = new Date(date.getFullYear(), date.getMonth(), date.getDate() + offset);
    if (!isYearAllowed(nextDate.getFullYear())) return;
    setFocusedDate(localIsoDate(nextDate));
    setViewDate(new Date(nextDate.getFullYear(), nextDate.getMonth(), 1));
  };

  return (
    <div className="transaction-date-picker" ref={rootRef}>
      <div className="date-picker-control">
        <input
          ref={inputRef}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          aria-label={label}
          aria-required="true"
          aria-invalid={!dateSlotsToIso(dateSlots)}
          value={dateDraft}
          onKeyDown={handleDateKeyDown}
          onBeforeInput={handleDateBeforeInput}
          onChange={handleDateChange}
          onPaste={(event) => { event.preventDefault(); insertDigits(event.clipboardData.getData("text")); }}
          onClick={(event) => setActiveSlot(slotAtCaret(event.currentTarget.selectionStart ?? 0))}
          onSelect={(event) => {
            const input = event.currentTarget;
            if (input.selectionStart === input.selectionEnd) setActiveSlot(slotAtCaret(input.selectionStart ?? 0));
          }}
          aria-haspopup="dialog"
        />
        <div className="date-picker-mask" aria-hidden="true">
          {Array.from(dateDraft).map((character, index) => (
            <span key={index} className={DATE_MASK_CHARS[index] === "/" ? "date-mask-separator" : dateSlots[DATE_SLOT_POSITIONS.indexOf(index)] ? "date-mask-digit" : "date-mask-placeholder"}>
              {character}
            </span>
          ))}
        </div>
        <button
          ref={triggerRef}
          type="button"
          className="date-picker-trigger"
          aria-label={`Mở lịch ${label}`}
          aria-haspopup="dialog"
          aria-expanded={open}
          onClick={() => setOpen((current) => !current)}
        >
          <i className="fi-rr-calendar" aria-hidden="true" />
        </button>
      </div>
      {open && (
        <div className="transaction-date-popover" role="dialog" aria-label="Chọn ngày giao dịch">
          <div className="transaction-calendar-header">
            <button type="button" className="calendar-nav" aria-label="Tháng trước" disabled={year === firstYear && month === 0} onClick={() => moveMonth(-1)}>
              <i className="fi-rr-angle-small-left" aria-hidden="true" />
            </button>
            <div className="calendar-month-year">
              <SelectField
                ariaLabel="Tháng"
                className="calendar-select"
                value={String(month)}
                options={CALENDAR_MONTHS.map((monthName, index) => ({ value: String(index), label: monthName }))}
                onChange={(nextMonth) => setViewDate(new Date(year, Number(nextMonth), 1))}
              />
              <SelectField
                ariaLabel="Năm"
                className="calendar-select"
                value={String(year)}
                options={years.map((calendarYear) => ({ value: String(calendarYear), label: String(calendarYear) }))}
                onChange={(nextYear) => setViewDate(new Date(Number(nextYear), month, 1))}
              />
            </div>
            <button type="button" className="calendar-nav" aria-label="Tháng sau" disabled={year === lastYear && month === 11} onClick={() => moveMonth(1)}>
              <i className="fi-rr-angle-small-right" aria-hidden="true" />
            </button>
          </div>
          <div className="transaction-calendar-weekdays" aria-hidden="true">
            {CALENDAR_WEEKDAYS.map((weekday) => <span key={weekday}>{weekday}</span>)}
          </div>
          <div className="transaction-calendar-days" aria-label="Các ngày trong tháng">
            {calendarDays.map((calendarDay) => {
              const iso = localIsoDate(calendarDay);
              const isCurrentMonth = calendarDay.getMonth() === month;
              const isSelected = iso === value;
              return (
                <button
                  key={iso}
                  type="button"
                  data-calendar-date={iso}
                  className={`calendar-day${isCurrentMonth ? "" : " outside-month"}${isSelected ? " selected" : ""}${iso === today ? " today" : ""}`}
                  aria-label={new Intl.DateTimeFormat("vi-VN", { dateStyle: "full" }).format(calendarDay)}
                  aria-pressed={isSelected}
                  disabled={!isYearAllowed(calendarDay.getFullYear())}
                  tabIndex={iso === focusedDate ? 0 : -1}
                  onKeyDown={(event) => handleDayKeyDown(event, calendarDay)}
                  onClick={() => chooseDate(calendarDay)}
                >
                  {calendarDay.getDate()}
                </button>
              );
            })}
          </div>
          <div className="transaction-calendar-footer">
            <button type="button" className="calendar-today" onClick={() => chooseDate(new Date())}>Hôm nay</button>
          </div>
        </div>
      )}
    </div>
  );
}

export function MovementForm({
  wallets,
  categories,
  editing,
  initialKind,
  onSaved,
  onCancel,
  onDelete,
  onValidationNotice = () => {},
}: {
  wallets: WalletRef[];
  categories: CategoryRef[];
  editing: Editing | null;
  initialKind: Kind;
  onSaved: (message: string) => void;
  onCancel: () => void;
  onDelete?: () => void;
  onValidationNotice?: (message: string) => void;
}) {
  const old = editing?.item;
  const [kind, setKind] = useState<Kind>(
    editing?.kind === "TRANSFER"
      ? "TRANSFER"
      : editing?.kind === "TRANSACTION"
        ? editing.item.type
        : initialKind,
  );
  const [source, setSource] = useState(
    editing?.kind === "TRANSFER"
      ? editing.item.sourceWallet.id
      : editing?.kind === "TRANSACTION"
        ? editing.item.wallet.id
        : "",
  );
  const [destination, setDestination] = useState(
    editing?.kind === "TRANSFER" ? editing.item.destinationWallet.id : "",
  );
  const [category, setCategory] = useState(
    editing?.kind === "TRANSACTION" ? editing.item.category.id : "",
  );
  const [amount, setAmount] = useState(
    old?.amount ? formatMoneyInput(old.amount) : "",
  );
  const [date, setDate] = useState(
    editing?.kind === "TRANSFER"
      ? editing.item.transferDate
      : editing?.kind === "TRANSACTION"
        ? editing.item.transactionDate
        : today(),
  );
  const [note, setNote] = useState(old?.note ?? "");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const errorRef = useRef<HTMLParagraphElement>(null);
  const isTransfer = kind === "TRANSFER";
  const activeWallets = wallets.filter((w) => !w.archivedAt);
  const showError = (message: string) => {
    setError(message);
    requestAnimationFrame(() => errorRef.current?.focus());
  };

  async function save(e: FormEvent) {
    e.preventDefault();
    const parsed = new Date(date + "T00:00:00Z");
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
      Number.isNaN(parsed.getTime()) ||
      parsed.toISOString().slice(0, 10) !== date
    )
      return showError("Vui lòng nhập ngày hợp lệ trong phạm vi năm được hỗ trợ.");
    const normalized = positiveAmount(amount);
    if (!normalized) {
      const parsedAmount = normalizeMoneyInput(amount);
      const parsedCents = parsedAmount ? BigInt(parsedAmount.replace(".", "")) : 0n;
      return showError(
        parsedCents > MAX_MONEY_AMOUNT * 100n
          ? "Bạn đã chạm giới hạn số tiền tối đa."
          : "Số tiền phải lớn hơn 0.",
      );
    }
    if (!source || (isTransfer && !destination))
      return showError("Vui lòng chọn đầy đủ ví nguồn và ví nhận.");
    if (isTransfer && source === destination)
      return showError("Ví nguồn và ví nhận phải khác nhau.");
    if (
      isTransfer &&
      ![source, destination].every((id) =>
        activeWallets.some((w) => w.id === id),
      )
    )
      return showError("Chỉ được chuyển tiền giữa các ví đang hoạt động.");
    if (!isTransfer && !category) return showError("Vui lòng chọn danh mục.");
    if (note.length > 500)
      return showError("Ghi chú không được vượt quá 500 ký tự.");
    setBusy(true);
    setError("");
    try {
      if (isTransfer) {
        await api(editing ? `/transfers/${editing.item.id}` : "/transfers", {
          method: editing ? "PATCH" : "POST",
          body: JSON.stringify({
            sourceWalletId: source,
            destinationWalletId: destination,
            amount: normalized,
            transferDate: date,
            note,
          }),
        });
      } else {
        const before = editing?.kind === "TRANSACTION" ? editing.item : null;
        // Only changed references are sent when editing historical transactions.
        const body = {
          amount: normalized,
          transactionDate: date,
          note,
          ...(!before || before.type !== kind ? { type: kind } : {}),
          ...(!before || before.wallet.id !== source
            ? { walletId: source }
            : {}),
          ...(!before || before.category.id !== category
            ? { categoryId: category }
            : {}),
        };
        await api(
          editing ? `/transactions/${editing.item.id}` : "/transactions",
          { method: editing ? "PATCH" : "POST", body: JSON.stringify(body) },
        );
      }
      onSaved(
        editing
          ? "Đã cập nhật giao dịch."
          : isTransfer
            ? "Đã chuyển tiền thành công."
            : "Đã thêm giao dịch.",
      );
    } catch (e) {
      showError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  async function createCategory(
    name: string,
    icon: CategoryIcon,
    color: CategoryColor,
  ) {
    return api<CategoryRef>("/categories", {
      method: "POST",
      body: JSON.stringify({ name, type: kind, icon, color }),
    });
  }

  return (
    <section
      className="card movement-editor"
      aria-labelledby="movement-heading"
    >
      <h2 id="movement-heading">
        {editing
          ? isTransfer
            ? "Sửa chuyển tiền"
            : "Sửa giao dịch"
          : "Thêm giao dịch"}
      </h2>
      <p className="muted">
        {isTransfer
          ? "Chuyển tiền giữa các ví của bạn. Khoản này không tính vào tổng thu hoặc tổng chi."
          : "Ghi nhận thu nhập hoặc chi tiêu thực tế của bạn."}
      </p>
      <form
        className="form-grid"
        noValidate
        onSubmit={save}
        aria-label="Form giao dịch"
      >
        <fieldset disabled={busy} className="movement-fields">
          <label>
            Loại giao dịch
            <SelectField
              ariaLabel="Loại giao dịch"
              value={kind}
              disabled={editing?.kind === "TRANSFER"}
              options={[
                { value: "INCOME", label: "Thu nhập" },
                { value: "EXPENSE", label: "Chi tiêu" },
                ...(!editing || editing.kind === "TRANSFER"
                  ? [{ value: "TRANSFER", label: "Chuyển tiền" }]
                  : []),
              ]}
              onChange={(value) => {
                setKind(value as Kind);
                setCategory("");
                setDestination("");
                setError("");
              }}
            />
          </label>
          {!isTransfer && (
            <label>
              Danh mục
              <CategorySelect
                categories={categories}
                value={category}
                onChange={setCategory}
                type={kind}
                onCreate={createCategory}
              />
            </label>
          )}
          <label>
            Số tiền
            <input
              inputMode="decimal"
              value={amount}
              onChange={(e) => {
                const nextAmount = formatMoneyInput(e.target.value);
                if (nextAmount && !isMoneyInputWithinLimit(nextAmount)) {
                  setError("Bạn đã chạm giới hạn số tiền tối đa.");
                  return;
                }
                setAmount(nextAmount);
                setError("");
              }}
              required
            />
          </label>
          <label>
            {isTransfer ? "Ví nguồn" : "Ví"}
            <SelectField
              ariaLabel={isTransfer ? "Ví nguồn" : "Ví"}
              value={source}
              placeholder="Chọn ví"
              options={[
                { value: "", label: "Chọn ví" },
                ...activeWallets.map((w) => ({ value: w.id, label: w.name })),
                ...(!isTransfer &&
                editing?.kind === "TRANSACTION" &&
                !activeWallets.some((w) => w.id === source)
                  ? [
                      {
                        value: source,
                        label: `${editing.item.wallet.name} (đã lưu trữ)`,
                      },
                    ]
                  : []),
              ]}
              onChange={(value) => {
                setSource(value);
                if (value === destination) setDestination("");
              }}
            />
          </label>
          {isTransfer ? (
            <label>
              Ví nhận
              <SelectField
                ariaLabel="Ví nhận"
                value={destination}
                placeholder="Chọn ví nhận"
                options={[
                  { value: "", label: "Chọn ví nhận" },
                  ...activeWallets
                    .filter((w) => w.id !== source)
                    .map((w) => ({ value: w.id, label: w.name })),
                ]}
                onChange={setDestination}
              />
            </label>
          ) : null}
          <label>
            {isTransfer ? "Ngày chuyển" : "Ngày"}
            <TransactionDatePicker
              label={isTransfer ? "Ngày chuyển" : "Ngày"}
              value={date}
              onChange={setDate}
              onValidationNotice={onValidationNotice}
            />
          </label>
          <label>
            Ghi chú
            <input
              value={note}
              maxLength={500}
              onChange={(e) => setNote(e.target.value)}
            />
          </label>
          {!editing && kind === "EXPENSE" && (
            <ReceiptImporter
              categories={categories}
              onRecognized={(fields) => {
                setAmount(fields.amount ? formatMoneyInput(fields.amount) : "");
                setDate(fields.date);
                setNote(fields.note);
                setError("");
              }}
              onChooseCategory={setCategory}
            />
          )}
        </fieldset>
        {error && (
          <p className="error" role="alert" tabIndex={-1} ref={errorRef}>
            {error}
          </p>
        )}
        {isTransfer && activeWallets.length < 2 && (
          <p className="error">
            Bạn cần ít nhất hai ví đang hoạt động.{" "}
            <a href="/wallets">Quản lý ví</a>
          </p>
        )}
        <div className="actions">
          <button type="submit" disabled={busy}>
            {busy
              ? "Đang lưu…"
              : editing
                ? "Cập nhật"
                : isTransfer
                  ? "Chuyển tiền"
                  : "Lưu giao dịch"}
          </button>
          {editing && onDelete && (
            <button
              type="button"
              className="danger"
              disabled={busy}
              onClick={onDelete}
            >
              Xóa giao dịch
            </button>
          )}
          <button
            type="button"
            className="secondary"
            disabled={busy}
            onClick={onCancel}
          >
            Hủy
          </button>
        </div>
      </form>
    </section>
  );
}
