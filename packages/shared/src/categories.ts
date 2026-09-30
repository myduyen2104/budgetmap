export type CategoryType = "INCOME" | "EXPENSE";

export type CategoryIcon =
  | "utensils" | "house" | "lightbulb" | "droplet" | "wifi" | "phone"
  | "home" | "car" | "parking" | "taxi" | "wrench" | "shopping-bag"
  | "shirt" | "sparkles" | "laptop" | "gamepad" | "film" | "calendar"
  | "heart-pulse" | "pill" | "dumbbell" | "book" | "graduation-cap"
  | "shield" | "credit-card" | "receipt" | "chart-line" | "piggy-bank"
  | "users" | "gift" | "paw" | "plane" | "repeat" | "circle-dollar-sign"
  | "briefcase" | "bank" | "building" | "wallet" | "tag"
  | "gym" | "swimmer" | "swimming-pool" | "running" | "bike" | "stationary-bike"
  | "basketball" | "tennis" | "sport" | "spa" | "massage" | "spray-can-sparkles"
  | "robot" | "cloud-code" | "laptop-code" | "cloud" | "headphones"
  | "pets" | "dog" | "cat" | "baby" | "doctor" | "medicine" | "tooth" | "stethoscope"
  | "hospital" | "ambulance" | "syringe" | "medical-star" | "umbrella" | "file-invoice"
  | "school" | "pencil" | "calculator" | "child" | "baby-carriage"
  | "restaurant" | "apple-whole" | "grocery-bag" | "basket"
  | "bed" | "sofa" | "broom" | "key";

export type CategoryColor =
  | "purple" | "orange" | "blue" | "pink" | "violet" | "red"
  | "indigo" | "green" | "teal" | "amber" | "slate";

export type DefaultCategory = {
  name: string;
  type: CategoryType;
  icon: CategoryIcon;
  color: CategoryColor;
};

export const DEFAULT_CATEGORIES: readonly DefaultCategory[] = [
  { name: "Ăn uống", type: "EXPENSE", icon: "utensils", color: "orange" },
  { name: "Nhà cửa", type: "EXPENSE", icon: "house", color: "purple" },
  { name: "Điện nước", type: "EXPENSE", icon: "lightbulb", color: "amber" },
  { name: "Internet", type: "EXPENSE", icon: "wifi", color: "blue" },
  { name: "Điện thoại", type: "EXPENSE", icon: "phone", color: "teal" },
  { name: "Gia dụng", type: "EXPENSE", icon: "home", color: "violet" },
  { name: "Di chuyển", type: "EXPENSE", icon: "car", color: "blue" },
  { name: "Gửi xe", type: "EXPENSE", icon: "parking", color: "slate" },
  { name: "Taxi / xe công nghệ", type: "EXPENSE", icon: "taxi", color: "indigo" },
  { name: "Mua sắm", type: "EXPENSE", icon: "shopping-bag", color: "pink" },
  { name: "Quần áo", type: "EXPENSE", icon: "shirt", color: "pink" },
  { name: "Công nghệ / Thiết bị", type: "EXPENSE", icon: "laptop", color: "indigo" },
  { name: "Giải trí", type: "EXPENSE", icon: "gamepad", color: "violet" },
  { name: "Sức khỏe", type: "EXPENSE", icon: "heart-pulse", color: "red" },
  { name: "Giáo dục", type: "EXPENSE", icon: "book", color: "indigo" },
  { name: "Bảo hiểm", type: "EXPENSE", icon: "shield", color: "teal" },
  { name: "Trả nợ", type: "EXPENSE", icon: "credit-card", color: "red" },
  { name: "Phí ngân hàng", type: "EXPENSE", icon: "receipt", color: "slate" },
  { name: "Đầu tư", type: "EXPENSE", icon: "chart-line", color: "green" },
  { name: "Gia đình", type: "EXPENSE", icon: "users", color: "purple" },
  { name: "Quà tặng", type: "EXPENSE", icon: "gift", color: "pink" },
  { name: "Du lịch", type: "EXPENSE", icon: "plane", color: "blue" },
  { name: "Subscription", type: "EXPENSE", icon: "repeat", color: "violet" },
  { name: "Khác", type: "EXPENSE", icon: "circle-dollar-sign", color: "slate" },
  { name: "Gym & thể thao", type: "EXPENSE", icon: "gym", color: "blue" },
  { name: "Bơi lội", type: "EXPENSE", icon: "swimming-pool", color: "teal" },
  { name: "Chạy bộ", type: "EXPENSE", icon: "running", color: "green" },
  { name: "Đạp xe", type: "EXPENSE", icon: "bike", color: "blue" },
  { name: "Thể thao khác", type: "EXPENSE", icon: "sport", color: "violet" },
  { name: "AI & công cụ số", type: "EXPENSE", icon: "robot", color: "violet" },
  { name: "Phần mềm & dịch vụ số", type: "EXPENSE", icon: "laptop-code", color: "indigo" },
  { name: "Lưu trữ đám mây", type: "EXPENSE", icon: "cloud-code", color: "blue" },
  { name: "Spa & massage", type: "EXPENSE", icon: "spa", color: "pink" },
  { name: "Chăm sóc cá nhân", type: "EXPENSE", icon: "spray-can-sparkles", color: "pink" },
  { name: "Bác sĩ & nha khoa", type: "EXPENSE", icon: "stethoscope", color: "red" },
  { name: "Thuốc", type: "EXPENSE", icon: "medicine", color: "red" },
  { name: "Thú cưng", type: "EXPENSE", icon: "pets", color: "orange" },
  { name: "Em bé", type: "EXPENSE", icon: "baby", color: "pink" },
  { name: "Lương", type: "INCOME", icon: "briefcase", color: "green" },
  { name: "Freelance", type: "INCOME", icon: "laptop", color: "blue" },
  { name: "Thưởng", type: "INCOME", icon: "gift", color: "pink" },
  { name: "Đầu tư / lợi nhuận", type: "INCOME", icon: "chart-line", color: "green" },
  { name: "Lãi ngân hàng", type: "INCOME", icon: "bank", color: "teal" },
  { name: "Cho thuê", type: "INCOME", icon: "building", color: "purple" },
  { name: "Hoàn tiền", type: "INCOME", icon: "wallet", color: "orange" },
  { name: "Thu nhập khác", type: "INCOME", icon: "circle-dollar-sign", color: "slate" },
];

