"use client";
import { ReactNode, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "../lib/api";
import { currentMonth } from "../lib/movements";
import { applyThemePalette, THEME_STORAGE_KEY } from "../lib/theme";
const baseLinks = [
  ["/dashboard", "Tổng quan", "fi-rr-home"],
  ["/transactions", "Giao dịch", "fi-rr-exchange-alt"],
  ["/plans/current", "Kế hoạch tháng", "fi-rr-calendar-days"],
  ["/analysis", "Phân tích", "fi-rr-chart-pie"],
  ["/wallets", "Ví tiền", "fi-rr-wallet"],
  ["/categories", "Danh mục", "fi-rr-category"],
  ["/profile", "Hồ sơ", "fi-rr-user"],
];
export function AppShell({ children }: { children: ReactNode }) {
  const path = usePathname(),
    router = useRouter(),
    [open, setOpen] = useState(false),
    [name, setName] = useState(""),
    [theme, setTheme] = useState<"light" | "dark">("light");
  const [currentYear, currentMonthNumber] = currentMonth().split("-");
  const links = baseLinks.map(([href, label, icon]) => href === "/plans/current"
    ? [`/plans/${currentYear}/${currentMonthNumber}`, label, icon]
    : [href, label, icon]);
  const publicPage = path === "/login" || path === "/register";
  useEffect(() => {
    const saved = window.localStorage.getItem("budgetmap-theme") as "light" | "dark" | null;
    const next = saved === "dark" || saved === "light"
      ? saved
      : (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    setTheme(next);
    document.documentElement.dataset.theme = next;
    applyThemePalette(window.localStorage.getItem(THEME_STORAGE_KEY) ?? "purple");
  }, []);
  function changeTheme(next: "light" | "dark") {
    setTheme(next);
    document.documentElement.dataset.theme = next;
    window.localStorage.setItem("budgetmap-theme", next);
  }
  useEffect(() => {
    if (publicPage) {
      setName("");
      return;
    }
    api<{ displayName: string | null }>("/auth/me")
      .then((u) => setName(u.displayName ?? "Bạn"))
      .catch(() => {});
  }, [path]);
  useEffect(() => {
    document.documentElement.classList.toggle("mobile-menu-open", open);
    document.body.classList.toggle("mobile-menu-open", open);
    return () => {
      document.documentElement.classList.remove("mobile-menu-open");
      document.body.classList.remove("mobile-menu-open");
    };
  }, [open]);
  const logout = async () => {
    await api("/auth/logout", { method: "POST" });
    router.replace("/login");
  };
  if (publicPage) return <div className="public-shell"><div className="public-brand"><img className="brand-app-icon" src="/brand/app-icon-pastel.png" alt="" /><strong>BudgetMap</strong></div>{children}</div>;
  return (
    <div className="shell">
      <aside className={open ? "sidebar open" : "sidebar"}>
        <div className="brand">
          <img className="brand-app-icon" src="/brand/app-icon-pastel.png" alt="" />
          <span>BudgetMap</span>
        </div>
        <nav aria-label="Điều hướng chính">
          {links.slice(0, -1).map(([href, label, icon]) => (
            <Link
              className={
                path === href || path.startsWith(href + "/") ? "active" : ""
              }
              href={href}
              key={href}
              onClick={() => setOpen(false)}
            >
              <span className={icon} aria-hidden="true" />
              {label}
            </Link>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <Link
            className={path === "/settings" ? "active" : ""}
            href="/settings"
            onClick={() => setOpen(false)}
          >
            <span className="fi-rr-settings" aria-hidden="true" />
            Cài đặt
          </Link>
          <Link
            className={path === "/profile" ? "active" : ""}
            href="/profile"
            onClick={() => setOpen(false)}
          >
            <span className="fi-rr-user" aria-hidden="true" />
            Hồ sơ
          </Link>
          <button className="logout" onClick={logout}>
            <i className="fi-rr-sign-out-alt" aria-hidden="true" /> <span>Đăng xuất</span>
          </button>
        </div>
      </aside>
      {open && (
        <button
          className="scrim"
          aria-label="Đóng menu"
          onClick={() => setOpen(false)}
        />
      )}
      <section className="content">
        <header className="topbar" role="banner">
          <button
            className="menu"
            aria-label="Mở menu"
            onClick={() => setOpen(true)}
          >
            <i className="fi-rr-menu-burger" aria-hidden="true" />
          </button>
          <div className="theme-controls" aria-label="Chế độ màu">
            <button className="theme-toggle" aria-label="Chuyển sáng tối" onClick={() => changeTheme(theme === "dark" ? "light" : "dark")}><span className={`theme-toggle-icon ${theme === "light" ? "moon" : "eclipse"}`} aria-hidden="true" /></button>
          </div>
          <div>
            <strong>{name || "BudgetMap"}</strong>
          </div>
          <button
            className="avatar"
            aria-label="Mở hồ sơ"
            onClick={() => router.push("/profile")}
          >
            {name.slice(0, 1).toUpperCase() || "B"}
          </button>
        </header>
        <div className="page">{children}</div>
        <nav className="mobile-nav" aria-label="Điều hướng nhanh">{links.slice(0,5).map(([href,label,icon]) => <Link key={href} href={href} className={path === href || path.startsWith(href + "/") ? "active" : ""}><span className={icon} aria-hidden="true" /><small>{label.replace("Tổng quan","Tổng quan").replace("Kế hoạch tháng","Kế hoạch")}</small></Link>)}</nav>
      </section>
    </div>
  );
}
