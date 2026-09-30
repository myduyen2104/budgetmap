# Business Rules — Source of Truth

Nếu UI, API, ERD hoặc test mô tả khác tài liệu này thì phải sửa decision trước khi development.

## Source of truth

- Planning inputs: `plannedIncome`, `carryOver`, allocations.
- Actual inputs: income/expense transactions, wallet initial balance.
- Dashboard và report metrics đều derived.
- Không persist `actualIncome`, `actualExpense`, `currentBalance`, `remainingCashFlow`, `remainingBudget`, `usagePercentage` hoặc `overspendingAmount` làm source of truth.

## Glossary and examples

### Planned income

Khoản user dự kiến sẽ nhận trong tháng, ví dụ lương dự kiến 12.000.000đ. Đây là con số dùng để lập kế hoạch trước khi tiền thực sự về.

### Actual income

Tổng các `INCOME` transactions thực tế trong tháng. Nếu user dự kiến 12.000.000đ nhưng mới nhận 10.000.000đ thì planned income vẫn là 12.000.000đ, actual income là 10.000.000đ.

### Carry-over

Phần tiền từ nguồn trước tháng hiện tại mà user chủ động đưa vào plan mới. User có 50.000.000đ trong ngân hàng nhưng chỉ muốn đưa 2.000.000đ vào kế hoạch thì carry-over là 2.000.000đ, không phải 50.000.000đ. MVP không cho carry-over âm.

### Planned available money

Số tiền user dự kiến có thể phân bổ:

`plannedIncome + carryOver`

Ví dụ 12.000.000đ planned income + 1.000.000đ carry-over = 13.000.000đ.

### Actual expense

Tổng tiền thực sự chi ra từ các `EXPENSE` transactions trong tháng. Planned allocation không làm tăng actual expense.

### Actual available money

Góc nhìn dựa trên phát sinh thật:

`actualIncome + carryOver`

Ví dụ actual income 10.000.000đ và carry-over 1.000.000đ thì actual available money là 11.000.000đ.

### Remaining cash flow

Tiền còn lại theo actual data:

`actualIncome + carryOver - actualExpense`

Không dùng planned income trong công thức này.

### Expense budget

Số tiền user dự kiến dành cho một expense category, ví dụ Food 3.000.000đ. Budget không phải transaction và không tự làm giảm wallet balance.

### Remaining budget

`plannedAmount - actualExpense(category)`.

Nếu Food planned 3.000.000đ và actual 2.000.000đ thì remaining budget là 1.000.000đ.

### Overspending

Chỉ xảy ra khi actual expense lớn hơn planned amount:

`max(actualAmount - plannedAmount, 0)`.

Food planned 3.000.000đ, actual 3.600.000đ → overspending 600.000đ.

### Planned saving

Số tiền user dự kiến earmark cho savings, được nhập trực tiếp trên MonthlyPlan. Đây chưa phải actual saving transaction và không phải Expense trong MVP. Nếu planned saving là 3.000.000đ và actual expense là 5.000.000đ thì actual expense vẫn là 5.000.000đ.

MVP chưa có savings goal, savings wallet hoặc transfer. Không được hiển thị planned saving như tiền đã chuyển thành công.

### Unallocated money

Tiền trong planned available money chưa được gán vào expense budget hoặc planned saving:

`plannedAvailableMoney - totalAllocated`.

`totalAllocated = totalExpenseAllocated + plannedSaving`.

### Category không được cấp budget nhưng vẫn chi tiêu

Nếu Health không có allocation nhưng có expense 500.000đ: planned amount = 0, actual amount = 500.000đ, usage = N/A/null, status = EXCEEDED, overspending = 500.000đ. Không hiển thị Infinity%.

## Wallet rules

`initialBalance` là số dư wallet tại thời điểm user bắt đầu tracking. Không được nhập cùng khoản tiền vừa là initial balance vừa là income transaction.

`walletBalance = initialBalance + income - expense`.

Wallet archive chỉ chặn transaction mới; transaction cũ và historical balance vẫn được tính.

## Allocation rules

- MonthlyBudgetAllocation chỉ đại diện cho Expense Budget và phải reference một EXPENSE category.
- Không có savings allocation trong MVP; plannedSaving chỉ là field của MonthlyPlan.
- `totalExpenseAllocated = SUM(MonthlyBudgetAllocation.plannedAmount)`.
- `totalAllocated = totalExpenseAllocated + plannedSaving`.
- `plannedSaving >= 0`.
- `totalExpenseAllocated + plannedSaving <= plannedAvailableMoney`.
- Actual spending được phép vượt allocation.
- Planned saving không đi vào actual expense, expense budget usage hoặc wallet balance.
- MVP không có actualSaving, savings progress hoặc saving transaction.

## Status rules

- `SAFE`: usage < 80%.
- `WARNING`: 80% <= usage < 100%.
- `AT_LIMIT`: usage = 100%.
- `EXCEEDED`: usage > 100%.

100% không phải overspending. Planned 0/actual 0 → SAFE, usage 0. Planned 0/actual > 0 → EXCEEDED, usage N/A/null.

## Dates, ownership and recalculation

`transactionDate` là business date quyết định tháng báo cáo; `createdAt` không quyết định tháng. Sửa transaction từ 31/08 sang 01/09 phải làm August giảm và September tăng. Đổi amount/category/wallet hoặc delete cũng phải recalculate aggregate liên quan.

Backend phải derive user identity từ auth context và kiểm tra ownership cho mọi read, create, update và delete.
Wallet transfer là movement riêng giữa hai wallet active thuộc cùng user. Source và destination phải khác nhau; transfer bị soft-delete thì không còn ảnh hưởng balance và không bao giờ được tính vào income/expense.

## Precision

MVP chọn PostgreSQL `NUMERIC(19,2)`/Decimal để tránh floating-point và giữ khả năng mở rộng. API dùng decimal string; UI VND hiển thị không có chữ số thập phân.
