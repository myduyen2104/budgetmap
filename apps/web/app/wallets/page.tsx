"use client";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { api } from "../../lib/api";
import { formatMoneyInput, formatVnd, normalizeMoneyInput } from "../../lib/money";
import { errorMessage } from "../../lib/movements";
import {
  EmptyState,
  ErrorState,
  LoadingSkeleton,
  PageHeader,
} from "../../components/ui";
type Wallet = {
  id: string;
  name: string;
  type: string;
  initialBalance: string;
  currentBalance: string;
  totalIncome: string;
  totalExpense: string;
  incomingTransferAmount: string;
  outgoingTransferAmount: string;
  archivedAt?: string | null;
};

export default function Wallets() {
  const [wallets, setWallets] = useState<Wallet[]>([]),
    [name, setName] = useState(""),
    [type, setType] = useState("CASH"),
    [initial, setInitial] = useState("0");
  const [editing, setEditing] = useState<string | null>(null),
    [showArchived, setShowArchived] = useState(false);
  const [error, setError] = useState(""),
    [saveError, setSaveError] = useState(""),
    [toast, setToast] = useState(""),
    [loading, setLoading] = useState(true),
    [saving, setSaving] = useState(false);
  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setWallets(
        (
          await api<{ items: Wallet[] }>(
            "/wallets?includeArchived=" + showArchived,
          )
        ).items,
      );
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [showArchived]);
  useEffect(() => {
    void load();
    const refresh = () => {
      void load();
    };
    window.addEventListener("focus", refresh);
    return () => window.removeEventListener("focus", refresh);
  }, [load]);
  async function save(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaveError("");
    try {
      await api(editing ? "/wallets/" + editing : "/wallets", {
        method: editing ? "PATCH" : "POST",
        body: JSON.stringify(
          editing ? { name, type } : { name, type, initialBalance: normalizeMoneyInput(initial) || "0.00" },
        ),
      });
      setName("");
      setInitial("0");
      setEditing(null);
      setToast("Đã lưu ví.");
      await load();
    } catch (e) {
      setSaveError(errorMessage(e));
    } finally {
      setSaving(false);
    }
  }
  async function archive(w: Wallet) {
    if (
      !window.confirm(
        "Lưu trữ ví " + w.name + "? Lịch sử giao dịch vẫn được giữ lại.",
      )
    )
      return;
    try {
      await api("/wallets/" + w.id + "/archive", { method: "POST" });
      setToast("Đã lưu trữ ví.");
      await load();
    } catch (e) {
      setSaveError(errorMessage(e));
    }
  }
  return (
    <main>
      <PageHeader
        title="Ví tiền"
        description="Số dư và các khoản thu, chi, chuyển tiền của từng ví."
      />
      {toast && (
        <p role="status" className="feedback-toast">
          {toast}
        </p>
      )}
      <section className="card wallet-create">
        <h2>{editing ? "Sửa ví" : "Tạo ví mới"}</h2>
        <form className="form-grid" onSubmit={save}>
          <div className="movement-fields">
            <label>
              Tên ví
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </label>
            <label>
              Loại
              <select value={type} onChange={(e) => setType(e.target.value)}>
                <option value="CASH">Tiền mặt</option>
                <option value="BANK">Ngân hàng</option>
              </select>
            </label>
            {!editing && (
              <label>
                Số dư ban đầu
                <input
                  inputMode="decimal"
                  required
                  value={initial}
                  onChange={(e) => setInitial(formatMoneyInput(e.target.value))}
                />
              </label>
            )}
          </div>
          {saveError && (
            <p role="alert" className="error">
              {saveError}
            </p>
          )}
          <div className="actions">
            <button disabled={saving}>
              {saving ? "Đang lưu…" : editing ? "Cập nhật" : "Thêm ví"}
            </button>
            {editing && (
              <button
                type="button"
                className="secondary"
                onClick={() => {
                  setEditing(null);
                  setName("");
                }}
              >
                Hủy
              </button>
            )}
          </div>
        </form>
      </section>
      <section aria-label="Tổng hợp số dư ví">
        <div className="page-header">
          <div>
            <h2>Danh sách ví</h2>
            <p className="muted">
              Các tổng dưới đây tính từ khi tạo ví; không bao gồm giao dịch đã
              xóa.
            </p>
          </div>
          <label>
            <input
              type="checkbox"
              checked={showArchived}
              onChange={(e) => setShowArchived(e.target.checked)}
            />{" "}
            Hiện đã lưu trữ
          </label>
        </div>
        {loading ? (
          <LoadingSkeleton label="Đang tải số dư ví…" />
        ) : error ? (
          <ErrorState message={error} onRetry={() => void load()} />
        ) : wallets.length === 0 ? (
          <EmptyState
            title="Chưa có ví"
            description="Tạo ví đầu tiên để ghi nhận thu, chi và chuyển tiền."
          />
        ) : (
          <div className="wallet-cards">
            {wallets.map((w) => (
              <article
                key={w.id}
                className="card wallet-summary"
                aria-label={"Ví " + w.name}
              >
                <div className="page-header">
                  <div>
                    <h3>{w.name}</h3>
                    <p className="muted">
                      {w.type === "BANK"
                        ? "Ngân hàng"
                        : w.type === "CASH" || w.type === "cash"
                          ? "Tiền mặt"
                          : w.type}
                    </p>
                  </div>
                  <span className="badge">
                    {w.archivedAt ? "Đã lưu trữ" : "Đang dùng"}
                  </span>
                </div>
                <dl className="wallet-metrics">
                  <div className="balance">
                    <dt>Số dư hiện tại</dt>
                    <dd>{formatVnd(w.currentBalance)}</dd>
                  </div>
                  <div>
                    <dt>Số dư ban đầu</dt>
                    <dd>{formatVnd(w.initialBalance)}</dd>
                  </div>
                  <div>
                    <dt>Tổng thu nhập</dt>
                    <dd>{formatVnd(w.totalIncome)}</dd>
                  </div>
                  <div>
                    <dt>Tổng chi tiêu</dt>
                    <dd>{formatVnd(w.totalExpense)}</dd>
                  </div>
                  <div className="transfer-metric">
                    <dt>Nhận từ chuyển tiền</dt>
                    <dd>{formatVnd(w.incomingTransferAmount)}</dd>
                  </div>
                  <div className="transfer-metric">
                    <dt>Chuyển tiền đi</dt>
                    <dd>{formatVnd(w.outgoingTransferAmount)}</dd>
                  </div>
                </dl>
                <p className="muted">
                  Chuyển tiền giữa ví không tính vào tổng thu nhập hoặc chi
                  tiêu.
                </p>
                <div className="row-actions">
                  <a
                    href={"/transactions?walletId=" + encodeURIComponent(w.id)}
                  >
                    Xem giao dịch
                  </a>
                  {!w.archivedAt && (
                    <>
                      <button
                        className="secondary"
                        onClick={() => {
                          setEditing(w.id);
                          setName(w.name);
                          setType(w.type);
                          document
                            .querySelector<HTMLInputElement>(
                              ".wallet-create input",
                            )
                            ?.focus();
                        }}
                      >
                        Sửa
                      </button>
                      <button
                        className="danger"
                        onClick={() => void archive(w)}
                      >
                        Lưu trữ
                      </button>
                    </>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
