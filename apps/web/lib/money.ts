// Money remains a decimal string; bigint is used only for exact input validation.
function parseMoneyInput(value: string): { whole: string; fraction: string } | null {
  const raw = value.trim().replace(/\s/g, "");
  if (!raw) return null;
  if (!/^\d[\d,.]*$/.test(raw)) return null;
  const commas = (raw.match(/,/g) ?? []).length;
  const dots = (raw.match(/\./g) ?? []).length;
  const lastComma = raw.lastIndexOf(",");
  const lastDot = raw.lastIndexOf(".");
  if ((commas === 1 && dots === 0 && raw.length - lastComma - 1 > 2) || (dots === 1 && commas === 0 && raw.length - lastDot - 1 > 2)) return null;
  let decimalIndex = -1;
  if (commas && dots) {
    const fractionLength = raw.length - Math.max(lastComma, lastDot) - 1;
    if (fractionLength > 0 && fractionLength <= 2) decimalIndex = Math.max(lastComma, lastDot);
  }
  else if (commas) {
    const fractionLength = raw.length - lastComma - 1;
    if (commas === 1 && fractionLength > 0 && fractionLength <= 2) decimalIndex = lastComma;
  } else if (dots) {
    const fractionLength = raw.length - lastDot - 1;
    if (dots === 1 && fractionLength > 0 && fractionLength <= 2) decimalIndex = lastDot;
  }
  const wholePart = decimalIndex >= 0 ? raw.slice(0, decimalIndex) : raw;
  const fractionPart = decimalIndex >= 0 ? raw.slice(decimalIndex + 1) : "";
  const whole = wholePart.replace(/\D/g, "").replace(/^0+(?=\d)/, "");
  if (!whole && !fractionPart.replace(/\D/g, "")) return null;
  return { whole: whole || "0", fraction: fractionPart.replace(/\D/g, "").slice(0, 2) };
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

export function formatVnd(value: string): string {
  const [whole, fraction = "00"] = value.split(".");
  return whole.replace(/\B(?=(\d{3})+(?!\d))/g, ".") + (fraction !== "00" && fraction !== "0" ? "," + fraction : "") + " ₫";
}

export function positiveAmount(value: string): string | null {
  const normalized = normalizeMoneyInput(value);
  if (!/^\d{1,17}(\.\d{1,2})?$/.test(normalized)) return null;
  const [whole, fraction = ""] = normalized.split(".");
  if (BigInt(whole) * 100n + BigInt(fraction.padEnd(2, "0")) <= 0n) return null;
  return whole + "." + fraction.padEnd(2, "0");
}
