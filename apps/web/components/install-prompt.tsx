"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

type InstallEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function InstallPrompt() {
  const pathname = usePathname();
  const isAuthPage = pathname === "/login" || pathname === "/register";
  const [installEvent, setInstallEvent] = useState<InstallEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [guideSteps, setGuideSteps] = useState<string[]>([]);
  const [guideTitle, setGuideTitle] = useState("Thêm BudgetMap vào màn hình chính");

  useEffect(() => {
    if (isAuthPage) {
      setVisible(false);
      return;
    }
    if (
      window.matchMedia("(display-mode: standalone)").matches ||
      ("standalone" in navigator &&
        (navigator as Navigator & { standalone?: boolean }).standalone)
    )
      return;
    const dismissed =
      window.localStorage.getItem("budgetmap-install-dismissed") === "1";
    const isMobile = window.matchMedia("(max-width: 700px)").matches;
    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as InstallEvent);
      if (!dismissed) setVisible(true);
    };
    const onInstalled = () => {
      setVisible(false);
      setInstallEvent(null);
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    const fallbackTimer = window.setTimeout(() => {
      if (isMobile && !dismissed) setVisible(true);
    }, 900);
    if ("serviceWorker" in navigator)
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
      window.clearTimeout(fallbackTimer);
    };
  }, [isAuthPage]);

  if (!visible) return null;
  const dismiss = () => {
    window.localStorage.setItem("budgetmap-install-dismissed", "1");
    setClosing(true);
    window.setTimeout(() => setVisible(false), 260);
  };
  const acknowledgeGuide = () => {
    setGuideOpen(false);
    dismiss();
  };
  const install = async () => {
    if (!installEvent) {
      const userAgent = navigator.userAgent.toLowerCase();
      const isIos = /iphone|ipad|ipod/.test(userAgent);
      const isAndroid = /android/.test(userAgent);
      setGuideTitle(isIos ? "Thêm BudgetMap trên iPhone/iPad" : isAndroid ? "Thêm BudgetMap trên Android" : "Cài BudgetMap trên máy tính");
      setGuideSteps(
        isIos
          ? ["Nhấn nút Chia sẻ trên Safari.", "Chọn Thêm vào Màn hình chính.", "Nhấn Thêm để xác nhận."]
          : isAndroid
            ? ["Mở menu trình duyệt ⋮.", "Chọn Cài đặt ứng dụng hoặc Thêm vào màn hình chính.", "Nhấn Thêm/Cài đặt để xác nhận."]
            : ["Mở menu cài đặt của trình duyệt.", "Chọn Cài đặt BudgetMap hoặc Install BudgetMap.", "Xác nhận cài đặt trong hộp thoại của trình duyệt."]
      );
      setGuideOpen(true);
      return;
    }
    await installEvent.prompt();
    await installEvent.userChoice;
    setVisible(false);
    setInstallEvent(null);
  };
  return (
    <>
    <aside
      className={`install-prompt${closing ? " is-closing" : ""}`}
      role="dialog"
      aria-label="Cài đặt BudgetMap"
    >
      <img
        className="install-prompt-icon"
        src="/brand/app-icon-pastel.png"
        alt=""
        aria-hidden="true"
      />
      <div className="install-prompt-copy">
        <strong>Cài BudgetMap như một ứng dụng?</strong>
        <span>
          Mở nhanh hơn, dùng toàn màn hình và không hiện thanh địa chỉ.
        </span>
      </div>
      <div className="install-prompt-actions">
        <button type="button" onClick={install}>
          {installEvent ? "Cài đặt" : "Xem cách thêm"}
        </button>
        <button type="button" className="secondary" onClick={dismiss}>
          Để sau
        </button>
      </div>
    </aside>
    {guideOpen && <div className="install-guide-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setGuideOpen(false); }}>
      <div className="install-guide" role="dialog" aria-modal="true" aria-labelledby="install-guide-title">
        <div className="install-guide-header"><h2 id="install-guide-title">{guideTitle}</h2><button type="button" className="install-guide-close" aria-label="Đóng hướng dẫn" onClick={() => setGuideOpen(false)}>×</button></div>
        <ol>{guideSteps.map((step) => <li key={step}>{step}</li>)}</ol>
        <button type="button" onClick={acknowledgeGuide}>Đã hiểu</button>
      </div>
    </div>}
    </>
  );
}
