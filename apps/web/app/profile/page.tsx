"use client";
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { api } from "../../lib/api";
import { PageHeader } from "../../components/ui";
type User = { displayName: string | null; email: string | null };
export default function Profile() {
  const [name, setName] = useState(""),
    [email, setEmail] = useState(""),
    [message, setMessage] = useState(""),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true);
  const [currentPassword, setCurrentPassword] = useState(""),
    [newPassword, setNewPassword] = useState(""),
    [confirmPassword, setConfirmPassword] = useState(""),
    [passwordMessage, setPasswordMessage] = useState(""),
    [passwordError, setPasswordError] = useState(""),
    [passwordLoading, setPasswordLoading] = useState(false),
    [showCurrentPassword, setShowCurrentPassword] = useState(false),
    [showNewPassword, setShowNewPassword] = useState(false),
    [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [welcome, setWelcome] = useState(false),
    [passwordOpen, setPasswordOpen] = useState(false);
  const passwordDialogRef = useRef<HTMLDivElement>(null);
  const load = useCallback(() => {
    setLoading(true);
    setError("");
    api<User>("/auth/me")
      .then((u) => {
        setName(u.displayName ?? "");
        setEmail(u.email ?? "");
      })
      .catch(() => setError("Không thể tải hồ sơ."))
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => {
    load();
  }, [load]);
  useEffect(() => {
    setWelcome(new URLSearchParams(window.location.search).get("welcome") === "1");
  }, []);
  useEffect(() => {
    if (!passwordOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setPasswordOpen(false);
    };
    document.addEventListener("keydown", closeOnEscape);
    passwordDialogRef.current?.querySelector<HTMLInputElement>("input")?.focus();
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [passwordOpen]);
  const save = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await api("/auth/me", {
        method: "PATCH",
        body: JSON.stringify({ displayName: name }),
      });
      setMessage("Đã lưu thay đổi.");
    } catch {
      setError("Không thể lưu hồ sơ.");
    }
  };
  const changePassword = async (e: FormEvent) => {
    e.preventDefault();
    setPasswordMessage("");
    setPasswordError("");
    if (newPassword !== confirmPassword) {
      setPasswordError("Mật khẩu mới và phần nhập lại chưa giống nhau.");
      return;
    }
    setPasswordLoading(true);
    try {
      await api<void>("/auth/password", {
        method: "PATCH",
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordMessage("Đã cập nhật mật khẩu mới.");
    } catch (changeError) {
      const code = changeError instanceof Error ? changeError.message : "";
      setPasswordError(
        code === "INVALID_CURRENT_PASSWORD"
          ? "Mật khẩu hiện tại không đúng."
          : code === "NEW_PASSWORD_MUST_DIFFER"
            ? "Mật khẩu mới phải khác mật khẩu hiện tại."
            : "Không thể cập nhật mật khẩu. Vui lòng thử lại.",
      );
    } finally {
      setPasswordLoading(false);
    }
  };
  return (
    <main>
      <PageHeader title="Hồ sơ" description="Giữ thông tin và cách hiển thị BudgetMap theo đúng bạn." />
      <section className="profile-layout">
        {loading ? (
          <div className="card loading-skeleton" aria-label="Đang tải hồ sơ">Đang tải hồ sơ…</div>
        ) : error ? (
          <div className="card error" role="alert">
            <p>{error}</p>
            <button type="button" onClick={load}>
              Thử lại
            </button>
          </div>
        ) : (
          <>
            {welcome && <div className="auth-success" role="status"><strong>Chào mừng bạn đến với BudgetMap!</strong><br />Hãy điền tên hiển thị để hoàn thiện hồ sơ của bạn.</div>}
            <section className="card profile-card profile-personal-card">
              <div className="profile-identity"><div className="profile-avatar">{(name.trim() || email.trim() || "B").slice(0,1).toUpperCase()}</div><div><strong>{name || "Chưa đặt tên"}</strong><p className="muted">Tài khoản cá nhân của bạn</p></div></div>
              <div className="profile-section-heading"><div><h2>Cập nhật thông tin của bạn</h2></div><span className="profile-section-icon" aria-hidden="true"><i className="fi-rr-user" /></span></div>
              {message && <p className="auth-success" role="status">{message}</p>}
              <form className="form-grid" onSubmit={save}>
                <label>Tên hiển thị<input value={name} onChange={(e) => setName(e.target.value)} /></label>
                <button type="submit">Lưu thay đổi</button>
              </form>
            </section>
            <section className="card profile-card security-card">
              <div className="profile-section-heading"><div><h2>Giữ tài khoản an toàn</h2></div><span className="profile-section-icon" aria-hidden="true"><i className="fi-rr-shield-check" /></span></div>
              <p className="muted">Mật khẩu được mã hóa an toàn. Bạn có thể đổi mật khẩu bất cứ lúc nào.</p>
              <div className="security-status"><span className="status-dot" aria-hidden="true" />Mật khẩu đã được thiết lập</div>
              {passwordMessage && <p className="auth-success" role="status">{passwordMessage}</p>}
              <button type="button" className="button-secondary security-action" onClick={() => { setPasswordError(""); setPasswordMessage(""); setPasswordOpen(true); }}><i className="fi-rr-lock" aria-hidden="true" /> Đổi mật khẩu</button>
            </section>
          </>
        )}
      </section>
      {passwordOpen && <div className="password-sheet-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setPasswordOpen(false); }}>
        <div className="password-sheet" ref={passwordDialogRef} role="dialog" aria-modal="true" aria-labelledby="password-dialog-title">
          <div className="sheet-handle" aria-hidden="true" />
          <div className="sheet-header"><div><h2 id="password-dialog-title">Đổi mật khẩu</h2></div><button type="button" className="sheet-close" aria-label="Đóng đổi mật khẩu" onClick={() => setPasswordOpen(false)}>×</button></div>
          <p className="muted">Chọn một mật khẩu mới để bảo vệ tài khoản của bạn.</p>
          {passwordMessage && <p className="auth-success" role="status">{passwordMessage}</p>}
          {passwordError && <p className="error" role="alert">{passwordError}</p>}
          <form className="form-grid password-form" onSubmit={async (event) => { await changePassword(event); }}>
            <label>Mật khẩu hiện tại<span className="field-control"><input type={showCurrentPassword ? "text" : "password"} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required minLength={8} autoComplete="current-password" /><button type="button" className="password-toggle" aria-label={showCurrentPassword ? "Ẩn mật khẩu hiện tại" : "Hiện mật khẩu hiện tại"} onClick={() => setShowCurrentPassword(!showCurrentPassword)}><i className={showCurrentPassword ? "fi-rr-eye-crossed" : "fi-rr-eye"} aria-hidden="true" /></button></span></label>
            <label>Mật khẩu mới<span className="field-control"><input type={showNewPassword ? "text" : "password"} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={8} autoComplete="new-password" /><button type="button" className="password-toggle" aria-label={showNewPassword ? "Ẩn mật khẩu mới" : "Hiện mật khẩu mới"} onClick={() => setShowNewPassword(!showNewPassword)}><i className={showNewPassword ? "fi-rr-eye-crossed" : "fi-rr-eye"} aria-hidden="true" /></button></span></label>
            <label>Nhập lại mật khẩu mới<span className="field-control"><input type={showConfirmPassword ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required minLength={8} autoComplete="new-password" /><button type="button" className="password-toggle" aria-label={showConfirmPassword ? "Ẩn phần nhập lại mật khẩu" : "Hiện phần nhập lại mật khẩu"} onClick={() => setShowConfirmPassword(!showConfirmPassword)}><i className={showConfirmPassword ? "fi-rr-eye-crossed" : "fi-rr-eye"} aria-hidden="true" /></button></span></label>
            <div className="sheet-actions"><button type="button" className="button-secondary" onClick={() => setPasswordOpen(false)}>Hủy</button><button type="submit" disabled={passwordLoading}>{passwordLoading ? "Đang cập nhật…" : "Cập nhật mật khẩu"}</button></div>
          </form>
        </div>
      </div>}
    </main>
  );
}
