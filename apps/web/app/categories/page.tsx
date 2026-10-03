"use client";
import { FormEvent, useEffect, useState } from "react";
import { api } from "../../lib/api";
import { PageHeader } from "../../components/ui";
import { CategoryBadge, CategoryPicker } from "../../components/category";
import { defaultCategory, CategoryColor, CategoryIcon } from "../../../../packages/shared/src/categories";

type Kind = "INCOME" | "EXPENSE";
type Category = { id: string; name: string; type: Kind; icon?: string | null; color?: string | null; archivedAt?: string | null };

export default function Categories() {
  const [items, setItems] = useState<Category[]>([]), [tab, setTab] = useState<Kind>("EXPENSE"), [editing, setEditing] = useState<string | null>(null), [name, setName] = useState(""), [type, setType] = useState<Kind>("EXPENSE"), [typeOpen, setTypeOpen] = useState(false), [icon, setIcon] = useState<CategoryIcon>("tag"), [color, setColor] = useState<CategoryColor>("slate"), [error, setError] = useState(""), [loading, setLoading] = useState(true);
  const load = () => { setLoading(true); api<{ items: Category[] }>("/categories?includeArchived=true").then((x) => setItems(x.items)).catch(() => setError("Không thể tải danh mục.")).finally(() => setLoading(false)); };
  useEffect(load, []);
  const reset = () => { setEditing(null); setName(""); setIcon("tag"); setColor("slate"); };
  const save = async (e: FormEvent) => { e.preventDefault(); setError(""); try { await api(editing ? `/categories/${editing}` : "/categories", { method: editing ? "PATCH" : "POST", body: JSON.stringify({ name: name.trim(), type, icon, color }) }); reset(); load(); } catch (e) { setError(e instanceof Error && e.message === "CATEGORY_DUPLICATE" ? "Danh mục cùng loại đã tồn tại." : "Không thể lưu danh mục."); } };
  const startEdit = (c: Category) => { setEditing(c.id); setName(c.name); setType(c.type); setIcon((c.icon as CategoryIcon) || defaultCategory(c.name, c.type).icon); setColor((c.color as CategoryColor) || defaultCategory(c.name, c.type).color); };
  return <main>
    <PageHeader title="Danh mục" description="Nhận diện khoản tiền bằng icon và màu — tạo sẵn, dễ tìm, vẫn tùy chỉnh theo bạn." />
    <div className="grid grid-2">
      <section className="card category-editor">
        <h2>{editing ? "Sửa danh mục" : "Tạo danh mục"}</h2>
        <form className="form-grid" onSubmit={save}>
          <label>Tên danh mục<input required maxLength={120} value={name} onChange={(e) => setName(e.target.value)} placeholder="Ví dụ: Mua iPhone" /></label>
          <label>Loại<div className="select-field category-type-select"><button type="button" className="select-trigger" aria-expanded={typeOpen} onClick={() => setTypeOpen(!typeOpen)}><span>{type === "EXPENSE" ? "Chi tiêu" : "Thu nhập"}</span><i className={typeOpen ? "fi-rr-angle-small-up" : "fi-rr-angle-small-down"} aria-hidden="true" /></button>{typeOpen && <div className="select-menu" role="listbox" aria-label="Chọn loại danh mục"><button type="button" className={type === "EXPENSE" ? "selected" : ""} role="option" aria-selected={type === "EXPENSE"} onClick={() => { const next: Kind = "EXPENSE"; setType(next); setTypeOpen(false); const f = defaultCategory(name, next); if (!editing) { setIcon(f.icon); setColor(f.color); } }}>Chi tiêu</button><button type="button" className={type === "INCOME" ? "selected" : ""} role="option" aria-selected={type === "INCOME"} onClick={() => { const next: Kind = "INCOME"; setType(next); setTypeOpen(false); const f = defaultCategory(name, next); if (!editing) { setIcon(f.icon); setColor(f.color); } }}>Thu nhập</button></div>}</div></label>
          <CategoryPicker icon={icon} color={color} onIconChange={setIcon} onColorChange={setColor} />
          <div className="actions"><button>{editing ? "Cập nhật" : "Thêm danh mục"}</button>{editing && <button type="button" className="secondary" onClick={reset}>Hủy</button>}</div>
        </form>
      </section>
      <section className="card category-list-card">
        <div className="section-heading"><div><h2>Danh mục của bạn</h2><p className="muted">Danh mục mặc định dùng ngay, danh mục riêng vẫn hoàn toàn thuộc về bạn.</p></div></div>
        <div className="category-tabs" role="tablist" aria-label="Loại danh mục"><button className={tab === "EXPENSE" ? "active" : "secondary"} role="tab" aria-selected={tab === "EXPENSE"} onClick={() => setTab("EXPENSE")}>Khoản chi</button><button className={tab === "INCOME" ? "active" : "secondary"} role="tab" aria-selected={tab === "INCOME"} onClick={() => setTab("INCOME")}>Khoản thu</button></div>
        {error && <p className="error" role="alert">{error}</p>}
        {loading ? <p className="muted">Đang tải…</p> : <div className="category-card-list">{items.filter((c) => c.type === tab).map((c) => <article className={`category-list-item ${c.archivedAt ? "archived" : ""}`} key={c.id}><CategoryBadge category={c} /><span className="badge">{c.archivedAt ? "Đã lưu trữ" : c.type === "INCOME" ? "Thu nhập" : "Chi tiêu"}</span><div className="row-actions"><button className="secondary" onClick={() => startEdit(c)}>Sửa</button>{!c.archivedAt && <button className="danger" onClick={async () => { if (confirm("Lưu trữ danh mục này? Giao dịch cũ vẫn được giữ nguyên.")) { await api(`/categories/${c.id}/archive`, { method: "POST" }); load(); } }}>Lưu trữ</button>}</div></article>)}</div>}
      </section>
    </div>
  </main>;
}
