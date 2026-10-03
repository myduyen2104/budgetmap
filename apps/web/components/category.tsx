"use client";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { CATEGORY_COLORS, CATEGORY_ICONS, CategoryColor, CategoryIcon } from "../../../packages/shared/src/categories";
import { defaultCategory } from "../../../packages/shared/src/categories";

export type CategoryLike = { id?: string; name: string; type?: "INCOME" | "EXPENSE"; icon?: string | null; color?: string | null; archivedAt?: string | null };

const iconClass: Record<string, string> = {
  house: "fi-rr-home", home: "fi-rr-home", utensils: "fi-rr-utensils", lightbulb: "fi-rr-bulb",
  droplet: "fi-rr-water", wifi: "fi-rr-wifi", phone: "fi-rr-mobile-button", car: "fi-rr-car",
  parking: "fi-rr-parking", taxi: "fi-rr-taxi", wrench: "fi-rr-tools", "shopping-bag": "fi-rr-shopping-bag",
  shirt: "fi-rr-shirt", sparkles: "fi-rr-sparkles", laptop: "fi-rr-laptop", gamepad: "fi-rr-gamepad",
  film: "fi-rr-film", calendar: "fi-rr-calendar", "heart-pulse": "fi-rr-heart-rate", pill: "fi-rr-pills",
  book: "fi-rr-book-alt", "graduation-cap": "fi-rr-graduation-cap", shield: "fi-rr-shield-check",
  "credit-card": "fi-rr-credit-card", receipt: "fi-rr-receipt", "chart-line": "fi-rr-chart-line-up",
  "piggy-bank": "fi-rr-piggy-bank", users: "fi-rr-users", gift: "fi-rr-gift", paw: "fi-rr-paw",
  plane: "fi-rr-plane", repeat: "fi-rr-refresh", briefcase: "fi-rr-briefcase", bank: "fi-rr-bank",
  building: "fi-rr-building", wallet: "fi-rr-wallet", tag: "fi-rr-label", "circle-dollar-sign": "fi-rr-usd-circle",
  dumbbell: "fi-rr-heart-rate", gym: "fi-rr-gym", swimmer: "fi-rr-swimmer", "swimming-pool": "fi-rr-swimming-pool", running: "fi-rr-running", bike: "fi-rr-bike", "stationary-bike": "fi-rr-stationary-bike",
  basketball: "fi-rr-basketball", tennis: "fi-rr-tennis", sport: "fi-rr-sport", spa: "fi-rr-spa", massage: "fi-rr-massage", "spray-can-sparkles": "fi-rr-spray-can-sparkles",
  robot: "fi-rr-robot", "cloud-code": "fi-rr-cloud-code", "laptop-code": "fi-rr-laptop-code", cloud: "fi-rr-cloud", headphones: "fi-rr-headphones",
  pets: "fi-rr-pets", dog: "fi-rr-dog", cat: "fi-rr-cat", baby: "fi-rr-baby", doctor: "fi-rr-doctor", medicine: "fi-rr-medicine", tooth: "fi-rr-tooth", stethoscope: "fi-rr-stethoscope",
  hospital: "fi-rr-hospital", ambulance: "fi-rr-ambulance", syringe: "fi-rr-syringe", "medical-star": "fi-rr-medical-star",
  umbrella: "fi-rr-umbrella", "file-invoice": "fi-rr-file-invoice", school: "fi-rr-school", pencil: "fi-rr-pencil", calculator: "fi-rr-calculator",
  child: "fi-rr-child", "baby-carriage": "fi-rr-baby-carriage", restaurant: "fi-rr-restaurant", "apple-whole": "fi-rr-apple-whole", "grocery-bag": "fi-rr-grocery-bag", basket: "fi-rr-basket",
  bed: "fi-rr-bed", sofa: "fi-rr-sofa", broom: "fi-rr-broom", key: "fi-rr-key",
};

export const categoryIconClass = (icon?: string | null) => iconClass[icon ?? "tag"] ?? iconClass.tag;
export const categoryColorClass = (color?: string | null) => `category-color-${color ?? "slate"}`;
export const categoryColorValue = (color?: string | null) => ({ purple: "#806fe5", orange: "#d88749", blue: "#4e87c7", pink: "#d66b9b", violet: "#9573c8", red: "#ca6262", indigo: "#6576c7", green: "#4f9b79", teal: "#459c9b", amber: "#bc8a3c", slate: "#778096" } as Record<string, string>)[color ?? "slate"] ?? "#778096";

export function CategoryBadge({ category, compact = false }: { category: CategoryLike; compact?: boolean }) {
  const fallback = category.type ? defaultCategory(category.name, category.type) : undefined;
  const icon = category.icon ?? fallback?.icon;
  const color = category.color ?? fallback?.color;
  return <span className={`category-badge ${categoryColorClass(color)} ${compact ? "compact" : ""}`}>
    <span className="category-icon" aria-hidden="true"><i className={categoryIconClass(icon)} /></span>
    <span>{category.name}</span>
  </span>;
}

