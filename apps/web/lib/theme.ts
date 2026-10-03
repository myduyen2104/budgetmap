export const THEME_STORAGE_KEY = "budgetmap-theme-color";

export const THEME_PALETTES = [
  { id: "purple", name: "Tím pastel", color: "#806fe5", vars: ["#806fe5", "#5b4bb7", "#eee9ff", "#ddd5ff"] },
  { id: "orange", name: "Cam pastel", color: "#e6a47f", vars: ["#e6a47f", "#cf8a65", "#fff3ec", "#f3d8c9"] },
  { id: "blue", name: "Xanh pastel", color: "#82aee0", vars: ["#82aee0", "#6f9fd6", "#eef5ff", "#d3e3f8"] },
  { id: "red", name: "Đỏ pastel", color: "#e2949b", vars: ["#e2949b", "#d17d85", "#fff1f2", "#f3d2d5"] },
  { id: "pink", name: "Hồng pastel", color: "#df8fb4", vars: ["#df8fb4", "#c9789f", "#fff0f6", "#f2d3e1"] },
  { id: "green", name: "Xanh lá pastel", color: "#79b9aa", vars: ["#79b9aa", "#65aa9a", "#edf9f5", "#cfe9e1"] },
] as const;

export function applyThemePalette(id: string) {
  const root = document.documentElement;
  if (id === "purple" || id === "lavender" || !THEME_PALETTES.some((item) => item.id === id)) {
    root.removeAttribute("data-theme-color");
    ["--theme-bg", "--theme-page-bg", "--theme-primary", "--theme-primary-strong", "--theme-primary-soft", "--theme-border", "--theme-surface", "--theme-surface-muted", "--theme-surface-2", "--theme-line", "--theme-shadow", "--purple", "--purple-strong", "--purple-soft", "--purple-line", "--purple-border", "--brand", "--brand-strong", "--brand-soft", "--brand-border", "--brand-gradient"].forEach((name) => root.style.removeProperty(name));
    return;
  }
  const palette = THEME_PALETTES.find((item) => item.id === id) ?? THEME_PALETTES[0];
  const [primary, strong, soft, line] = palette.vars;
  root.dataset.themeColor = id;
  root.style.setProperty("--theme-primary", primary);
  root.style.setProperty("--theme-primary-strong", strong);
  root.style.setProperty("--theme-primary-soft", soft);
  root.style.setProperty("--theme-border", line);
  root.style.setProperty("--purple", primary);
  root.style.setProperty("--purple-strong", strong);
  root.style.setProperty("--purple-soft", soft);
  root.style.setProperty("--purple-line", line);
  root.style.setProperty("--purple-border", line);
  root.style.setProperty("--brand", primary);
  root.style.setProperty("--brand-strong", strong);
  root.style.setProperty("--brand-soft", soft);
  root.style.setProperty("--brand-border", line);
  root.style.setProperty("--brand-gradient", `linear-gradient(135deg, ${primary} 0%, ${strong} 100%)`);
  root.style.setProperty("--theme-page-bg", `color-mix(in srgb, ${soft} 28%, #fbfaff)`);
  root.style.setProperty("--theme-bg", `color-mix(in srgb, ${soft} 28%, #fbfaff)`);
  root.style.setProperty("--theme-surface", `color-mix(in srgb, ${soft} 10%, #ffffff)`);
  root.style.setProperty("--theme-surface-2", `color-mix(in srgb, ${soft} 42%, #ffffff)`);
  root.style.setProperty("--theme-line", `color-mix(in srgb, ${line} 76%, #ffffff)`);
  root.style.setProperty("--theme-shadow", `0 10px 30px color-mix(in srgb, ${strong} 20%, transparent)`);
  root.style.setProperty("--theme-surface", `color-mix(in srgb, ${soft} 10%, #ffffff)`);
  root.style.setProperty("--theme-surface-muted", `color-mix(in srgb, ${soft} 42%, #ffffff)`);
}
