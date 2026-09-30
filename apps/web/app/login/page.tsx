"use client";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "../../lib/api";
const UserIcon = () => <svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="12" cy="8" r="3.2"/><path d="M5.5 20c.7-3.7 2.8-5.5 6.5-5.5s5.8 1.8 6.5 5.5"/></svg>;
const LockIcon = () => <svg aria-hidden="true" viewBox="0 0 24 24"><rect x="5.5" y="10" width="13" height="10" rx="2"/><path d="M8.5 10V7.5a3.5 3.5 0 0 1 7 0V10"/></svg>;
const WalletIcon = () => <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M4.5 7.5h13a2 2 0 0 1 2 2V19h-15a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h11"/><path d="M19.5 11h-4a2 2 0 0 0 0 4h4"/><circle cx="15.5" cy="13" r=".7"/></svg>;
const EyeIcon = ({ off }: { off: boolean }) => <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M2.8 12s3.3-5 9.2-5 9.2 5 9.2 5-3.3 5-9.2 5-9.2-5-9.2-5Z"/>{off ? <path d="m4 4 16 16"/> : <circle cx="12" cy="12" r="2.2"/>}</svg>;
export default function Login() {
  const router = useRouter();
  const [e, setE] = useState("");
  const [p, setP] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("registered") === "1") {
      setNotice("Tạo tài khoản thành công. Hãy đăng nhập để bắt đầu.");
    }
  }, []);
  async function submit(x: FormEvent) {
    x.preventDefault();
    setError("");
    try {
      const user = await api<{ displayName: string | null }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ username: e, password: p }),
      });
      router.replace(user.displayName?.trim() ? "/dashboard" : "/profile?welcome=1");
    } catch (cause) {
      const code = cause instanceof Error ? cause.message : "";
      if (code === "UNAUTHORIZED") {
        setError("Tên tài khoản hoặc mật khẩu không đúng.");
      } else if (code === "RATE_LIMITED") {
        setError("Bạn đã thử đăng nhập quá nhiều lần. Vui lòng chờ 15 phút rồi thử lại.");
      } else {
        setError("Không thể kết nối đến hệ thống. Vui lòng thử lại.");
      }
    }
  }
  return (
    <main className="auth-card auth-card-checkin">
      <div className="auth-hero" aria-hidden="true"><div className="auth-cloud cloud-one"/><div className="auth-cloud cloud-two"/><div className="auth-map"><span>⌁</span><span>⌁</span><span>⌁</span></div><div className="auth-pin"><b>₫</b></div><div className="auth-leaf leaf-one"/><div className="auth-leaf leaf-two"/></div>
      <div className="auth-dots" aria-label="Trang đăng nhập"><b/><i/><i/></div>
      <div className="auth-heading"><span className="auth-kicker">Chào mừng trở lại</span><h1>Xin chào</h1><p className="muted">Đăng nhập để tiếp tục <span aria-hidden="true">♥</span></p></div>
      <form onSubmit={submit}>
        <label className="auth-field">
          <span>Tên tài khoản</span>
          <span className="field-control"><span className="input-icon"><UserIcon /></span>
          <input
            aria-label="Tên tài khoản"
            required
            value={e}
            onChange={(x) => setE(x.target.value)}
            placeholder="Nhập tên tài khoản"
          />
          </span>
        </label>
        <label className="auth-field">
          <span>Mật khẩu</span>
          <span className="field-control"><span className="input-icon"><LockIcon /></span>
          <input
            aria-label="Mật khẩu"
            type={showPassword ? "text" : "password"}
            required
            value={p}
            onChange={(x) => setP(x.target.value)}
            placeholder="Nhập mật khẩu"
          />
          <button type="button" className="password-toggle" aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"} onClick={() => setShowPassword(!showPassword)}><EyeIcon off={showPassword} /></button></span>
        </label>
        <button className="auth-submit" type="submit">Bắt đầu quản lý tiền <WalletIcon /></button>
      </form>
      {notice && <p className="auth-success" role="status">{notice}</p>}
      {error && <p className="auth-error" role="alert">{error}</p>}
      <p className="auth-switch">Chưa có tài khoản? <a href="/register">Đăng ký ngay</a></p>
    </main>
  );
}
