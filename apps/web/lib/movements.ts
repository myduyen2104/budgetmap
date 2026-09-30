export type Kind = "INCOME" | "EXPENSE" | "TRANSFER";
export type WalletRef = {
  id: string;
  name: string;
  archivedAt?: string | null;
};
export type CategoryRef = {
  id: string;
  name: string;
  type: "INCOME" | "EXPENSE";
  icon?: string | null;
  color?: string | null;
  archivedAt?: string | null;
};
export type Transaction = {
  id: string;
  type: "INCOME" | "EXPENSE";
  amount: string;
  transactionDate: string;
  note: string | null;
  wallet: WalletRef;
  category: CategoryRef;
};
export type Transfer = {
  id: string;
  amount: string;
  transferDate: string;
  note: string | null;
  sourceWallet: WalletRef;
  destinationWallet: WalletRef;
};
export type Editing =
  | { kind: "TRANSFER"; item: Transfer }
  | { kind: "TRANSACTION"; item: Transaction };
export type PageData<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};
export function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
export function errorMessage(error: unknown): string {
  const code = error instanceof Error ? error.message : "";
  const messages: Record<string, string> = {
    INVALID_AMOUNT: "Số tiền phải lớn hơn 0 và có tối đa 2 chữ số thập phân.",
    TRANSFER_SAME_WALLET: "Ví nguồn và ví nhận phải khác nhau.",
    INVALID_DATE: "Ngày giao dịch không hợp lệ.",
    NOT_FOUND:
      "Không tìm thấy dữ liệu hoặc ví đã được lưu trữ. Hãy tải lại và thử lại.",
    WALLET_ARCHIVED: "Ví đã được lưu trữ. Vui lòng chọn ví đang hoạt động.",
    CATEGORY_TYPE_MISMATCH: "Danh mục không phù hợp với loại giao dịch.",
    UNAUTHORIZED: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
    FORBIDDEN: "Bạn không có quyền thực hiện thao tác này.",
    VALIDATION_ERROR: "Vui lòng kiểm tra các thông tin đã nhập.",
  };
  return (
    messages[code] ??
    "Không thể thực hiện yêu cầu. Kiểm tra kết nối và thử lại."
  );
}
