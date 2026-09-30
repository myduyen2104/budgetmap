"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type GettingStartedProps = {
  month: string;
  hasWallet: boolean;
  hasPlan: boolean;
  hasTransactions: boolean;
};

type Step = {
  number: string;
  title: string;
  description: string;
  howTo: string;
  example: string;
  href: string;
  action: string;
  done: boolean;
};

export function GettingStarted({ month, hasWallet, hasPlan, hasTransactions }: GettingStartedProps) {
  const [year, monthNumber] = month.split("-");
  const [showTour, setShowTour] = useState(false);
  const [tourIndex, setTourIndex] = useState(0);

  const steps: Step[] = [
    {
      number: "01",
      title: "Tạo ví tiền",
      description: "Khai báo nơi bạn đang giữ tiền: tiền mặt, ngân hàng hoặc ví điện tử.",
      howTo: "Vào Ví tiền → Thêm ví → chọn loại ví → nhập số dư hiện tại → Lưu.",
      example: "Tài khoản ngân hàng 20.000.000đ và Tiền mặt 2.000.000đ.",
      href: "/wallets",
      action: "Mở Ví tiền",
      done: hasWallet,
    },
    {
      number: "02",
      title: "Lập kế hoạch tháng",
      description: "Đặt trước thu nhập, ngân sách và thêm danh mục riêng nếu khoản chi chưa có sẵn.",
      howTo: "Vào Kế hoạch tháng → nhập Thu nhập dự kiến → bấm Thêm danh mục dự kiến. Nếu thiếu mục chi, chọn Tạo danh mục riêng → nhập tên → chọn icon, màu → Tạo và thêm vào kế hoạch → Lưu.",
      example: "Tạo mục Thú cưng với icon dấu chân, rồi đặt ngân sách 500.000đ.",
      href: `/plans/${year}/${monthNumber}`,
      action: "Mở Kế hoạch tháng",
      done: hasPlan,
    },
    {
      number: "03",
      title: "Ghi giao dịch thực tế",
      description: "Mỗi khoản thu, chi hoặc chuyển tiền phát sinh đều được ghi lại tại đây.",
      howTo: "Vào Giao dịch → Thêm giao dịch → chọn loại, danh mục, ví và số tiền → Lưu.",
      example: "Chi 120.000đ cho Di chuyển từ ví Tiền mặt.",
      href: "/transactions",
      action: "Mở Giao dịch",
      done: hasTransactions,
    },
    {
      number: "04",
      title: "So sánh và điều chỉnh",
      description: "Theo dõi số đã chi so với kế hoạch để biết khoản nào đang vượt ngân sách.",
      howTo: "Vào Phân tích → chọn tháng → xem Planned là dự kiến và Actual là thực tế.",
      example: "Actual cao hơn Planned nghĩa là bạn đang chi vượt ngân sách.",
      href: "/analysis",
      action: "Mở Phân tích",
      done: hasTransactions,
    },
  ];

  useEffect(() => {
    if (window.localStorage.getItem("budgetmap-tour-seen") !== "1") setShowTour(true);
  }, []);

  const openTour = () => {
    setTourIndex(0);
    setShowTour(true);
  };

  const closeTour = () => {
    window.localStorage.setItem("budgetmap-tour-seen", "1");
    setShowTour(false);
  };

  const currentStep = steps[tourIndex];

  return (
    <>
      <section className="card getting-started" aria-labelledby="getting-started-title">
        <div className="getting-started-header">
          <div>
            <p className="eyebrow">BẮT ĐẦU NHANH</p>
            <h2 id="getting-started-title">Quản lý dòng tiền theo 4 bước</h2>
            <p className="muted">Lập kế hoạch trước, ghi thực tế sau, rồi xem chênh lệch để điều chỉnh.</p>
          </div>
          <div className="getting-started-header-actions">
            <div className="getting-started-legend" aria-label="Giải thích loại dữ liệu">
              <span><i className="legend-dot planned" /> Dự kiến</span>
              <span><i className="legend-dot actual" /> Thực tế</span>
            </div>
            <button type="button" className="getting-started-help" onClick={openTour}>Xem hướng dẫn</button>
          </div>
        </div>
        <div className="getting-started-steps">
          {steps.map((step, index) => (
            <Link
              className={`getting-started-step ${step.done ? "is-done" : ""} ${index === steps.findIndex((item) => !item.done) ? "is-next" : ""}`}
              href={step.href}
              key={step.number}
            >
              <span className="getting-started-number">{step.done ? "✓" : step.number}</span>
              <span className="getting-started-copy">
                <strong>{step.title}</strong>
                <small>{step.description}</small>
                <em>{step.done ? "Đã hoàn thành" : step.action}</em>
              </span>
              <span className="getting-started-arrow" aria-hidden="true">→</span>
            </Link>
          ))}
        </div>
      </section>

      {showTour && (
        <div className="tour-backdrop" role="presentation" onClick={closeTour}>
          <section className="tour-dialog" role="dialog" aria-modal="true" aria-labelledby="tour-title" onClick={(event) => event.stopPropagation()}>
            <button type="button" className="tour-close" aria-label="Đóng hướng dẫn" onClick={closeTour}>×</button>
            <p className="eyebrow">HƯỚNG DẪN NHANH · {tourIndex + 1}/{steps.length}</p>
            <div className="tour-progress" aria-hidden="true">
              {steps.map((step, index) => <span key={step.number} className={index <= tourIndex ? "is-active" : ""} />)}
            </div>
            <span className="tour-number">{currentStep.number}</span>
            <h2 id="tour-title">{currentStep.title}</h2>
            <p className="tour-description">{currentStep.description}</p>
            <div className="tour-howto">
              <strong>Bạn cần làm</strong>
              <p>{currentStep.howTo}</p>
            </div>
            <p className="tour-example"><strong>Ví dụ:</strong> {currentStep.example}</p>
            <Link className="tour-open-link" href={currentStep.href} onClick={closeTour}>{currentStep.action} <span aria-hidden="true">→</span></Link>
            <div className="tour-actions">
              <button type="button" className="tour-skip" onClick={closeTour}>Bỏ qua</button>
              <div>
                {tourIndex > 0 && <button type="button" className="button-secondary" onClick={() => setTourIndex((index) => index - 1)}>Quay lại</button>}
                {tourIndex < steps.length - 1 ? (
                  <button type="button" className="button-primary" onClick={() => setTourIndex((index) => index + 1)}>Tiếp theo</button>
                ) : (
                  <button type="button" className="button-primary" onClick={closeTour}>Bắt đầu sử dụng</button>
                )}
              </div>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
