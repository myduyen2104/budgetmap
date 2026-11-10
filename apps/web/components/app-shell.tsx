"use client";
import { ReactNode, useEffect, useState } from "react";
import type { CSSProperties } from "react";
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
  ["/financial-map", "Bản đồ tài chính", "fi-rr-route"],
  ["/wallets", "Ví tiền", "fi-rr-wallet"],
  ["/categories", "Danh mục", "fi-rr-category"],
  ["/profile", "Hồ sơ", "fi-rr-user"],
];
export function AppShell({ children }: { children: ReactNode }) {
  const path = usePathname(),
    router = useRouter(),
    [open, setOpen] = useState(false),
    [headerHidden, setHeaderHidden] = useState(false),
    [name, setName] = useState(""),
    [unreadCount, setUnreadCount] = useState(0),
    [theme, setTheme] = useState<"light" | "dark">("light");
  const [currentYear, currentMonthNumber] = currentMonth().split("-");
  const links = baseLinks.map(([href, label, icon]) =>
    href === "/plans/current"
      ? [`/plans/${currentYear}/${currentMonthNumber}`, label, icon]
      : [href, label, icon],
  );
  const mobileLinks = links.slice(0, 5);
  const mobileActiveIndex = mobileLinks.findIndex(
    ([href]) => path === href || path.startsWith(href + "/"),
  );
  const publicPage = path === "/login" || path === "/register";
  useEffect(() => {
    const saved = window.localStorage.getItem("budgetmap-theme") as
      | "light"
      | "dark"
      | null;
    const next =
      saved === "dark" || saved === "light"
        ? saved
        : window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light";
    setTheme(next);
    document.documentElement.dataset.theme = next;
    applyThemePalette(
      window.localStorage.getItem(THEME_STORAGE_KEY) ?? "purple",
    );
  }, []);
  function changeTheme(next: "light" | "dark") {
    const root = document.documentElement;
    // Dark mode changes substantially more surface colors than light mode.
    // Prevent every card and navigation item from interpolating at once;
    // that causes a visible paint hitch on smaller devices.
    root.classList.add("theme-switching");
    setTheme(next);
    root.dataset.theme = next;
    window.localStorage.setItem("budgetmap-theme", next);
    // Recompute palette-derived surfaces after the mode changes. Without this,
    // inline palette variables retained the colors from the previous mode.
    applyThemePalette(
      window.localStorage.getItem(THEME_STORAGE_KEY) ?? "purple",
    );
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => root.classList.remove("theme-switching"));
    });
  }
  useEffect(() => {
    if (publicPage) {
      setName("");
      return;
    }
    api<{ displayName: string | null }>("/auth/me")
      .then((u) => setName(u.displayName ?? "Bạn"))
      .catch(() => {});
  }, [publicPage]);
  useEffect(() => {
    if (publicPage) { setUnreadCount(0); return; }
    let active = true;
    const refresh = () => api<{ unreadCount: number }>("/notifications")
      .then((data) => { if (active) setUnreadCount(data.unreadCount); })
      .catch(() => {});
    void refresh();
    const timer = window.setInterval(refresh, 60_000);
    const onUpdate = () => void refresh();
    window.addEventListener("budgetmap-notifications-updated", onUpdate);
    return () => { active = false; window.clearInterval(timer); window.removeEventListener("budgetmap-notifications-updated", onUpdate); };
  }, [publicPage, path]);
  useEffect(() => {
    document.documentElement.classList.toggle("mobile-menu-open", open);
    document.body.classList.toggle("mobile-menu-open", open);
    return () => {
      document.documentElement.classList.remove("mobile-menu-open");
      document.body.classList.remove("mobile-menu-open");
    };
  }, [open]);
  useEffect(() => {
    const root = document.documentElement;
    const content = document.querySelector<HTMLElement>(".content");
    const mobileOrTablet = window.matchMedia("(max-width: 1100px)");
    let lastScrollY = 0;

    const clearHidden = () => {
      root.classList.remove("app-header-hidden");
      setHeaderHidden(false);
    };
    const onScroll = (event: Event) => {
      if (!mobileOrTablet.matches || open) return;

      // Phones scroll the document; tablets use the app's dedicated content pane.
      const isPhone = window.matchMedia("(max-width: 640px)").matches;
      if (
        (isPhone && event.currentTarget !== window) ||
        (!isPhone && event.currentTarget !== content)
      ) {
        return;
      }

      const scrollY = isPhone
        ? window.scrollY || root.scrollTop
        : content?.scrollTop ?? 0;
      const delta = scrollY - lastScrollY;
      let shouldHide = root.classList.contains("app-header-hidden");

      if (scrollY <= 12) shouldHide = false;
      else if (scrollY > 96 && delta > 5) shouldHide = true;
      else if (delta < -5) shouldHide = false;

      if (shouldHide !== root.classList.contains("app-header-hidden")) {
        root.classList.toggle("app-header-hidden", shouldHide);
        setHeaderHidden(shouldHide);
      }
      lastScrollY = scrollY;
    };
    const onViewportChange = () => {
      lastScrollY = 0;
      clearHidden();
    };

    clearHidden();
    window.addEventListener("scroll", onScroll, { passive: true });
    content?.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onViewportChange, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      content?.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onViewportChange);
      root.classList.remove("app-header-hidden");
    };
  }, [open, path]);
  const logout = async () => {
    await api("/auth/logout", { method: "POST" });
    router.replace("/login");
  };
  if (publicPage)
    return (
      <div className="public-shell">
        <div className="public-brand">
          <img
            className="brand-app-icon"
            src="/brand/app-icon-pastel.png"
            alt=""
          />
          <strong>BudgetMap</strong>
        </div>
        {children}
      </div>
    );
  return (
    <div className="shell">
      <aside className={open ? "sidebar open" : "sidebar"}>
        <div className="brand">
          <img
            className="brand-app-icon"
            src="/brand/app-icon-pastel.png"
            alt=""
          />
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
              title={label}
              aria-current={path === href || path.startsWith(href + "/") ? "page" : undefined}
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
            <i className="fi-rr-sign-out-alt" aria-hidden="true" />{" "}
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>
      {open && (
        <div
          className="scrim"
          role="button"
          tabIndex={0}
          aria-label="Đóng menu"
          onClick={() => setOpen(false)}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              setOpen(false);
            }
          }}
        />
      )}
      <section className="content">
        <header
          className={`topbar${headerHidden ? " is-scroll-hidden" : ""}`}
          role="banner"
        >
          <button
            className="menu"
            aria-label="Mở menu"
            onClick={() => setOpen(true)}
          >
            <i className="fi-rr-menu-burger" aria-hidden="true" />
          </button>
          <div className="theme-controls" aria-label="Chế độ màu">
            <button
              className="theme-toggle"
              aria-label="Chuyển sáng tối"
              onClick={() => changeTheme(theme === "dark" ? "light" : "dark")}
            >
              <span
                className={`theme-toggle-icon ${theme === "light" ? "moon" : "eclipse"}`}
                aria-hidden="true"
              />
            </button>
          </div>
          <div>
            <strong>{name || "BudgetMap"}</strong>
          </div>
          <div className="topbar-actions">
            <button
              className="notification-bell"
              aria-label={unreadCount ? `Thông báo, ${unreadCount} chưa đọc` : "Thông báo"}
              onClick={() => router.push("/notifications")}
            >
              <i className="fi-rr-bell" aria-hidden="true" />
              {unreadCount > 0 && <span className="notification-badge" aria-hidden="true">{unreadCount > 99 ? "99+" : unreadCount}</span>}
            </button>
          <button
            className="avatar"
            aria-label="Mở hồ sơ"
            onClick={() => router.push("/profile")}
          >
            {name.slice(0, 1).toUpperCase() || "B"}
          </button>
          </div>
        </header>
        <div className="page">{children}</div>
        <nav
          className={`mobile-nav${mobileActiveIndex < 0 ? " no-active" : ""}`}
          aria-label="Điều hướng nhanh"
          style={{ "--active-index": mobileActiveIndex } as CSSProperties}
        >
          {mobileLinks.map(([href, label, icon]) => (
            <Link
              key={href}
              href={href}
              aria-current={path === href || path.startsWith(href + "/") ? "page" : undefined}
              className={
                path === href || path.startsWith(href + "/") ? "active" : ""
              }
            >
              <span className={icon} aria-hidden="true" />
              <small>
                {label
                  .replace("Tổng quan", "Tổng quan")
                  .replace("Kế hoạch tháng", "Kế hoạch")}
              </small>
            </Link>
          ))}
        </nav>
      </section>
    </div>
  );
}
