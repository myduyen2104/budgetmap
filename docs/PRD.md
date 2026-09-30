# Product Requirements Document — BudgetMap MVP

**Status:** Draft for Product Owner review  
**Phase:** Phase 0 — Requirement & Design  
**Primary user:** Cá nhân tự quản lý tài chính  
**Currency:** VND

## Problem

Ứng dụng ghi chép thu/chi thông thường chỉ trả lời “đã tiêu bao nhiêu”. Người dùng còn cần biết số tiền đầu tháng dự kiến dùng thế nào, mỗi category còn bao nhiêu, category nào đã xài lố và việc xài lố đó có ảnh hưởng thế nào đến tiền còn lại.

## Product goal

Giúp một người dùng đi từ thu nhập dự kiến đến kế hoạch tháng, ghi nhận phát sinh thực tế và so sánh planned với actual ở cấp tổng thể lẫn category.

## Core flow

`Planned income → Carry-over → Planned saving and expense budgets → Income/expense transactions → Dashboard → Overspending → Monthly analysis`

## User outcomes

- Biết planned available money đầu tháng.
- Biết actual income và actual expense trong tháng.
- Biết remaining cash flow.
- Biết planned/actual/remaining của từng expense category.
- Nhận ra category không có budget nhưng vẫn phát sinh chi tiêu.
- So sánh expense tháng hiện tại với tháng trước.

## Product principles

- Planning inputs và transactions là dữ liệu gốc.
- Financial metrics được tính từ dữ liệu gốc, không nhập lặp lại.
- Tổng tiền còn lại và budget category là hai góc nhìn khác nhau.
- Không làm MVP phình to bởi automation hoặc tích hợp bên ngoài.
- Lịch sử không bị mất khi wallet/category được archive.

## Success criteria for MVP

- User hoàn thành được flow tạo plan, phân bổ và ghi nhận transaction.
- Dashboard hiển thị đúng planned, actual, remaining và overspending.
- Exact 100% được phân biệt với overspending.
- Sửa/xóa giao dịch làm thay đổi báo cáo đúng tháng/category/wallet.
- User không thể truy cập dữ liệu của user khác.
