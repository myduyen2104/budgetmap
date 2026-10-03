"use client";
import { FormEvent, useRef, useState } from "react";
import { api } from "../lib/api";
import { formatMoneyInput, positiveAmount } from "../lib/money";
import { CategorySelect } from "./category";
import type { CategoryColor, CategoryIcon } from "../../../packages/shared/src/categories";
import {
  CategoryRef,
  Editing,
  errorMessage,
  Kind,
  today,
  WalletRef,
} from "../lib/movements";

export function MovementForm({
  wallets,
  categories,
  editing,
  initialKind,
  onSaved,
  onCancel,
  onDelete,
}: {
  wallets: WalletRef[];
  categories: CategoryRef[];
  editing: Editing | null;
  initialKind: Kind;
  onSaved: (message: string) => void;
  onCancel: () => void;
  onDelete?: () => void;
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
  const [amount, setAmount] = useState(old?.amount ? formatMoneyInput(old.amount) : "");
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
    const normalized = positiveAmount(amount);
    if (!normalized)
      return showError(
        "Số tiền phải lớn hơn 0, tối đa 17 chữ số phần nguyên và 2 chữ số thập phân.",
      );
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
    const parsed = new Date(date + "T00:00:00Z");
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
      Number.isNaN(parsed.getTime()) ||
      parsed.toISOString().slice(0, 10) !== date
    )
      return showError("Vui lòng chọn ngày hợp lệ.");
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

  async function createCategory(name: string, icon: CategoryIcon, color: CategoryColor) {
    return api<CategoryRef>("/categories", { method: "POST", body: JSON.stringify({ name, type: kind, icon, color }) });
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
            <select
              aria-label="Loại giao dịch"
              autoFocus
              value={kind}
              disabled={editing?.kind === "TRANSFER"}
              onChange={(e) => {
                setKind(e.target.value as Kind);
                setCategory("");
                setDestination("");
                setError("");
              }}
            >
              <option value="INCOME">Thu nhập</option>
              <option value="EXPENSE">Chi tiêu</option>
              {(!editing || editing.kind === "TRANSFER") && (
                <option value="TRANSFER">Chuyển tiền</option>
              )}
            </select>
          </label>
          <label>
            Số tiền
            <input
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(formatMoneyInput(e.target.value))}
              required
            />
          </label>
          <label>
            {isTransfer ? "Ví nguồn" : "Ví"}
            <select
              aria-label={isTransfer ? "Ví nguồn" : "Ví"}
              required
              value={source}
              onChange={(e) => {
                setSource(e.target.value);
                if (e.target.value === destination) setDestination("");
              }}
            >
              <option value="">Chọn ví</option>
              {activeWallets.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
              {!isTransfer &&
                editing?.kind === "TRANSACTION" &&
                !activeWallets.some((w) => w.id === source) && (
                  <option value={source}>
                    {editing.item.wallet.name} (đã lưu trữ)
                  </option>
                )}
            </select>
          </label>
          {isTransfer ? (
            <label>
              Ví nhận
              <select
                aria-label="Ví nhận"
                required
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
              >
                <option value="">Chọn ví nhận</option>
                {activeWallets
                  .filter((w) => w.id !== source)
                  .map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                    </option>
                  ))}
              </select>
            </label>
          ) : (
            <label>
              Danh mục
              <CategorySelect categories={categories} value={category} onChange={setCategory} type={kind} onCreate={createCategory} />
            </label>
          )}
          <label>
            {isTransfer ? "Ngày chuyển" : "Ngày"}
            <input
              aria-label={isTransfer ? "Ngày chuyển" : "Ngày"}
              type="date"
              required
              value={date}
              onInput={(e) => setDate(e.currentTarget.value)}
              onChange={(e) => setDate(e.target.value)}
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
          {editing && onDelete && <button type="button" className="danger" disabled={busy} onClick={onDelete}>Xóa giao dịch</button>}
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
