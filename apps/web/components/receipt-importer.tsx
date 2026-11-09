"use client";

import { ChangeEvent, DragEvent, PointerEvent as ReactPointerEvent, useEffect, useMemo, useRef, useState } from "react";
import { createWorker, PSM } from "tesseract.js";
import { CategoryRef } from "../lib/movements";
import { recognizeHandwrittenLines } from "../lib/handwriting-ocr";

type Extracted = { amount: string; date: string; note: string };
type Props = { categories: CategoryRef[]; onRecognized: (fields: Extracted) => void; onChooseCategory: (categoryId: string) => void };
const categorySignals: Record<string, string[]> = {
  "ăn uống": ["ăn uống", "food", "restaurant", "nhà hàng", "quán ăn", "coffee", "cafe", "cà phê", "highlands", "phúc long", "trà sữa", "đồ uống", "thực phẩm", "tên món", "nước suối", "nước ngọt", "món ăn", "bánh đa", "thịt", "coca", "cơm", "phở", "bún", "lẩu", "rau củ"],
  "đi lại": ["đi lại", "xăng", "petrol", "gas station", "grab", "be bike", "taxi", "vé xe", "vé tàu", "vé máy bay", "bãi đỗ xe", "parking", "cao tốc", "thu phí", "transport", "biển số xe", "trạm thu phí"],
  "hóa đơn điện nước": ["tiền điện", "điện sinh hoạt", "evn", "tiền nước", "cấp nước", "water bill", "electricity", "internet", "cước internet", "viễn thông", "vnpt", "viettel telecom", "fpt telecom", "mã khách hàng điện", "mã khách hàng nước"],
  "mua sắm": ["siêu thị", "grocery", "shopping", "quần áo", "thời trang", "mỹ phẩm", "trung tâm thương mại", "mall", "winmart", "coopmart", "bach hoa xanh", "bách hóa xanh", "hóa đơn bán lẻ", "tạp hóa"],
  "sức khỏe": ["nhà thuốc", "nhà thuốc tây", "quầy thuốc", "hiệu thuốc", "pharmacy", "drugstore", "thuốc", "thuốc men", "dược phẩm", "dược", "bệnh viện", "hospital", "phòng khám", "clinic", "medical", "xét nghiệm", "dental", "nha khoa", "bệnh nhân", "bn trả", "bhyt", "bảo hiểm y tế", "khám bệnh", "đơn thuốc", "tiền khám", "viện phí"],
  "giáo dục": ["học phí", "tuition", "school", "trường học", "education", "khóa học", "course", "sách giáo khoa", "sinh viên", "học sinh", "trung tâm ngoại ngữ"],
  "nhà ở": ["tiền thuê nhà", "rent", "tiền nhà", "apartment", "chung cư", "sửa chữa nhà", "home maintenance"],
  "giải trí": ["cinema", "rạp chiếu phim", "phim", "netflix", "spotify", "game", "concert", "vé xem", "giải trí"],
  "du lịch": ["hotel", "khách sạn", "homestay", "booking", "travel", "du lịch", "resort", "tour"],
  "bảo hiểm và thuế": ["insurance", "bảo hiểm nhân thọ", "phí bảo hiểm", "premium", "thuế thu nhập", "thuế trước bạ", "lệ phí trước bạ", "phí dịch vụ công"],
};
const noteByReceiptType: Record<string, string> = {
  "ăn uống": "Thanh toán chi phí ăn uống", "đi lại": "Thanh toán chi phí đi lại", "hóa đơn điện nước": "Thanh toán hóa đơn điện nước", "mua sắm": "Thanh toán mua sắm", "sức khỏe": "Thanh toán chi phí sức khỏe", "giáo dục": "Thanh toán học phí", "nhà ở": "Thanh toán chi phí nhà ở", "giải trí": "Thanh toán chi phí giải trí", "du lịch": "Thanh toán chi phí du lịch", "bảo hiểm và thuế": "Thanh toán bảo hiểm hoặc thuế",
};
const merchantCategorySignals: Record<string, string[]> = {
  "mua sắm": ["miniso"],
};
const normalizeText = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase();
const paymentTotalLabel = /(grand\s+total|invoice\s+total|total\s+(?:due|paid|payable|to\s+pay|payment|amount)|amount\s+(?:due|paid|payable|to\s+pay)|balance\s+due|final\s+amount|net\s+payable|tổng\s+(?:thanh toán|tiền|cộng|phải trả|cần trả|thành tiền)|tong\s+(?:thanh toan|tien|cong|phai tra|can tra|thanh tien)|cong\s+(?:tien|mat)|khách\s+(?:phải trả|thanh toán)|phải\s+trả|cần\s+(?:thanh toán|trả)|thanh\s+toán\s+cuối|đã\s+thanh\s+toán|amount\s+payable|total\b)/i;
const excludedAdjustment = /(tiết\s*kiệm|tiet\s*kiem|savings|you\s+save|discount|giảm\s*giá|giam\s*gia|voucher|coupon|promotion|subtotal|sub\s+total)/i;
const expandReceiptYear = (raw: string, currentYear = new Date().getFullYear()) => {
  const value = Number(raw);
  if (raw.length !== 2) return value;
  return value <= currentYear % 100 ? 2000 + value : 1900 + value;
};

function cleanAmount(raw: string) {
  let value = raw.replace(/\s/g, "").replace(/[^\d.,]/g, "");
  if (!value) return "";
  const dot = value.lastIndexOf("."), comma = value.lastIndexOf(","), decimalAt = Math.max(dot, comma);
  const decimalDigits = decimalAt < 0 ? 0 : value.length - decimalAt - 1;
  if (dot >= 0 && comma >= 0 && decimalDigits > 0 && decimalDigits <= 2) {
    value = `${value.slice(0, decimalAt).replace(/[.,]/g, "")}.${value.slice(decimalAt + 1)}`;
  } else if ((dot >= 0 || comma >= 0) && decimalDigits > 0 && decimalDigits <= 2 && !/[.,].*[.,]/.test(value)) {
    value = `${value.slice(0, decimalAt).replace(/[.,]/g, "")}.${value.slice(decimalAt + 1)}`;
  } else value = value.replace(/[.,]/g, "");
  const number = Number(value), digits = value.replace(/\D/g, "");
  return Number.isFinite(number) && number > 0 && digits.length >= 4 && digits.length <= 10 ? number.toFixed(2) : "";
}

function parseVietnameseAmountWords(raw: string) {
  const tokens = normalizeText(raw).match(/[a-z]+/g) ?? [];
  const digit: Record<string, number> = { khong: 0, mot: 1, hai: 2, ba: 3, bon: 4, tu: 4, nam: 5, lam: 5, sau: 6, bay: 7, tam: 8, chin: 9 };
  const ignored = new Set(["dong", "chan", "vnd", "viet", "bang", "chu", "thanh", "tien"]);
  const scales: Record<string, number> = { ngan: 1_000, nghin: 1_000, trieu: 1_000_000, ty: 1_000_000_000 };
  if (!tokens.length || !tokens.some(token => token in scales)) return "";
  if (tokens.some(token => !(token in digit) && !(token in scales) && !["tram", "muoi", "linh", "le"].includes(token) && !ignored.has(token))) return "";

  const parseGroup = (group: string[]) => {
    let total = 0, pending: number | undefined;
    for (const token of group) {
      if (token in digit) {
        if (pending !== undefined) total += pending;
        pending = digit[token];
      } else if (token === "tram" || token === "muoi") {
        total += (pending ?? 1) * (token === "tram" ? 100 : 10);
        pending = undefined;
      } else if (token === "linh" || token === "le") {
        if (pending !== undefined) total += pending;
        pending = undefined;
      }
    }
    return total + (pending ?? 0);
  };

  let total = 0, group: string[] = [];
  for (const token of tokens) {
    if (token in scales) {
      const multiplier = scales[token];
      const groupValue = parseGroup(group);
      total += (groupValue || 1) * multiplier;
      group = [];
    } else if (!ignored.has(token)) group.push(token);
  }
  total += parseGroup(group);
  return Number.isSafeInteger(total) && total > 0 && total <= 1_000_000_000_000 ? total.toFixed(2) : "";
}

