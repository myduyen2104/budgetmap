# BudgetMap

BudgetMap là ứng dụng quản lý tài chính cá nhân giúp người dùng lập kế hoạch tiền theo tháng, phân bổ ngân sách, ghi nhận thu/chi thực tế và nhận biết category nào đang xài lố.

## Trạng thái hiện tại

Đây là ứng viên phát hành MVP đã có giao diện web, API, PostgreSQL/Prisma, xác thực, phân tách dữ liệu người dùng, ví, danh mục, giao dịch, chuyển tiền giữa ví, kế hoạch tháng, bảng điều khiển, phân tích và kiểm thử tự động. Dự án phù hợp cho staging hoặc sử dụng nội bộ có kiểm soát.

Đọc tài liệu theo thứ tự: [PRD](docs/PRD.md) → [MVP Scope](docs/MVP-SCOPE.md) → [Business Rules](docs/BUSINESS-RULES.md) → [User Flows](docs/USER-FLOWS.md) → [Screen List](docs/SCREEN-LIST.md) → [ERD](docs/ERD.md) → [Data Dictionary](docs/DATA-DICTIONARY.md) → [API Contract](docs/API-CONTRACT.md) → [Error Catalog](docs/ERROR-CATALOG.md) → [Database Migration Plan](docs/DATABASE-MIGRATION-PLAN.md) → [Frontend UX Spec](docs/FRONTEND-UX-SPEC.md) → [Auth & Security](docs/AUTH-SECURITY.md) → [Environment Setup](docs/ENVIRONMENT-SETUP.md) → [Architecture](docs/ARCHITECTURE.md) → [Test Plan](docs/TEST-PLAN.md) → [Implementation Checklist](docs/IMPLEMENTATION-CHECKLIST.md) → [Roadmap](docs/ROADMAP.md).

 PostgreSQL cục bộ dùng cổng máy chủ `5434` (`localhost:5434` từ máy host, `postgres:5432` từ container). API/Prisma hiện được thiết kế chạy trực tiếp trên máy host.

Kiểm thử trên trình duyệt dùng Playwright với cơ sở dữ liệu riêng `budgetmap_test`. Cài trình duyệt một lần bằng `npx playwright install chromium`; các tệp trình duyệt nằm ngoài kho mã nguồn. Chạy `npm run test:e2e` và `npm run test:a11y`.

Trạng thái phát hành: ứng viên phát hành MVP — đã được duyệt để triển khai thử nghiệm/sử dụng nội bộ. Chưa được duyệt cho môi trường chính thức; các rủi ro trong quá trình xây dựng và phát triển được ghi tại `docs/SECURITY-AUDIT.md`.

## Giao diện và môi trường thử nghiệm

### Ghi nhận nguồn biểu tượng

BudgetMap sử dụng bộ biểu tượng miễn phí [Flaticon Uicons](https://www.flaticon.com/uicons) Regular Rounded cho điều hướng và thao tác. Bộ biểu tượng do Flaticon/Freepik cung cấp theo giấy phép miễn phí có yêu cầu ghi nhận nguồn. Xem [giấy phép Flaticon](https://www.flaticon.com/license/license.pdf).

Chạy `./install-dev.sh` để thiết lập cục bộ và khởi động API/web. PostgreSQL là dịch vụ hỗ trợ duy nhất; không cần Strapi hoặc Medusa. Tập lệnh dùng PostgreSQL trong Docker tại `127.0.0.1:5434`, API tại cổng `2311` và Next.js tại cổng `2310`; không dừng hoặc xóa PostgreSQL. Mở [http://127.0.0.1:2310/login](http://127.0.0.1:2310/login). Chạy `npm run test:e2e` và `npm run test:a11y` để kiểm thử trình duyệt. Xem [kiểm thử giao diện](docs/UI-QA.md) và [hướng dẫn môi trường thử nghiệm](docs/STAGING-RUNBOOK.md) để biết kiểm tra kích thước màn hình, biến môi trường, migration, kiểm tra sức khỏe và giới hạn một tiến trình API.

## Điều kiện phát hành

`GET /health` kiểm tra API và PostgreSQL. Môi trường chính thức cần chạy một API instance khi bộ giới hạn truy cập còn lưu trong bộ nhớ, dùng `prisma migrate deploy`, không seed dữ liệu production và cấu hình HTTPS/CORS/cookie an toàn. Xem [Security Audit](docs/SECURITY-AUDIT.md), [Operations](docs/OPERATIONS.md) và [Release Checklist](docs/RELEASE-CHECKLIST.md).

## Cam kết sản phẩm

BudgetMap phải trả lời được đồng thời: người dùng còn bao nhiêu tiền theo dòng tiền thực tế, và category nào đã xài lố dù tổng tiền vẫn còn.

## Chức năng hiện có

- Đăng ký, đăng nhập, đăng xuất, hồ sơ cá nhân và cookie phiên bảo mật.
- Nhiều ví, số dư suy ra, danh mục thu/chi và lưu trữ.
- Giao dịch thu/chi: thêm, lọc, phân trang, sửa và xóa mềm.
- Chuyển tiền giữa hai ví đang hoạt động của cùng người dùng.
- Kế hoạch tháng với thu nhập dự kiến, tiền chuyển tiếp, tiền tiết kiệm dự kiến và ngân sách chi tiêu.
- Bảng điều khiển, trạng thái ngân sách, khoản chi vượt mức, biểu đồ và phân tích tháng.

Các chức năng chưa có gồm giao dịch định kỳ, sao chép kế hoạch, quên mật khẩu, xuất CSV, đồng bộ ngân hàng, OCR, trợ lý AI, đa tiền tệ, ví dùng chung, ứng dụng di động riêng và chế độ ngoại tuyến. Xem `docs/MVP-SCOPE.md`.

## Triển khai môi trường thử nghiệm

Kho mã nguồn chưa có cấu hình triển khai theo nhà cung cấp cụ thể, vì vậy môi trường thử nghiệm cần được tạo riêng. Dùng một cơ sở dữ liệu PostgreSQL được quản lý riêng, một API Node.js 22 và một tiến trình Next.js phía sau HTTPS. Sao chép `.env.staging.example` vào cấu hình môi trường của nền tảng và đặt secret qua trình quản lý thông tin bí mật; không commit thông tin xác thực thật.

```bash
npm ci --no-audit --no-fund
npm run db:validate
npm run db:generate
DATABASE_URL="$STAGING_DATABASE_URL" npm exec prisma migrate deploy --schema=packages/api/prisma/schema.prisma
npm run build --workspace=@budgetmap/api
npm run build --workspace=@budgetmap/web
npm run start --workspace=@budgetmap/api
npm run start --workspace=@budgetmap/web
```

Thiết lập kiểm tra sức khỏe proxy bằng `GET /health`, giữ `CORS_ORIGIN` đúng bằng nguồn web thử nghiệm, không chạy `install-dev.sh` trên môi trường thử nghiệm và không seed môi trường này nếu chưa được duyệt. Xem [docs/STAGING-RUNBOOK.md](docs/STAGING-RUNBOOK.md) và [docs/OPERATIONS.md](docs/OPERATIONS.md) để biết kiểm thử nhanh, dừng dịch vụ và khôi phục.
