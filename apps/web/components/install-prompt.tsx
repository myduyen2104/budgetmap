"use client";

import { useEffect, useState } from "react";

type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };

export function InstallPrompt() {
  const [installEvent, setInstallEvent] = useState<InstallEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(display-mode: standalone)").matches || ("standalone" in navigator && (navigator as Navigator & { standalone?: boolean }).standalone)) return;
    const dismissed = window.localStorage.getItem("budgetmap-install-dismissed") === "1";
    const isMobile = window.matchMedia("(max-width: 700px)").matches;
    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as InstallEvent);
      if (!dismissed) setVisible(true);
    };
    const onInstalled = () => { setVisible(false); setInstallEvent(null); };
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    const fallbackTimer = window.setTimeout(() => {
      if (isMobile && !dismissed) setVisible(true);
    }, 900);
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => {});
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
      window.clearTimeout(fallbackTimer);
    };
  }, []);

  if (!visible) return null;
  const dismiss = () => {
    window.localStorage.setItem("budgetmap-install-dismissed", "1");
    setVisible(false);
  };
  const install = async () => {
    if (!installEvent) {
      window.alert("Trên điện thoại, mở menu trình duyệt rồi chọn ‘Thêm vào màn hình chính’ để cài BudgetMap.");
      return;
    }
    await installEvent.prompt();
    await installEvent.userChoice;
    setVisible(false);
    setInstallEvent(null);
  };
  return <aside className="install-prompt" role="dialog" aria-label="Cài đặt BudgetMap">
    <img className="install-prompt-icon" src="/brand/app-icon-pastel.png" alt="" aria-hidden="true" />
    <div className="install-prompt-copy"><strong>Cài BudgetMap như một ứng dụng?</strong><span>Mở nhanh hơn, dùng toàn màn hình và không hiện thanh địa chỉ.</span></div>
    <div className="install-prompt-actions"><button type="button" onClick={install}>{installEvent ? "Cài đặt" : "Cách cài"}</button><button type="button" className="secondary" onClick={dismiss}>Để sau</button></div>
  </aside>;
}
