"use client";

import { useEffect, useState } from "react";
import { api } from "../../lib/api";

type NotificationItem = { id: string; title: string; body: string; readAt: string | null; createdAt: string };
type NotificationData = { items: NotificationItem[]; unreadCount: number; dailyReminderEnabled: boolean; dailyReminderTimes: string[]; pushConfigured: boolean };
const REMINDER_TIMES = ["13:00", "18:00", "22:00"];

function decodeKey(value: string) {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  return Uint8Array.from(atob(padded), (char) => char.charCodeAt(0));
}

function dateLabel(value: string) {
  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export default function NotificationsPage() {
  const [data, setData] = useState<NotificationData | null>(null);
  const [error, setError] = useState("");
  const [testPushMessage, setTestPushMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<NotificationItem | null>(null);

  const refresh = async () => {
    try { const next = await api<NotificationData>("/notifications"); setData(next); setError(""); }
    catch { setError("Không thể tải thông báo. Vui lòng thử lại."); }
  };
  useEffect(() => { void refresh(); }, []);
  useEffect(() => {
    if (!selectedNotification) return;
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") setSelectedNotification(null); };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [selectedNotification]);
  const enableReminders = async () => {
    setBusy(true); setError("");
    try {
      if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
        throw new Error("Thiết bị hoặc trình duyệt này chưa hỗ trợ thông báo đẩy.");
      }
      const { publicKey } = await api<{ publicKey: string | null }>("/notifications/vapid-public-key");
      if (!publicKey) throw new Error("Thông báo đẩy chưa được cấu hình trên máy chủ.");
      const permission = await Notification.requestPermission();
      if (permission !== "granted") throw new Error("Bạn chưa cấp quyền gửi thông báo cho BudgetMap.");
      const registration = await navigator.serviceWorker.register("/sw.js");
      const ready = await navigator.serviceWorker.ready;
      const subscription = await ready.pushManager.getSubscription() ?? await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: decodeKey(publicKey) });
      await api("/notifications/reminder", { method: "PATCH", body: JSON.stringify({ enabled: true, times: REMINDER_TIMES }) });
      await api("/notifications/subscribe", { method: "POST", body: JSON.stringify(subscription.toJSON()) });
      await refresh();
      window.dispatchEvent(new Event("budgetmap-notifications-updated"));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Không thể bật nhắc nhở lúc này.");
    } finally { setBusy(false); }
  };

  const disableReminders = async () => {
    setBusy(true); setError("");
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      const subscription = await registration?.pushManager.getSubscription();
      await subscription?.unsubscribe();
      await api("/notifications/subscribe", { method: "DELETE" });
      await refresh();
    } catch { setError("Không thể tắt nhắc nhở lúc này."); }
    finally { setBusy(false); }
  };

  const sendTestPush = async () => {
    setBusy(true); setError(""); setTestPushMessage("");
    try {
      await api("/notifications/test", { method: "POST" });
      setTestPushMessage("Đã gửi thông báo thử. Kiểm tra thông báo trên thiết bị nhé.");
    } catch (cause) {
      setError(cause instanceof Error && cause.message === "PUSH_SUBSCRIPTION_NOT_FOUND" ? "Chưa đăng ký thiết bị nhận push. Hãy bật nhắc nhở trước." : "Gửi thông báo thử thất bại. Kiểm tra quyền thông báo và kết nối local.");
    } finally { setBusy(false); }
  };

  const markRead = async (item: NotificationItem) => {
    if (item.readAt) return;
    try {
      await api(`/notifications/${item.id}/read`, { method: "PATCH" });
      const readAt = new Date().toISOString();
      setData((current) => current ? { ...current, unreadCount: Math.max(0, current.unreadCount - 1), items: current.items.map((entry) => entry.id === item.id ? { ...entry, readAt } : entry) } : current);
      setSelectedNotification((current) => current?.id === item.id ? { ...current, readAt } : current);
      window.dispatchEvent(new Event("budgetmap-notifications-updated"));
    } catch {
      setError("Không thể cập nhật trạng thái thông báo. Vui lòng thử lại.");
    }
  };

  const openNotification = (item: NotificationItem) => {
    setSelectedNotification(item);
    void markRead(item);
  };

  const markAllRead = async () => {
    await api("/notifications/read-all", { method: "PATCH" });
    setData((current) => current ? { ...current, unreadCount: 0, items: current.items.map((item) => ({ ...item, readAt: item.readAt ?? new Date().toISOString() })) } : current);
    window.dispatchEvent(new Event("budgetmap-notifications-updated"));
  };

  return (
    <main className="notifications-page">
      <header className="notifications-heading">
        <div><p className="eyebrow">NHẮC NHỞ CHI TIÊU</p><h1>Thông báo</h1><p className="muted">Nhắc bạn ghi lại các khoản đã chi trong ngày.</p></div>
        {Boolean(data?.unreadCount) && <button className="button-secondary" onClick={markAllRead}>Đánh dấu đã đọc</button>}
      </header>
      <section className="notification-reminder-card card">
        <div className="notification-reminder-intro">
          <div className="notification-reminder-icon"><i className="fi-rr-bell" aria-hidden="true" /></div>
          <div className="notification-reminder-copy"><h2>Nhắc nhở hằng ngày</h2><p className="muted">Nhắc bạn ghi lại chi tiêu vào các khung giờ cố định.</p></div>
        </div>
        <div className="notification-time-field">
          <span>Giờ nhắc (giờ Việt Nam)</span>
          <div className="notification-time-slots">{REMINDER_TIMES.map((time) => <span className="notification-time-fixed" key={time}><span>{time}</span><i className="fi-rr-clock" aria-hidden="true" /></span>)}</div>
        </div>
        <div className="notification-reminder-actions">
          {process.env.NODE_ENV !== "production" && data?.dailyReminderEnabled && <button className="button-secondary" disabled={busy} onClick={sendTestPush}>Gửi thử</button>}
          {data?.dailyReminderEnabled && <button className="button-secondary" disabled={busy} onClick={disableReminders}>Tắt</button>}
          <button className="button-primary" disabled={busy || !data || Boolean(data.dailyReminderEnabled) || !data.pushConfigured} onClick={enableReminders}>
            {busy ? "Đang bật…" : data?.dailyReminderEnabled ? "Đã bật nhắc nhở" : "Bật nhắc nhở"}
          </button>
        </div>
      </section>
      {testPushMessage && <p className="notification-setup-note" role="status">{testPushMessage}</p>}
      {data?.pushConfigured && <p className="notification-setup-note">Trên iPhone/iPad, hãy thêm BudgetMap vào Màn hình chính trước khi bật thông báo.</p>}
      {!data?.pushConfigured && <p className="notification-setup-note">Máy chủ chưa cấu hình khóa Web Push nên chưa thể bật nhắc nhở.</p>}
      {error && <p className="notification-error" role="alert">{error.includes("Không thể tải thông báo") ? "Chưa kết nối được máy chủ thông báo. Kiểm tra API local rồi tải lại trang." : error}</p>}
      <section className="notification-list card" aria-label="Danh sách thông báo">
        <div className="notification-list-heading"><h2>Gần đây</h2>{data && <span>{data.items.length} thông báo</span>}</div>
        {!data ? <p className="muted">Đang tải…</p> : data.items.length === 0 ? <div className="notification-empty"><i className="fi-rr-bell" aria-hidden="true"/><strong>Chưa có thông báo</strong><span>Khi có lời nhắc, bạn sẽ thấy thông báo tại đây.</span></div> : (
          <div className="notification-items">{data.items.map((item) => (
            <button key={item.id} type="button" className={`notification-item${item.readAt ? " is-read" : " is-unread"}`} onClick={() => openNotification(item)}>
              <span className="notification-item-dot" aria-hidden="true" />
              <span className="notification-item-content"><strong>{item.title}</strong><span>{item.body}</span><small>{dateLabel(item.createdAt)}</small></span>
              <i className="fi-rr-angle-small-right" aria-hidden="true" />
            </button>
          ))}</div>
        )}
      </section>
      {selectedNotification && <div className="notification-detail-backdrop" onClick={() => setSelectedNotification(null)}>
        <section className="notification-detail card" role="dialog" aria-modal="true" aria-labelledby="notification-detail-title" onClick={(event) => event.stopPropagation()}>
          <div className="notification-detail-heading">
            <span className="notification-detail-icon"><i className="fi-rr-bell" aria-hidden="true" /></span>
            <button type="button" className="notification-detail-close" aria-label="Đóng chi tiết thông báo" onClick={() => setSelectedNotification(null)}>×</button>
          </div>
          <p className="eyebrow">CHI TIẾT THÔNG BÁO</p>
          <h2 id="notification-detail-title">{selectedNotification.title}</h2>
          <p className="notification-detail-body">{selectedNotification.body}</p>
          <time className="notification-detail-date" dateTime={selectedNotification.createdAt}>{dateLabel(selectedNotification.createdAt)}</time>
          <button type="button" className="button-primary notification-detail-done" onClick={() => setSelectedNotification(null)}>Đóng</button>
        </section>
      </div>}
    </main>
  );
}
