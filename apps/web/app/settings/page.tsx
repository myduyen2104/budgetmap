"use client";
import { useEffect, useState } from "react";
import { PageHeader } from "../../components/ui";
import { applyThemePalette, THEME_PALETTES, THEME_STORAGE_KEY } from "../../lib/theme";

export default function Settings() {
  const [selected, setSelected] = useState("purple");
  useEffect(() => {
    const savedValue = window.localStorage.getItem(THEME_STORAGE_KEY) ?? "purple";
    const saved = savedValue === "lavender" ? "purple" : savedValue;
    setSelected(saved);
    applyThemePalette(saved);
  }, []);
  const choose = (id: string) => {
    setSelected(id);
    window.localStorage.setItem(THEME_STORAGE_KEY, id);
    applyThemePalette(id);
  };
  return <main>
    <PageHeader title="Cài đặt" description="Tùy chỉnh cách BudgetMap hiển thị theo sở thích của bạn." />
    <section className="card settings-card">
      <div className="profile-section-heading"><div><h2>Màu theme giao diện</h2><p className="muted">Chọn màu để áp dụng cho toàn bộ app. Tím pastel là theme mặc định.</p></div><span className="profile-section-icon" aria-hidden="true"><i className="fi-rr-palette" /></span></div>
      <div className="theme-palette-grid" role="radiogroup" aria-label="Chọn màu theme">
        {THEME_PALETTES.map((palette) => <button type="button" key={palette.id} className={`theme-palette-option${selected === palette.id ? " selected" : ""}`} role="radio" aria-checked={selected === palette.id} onClick={() => choose(palette.id)}><span className="theme-palette-swatch" style={{ background: palette.color }} aria-hidden="true" /><span>{palette.name}</span>{selected === palette.id && <i className="fi-rr-check" aria-hidden="true" />}</button>)}
      </div>
    </section>
  </main>;
}