export function CategoryPicker({ icon, color, name, onIconChange, onColorChange }: { icon: string; color: string; name?: string; onIconChange: (value: CategoryIcon) => void; onColorChange: (value: CategoryColor) => void }) {
  const [showAll, setShowAll] = useState(false);
  const icons = useMemo(() => showAll ? CATEGORY_ICONS : CATEGORY_ICONS.slice(0, 24), [showAll]);
  return <div className="category-picker">
    <div className="category-preview"><CategoryBadge category={{ name: name?.trim() || "Xem trước", icon, color }} /></div>
    <span className="picker-label">Biểu tượng</span>
    <div className="icon-grid" role="radiogroup" aria-label="Biểu tượng danh mục">
      {icons.map((x) => <button type="button" key={x} className={icon === x ? "selected" : ""} aria-label={`Chọn biểu tượng ${x}`} aria-pressed={icon === x} onClick={() => onIconChange(x)}><i className={categoryIconClass(x)} aria-hidden="true" /></button>)}
    </div>
    <button type="button" className="secondary picker-more" onClick={() => setShowAll(!showAll)}>{showAll ? "Thu gọn" : "Xem thêm biểu tượng"}</button>
    <span className="picker-label">Màu nhận diện</span>
    <div className="color-grid" role="radiogroup" aria-label="Màu danh mục">
      {CATEGORY_COLORS.map((x) => <button type="button" key={x} className={`color-swatch ${categoryColorClass(x)} ${color === x ? "selected" : ""}`} aria-label={`Chọn màu ${x}`} aria-pressed={color === x} onClick={() => onColorChange(x)}><span aria-hidden="true" /></button>)}
    </div>
  </div>;
}

export function CategorySelect({ categories, value, onChange, type, onCreate }: { categories: CategoryLike[]; value: string; onChange: (id: string) => void; type: "INCOME" | "EXPENSE"; onCreate: (name: string, icon: CategoryIcon, color: CategoryColor) => Promise<CategoryLike> }) {
  const [open, setOpen] = useState(false), [search, setSearch] = useState(""), [creating, setCreating] = useState(false), [name, setName] = useState(""), [icon, setIcon] = useState<CategoryIcon>("tag"), [color, setColor] = useState<CategoryColor>("slate"), [local, setLocal] = useState<CategoryLike[]>([]);
  useEffect(() => {
    if (!creating) return;
    document.documentElement.classList.add("category-modal-open");
    document.body.classList.add("category-modal-open");
    return () => {
      document.documentElement.classList.remove("category-modal-open");
      document.body.classList.remove("category-modal-open");
    };
  }, [creating]);
  const all = [...categories.filter((x) => !x.archivedAt && x.type === type), ...local];
  const selected = all.find((x) => x.id === value);
  const visible = all.filter((x) => x.name.toLocaleLowerCase().includes(search.toLocaleLowerCase()));
  const create = async () => { if (!name.trim()) return; const c = await onCreate(name.trim(), icon, color); setLocal([...local, c]); onChange(c.id!); setCreating(false); setName(""); setOpen(false); };
  const createDialog = creating && typeof document !== "undefined" ? createPortal(<><div className="category-create-overlay" aria-hidden="true" onMouseDown={() => setCreating(false)} /><div className="category-create-popover" role="dialog" aria-modal="true" aria-label="Tạo danh mục nhanh" onMouseDown={(event) => event.stopPropagation()}><h3>Tạo danh mục mới</h3><input aria-label="Tên danh mục mới" placeholder="Tên danh mục" value={name} onChange={(e) => setName(e.target.value)} /><CategoryPicker icon={icon} color={color} onIconChange={setIcon} onColorChange={setColor} /><div className="actions"><button type="button" onClick={create}>Tạo và chọn</button><button type="button" className="secondary" onClick={() => setCreating(false)}>Hủy</button></div></div></>, document.body) : null;
  return <><div className="category-select"><button type="button" className="category-select-trigger" aria-label="Danh mục" aria-expanded={open} onClick={() => setOpen(!open)}>{selected ? <CategoryBadge category={selected} /> : <span>Chọn danh mục</span>}<span aria-hidden="true">⌄</span></button>{open && <div className="category-select-menu" role="listbox" aria-label="Danh mục"><input autoFocus aria-label="Tìm danh mục" placeholder="Tìm danh mục..." value={search} onChange={(e) => setSearch(e.target.value)} />{visible.map((c) => <button type="button" role="option" aria-selected={c.id === value} key={c.id} onClick={() => { onChange(c.id!); setOpen(false); }}><CategoryBadge category={c} /></button>)}<button type="button" className="quick-category-create" onClick={() => { setCreating(true); setOpen(false); }}>＋ Tạo danh mục mới</button></div>}</div>{createDialog}</>;
}
