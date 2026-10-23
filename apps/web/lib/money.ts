// Money remains a decimal string; bigint is used only for exact input validation.
export const MAX_MONEY_AMOUNT = 1_000_000_000_000n;

function parseMoneyInput(value: string): { whole: string; fraction: string } | null {
  const raw = value.trim().replace(/\s/g, "");
  if (!raw || !/^\d[\d,.]*$/.test(raw)) return null;

  const normalizeWhole = (whole: string) => whole.replace(/\./g, "").replace(/^0+(?=\d)/, "") || "0";
  const commaCount = (raw.match(/,/g) ?? []).length;

  // The app displays Vietnamese thousands separators as dots and decimals as commas.
  if (commaCount) {
    if (commaCount !== 1) return null;
    const [whole, fraction] = raw.split(",");
    if (!/^\d[\d.]*$/.test(whole) || !/^\d{0,2}$/.test(fraction)) return null;
    return { whole: normalizeWhole(whole), fraction };
  }

  const dotCount = (raw.match(/\./g) ?? []).length;
  if (!dotCount) return { whole: normalizeWhole(raw), fraction: "" };

  // A dot followed by 1–2 digits can be a decimal separator. Three or more
  // digits after it means the user is continuing to type a grouped integer
  // (for example, the visible "1.234" becoming "1.2345").
  if (dotCount === 1) {
    const [whole, fraction] = raw.split(".");
    if (!/^\d+$/.test(whole)) return null;
    if (/^\d{1,2}$/.test(fraction)) return { whole: normalizeWhole(whole), fraction };
  }
  if (!/^\d[\d.]*$/.test(raw)) return null;
  return { whole: normalizeWhole(raw), fraction: "" };
}

export function normalizeMoneyInput(value: string): string {
  const parsed = parseMoneyInput(value);
  if (!parsed) return "";
  return parsed.whole + "." + parsed.fraction.padEnd(2, "0");
}

export function formatMoneyInput(value: string): string {
  const normalized = normalizeMoneyInput(value);
  if (!normalized) return "";
  const [whole, fraction = "00"] = normalized.split(".");
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return fraction !== "00" ? grouped + "," + fraction : grouped;
}

export function isMoneyInputWithinLimit(value: string): boolean {
  const normalized = normalizeMoneyInput(value);
  if (!normalized) return false;
  const [whole, fraction = ""] = normalized.split(".");
  return BigInt(whole) * 100n + BigInt(fraction) <= MAX_MONEY_AMOUNT * 100n;
}

export function formatVnd(value: string): string {
  const [whole, fraction = "00"] = value.split(".");
  return whole.replace(/\B(?=(\d{3})+(?!\d))/g, ".") + (fraction !== "00" && fraction !== "0" ? "," + fraction : "");
}

export function positiveAmount(value: string): string | null {
  const normalized = normalizeMoneyInput(value);
  if (!/^\d+(\.\d{1,2})?$/.test(normalized) || !isMoneyInputWithinLimit(normalized)) return null;
  const [whole, fraction = ""] = normalized.split(".");
  if (BigInt(whole) * 100n + BigInt(fraction.padEnd(2, "0")) <= 0n) return null;
  return whole + "." + fraction.padEnd(2, "0");
}
