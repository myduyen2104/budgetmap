export const THEME_STORAGE_KEY = "budgetmap-theme-color";

export const THEME_PALETTES = [
  { id: "purple", name: "Tím", color: "#806fe5", vars: ["#806fe5", "#5b4bb7", "#eee9ff", "#ddd5ff"] },
  { id: "orange", name: "Cam", color: "#e6a47f", vars: ["#e6a47f", "#cf8a65", "#fff3ec", "#f3d8c9"] },
  { id: "yellow", name: "Vàng", color: "#f2d477", vars: ["#f2d477", "#d9b332", "#fff8e3", "#efdfa9"] },
  { id: "brown", name: "Nâu", color: "#b99a82", vars: ["#b99a82", "#6f4e37", "#f7f1eb", "#e8d9cc"] },
  { id: "blue", name: "Xanh dương", color: "#82aee0", vars: ["#82aee0", "#6f9fd6", "#eef5ff", "#d3e3f8"] },
  { id: "cyan", name: "Xanh cyan", color: "#82cfe0", vars: ["#82cfe0", "#519eb2", "#effafd", "#d2edf2"] },
  { id: "red", name: "Đỏ", color: "#df6268", vars: ["#df6268", "#bf3f4b", "#fff0f0", "#f0c5c7"] },
  { id: "burgundy", name: "Đỏ Burgundy", color: "#800020", vars: ["#800020", "#600018", "#f8edf0", "#e6cbd2"] },
  { id: "pink", name: "Hồng pastel", color: "#df8fb4", vars: ["#df8fb4", "#c9789f", "#fff0f6", "#f2d3e1"] },
  { id: "green", name: "Xanh lá", color: "#82b98f", vars: ["#82b98f", "#64a976", "#eff8f0", "#d2e7d7"] },
] as const;

export function applyThemePalette(id: string) {
  const root = document.documentElement;
  if (id === "lavender" || !THEME_PALETTES.some((item) => item.id === id)) {
    root.removeAttribute("data-theme-color");
    ["--theme-bg", "--theme-page-bg", "--theme-primary", "--theme-primary-strong", "--theme-primary-soft", "--theme-border", "--theme-surface", "--theme-surface-muted", "--theme-surface-2", "--theme-line", "--theme-shadow", "--purple", "--purple-strong", "--purple-soft", "--purple-line", "--purple-border", "--brand", "--brand-strong", "--brand-soft", "--brand-border", "--brand-gradient"].forEach((name) => root.style.removeProperty(name));
    return;
  }
  const palette = THEME_PALETTES.find((item) => item.id === id) ?? THEME_PALETTES[0];
  const [primary, strong, soft, line] = palette.vars;
  root.dataset.themeColor = id;
  const dark = root.dataset.theme === "dark";
  const darkPrimary = id === "burgundy" ? "#6f102b" : primary;
  const darkStrong = id === "burgundy" ? "#941f40" : strong;
  root.style.setProperty("--theme-primary", dark ? darkPrimary : primary);
  root.style.setProperty("--theme-primary-strong", dark ? darkStrong : strong);
  // Dark surfaces stay neutral regardless of the selected accent.
  const darkSoft = "#262b31";
  const darkLine = "#3b424a";
  root.style.setProperty("--theme-primary-soft", dark ? darkSoft : soft);
  root.style.setProperty("--theme-border", dark ? darkLine : line);
  root.style.setProperty("--purple", dark ? darkPrimary : primary);
  root.style.setProperty("--purple-strong", dark ? darkStrong : strong);
  root.style.setProperty("--purple-soft", dark ? darkSoft : soft);
  root.style.setProperty("--purple-line", dark ? darkLine : line);
  root.style.setProperty("--purple-border", dark ? darkLine : line);
  root.style.setProperty("--brand", dark ? darkPrimary : primary);
  root.style.setProperty("--brand-strong", dark ? darkStrong : strong);
  root.style.setProperty("--brand-soft", dark ? darkSoft : soft);
  root.style.setProperty("--brand-border", dark ? darkLine : line);
  root.style.setProperty("--brand-gradient", `linear-gradient(135deg, ${dark ? darkPrimary : primary} 0%, ${dark ? darkStrong : strong} 100%)`);
  // Keep palette accents separate from light/dark surfaces. Setting light
  // surfaces inline here used to override the dark-mode stylesheet.
  root.style.setProperty("--theme-page-bg", dark ? "#111315" : `color-mix(in srgb, ${soft} 28%, #fbfaff)`);
  root.style.setProperty("--theme-bg", dark ? "#111315" : `color-mix(in srgb, ${soft} 28%, #fbfaff)`);
  root.style.setProperty("--theme-surface", dark ? "#1a1d21" : `color-mix(in srgb, ${soft} 10%, #ffffff)`);
  root.style.setProperty("--theme-surface-2", dark ? "#23272c" : `color-mix(in srgb, ${soft} 42%, #ffffff)`);
  root.style.setProperty("--theme-line", dark ? "#3b424a" : `color-mix(in srgb, ${line} 76%, #ffffff)`);
  root.style.setProperty("--theme-shadow", `0 10px 30px color-mix(in srgb, ${strong} 20%, transparent)`);
  root.style.setProperty("--theme-surface-muted", dark ? "#23272c" : `color-mix(in srgb, ${soft} 42%, #ffffff)`);
}
