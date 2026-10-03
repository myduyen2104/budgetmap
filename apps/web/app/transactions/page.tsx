"use client";
import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { formatVnd } from "../../lib/money";
import {
  CategoryRef,
  Editing,
  errorMessage,
  Kind,
  PageData,
  today,
  formatDate,
  Transaction,
  Transfer,
  WalletRef,
} from "../../lib/movements";
import { MovementForm } from "../../components/movement-form";
import { CategoryBadge } from "../../components/category";
import { SelectField } from "../../components/select-field";
import { MonthPicker } from "../../components/month-picker";
import { ConfirmDialog } from "../../components/confirm-dialog";
import {
  EmptyState,
  ErrorState,
  LoadingSkeleton,
  PageHeader,
} from "../../components/ui";

function Pagination({
  name,
  page,
  total,
  onChange,
}: {
  name: string;
  page: number;
  total: number;
  onChange: (page: number) => void;
}) {
  const pages = Math.max(1, Math.ceil(total / 20));
  return (
    <nav className="pagination" aria-label={name}>
      <button
        className="secondary"
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
      >
        Trang trước
      </button>
      <span>
        Trang {page}/{pages} · {total} giao dịch
      </span>
      <button
        className="secondary"
        disabled={page >= pages}
        onClick={() => onChange(page + 1)}
      >
        Trang sau
      </button>
    </nav>
  );
}