export const CATEGORY_ICONS: readonly CategoryIcon[] = [
  "utensils", "house", "home", "lightbulb", "wifi", "phone", "car", "parking", "taxi",
  "shopping-bag", "shirt", "laptop", "gamepad", "film", "heart-pulse", "pill",
  "book", "graduation-cap", "shield", "credit-card", "receipt",
  "chart-line", "piggy-bank", "users", "gift", "paw", "plane", "repeat",
  "briefcase", "bank", "building", "wallet", "tag", "circle-dollar-sign",
  "gym", "swimmer", "swimming-pool", "running", "bike", "stationary-bike",
  "basketball", "tennis", "sport", "spa", "massage", "spray-can-sparkles",
  "robot", "cloud-code", "laptop-code", "cloud", "headphones",
  "pets", "dog", "cat", "baby", "doctor", "medicine", "tooth", "stethoscope",
  "hospital", "ambulance", "syringe", "medical-star", "umbrella", "file-invoice",
  "school", "pencil", "calculator", "child", "baby-carriage",
  "restaurant", "apple-whole", "grocery-bag", "basket",
  "bed", "sofa", "broom", "key",
];

export const CATEGORY_COLORS: readonly CategoryColor[] = [
  "purple", "orange", "blue", "pink", "violet", "red", "indigo", "green", "teal", "amber", "slate",
];

export function defaultCategory(name: string, type: CategoryType): DefaultCategory {
  const legacy: Record<string, DefaultCategory> = {
    Food: { name, type: "EXPENSE", icon: "utensils", color: "orange" },
    Housing: { name, type: "EXPENSE", icon: "house", color: "purple" },
    Transport: { name, type: "EXPENSE", icon: "car", color: "blue" },
    Salary: { name, type: "INCOME", icon: "briefcase", color: "green" },
    "Other income": { name, type: "INCOME", icon: "circle-dollar-sign", color: "slate" },
    // Common Vietnamese custom categories used by the demo and imported budgets.
    // Keeping these fallbacks here ensures badges stay identifiable even when
    // older records do not have icon/color metadata saved with them.
    "Tiền trọ": { name, type: "EXPENSE", icon: "house", color: "purple" },
    "Cho ba mẹ": { name, type: "EXPENSE", icon: "users", color: "pink" },
    "Đi chơi": { name, type: "EXPENSE", icon: "plane", color: "violet" },
    "Sửa xe": { name, type: "EXPENSE", icon: "wrench", color: "amber" },
    "Gói 4G": { name, type: "EXPENSE", icon: "wifi", color: "blue" },
    "Cà phê": { name, type: "EXPENSE", icon: "utensils", color: "orange" },
  };
  return DEFAULT_CATEGORIES.find((x) => x.name === name && x.type === type) ?? legacy[name] ?? {
    name, type, icon: "tag", color: "slate",
  };
}
