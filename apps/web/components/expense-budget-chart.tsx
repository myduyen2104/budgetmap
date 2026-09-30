type ChartRow = {
  categoryId: string;
  category: string;
  planned: string;
  actual: string;
  status?: string;
  icon?: string | null;
  color?: string | null;
};

import { CategoryBadge } from "./category";

const amountLabel = (value: string) => {
  const amount = Number(value);
  return `${Number.isFinite(amount) ? amount.toLocaleString("vi-VN") : value}đ`;
};

export function ExpenseBudgetChart({ data }: { data: ChartRow[] }) {
  if (data.length === 0)
    return (
      <section className="card" aria-label="Biểu đồ chi tiêu">
        <h2>Chi tiêu theo danh mục</h2>
        <p>Tháng này chưa có chi tiêu để hiển thị.</p>
      </section>
    );
  const max = Math.max(
    ...data.map((x) => Math.max(Number(x.planned), Number(x.actual))),
    1,
  );
  return (
    <section className="card" aria-label="Biểu đồ ngân sách và chi tiêu">
      <h2>Chi tiêu theo danh mục</h2>
      <div className="chart-legend" aria-label="Chú thích biểu đồ">
        <span className="legend-planned">Ngân sách dự kiến</span>
        <span className="legend-actual">Đã chi thực tế</span>
        <span className="legend-exceeded">Vượt ngân sách</span>
      </div>
      <div
        className="chart-scroll"
        role="img"
        aria-label="Biểu đồ thanh ngang ngân sách dự kiến và chi tiêu thực tế"
      >
        {data.map((x) => {
          const category = { name: x.category, type: "EXPENSE" as const, icon: x.icon, color: x.color };
          return (
            <div className="chart-row" key={x.categoryId}>
              <CategoryBadge category={category} compact />
              <div className="bars">
                <div className="bar-line">
                  <span
                    className="bar-planned"
                    style={{ width: `${(Number(x.planned) / max) * 100}%` }}
                    title={`Ngân sách dự kiến ${amountLabel(x.planned)}`}
                  />
                  <small>KH {amountLabel(x.planned)}</small>
                </div>
                <div className="bar-line">
                  <span
                    className={
                      x.status === "EXCEEDED" || Number(x.actual) > Number(x.planned)
                        ? "bar-actual exceeded"
                        : "bar-actual"
                    }
                    style={{ width: `${(Number(x.actual) / max) * 100}%` }}
                    title={`Đã chi thực tế ${amountLabel(x.actual)}${Number(x.actual) > Number(x.planned) ? " · vượt ngân sách" : ""}`}
                  />
                  <small>TT {amountLabel(x.actual)}</small>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <table>
        <caption>Chi tiết dữ liệu biểu đồ</caption>
        <thead>
          <tr>
            <th>Danh mục</th>
            <th>Dự kiến</th>
            <th>Thực tế</th>
          </tr>
        </thead>
        <tbody>
          {data.map((x) => (
            <tr key={x.categoryId}>
              <td><CategoryBadge category={{ name: x.category, type: "EXPENSE", icon: x.icon, color: x.color }} compact /></td>
              <td>{amountLabel(x.planned)}</td>
              <td>{amountLabel(x.actual)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