export default function Transactions() {
  const [month, setMonth] = useState(today().slice(0, 7)),
    [kind, setKind] = useState(""),
    [walletId, setWalletId] = useState(""),
    [categoryId, setCategoryId] = useState(""),
    [search, setSearch] = useState("");
  const [page, setPage] = useState(1),
    [transferPage, setTransferPage] = useState(1),
    [revision, setRevision] = useState(0);
  const [wallets, setWallets] = useState<WalletRef[]>([]),
    [categories, setCategories] = useState<CategoryRef[]>([]);
  const [usedCategoryIds, setUsedCategoryIds] = useState<Set<string>>(new Set());
  const [transactions, setTransactions] =
      useState<PageData<Transaction> | null>(null),
    [transfers, setTransfers] = useState<PageData<Transfer> | null>(null);
  const [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [toast, setToast] = useState("");
  const [editor, setEditor] = useState(false),
    [editing, setEditing] = useState<Editing | null>(null),
    [initialKind, setInitialKind] = useState<Kind>("EXPENSE");
  const [deleting, setDeleting] = useState<Editing | null>(null),
    [busy, setBusy] = useState(false),
    [deleteError, setDeleteError] = useState("");
  const showTransfers = !categoryId && (kind === "" || kind === "TRANSFER");
  const showTransactions = kind !== "TRANSFER";
  const visibleTransactions = transactions?.items.filter((t) => !search.trim() || `${t.note ?? ""} ${t.category.name}`.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase())) ?? [];

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const value = query.get("type");
    if (value === "INCOME" || value === "EXPENSE" || value === "TRANSFER") {
      setInitialKind(value);
      setEditor(true);
    }
    if (query.get("walletId")) setWalletId(query.get("walletId")!);
  }, []);
  useEffect(() => {
    let live = true;
    setLoading(true);
    setError("");
    const q = new URLSearchParams({
      month,
      page: String(page),
      pageSize: search.trim() ? "100" : "20",
    });
    const tq = new URLSearchParams({
      month,
      page: String(transferPage),
      pageSize: "20",
    });
    const usageQ = new URLSearchParams({ month, page: "1", pageSize: "1000" });
    if (kind && kind !== "TRANSFER") q.set("type", kind);
    if (walletId) {
      q.set("walletId", walletId);
      tq.set("walletId", walletId);
    }
    if (categoryId) q.set("categoryId", categoryId);
    Promise.all([
      showTransactions
        ? api<PageData<Transaction>>("/transactions?" + q)
        : Promise.resolve(null),
      showTransfers
        ? api<PageData<Transfer>>("/transfers?" + tq)
        : Promise.resolve(null),
      api<{ items: WalletRef[] }>("/wallets?includeArchived=true"),
      api<{ items: CategoryRef[] }>("/categories?includeArchived=true"),
      api<PageData<Transaction>>("/transactions?" + usageQ),
    ])
      .then(([t, tr, w, c, usage]) => {
        if (!live) return;
        setTransactions(t);
        setTransfers(tr);
        setWallets(w.items);
        setCategories(c.items);
        setUsedCategoryIds(new Set(usage.items.map((item) => item.category.id)));
        if (t && page > 1 && t.items.length === 0)
          setPage(Math.max(1, Math.ceil(t.total / 20)));
        if (tr && transferPage > 1 && tr.items.length === 0)
          setTransferPage(Math.max(1, Math.ceil(tr.total / 20)));
      })
      .catch((e) => {
        if (live) setError(errorMessage(e));
      })
      .finally(() => {
        if (live) setLoading(false);
      });
    return () => {
      live = false;
    };
  }, [
    month,
    kind,
    walletId,
    categoryId,
    page,
    transferPage,
    revision,
    showTransactions,
    showTransfers,
    search,
  ]);
  function filter(change: () => void) {
    change();
    setPage(1);
    setTransferPage(1);
  }
  function closeEditor() {
    setEditor(false);
    setEditing(null);
  }
  function edit(value: Editing) {
    setEditing(value);
    setEditor(true);
    setToast("");
    requestAnimationFrame(() =>
      document
        .getElementById("movement-heading")
        ?.scrollIntoView({ block: "center" }),
    );
  }
  async function remove() {
    if (!deleting) return;
    setBusy(true);
    setDeleteError("");
    try {
      await api(
        "/" +
          (deleting.kind === "TRANSFER" ? "transfers" : "transactions") +
          "/" +
          deleting.item.id,
        { method: "DELETE" },
      );
      setDeleting(null);
      setEditor(false);
      setEditing(null);
      setToast("Đã xóa giao dịch và cập nhật số dư ví.");
      setRevision((r) => r + 1);
    } catch (e) {
      setDeleteError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  const askDelete = (value: Editing) => {
    setDeleting(value);
    setDeleteError("");
  };

  return (
    <main>
      <PageHeader
        title="Giao dịch"
        description="Thu nhập, chi tiêu và chuyển tiền giữa các ví."
        actions={
          <div className="planner-month transactions-month-picker">
            <MonthPicker value={month} onChange={(value) => filter(() => setMonth(value))} />
          </div>
        }
      />
      {toast && (
        <div className="feedback-toast" role="status">
          {toast}
          <button
            type="button"
            className="secondary"
            aria-label="Đóng thông báo"
            onClick={() => setToast("")}
          >
            Đóng
          </button>
        </div>
      )}
      <section className="movement-filters card" aria-label="Bộ lọc">
        <label>
          Loại
          <SelectField ariaLabel="Loại" value={kind} options={[{value:"",label:"Tất cả"},{value:"INCOME",label:"Thu nhập"},{value:"EXPENSE",label:"Chi tiêu"},{value:"TRANSFER",label:"Chuyển tiền"}]} onChange={(value) =>
              filter(() => {
                setKind(value);
                setCategoryId("");
              })
            } />
        </label>
        <label>
          Ví
          <SelectField ariaLabel="Ví" value={walletId} options={[{value:"",label:"Tất cả"}, ...wallets.map((w) => ({value:w.id,label:w.name + (w.archivedAt ? " (đã lưu trữ)" : "")}))]} onChange={(value) => filter(() => setWalletId(value))} />
        </label>
        {kind !== "TRANSFER" && (
          <label>
            Danh mục
            <SelectField ariaLabel="Danh mục" value={categoryId} options={[{value:"",label:"Tất cả"}, ...categories.filter((c) => usedCategoryIds.has(c.id) && (!kind || c.type === kind)).map((c) => ({value:c.id,label:c.name}))]} onChange={(value) => filter(() => setCategoryId(value))} />
          </label>
        )}
        {kind !== "TRANSFER" && <label className="transaction-search">Tìm giao dịch<input aria-label="Tìm giao dịch" placeholder="Theo ghi chú hoặc danh mục..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} /></label>}
      </section>
      {loading ? (
        <LoadingSkeleton label="Đang tải lịch sử giao dịch…" />
      ) : error ? (
        <ErrorState message={error} onRetry={() => setRevision((r) => r + 1)} />
      ) : (
        <>
          {editor && (
            <div className="movement-edit-modal" role="dialog" aria-modal="true" aria-labelledby="movement-heading">
            <MovementForm
              key={editing ? editing.kind + editing.item.id : "new"}
              wallets={wallets}
              categories={categories}
              editing={editing}
              initialKind={initialKind}
              onCancel={closeEditor}
              onDelete={editing ? () => askDelete(editing) : undefined}
              onSaved={(message) => {
                closeEditor();
                setToast(message);
                setRevision((r) => r + 1);
              }}
            />
            </div>
          )}
          {transactions && (
            <section
              className="card history-section movement-history"
              aria-label="Lịch sử thu chi"
            >
              <h2>Thu nhập và chi tiêu</h2>
              {transactions.items.length === 0 ? (
                <EmptyState
                  title="Chưa có khoản thu hoặc chi"
                  description="Thay đổi bộ lọc hoặc thêm giao dịch đầu tiên."
                />
              ) : (
                <table className="movement-table">
                  <caption className="sr-only">
                    Thu nhập và chi tiêu trong tháng đã chọn
                  </caption>
                  <thead>
                    <tr>
                      <th scope="col">Ngày</th>
                      <th scope="col">Loại / Danh mục</th>
                      <th scope="col">Ví</th>
                      <th scope="col">Số tiền</th>
                      <th scope="col">Ghi chú</th>
                      <th scope="col"><span className="sr-only">Thao tác</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleTransactions.map((t) => (
                      <tr key={t.id}>
                        <td data-label="Ngày">{formatDate(t.transactionDate)}</td>
                        <td className="movement-kind-cell" data-label="Loại / Danh mục"><div className="movement-kind-stack">
                          <span
                            className={
                              t.type === "INCOME"
                                ? "badge movement-income"
                                : "badge movement-expense"
                            }
                          >
                            {t.type === "INCOME" ? "Thu nhập" : "Chi tiêu"}
                          </span>
                          <CategoryBadge category={t.category} compact /></div>
                        </td>
                        <td data-label="Ví">{t.wallet.name}</td>
                        <td data-label="Số tiền">
                          {t.type === "INCOME" ? "+" : "−"}
                          {formatVnd(t.amount)}
                        </td>
                        <td data-label="Ghi chú">{t.note || "—"}</td>
                        <td data-label="Thao tác">
                          <div className="row-actions"><button type="button" className="icon-action-button" aria-label="Sửa giao dịch" title="Sửa giao dịch" onClick={() => edit({ kind: "TRANSACTION", item: t })}><span className="pencil-icon" aria-hidden="true" /></button></div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              <Pagination
                name="Phân trang thu chi"
                page={page}
                total={search.trim() ? visibleTransactions.length : transactions.total}
                onChange={setPage}
              />
            </section>
          )}
          {transfers && (
            <section
              className="card history-section"
              aria-label="Lịch sử chuyển tiền"
            >
              <h2>Chuyển tiền giữa ví</h2>
              <p className="muted">
                Không tính vào thu nhập hoặc chi tiêu. Lọc theo ví nguồn hoặc ví
                nhận.
              </p>
              {transfers.items.length === 0 ? (
                <EmptyState
                  title="Chưa có chuyển tiền"
                  description="Chọn Chuyển tiền khi thêm giao dịch để di chuyển tiền giữa các ví."
                />
              ) : (
                <table className="movement-table">
                  <caption className="sr-only">
                    Chuyển tiền trong tháng đã chọn
                  </caption>
                  <thead>
                    <tr>
                      <th scope="col">Ngày</th>
                      <th scope="col">Loại</th>
                      <th scope="col">Ví nguồn → Ví nhận</th>
                      <th scope="col">Số tiền</th>
                      <th scope="col">Ghi chú</th>
                      <th scope="col"><span className="sr-only">Thao tác</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    {transfers.items.map((t) => (
                      <tr key={t.id}>
                        <td data-label="Ngày">{t.transferDate}</td>
                        <td data-label="Loại">
                          <span className="badge movement-transfer">
                            Chuyển tiền
                          </span>
                        </td>
                        <td data-label="Ví nguồn → Ví nhận">
                          {t.sourceWallet.name} → {t.destinationWallet.name}
                        </td>
                        <td data-label="Số tiền">{formatVnd(t.amount)}</td>
                        <td data-label="Ghi chú">{t.note || "—"}</td>
                        <td data-label="Thao tác">
                          <div className="row-actions"><button type="button" className="icon-action-button" aria-label="Sửa chuyển tiền" title="Sửa chuyển tiền" onClick={() => edit({ kind: "TRANSFER", item: t })}><span className="pencil-icon" aria-hidden="true" /></button></div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              <Pagination
                name="Phân trang chuyển tiền"
                page={transferPage}
                total={transfers.total}
                onChange={setTransferPage}
              />
            </section>
          )}
        </>
      )}
      {deleting && (
        <ConfirmDialog
          title={
            deleting.kind === "TRANSFER" ? "Xóa chuyển tiền?" : "Xóa giao dịch?"
          }
          busy={busy}
          error={deleteError}
          onCancel={() => setDeleting(null)}
          onConfirm={remove}
        >
          <p>
            {deleting.kind === "TRANSFER"
              ? "Số dư của cả ví nguồn và ví nhận sẽ được cập nhật."
              : "Số dư ví sẽ được cập nhật."}{" "}
            Giao dịch sẽ không còn xuất hiện trong lịch sử.
          </p>
          <p>
            <strong>{formatVnd(deleting.item.amount)}</strong> ·{" "}
            {deleting.item.note || "Không có ghi chú"}
          </p>
        </ConfirmDialog>
      )}
    </main>
  );
}