function parseReceipt(text: string) {
  const lines = text.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
  // Receipts commonly print dates as either DD/MM/YYYY or ISO YYYY-MM-DD.
  // Only treat a date as year-first when the year has four digits. With a
  // short year, common Vietnamese receipt dates such as 05/11/26 are D/M/YY.
  const datePattern = /(?:^|\D)(?:(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})|(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4}))(?:\D|$)/;
  // OCR often preserves the closing parenthesis in labels like "(Ngày):".
  const dateLabel = /(?:\bn(?:g|u)[aà]y[\s):.-]*|ngày khám(?: bệnh)?|ngày vào(?: viện| khám)?|ngày lập(?: hóa đơn| phiếu)?|ngày hóa đơn|ngày thanh toán|ngày giao dịch|giờ\s+(?:vào|ra)|gio\s+(?:vao|ra)|invoice date|bill date|transaction date|date)/i;
  const writtenDatePattern = /(?:ng[aà]y\s*)?(\d{1,2})\s*th[aá]ng\s*(\d{1,2})\s*n[aă]m\s*(\d{2,4})(?![\d/.-])/i;
  const labeledDateLine = lines.find(line => dateLabel.test(line) && (datePattern.test(line) || writtenDatePattern.test(line)));
  // Accept an unlabeled date only when OCR isolated it as its own line. Never
  // mine date-like fragments from serial numbers or unrelated receipt text.
  const standaloneDateLine = lines.find(line => /^\s*(?:date\s*[:.-]?\s*)?(?:\d{4}[-/.]\d{1,2}[-/.]\d{1,2}|\d{1,2}[/.-]\d{1,2}[/.-]\d{4})(?:\s+\d{1,2}[:.]\d{2}(?::\d{2})?)?\s*$/i.test(line));
  // Thermal receipts often print date and time beside the invoice number, rather
  // than on a line labelled "Date". Only use an embedded date when a time follows.
  const timestampDateLine = lines.find(line => {
    const match = line.match(datePattern);
    if (!match) return false;
    const dateEnd = (match.index ?? 0) + match[0].length;
    const afterDate = line.slice(dateEnd);
    // OCR often drops the colon from a receipt time ("19:24" -> "1924" or
    // "19 24"). Accept a valid HHmm immediately after the date on that same
    // header line, without treating unrelated invoice IDs as timestamps.
    return /\b(?:[01]?\d|2[0-3])\s*[:.]?\s*[0-5]\d\b/.test(afterDate);
  });
  const dateSource = labeledDateLine ?? standaloneDateLine ?? timestampDateLine ?? "";
  const dateMatch = dateSource.match(datePattern);
  const writtenDateMatch = dateSource.match(writtenDatePattern);
  let date = "";
  if (dateMatch) {
    const yearFirst = Boolean(dateMatch[1]);
    const parsedYear = expandReceiptYear(yearFirst ? dateMatch[1] : dateMatch[6]);
    const first = Number(yearFirst ? dateMatch[2] : dateMatch[4]);
    const second = Number(yearFirst ? dateMatch[3] : dateMatch[5]);
    const month = yearFirst || (first <= 12 && second > 12) ? first : second;
    const day = yearFirst || (first <= 12 && second > 12) ? second : first;
    const candidate = `${parsedYear}-${String(month).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
    const [candidateYear, monthNumber, dayNumber] = candidate.split("-").map(Number);
    const parsed = new Date(Date.UTC(candidateYear, monthNumber - 1, dayNumber));
    const today = new Date();
    const todayUtc = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
    if (parsed.getTime() <= todayUtc && candidateYear >= today.getFullYear() - 40 && parsed.getUTCFullYear() === candidateYear && parsed.getUTCMonth() + 1 === monthNumber && parsed.getUTCDate() === dayNumber) date = candidate;
  } else if (writtenDateMatch) {
    const dayNumber = Number(writtenDateMatch[1]), monthNumber = Number(writtenDateMatch[2]), candidateYear = expandReceiptYear(writtenDateMatch[3]);
    const parsed = new Date(Date.UTC(candidateYear, monthNumber - 1, dayNumber));
    const today = new Date();
    const todayUtc = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
    if (parsed.getTime() <= todayUtc && candidateYear >= today.getFullYear() - 40 && parsed.getUTCFullYear() === candidateYear && parsed.getUTCMonth() + 1 === monthNumber && parsed.getUTCDate() === dayNumber) date = `${candidateYear}-${String(monthNumber).padStart(2,"0")}-${String(dayNumber).padStart(2,"0")}`;
  }
  // The main pass may read a date like "Nuày 05/02/202¢": day/month are
  // legible, but one year digit is not. If another labelled date pass confirms
  // the same day and year, keep the main pass's month instead of letting a
  // conflicting footer read silently replace it.
  if (!date) {
    const partialLine = lines.find(line => dateLabel.test(line)
      && /(?:^|\D)(\d{1,2})[/.-](\d{1,2})[/.-]\d{3}\D/.test(line));
    const partialMatch = partialLine?.match(/(?:^|\D)(\d{1,2})[/.-](\d{1,2})[/.-]\d{3}\D/);
    const supportingLine = partialLine
      ? lines.find(line => line !== partialLine && dateLabel.test(line) && datePattern.test(line))
      : undefined;
    const supportingMatch = supportingLine?.match(datePattern);
    if (partialMatch && supportingMatch && !supportingMatch[1] && supportingMatch[6]?.length === 4) {
      const day = Number(partialMatch[1]);
      const month = Number(partialMatch[2]);
      const supportingDay = Number(supportingMatch[4]);
      const year = Number(supportingMatch[6]);
      const candidate = new Date(Date.UTC(year, month - 1, day));
      const today = new Date();
      const todayUtc = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
      if (day === supportingDay && candidate.getTime() <= todayUtc && year >= today.getFullYear() - 40
        && candidate.getUTCFullYear() === year && candidate.getUTCMonth() + 1 === month && candidate.getUTCDate() === day) {
        date = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      }
    }
  }
  // Some receipt IDs encode YYYYMMDD (for example, "Mã bill: 2026031500139").
  // If the printed date OCR differs by exactly one day in the same month/year,
  // use that explicitly labelled ID as corroboration for a common 5/6 digit
  // confusion. Do not infer dates from arbitrary order or phone numbers.
  const billIdLine = lines.find(line => /(?:ma\s*bill|bill\s*(?:no|number|#)|invoice\s*(?:no|number|#))/i.test(normalizeText(line)));
  const billIdDate = billIdLine?.match(/\b((?:19|20)\d{6})\d{2,}\b/)?.[1];
  if (date && billIdDate) {
    const year = Number(billIdDate.slice(0, 4));
    const month = Number(billIdDate.slice(4, 6));
    const day = Number(billIdDate.slice(6, 8));
    const candidate = new Date(Date.UTC(year, month - 1, day));
    const [readYear, readMonth, readDay] = date.split("-").map(Number);
    const validIdDate = candidate.getUTCFullYear() === year && candidate.getUTCMonth() + 1 === month && candidate.getUTCDate() === day;
    if (validIdDate && year === readYear && month === readMonth && Math.abs(day - readDay) === 1) {
      date = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    }
  }
  const patientLabel = /(bn\s*(?:tự\s*)?trả|bệnh nhân\s*(?:tự\s*)?(?:trả|thanh toán|đóng)|người bệnh\s*(?:tự\s*)?(?:trả|thanh toán|đóng)|patient\s*(?:paid|payable)|patient portion)/i;
  const insuranceLabel = /(bhyt|bảo hiểm y tế|bảo hiểm\s*chi trả|insurance\s*(?:paid|coverage)|insurer\s*(?:paid|portion))/i;
  const totalLabel = paymentTotalLabel;
  const irrelevant = /(mã|code|bill\s?no|invoice\s?no|receipt\s?no|order\s?no|số hóa đơn|số hd|điện thoại|phone|hotline|góp ý|contact|customer service|liên hệ|số tk|so tk|tài khoản|tai khoan|ngân hàng|ngan hang|mst|terminal|trace|reference|ref\b|card|thẻ|tiền thừa|cashier|points?|reward|received|member code|điểm thưởng)/i;
  const promotionLine = /(quà tặng|qua tang|phiếu|phieu|voucher|coupon|khuyến mãi|khuyen mai|mã giảm|ma giam|áp dụng|ap dung|tặng kèm|tang kem|gift card|(?:mua )?hàng.{0,24}(?:₫|đ|vnd))/i;
  const isPromotionLine = (line: string) => promotionLine.test(normalizeText(line));
  const patientLines = lines.flatMap(line => {
    if (!patientLabel.test(line) || irrelevant.test(line)) return [];
    if (!insuranceLabel.test(line)) return [line];
    return [...line.matchAll(new RegExp(patientLabel.source,"gi"))].map(match => {
      const rest = line.slice((match.index ?? 0) + match[0].length);
      const next = /(?:bhyt|bảo hiểm y tế|bảo hiểm chi trả|bn\s*(?:tự\s*)?trả|bệnh nhân|người bệnh)/i.exec(rest);
      return rest.slice(0, next?.index ?? rest.length);
    });
  });
  const totals = lines.filter(line => totalLabel.test(normalizeText(line)) && !insuranceLabel.test(line)
    && !irrelevant.test(line) && !excludedAdjustment.test(normalizeText(line)) && !isPromotionLine(line));
  const amountLines = patientLines.length ? patientLines : totals;
  // OCR commonly inserts a space after the thousands separator ("383. 000").
  const groupedAmount = String.raw`\d{1,3}(?:(?:[.,]\s*|\s+)\d{3})+(?:[,\.]\s*\d{1,2})?`;
  const standaloneAmountPattern = new RegExp(String.raw`^\s*(?:${groupedAmount}|\d{4,10})\s*$`);
  const amountPattern = new RegExp(String.raw`(?<!\d)(?:${groupedAmount}|\d{4,10})(?!\d)`, "g");
  // Do not accept a plausible prefix such as "1,679" when OCR has left more
  // digits garbled immediately afterward (for example "1,679 oa i 5").
  // That is a truncated total, not a reliable 1,679 VND receipt amount.
  const isTruncatedTotalLine = (line: string) => {
    for (const match of line.matchAll(amountPattern)) {
      const tail = line.slice((match.index ?? 0) + match[0].length);
      const remainingText = tail.trim();
      if (/^\D{1,8}\d/.test(tail)
        || (/^[a-z]+(?:\s+[a-z]+)*$/i.test(remainingText) && !/^(?:vnd|dong|d)$/i.test(remainingText))) return true;
    }
    return false;
  };
  const hasTruncatedLabeledTotal = totals.some(isTruncatedTotalLine);
  const amountCandidates = amountLines.flatMap(line => (line.match(amountPattern) ?? []).map(cleanAmount).filter(Boolean));
  // Only accept money on the labelled payment/total row or immediately
  // adjacent OCR rows. Never fall back to arbitrary prices elsewhere in the
  // photo, since a second document may be visible behind the receipt.
  const labeledCandidates = totals.flatMap((totalLine, totalIndex) => {
    const labelIndex = lines.indexOf(totalLine);
    const direct = (totalLine.match(amountPattern) ?? []).map(cleanAmount).filter(Boolean);
    if (direct.length && !isTruncatedTotalLine(totalLine)) return [{ amount: direct.at(-1)!, rank: totalIndex }];
    const candidates: string[] = [];
    for (let offset = 1; offset <= 3; offset++) {
      const index = labelIndex + offset;
      if (index >= lines.length) break;
      const candidateLine = lines[index];
      const normalizedLine = normalizeText(candidateLine);
      if (excludedAdjustment.test(normalizedLine)) continue;
      if (irrelevant.test(candidateLine) || isPromotionLine(candidateLine) || insuranceLabel.test(candidateLine)) continue;
      const directAmounts = (candidateLine.match(amountPattern) ?? []).map(cleanAmount).filter(Boolean);
      // A nearby number is trusted only when it is a bare amount row or carries
      // an explicit currency marker. This prevents support phone numbers and
      // unrelated prose from being mistaken for the payable amount.
      const isAmountRow = standaloneAmountPattern.test(candidateLine) || /[₫đ]|vnd/i.test(candidateLine);
      if (directAmounts.length && isAmountRow && !isTruncatedTotalLine(candidateLine)) candidates.push(directAmounts.at(-1)!);
      if (/^\d{1,3}$/.test(candidateLine) && /^\d{3}$/.test(lines[index + 1] ?? "")) {
        const joined = cleanAmount(`${candidateLine}${lines[index + 1]}`);
        if (joined) candidates.push(joined);
      }
      if (directAmounts.length && !isAmountRow) break;
    }
    return candidates.length ? [{ amount: candidates.at(-1)!, rank: totalIndex }] : [];
  });
  // Some electronic invoices print the total on a separate row from its label
  // and repeat it in Vietnamese words. Use that value only when the explicit
  // “Số tiền viết bằng chữ” label is present; never derive totals by summing
  // item prices or choosing an unrelated number elsewhere on the page.
  const amountInWordsLine = lines.find(line => /(?:s[oố]\s*ti[eề]n\s*vi[eế]t\s*b[aằ]ng\s*ch[uữ]|amount\s+in\s+words)/i.test(line));
  const amountInWords = amountInWordsLine
    ? parseVietnameseAmountWords(amountInWordsLine.replace(/^(?:s[oố]\s*ti[eề]n\s*vi[eế]t\s*b[aằ]ng\s*ch[uữ]|amount\s+in\s+words)\s*[:：]?\s*/i, ""))
    : "";
  const amount = patientLines.length
    ? amountCandidates[0] ?? ""
    : labeledCandidates.at(-1)?.amount ?? amountInWords;
  const normalized = normalizeText(text);
  const ranked = Object.entries(categorySignals).map(([category, words]) => {
    const matches = words.filter(word => normalized.includes(normalizeText(word)));
    return { category, score: matches.reduce((total, word) => total + Math.max(1, normalizeText(word).length / 6), 0) };
  }).sort((a,b) => b.score - a.score);
  const merchantHint = Object.entries(merchantCategorySignals).find(([, merchants]) =>
    merchants.some(merchant => normalized.includes(normalizeText(merchant)))
  )?.[0] ?? "";
  const categoryHint = merchantHint || ((ranked[0]?.score ?? 0) >= 1 ? ranked[0].category : "");
  return { amount, date, categoryHint, hasTruncatedLabeledTotal, hasLabeledTotal: totals.length > 0 };
}

function parseSplitHeaderDate(text: string) {
  const lines = text.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
  for (let index = 0; index < lines.length - 1; index++) {
    // Numeric-only OCR sometimes splits a compact receipt date at the slash:
    // "08/:" followed by "11/2026". Only join adjacent header-crop lines with
    // this exact structure, then run the ordinary calendar/range validation.
    const day = lines[index].match(/^\s*(\d{1,2})\s*[/.: -]+\s*$/)?.[1];
    const monthYear = lines[index + 1].match(/^\s*(\d{1,2})\s*[/.-]\s*(\d{4})\s*$/);
    if (!day || !monthYear) continue;
    const parsed = parseReceipt(`${day}/${monthYear[1]}/${monthYear[2]}`).date;
    if (parsed) return parsed;
  }
  return "";
}

export function ReceiptImporter({ categories, onRecognized, onChooseCategory }: Props) {
  const [open,setOpen] = useState(false), [file,setFile] = useState<File|null>(null), [preview,setPreview] = useState(""), [imagePreview,setImagePreview] = useState(""), [imageOpen,setImageOpen] = useState(false), [imageRotation,setImageRotation] = useState(0), [imageZoom,setImageZoom] = useState(false), [imageOffset,setImageOffset] = useState({x:0,y:0}), [imageDragging,setImageDragging] = useState(false), [text,setText] = useState(""), [showText,setShowText] = useState(false), [status,setStatus] = useState(""), [busy,setBusy] = useState(false), [recognizedCategoryHint,setRecognizedCategoryHint] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);
  const rotatedPreviewUrl = useRef("");
  const imageDragStart = useRef<{pointerId:number;x:number;y:number;offsetX:number;offsetY:number}|null>(null);
  const parsed = useMemo(() => parseReceipt(text), [text]);
  const openImage = () => { setImageZoom(false); setImageOffset({x:0,y:0}); setImageRotation(0); setImagePreview(preview); setImageOpen(true); };
  const panStart = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!imageZoom) return;
    event.preventDefault();
    imageDragStart.current = { pointerId:event.pointerId, x:event.clientX, y:event.clientY, offsetX:imageOffset.x, offsetY:imageOffset.y };
    event.currentTarget.setPointerCapture(event.pointerId);
    setImageDragging(true);
  };
  const panMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const start = imageDragStart.current;
    if (!start || start.pointerId !== event.pointerId) return;
    setImageOffset({x:start.offsetX + event.clientX - start.x, y:start.offsetY + event.clientY - start.y});
  };
  const panEnd = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (imageDragStart.current?.pointerId !== event.pointerId) return;
    imageDragStart.current = null;
    setImageDragging(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  };
  const expenseCategories = categories.filter(category => category.type === "EXPENSE" && !category.archivedAt);
  const suggestedCategory = useMemo(() => {
    const normalized = normalizeText(text);
    const exact = expenseCategories.find(category => normalized.includes(normalizeText(category.name)));
    if (exact) return exact.id;
    const hint = recognizedCategoryHint || parsed.categoryHint;
    const matched = hint ? expenseCategories.find(category => {
      const name = normalizeText(category.name);
      return name.includes(normalizeText(hint)) || (categorySignals[hint] ?? []).some(word => name.includes(normalizeText(word)));
    })?.id : undefined;
    return matched ?? expenseCategories.find(category => ["khac", "other"].includes(normalizeText(category.name)))?.id ?? "";
  }, [categories, expenseCategories, parsed.categoryHint, recognizedCategoryHint, text]);
  useEffect(() => {
    if (!imageOpen) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") setImageOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [imageOpen]);
  useEffect(() => {
    if (imageOpen) return;
    if (rotatedPreviewUrl.current) URL.revokeObjectURL(rotatedPreviewUrl.current);
    rotatedPreviewUrl.current = "";
    setImagePreview(preview);
  }, [imageOpen, preview]);
  const acceptFile = (next?: File) => {
    if (!next) return;
    if (!next.type.startsWith("image/") || next.size > 10*1024*1024) { setStatus("Chọn ảnh hóa đơn tối đa 10 MB."); return; }
    setFile(next); setPreview(URL.createObjectURL(next)); setText(""); setStatus(""); setRecognizedCategoryHint("");
  };
  const selectFile = (event: ChangeEvent<HTMLInputElement>) => acceptFile(event.target.files?.[0]);
  const dropFile = (event: DragEvent<HTMLDivElement>) => { event.preventDefault(); acceptFile(event.dataTransfer.files[0]); };
  const applyText = (value: string, categoryHint = "", overrides?: Partial<Extracted>) => {
    setText(value);
    setRecognizedCategoryHint(categoryHint);
    const result = parseReceipt(value);
    const hint = result.categoryHint || categoryHint;
    onRecognized({ amount: overrides?.amount ?? result.amount, date: overrides?.date ?? result.date, note: noteByReceiptType[hint] ?? "" });
  };
  const getOcrImage = async (rotation = imageRotation, suppressRedInk = false): Promise<File | Blob> => {
    if (!file) throw new Error("Chưa chọn ảnh hóa đơn.");
    const bitmap = await createImageBitmap(file);
    const canvas = document.createElement("canvas");
    const quarterTurn = rotation % 180 !== 0;
    const width = quarterTurn ? bitmap.height : bitmap.width;
    const height = quarterTurn ? bitmap.width : bitmap.height;
    const oriented = document.createElement("canvas");
    oriented.width = width;
    oriented.height = height;
    const orientedContext = oriented.getContext("2d");
    if (!orientedContext) {
      bitmap.close();
      throw new Error("Không thể xử lý ảnh hóa đơn.");
    }
    orientedContext.translate(width / 2, height / 2);
    orientedContext.rotate((rotation * Math.PI) / 180);
    orientedContext.drawImage(bitmap, -bitmap.width / 2, -bitmap.height / 2);
    bitmap.close();
    // Keep the full frame so receipts near any edge are not cut off. Resize very
    // large phone photos to keep the OCR worker's memory use reasonable.
    const scale = Math.min(2, 2800 / Math.max(width, height));
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Không thể xử lý ảnh hóa đơn.");
    context.drawImage(oriented, 0, 0, canvas.width, canvas.height);
    // Handwritten Vietnamese forms often use blue ink over red printed labels.
    // Keep the grayscale print legible, while selectively darkening blue ink.
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;
    // Track neutral bright paper before converting the photo to grayscale. This
    // lets us crop a small receipt out of a dark/colorful tabletop background.
    const paperColumns = new Uint32Array(canvas.width);
    const paperRows = new Uint32Array(canvas.height);
    let blueInkSamples = 0, colorSamples = 0;
    for (let index = 0; index < pixels.length; index += 32) {
      const red = pixels[index], green = pixels[index + 1], blue = pixels[index + 2];
      if (blue > red + 14 && blue < 220 && red < 180) blueInkSamples++;
      colorSamples++;
    }
    const emphasizeBlueInk = blueInkSamples / colorSamples > 0.002;
    for (let index = 0; index < pixels.length; index += 4) {
      const red = pixels[index], green = pixels[index + 1], blue = pixels[index + 2];
      const pixel = index / 4;
      const minimum = Math.min(red, green, blue), maximum = Math.max(red, green, blue);
      if (minimum > 155 && maximum - minimum < 55) {
        paperColumns[pixel % canvas.width]++;
        paperRows[Math.floor(pixel / canvas.width)]++;
      }
      const grayscale = red * 0.299 + green * 0.587 + blue * 0.114;
      const blueInkBoost = emphasizeBlueInk ? Math.max(0, blue - red) * 0.75 : 0;
      // Handwriting crops get a separate pass that removes red invoice rules and
      // labels while preserving blue pen. Keep them in the Tesseract input so its
      // printed-text anchors still work.
      // Keep mixed blue-pen/red-rule pixels so rule removal does not break pen
      // strokes where they cross the printed form lines.
      const redTemplateInk = suppressRedInk && red > blue + 32 && red > green + 20 && red > 72;
      const intensity = redTemplateInk ? 255 : grayscale - blueInkBoost;
      const enhanced = Math.max(0, Math.min(255, (intensity - 128) * 1.65 + 136));
      pixels[index] = pixels[index + 1] = pixels[index + 2] = enhanced;
    }
    context.putImageData(imageData, 0, 0);
    const columnThreshold = canvas.height * 0.1;
    const rowThreshold = canvas.width * 0.05;
    const left = paperColumns.findIndex(count => count >= columnThreshold);
    const right = paperColumns.findLastIndex(count => count >= columnThreshold);
    const top = paperRows.findIndex(count => count >= rowThreshold);
    const bottom = paperRows.findLastIndex(count => count >= rowThreshold);
    if (left >= 0 && right > left && top >= 0 && bottom > top) {
      const paddingX = Math.round((right - left) * 0.035);
      const paddingY = Math.round((bottom - top) * 0.025);
      const cropLeft = Math.max(0, left - paddingX), cropTop = Math.max(0, top - paddingY);
      const cropRight = Math.min(canvas.width, right + paddingX), cropBottom = Math.min(canvas.height, bottom + paddingY);
      const cropWidth = cropRight - cropLeft, cropHeight = cropBottom - cropTop;
      const cropAreaRatio = (cropWidth * cropHeight) / (canvas.width * canvas.height);
      // Avoid aggressive crops when the detector sees a page filling the frame
      // or a small unrelated bright object instead of the receipt.
      if (cropWidth >= canvas.width * 0.08 && cropHeight >= canvas.height * 0.2 && cropAreaRatio < 0.88) {
        const cropped = document.createElement("canvas");
        cropped.width = cropWidth;
        cropped.height = cropHeight;
        const croppedContext = cropped.getContext("2d");
        if (croppedContext) {
          croppedContext.drawImage(canvas, cropLeft, cropTop, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);
          canvas.width = cropped.width;
          canvas.height = cropped.height;
          const croppedPixels = croppedContext.getImageData(0, 0, cropped.width, cropped.height);
          context.putImageData(croppedPixels, 0, 0);
        }
      }
    }
    return new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error("Không thể xử lý ảnh hóa đơn.")), file.type || "image/png");
    });
  };
  const deskewImage = async (source: Blob, radians: number): Promise<Blob> => {
    if (Math.abs(radians) < 0.005) return source;
    const bitmap = await createImageBitmap(source);
    const cosine = Math.abs(Math.cos(radians)), sine = Math.abs(Math.sin(radians));
    const canvas = document.createElement("canvas");
    canvas.width = Math.ceil(bitmap.width * cosine + bitmap.height * sine);
    canvas.height = Math.ceil(bitmap.height * cosine + bitmap.width * sine);
    const context = canvas.getContext("2d");
    if (!context) { bitmap.close(); throw new Error("Không thể cân chỉnh ảnh hóa đơn."); }
    context.fillStyle = "#fff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.translate(canvas.width / 2, canvas.height / 2);
    // Tesseract reports the exact correction angle it applied internally.
    // Apply the same rotation to our image so handwriting crops use matching coordinates.
    context.rotate(radians);
    context.drawImage(bitmap, -bitmap.width / 2, -bitmap.height / 2);
    bitmap.close();
    return new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error("Không thể cân chỉnh ảnh hóa đơn.")), source.type || "image/png");
    });
  };
  const rotateImage = async (source: Blob, degrees: number): Promise<Blob> => {
    const normalizedDegrees = ((degrees % 360) + 360) % 360;
    if (!normalizedDegrees) return source;
    const bitmap = await createImageBitmap(source);
    const quarterTurn = normalizedDegrees % 180 !== 0;
    const canvas = document.createElement("canvas");
    canvas.width = quarterTurn ? bitmap.height : bitmap.width;
    canvas.height = quarterTurn ? bitmap.width : bitmap.height;
    const context = canvas.getContext("2d");
    if (!context) { bitmap.close(); throw new Error("Không thể xoay ảnh hóa đơn."); }
    context.translate(canvas.width / 2, canvas.height / 2);
    context.rotate((normalizedDegrees * Math.PI) / 180);
    context.drawImage(bitmap, -bitmap.width / 2, -bitmap.height / 2);
    bitmap.close();
    return new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error("Không thể xoay ảnh hóa đơn.")), source.type || "image/png");
    });
  };
  const readImage = async () => {
    if (!file) return;
    setBusy(true); setStatus("Đang kiểm tra chiều ảnh…");
    let worker: Awaited<ReturnType<typeof createWorker>> | undefined;
    try {
      let ocrImage = await getOcrImage(imageRotation);
      // OSD requires legacy code/data. Keep it in a short-lived orientation worker;
      // the actual Vietnamese text pass uses the LSTM-only traineddata.
      let orientationWorker: Awaited<ReturnType<typeof createWorker>> | undefined;
      try {
        orientationWorker = await createWorker("osd",0,{legacyCore:true,legacyLang:true});
        const orientation = await orientationWorker.detect(ocrImage);
        if (orientation.data.orientation_degrees !== null
          && orientation.data.orientation_confidence !== null
          && orientation.data.orientation_confidence >= 5
          && orientation.data.orientation_degrees !== 0) {
          ocrImage = await rotateImage(ocrImage, orientation.data.orientation_degrees);
        }
      } finally {
        await orientationWorker?.terminate();
      }
      setStatus("Đang đọc nội dung hóa đơn…");
      worker = await createWorker(["vie","eng"],1);
      await worker.setParameters({tessedit_pageseg_mode:PSM.AUTO,preserve_interword_spaces:"1"});
      const recognizeBand = async (source: Blob, startRatio: number, endRatio: number) => {
        const bitmap = await createImageBitmap(source);
        try {
          const top = Math.max(0, Math.floor(bitmap.height * startRatio));
          const bottom = Math.min(bitmap.height, Math.ceil(bitmap.height * endRatio));
          const bandHeight = Math.max(1, bottom - top);
          // Enlarge small header/footer print before OCR. Cap the output size to
          // avoid large phone photos exhausting browser memory.
          const scale = Math.min(3, 4200 / Math.max(bitmap.width, bandHeight));
          const band = document.createElement("canvas");
          band.width = Math.max(1, Math.round(bitmap.width * scale));
          band.height = Math.max(1, Math.round(bandHeight * scale));
          const context = band.getContext("2d");
          if (!context) return "";
          context.fillStyle = "#fff";
          context.fillRect(0, 0, band.width, band.height);
          context.imageSmoothingEnabled = true;
          context.imageSmoothingQuality = "high";
          context.drawImage(bitmap, 0, top, bitmap.width, bandHeight, 0, 0, band.width, band.height);
          await worker!.setParameters({tessedit_pageseg_mode:PSM.SPARSE_TEXT,preserve_interword_spaces:"1"});
          const bandResult = await worker!.recognize(band, {}, {blocks:true});
          return bandResult.data.text.trim();
        } finally {
          bitmap.close();
          await worker!.setParameters({tessedit_pageseg_mode:PSM.AUTO,preserve_interword_spaces:"1"});
        }
      };
      const recognizeReceiptTotal = async (source: Blob): Promise<{ text: string; amount: string }> => {
        const bitmap = await createImageBitmap(source);
        try {
          // Phone photos often include a second receipt or other text behind
          // the main bill. Focus the lower, central part of the foreground
          // receipt so unrelated amounts elsewhere in the frame cannot win.
          // Receipts are not always placed on the left side of a photo. This
          // image has the foreground bill centered, with its amount column
          // close to x=0.7; the old 0.68 right boundary clipped that column.
          const left = Math.floor(bitmap.width * 0.16);
          const right = Math.ceil(bitmap.width * 0.9);
          // The payable total is usually in the lower-middle portion of a
          // receipt. A tight band keeps the table underneath the foreground
          // bill, plus its phone numbers and item rows, out of this pass.
          const top = Math.floor(bitmap.height * 0.25);
          const bottom = Math.ceil(bitmap.height * 0.96);
          const width = Math.max(1, right - left);
          const height = Math.max(1, bottom - top);
          const scale = Math.min(3, 4200 / Math.max(width, height));
          const crop = document.createElement("canvas");
          crop.width = Math.max(1, Math.round(width * scale));
          crop.height = Math.max(1, Math.round(height * scale));
          const context = crop.getContext("2d");
          if (!context) return { text: "", amount: "" };
          context.fillStyle = "#fff";
          context.fillRect(0, 0, crop.width, crop.height);
          context.imageSmoothingEnabled = true;
          context.imageSmoothingQuality = "high";
          context.drawImage(bitmap, left, top, width, height, 0, 0, crop.width, crop.height);
          await worker!.setParameters({ tessedit_pageseg_mode: PSM.SPARSE_TEXT, preserve_interword_spaces: "1" });
          const result = await worker!.recognize(crop, {}, { blocks: true });
          const cropLines = (result.data.blocks ?? []).flatMap(block =>
            block.paragraphs.flatMap(paragraph => paragraph.lines.map(line => ({ text: line.text.trim(), bbox: line.bbox })))
          ).filter(line => line.text);
          const valuePattern = /(?<!\d)(?:\d{1,3}(?:(?:[.,]\s*|\s+)\d{3})+(?:[,\.]\s*\d{1,2})?|\d{4,10})(?!\d)/g;
          const standaloneAmount = /^\s*(?:\d{1,3}(?:(?:[.,]\s*|\s+)\d{3})+(?:[,\.]\s*\d{1,2})?|\d{4,10})\s*$/;
          const overlapRatio = (first: { y0: number; y1: number }, second: { y0: number; y1: number }) => {
            const overlap = Math.max(0, Math.min(first.y1, second.y1) - Math.max(first.y0, second.y0));
            return overlap / Math.max(1, Math.min(first.y1 - first.y0, second.y1 - second.y0));
          };
          const totalRows = cropLines.filter(line => paymentTotalLabel.test(normalizeText(line.text))
            && !excludedAdjustment.test(normalizeText(line.text)));
          const amountRows = cropLines.flatMap(line => {
            if (excludedAdjustment.test(normalizeText(line.text))) return [];
            const values = (line.text.match(valuePattern) ?? []).map(cleanAmount).filter(Boolean);
            return values.map(amount => ({ ...line, amount }));
          });
          const alignedAmount = totalRows.flatMap(labelRow => {
            const onLabel = (labelRow.text.match(valuePattern) ?? []).map(cleanAmount).filter(Boolean);
            if (onLabel.length) return [onLabel.at(-1)!];
            const sameRow = amountRows.filter(row => overlapRatio(row.bbox, labelRow.bbox) >= 0.5);
            const candidates = sameRow.filter(row => standaloneAmount.test(row.text)
              || /[₫đ]|vnd/i.test(row.text));
            const ranked = candidates.sort((a, b) => b.bbox.x1 - a.bbox.x1);
            if (ranked.length) return [ranked[0].amount];

            // If OCR split a printed amount into two adjacent columns, join
            // the fragments only when they share the total label's physical row.
            const fragments = cropLines
              .filter(row => overlapRatio(row.bbox, labelRow.bbox) >= 0.5 && /^\d{1,3}$/.test(row.text))
              .sort((a, b) => a.bbox.x0 - b.bbox.x0);
            for (let index = 0; index < fragments.length - 1; index++) {
              const first = fragments[index], second = fragments[index + 1];
              const gap = second.bbox.x0 - first.bbox.x1;
              const fontHeight = Math.min(first.bbox.y1 - first.bbox.y0, second.bbox.y1 - second.bbox.y0);
              if (/^\d{3}$/.test(second.text) && gap <= fontHeight * 1.5) {
                const amount = cleanAmount(`${first.text}${second.text}`);
                if (amount) return [amount];
              }
            }
            return [];
          });
          return { text: result.data.text.trim(), amount: alignedAmount.at(-1) ?? "" };
        } finally {
          bitmap.close();
          await worker!.setParameters({ tessedit_pageseg_mode: PSM.AUTO, preserve_interword_spaces: "1" });
        }
      };
      const recognizeAdaptiveBand = async (source: Blob, startRatio: number, endRatio: number) => {
        const bitmap = await createImageBitmap(source);
        try {
          const top = Math.max(0, Math.floor(bitmap.height * startRatio));
          const bottom = Math.min(bitmap.height, Math.ceil(bitmap.height * endRatio));
          const bandHeight = Math.max(1, bottom - top);
          const scale = Math.min(2.5, 3600 / Math.max(bitmap.width, bandHeight));
          const band = document.createElement("canvas");
          band.width = Math.max(1, Math.round(bitmap.width * scale));
          band.height = Math.max(1, Math.round(bandHeight * scale));
          const context = band.getContext("2d", { willReadFrequently: true });
          if (!context) return "";
          context.fillStyle = "#fff";
          context.fillRect(0, 0, band.width, band.height);
          context.imageSmoothingEnabled = true;
          context.imageSmoothingQuality = "high";
          context.drawImage(bitmap, 0, top, bitmap.width, bandHeight, 0, 0, band.width, band.height);

          // Adaptive local thresholding helps faint thermal print under shadows
          // without turning the entire shaded paper into foreground noise.
          const image = context.getImageData(0, 0, band.width, band.height);
          const { width, height, data } = image;
          const stride = width + 1;
          const integral = new Uint32Array(stride * (height + 1));
          for (let y = 0; y < height; y++) {
            let rowSum = 0;
            for (let x = 0; x < width; x++) {
              const offset = (y * width + x) * 4;
              const gray = Math.round(data[offset] * 0.299 + data[offset + 1] * 0.587 + data[offset + 2] * 0.114);
              data[offset] = data[offset + 1] = data[offset + 2] = gray;
              rowSum += gray;
              integral[(y + 1) * stride + x + 1] = integral[y * stride + x + 1] + rowSum;
            }
          }
          const radius = Math.max(12, Math.round(18 * scale));
          for (let y = 0; y < height; y++) {
            const y0 = Math.max(0, y - radius), y1 = Math.min(height, y + radius + 1);
            for (let x = 0; x < width; x++) {
              const x0 = Math.max(0, x - radius), x1 = Math.min(width, x + radius + 1);
              const sum = integral[y1 * stride + x1] - integral[y0 * stride + x1] - integral[y1 * stride + x0] + integral[y0 * stride + x0];
              const mean = sum / ((x1 - x0) * (y1 - y0));
              const offset = (y * width + x) * 4;
              const binary = data[offset] < mean - 8 ? 0 : 255;
              data[offset] = data[offset + 1] = data[offset + 2] = binary;
            }
          }
          context.putImageData(image, 0, 0);
          await worker!.setParameters({ tessedit_pageseg_mode: PSM.SPARSE_TEXT, preserve_interword_spaces: "1" });
          const result = await worker!.recognize(band);
          return result.data.text.trim();
        } finally {
          bitmap.close();
          await worker!.setParameters({ tessedit_pageseg_mode: PSM.AUTO, preserve_interword_spaces: "1" });
        }
      };
      const recognizeHeaderDate = async (source: Blob) => {
        const bitmap = await createImageBitmap(source);
        try {
          // The date can shift vertically between thermal receipt layouts.
          // Read the whole paper header with a numeric whitelist instead of
          // assuming one fixed row or letting item names confuse digit OCR.
          const left = 0;
          const top = 0;
          const width = bitmap.width;
          const height = Math.max(1, Math.floor(bitmap.height * 0.34));
          const scale = Math.min(3, 4200 / Math.max(width, height));
          const crop = document.createElement("canvas");
          crop.width = Math.max(1, Math.round(width * scale));
          crop.height = Math.max(1, Math.round(height * scale));
          const context = crop.getContext("2d", { willReadFrequently: true });
          if (!context) return "";
          context.fillStyle = "#fff";
          context.fillRect(0, 0, crop.width, crop.height);
          context.imageSmoothingEnabled = true;
          context.imageSmoothingQuality = "high";
          context.drawImage(bitmap, left, top, width, height, 0, 0, crop.width, crop.height);
          const image = context.getImageData(0, 0, crop.width, crop.height);
          for (let i = 0; i < image.data.length; i += 4) {
            const gray = image.data[i] * 0.299 + image.data[i + 1] * 0.587 + image.data[i + 2] * 0.114;
            const enhanced = Math.max(0, Math.min(255, (gray - 128) * 1.8 + 128));
            image.data[i] = image.data[i + 1] = image.data[i + 2] = enhanced;
          }
          context.putImageData(image, 0, 0);
          await worker!.setParameters({
            tessedit_pageseg_mode: PSM.SPARSE_TEXT,
            tessedit_char_whitelist: "0123456789/.-:",
            preserve_interword_spaces: "1",
          });
          const result = await worker!.recognize(crop);
          return result.data.text.trim();
        } finally {
          bitmap.close();
          await worker!.setParameters({ tessedit_char_whitelist: "", tessedit_pageseg_mode: PSM.AUTO, preserve_interword_spaces: "1" });
        }
      };
      let result = await worker.recognize(ocrImage,{rotateAuto:true},{blocks:true});
      const correctionRadians = result.data.rotateRadians ?? 0;
      let alignedImage = ocrImage;
      let alignedHandwritingImage: Blob | undefined;
      if (Math.abs(correctionRadians) >= 0.005) {
        setStatus("Đang cân thẳng ảnh hóa đơn…");
        alignedImage = await deskewImage(ocrImage, correctionRadians);
        await worker.setParameters({tessedit_pageseg_mode:PSM.AUTO,preserve_interword_spaces:"1"});
        result = await worker.recognize(alignedImage,{}, {blocks:true});
      }
      const printedText = result.data.text.trim();
      const printedData = parseReceipt(printedText);
      setStatus("Đang kiểm tra riêng tổng tiền trên hóa đơn…");
      const focusedTotal = await recognizeReceiptTotal(alignedImage);
      let headerText = "";
      let footerText = "";
      let focusedHeaderDate = "";
      if (!printedData.date) {
        setStatus("Đang đọc kỹ ngày ở đầu hóa đơn…");
        headerText = await recognizeBand(alignedImage, 0, 0.34);
        if (!parseReceipt(headerText).date) {
          const adaptiveHeaderText = await recognizeAdaptiveBand(alignedImage, 0, 0.34);
          if (parseReceipt(adaptiveHeaderText).date) headerText = [headerText, adaptiveHeaderText].filter(Boolean).join("\n");
        }
        if (!parseReceipt(headerText).date) {
          const focusedDateText = await recognizeHeaderDate(alignedImage);
          if (focusedDateText) {
            focusedHeaderDate = parseReceipt(focusedDateText).date || parseSplitHeaderDate(focusedDateText);
            headerText = [headerText, focusedDateText].filter(Boolean).join("\n");
          }
        }
      }
      if (!printedData.amount || printedData.hasTruncatedLabeledTotal) {
        // Small or angled receipts often lose the total in a full-page scan.
        // Isolate and enlarge the summary area instead of trusting nearby values.
        setStatus("Đang đọc kỹ phần tổng hóa đơn…");
        footerText = await recognizeBand(alignedImage, 0.48, 1);
        if (printedData.hasTruncatedLabeledTotal) {
          const detailText = await recognizeBand(alignedImage, 0.64, 1);
          footerText = [footerText, detailText].filter(Boolean).join("\n");
        }
      }
      const handwrittenTemplate = /hoa don ban hang|thanh tien.{0,30}viet bang chu|ngay.{0,30}thang.{0,30}nam/i.test(normalizeText(printedText));
      const lines = (result.data.blocks ?? []).flatMap(block => block.paragraphs.flatMap(paragraph => paragraph.lines));
      const hasUncertainLines = lines.some(line => line.text.trim().length >= 2 && line.confidence < 75);
      let handwritingText = "", handwritingFailed = false, handwrittenDate = "", handwrittenAmount = "";
      if (handwrittenTemplate || hasUncertainLines) {
        setStatus("Đang nhận diện chữ viết tay…");
        try {
          alignedHandwritingImage ??= await getOcrImage(imageRotation, true);
          const handwritingImage = alignedImage === ocrImage
            ? alignedHandwritingImage
            : await deskewImage(alignedHandwritingImage, correctionRadians);
          const handwriting = await recognizeHandwrittenLines(handwritingImage, lines);
          handwritingText = handwriting.text;
          const dateGroups = handwriting.date.match(/\d+/g) ?? [];
          const dateDigits = dateGroups.length === 3 && dateGroups[0].length <= 2 && dateGroups[1].length <= 2 && dateGroups[2].length >= 2
            ? handwriting.date.match(/(?:^|\D)(\d{1,2})\D{1,5}(\d{1,2})\D{1,5}(\d{2,4})(?:\D|$)/)
            : null;
          if (dateDigits) {
            const day = Number(dateDigits[1]), month = Number(dateDigits[2]), year = expandReceiptYear(dateDigits[3]);
            const parsed = new Date(Date.UTC(year, month - 1, day));
            if (year >= new Date().getFullYear() - 40 && year <= new Date().getFullYear() + 10 && parsed.getUTCFullYear() === year && parsed.getUTCMonth() + 1 === month && parsed.getUTCDate() === day) handwrittenDate = `${year}-${String(month).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
          }
          const amountText = handwriting.amountNumber.trim();
          const amountMatches = [...amountText.matchAll(/(?<!\d)(?:\d{1,3}(?:[., ]\d{3}){1,3}|\d{5,10})(?!\d)/g)];
          const amountDigits = amountText.replace(/\D/g, "");
          // Do not accept a plausible-looking substring from a noisy line. Every
          // digit recognized in the amount crop must belong to the same candidate.
          const amountCandidates = amountMatches
            .filter(match => match[0].replace(/\D/g, "").length === amountDigits.length)
            .map(match => cleanAmount(match[0])).filter(Boolean);
          if (amountCandidates.length === 1) handwrittenAmount = amountCandidates[0];
          else handwrittenAmount = parseVietnameseAmountWords(handwriting.amountWords);
        } catch (error) {
          console.error("Handwriting OCR inference failed:", error instanceof Error ? error.message : String(error));
          handwritingFailed = true;
        }
      }
      const extracted = [printedText, headerText, footerText, handwritingText].filter(Boolean).join("\n").trim();
      const categoryHint = parseReceipt(extracted).categoryHint;
      const data = parseReceipt(extracted);
      const headerData = parseReceipt(headerText);
      const footerData = parseReceipt(footerText);
      // Keep the printed, labelled total stable. Handwriting OCR is less reliable
      // and should only fill the amount when the printed total was not found.
      const recognizedAmount = focusedTotal.amount
        || footerData.amount || printedData.amount || data.amount || (handwrittenTemplate ? handwrittenAmount : "");
      const recognizedDate = focusedHeaderDate || headerData.date || printedData.date || data.date || handwrittenDate;
      const amountConflictMessage = data.amount && handwrittenAmount && data.amount !== handwrittenAmount
        ? " Có số viết tay khác tổng in; hãy kiểm tra số tiền trước khi lưu."
        : "";
      applyText(extracted, categoryHint, { amount: recognizedAmount, date: recognizedDate });
      const normalized = normalizeText(extracted);
      const exactCategory = expenseCategories.find(category => normalized.includes(normalizeText(category.name)));
      const effectiveCategoryHint = data.categoryHint || categoryHint;
      const hintedCategory = effectiveCategoryHint ? expenseCategories.find(category => {
        const name = normalizeText(category.name);
        return name.includes(normalizeText(effectiveCategoryHint)) || (categorySignals[effectiveCategoryHint] ?? []).some(word => name.includes(normalizeText(word)));
      }) : undefined;
      const categoryName = (exactCategory ?? hintedCategory ?? expenseCategories.find(category => ["khac", "other"].includes(normalizeText(category.name))))?.name;
      const categoryMessage = categoryName
        ? ` Gợi ý danh mục: ${categoryName}.`
        : effectiveCategoryHint
          ? ` Có vẻ thuộc nhóm ${effectiveCategoryHint}; chọn danh mục phù hợp thủ công.`
          : " Chưa phân loại được; chọn danh mục thủ công.";
      const suggestedNote = noteByReceiptType[effectiveCategoryHint];
      const noteMessage = suggestedNote
        ? ` Gợi ý ghi chú: ${suggestedNote}.`
        : " Chưa xác định được nội dung ghi chú; vui lòng tự nhập hoặc kiểm tra lại trước khi lưu.";
      const handwrittenForm = /(?:viet\s+bang\s+chu|ngay.{0,30}thang.{0,30}nam)/i.test(normalized)
        || (normalized.includes("hoa don ban hang") && (!data.amount || !data.date));
      const handwritingMessage = handwrittenForm && (!recognizedAmount || !recognizedDate)
        ? " Hóa đơn có chữ viết tay; OCR có thể bỏ sót, hãy kiểm tra và nhập lại phần chưa nhận diện."
        : "";
      const handwritingFailureMessage = handwritingFailed ? " Chưa chạy được mô hình chữ viết tay; hãy thử quét lại hoặc kiểm tra kết nối đến máy chủ ứng dụng." : "";
      setStatus(extracted ? `Đã đọc ảnh.${recognizedAmount ? " Đã nhận diện số tiền." : " Chưa nhận diện được số tiền."}${recognizedDate ? " Đã nhận diện ngày." : " Chưa nhận diện được ngày."}${categoryMessage}${noteMessage}${amountConflictMessage}${handwritingMessage}${handwritingFailureMessage}` : "Không nhận diện được chữ; thử ảnh rõ hơn.");
    } catch { setStatus("OCR không hoàn tất. Kiểm tra kết nối mạng rồi thử lại."); }
    finally { await worker?.terminate(); setBusy(false); }
  };
  if (!open) return <div className="receipt-inline-trigger"><button type="button" className="secondary" onClick={()=>setOpen(true)}>▧ Quét hóa đơn</button><span>Đọc ảnh để điền nhanh giao dịch</span></div>;
  return <section className="receipt-inline" aria-label="Quét hóa đơn">
    <div className="receipt-inline-heading"><strong>Quét hóa đơn</strong><button type="button" className="button-ghost" onClick={()=>setOpen(false)}>Thu gọn</button></div>
    <div className={`receipt-upload-zone${file?" has-file":""}`} onDragOver={event=>event.preventDefault()} onDrop={dropFile}>
      <input ref={fileInput} type="file" accept="image/*" capture="environment" onChange={selectFile} aria-label="Chọn ảnh hóa đơn"/>
      {preview ? <><img className="receipt-upload-preview" src={preview} alt="Ảnh hóa đơn đã chọn"/><div className="receipt-upload-details"><strong>{file?.name}</strong><small>JPG, PNG hoặc WEBP · tối đa 10 MB</small><div className="receipt-image-actions"><button type="button" className="secondary" onClick={openImage}>Xem ảnh</button><button type="button" className="secondary" onClick={readImage} disabled={busy}>{busy?"Đang đọc…":"Đọc chữ trên ảnh"}</button><button type="button" className="button-ghost" onClick={()=>fileInput.current?.click()}>Đổi ảnh</button></div></div></> : <><span className="receipt-upload-icon" aria-hidden="true">↑</span><strong>Chọn ảnh hóa đơn hoặc kéo thả vào đây</strong><small>JPG, PNG hoặc WEBP · tối đa 10 MB</small><button type="button" className="secondary" onClick={()=>fileInput.current?.click()}>Chọn ảnh</button></>}
    </div>
    {imageOpen&&imagePreview&&<div className="receipt-image-backdrop" role="presentation" onMouseDown={event=>{if(event.target===event.currentTarget)setImageOpen(false);}}>
      <section className="receipt-image-dialog" role="dialog" aria-modal="true" aria-label="Ảnh hóa đơn kích thước lớn">
        <div className="receipt-image-toolbar"><div className="receipt-image-tools">
          <button type="button" className="secondary" onClick={async()=>{const next=(imageRotation+90)%360;setImageRotation(next);setImageZoom(false);setImageOffset({x:0,y:0});try{const rotated=await rotateImage(file!,next);const url=URL.createObjectURL(rotated);if(rotatedPreviewUrl.current)URL.revokeObjectURL(rotatedPreviewUrl.current);rotatedPreviewUrl.current=url;setImagePreview(url);}catch{setStatus("Không thể xoay ảnh hóa đơn.");}}} aria-label="Xoay ảnh 90 độ">↻ Xoay 90°</button>
          <button type="button" className="secondary" onClick={()=>{setImageZoom(zoom=>!zoom);setImageOffset({x:0,y:0});}} aria-label={imageZoom?"Thu nhỏ ảnh":"Phóng to ảnh"}>{imageZoom?"− Thu nhỏ":"＋ Phóng to"}</button>
        </div><button type="button" className="secondary" onClick={()=>setImageOpen(false)} autoFocus>Đóng <span aria-hidden="true">×</span></button></div>
        <div className={`receipt-image-viewport${imageZoom?" is-zoomed":""}${imageDragging?" is-dragging":""}`} onPointerDown={panStart} onPointerMove={panMove} onPointerUp={panEnd} onPointerCancel={panEnd}>
          <img className={imageZoom?"is-zoomed":""} src={imagePreview} alt="Ảnh hóa đơn phóng lớn" draggable={false} style={{transform:imageZoom?`translate3d(${imageOffset.x}px,${imageOffset.y}px,0) scale(2)`:"none"}}/>
        </div>
      </section>
    </div>}
    {suggestedCategory&&<div className="receipt-inline-suggestion"><span>Gợi ý danh mục: <b>{expenseCategories.find(category=>category.id===suggestedCategory)?.name}</b></span><button type="button" className="button-ghost" onClick={()=>onChooseCategory(suggestedCategory)}>Dùng danh mục này</button></div>}
    <button type="button" className="button-ghost receipt-ocr-toggle" aria-expanded={showText} onClick={()=>setShowText(value=>!value)}>{showText?"Ẩn văn bản OCR":"Xem/sửa văn bản OCR"}</button>
    {showText&&<label className="receipt-ocr-text">Văn bản nhận diện<textarea rows={10} value={text} onChange={event=>applyText(event.target.value)} placeholder="Văn bản OCR sẽ hiện ở đây."/></label>}
    {status&&<p role="status" className="receipt-status">{status}</p>}
  </section>;
}
