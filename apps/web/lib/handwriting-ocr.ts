type OcrWordBox = { text: string; confidence: number; bbox: { x0: number; y0: number; x1: number; y1: number } };
type OcrLineBox = { text: string; confidence: number; bbox: { x0: number; y0: number; x1: number; y1: number }; words?: OcrWordBox[] };
type HandwritingBox = OcrLineBox & { kind: "date" | "amountWords" | "amountNumber" | "text" };

const MODEL_BASE = "/models/vietocr-vietnamese-handwriting";
const WASM_BASE = "/onnxruntime/";
// One OCR action can run the handwriting recognizer over uncertain lines too.
// Cap inference so dense receipts do not trigger a long serial model run.
const MAX_LINES = 10;
const MAX_TOKENS = 64;

type Ort = typeof import("onnxruntime-web/wasm");
type OrtSession = Awaited<ReturnType<Ort["InferenceSession"]["create"]>>;

let modelPromise: Promise<{ ort: Ort; encoder: OrtSession; decoder: OrtSession; vocab: string[] }> | undefined;

async function loadModel() {
  if (!modelPromise) {
    modelPromise = (async () => {
      const ort = await import("onnxruntime-web/wasm");
      ort.env.wasm.wasmPaths = WASM_BASE;
      ort.env.wasm.numThreads = 1;
      // Run WASM in-process on this LAN origin. The proxy worker failed to initialize
      // in Chrome and produced "worker not ready" before either model could run.
      ort.env.wasm.proxy = false;
      const [encoderBytes, decoderBytes, vocabResponse] = await Promise.all([
        fetch(`${MODEL_BASE}/encoder_fp16.onnx`, { cache: "force-cache" }).then(response => {
          if (!response.ok) throw new Error("Không tải được mô hình OCR chữ viết tay.");
          return response.arrayBuffer();
        }),
        fetch(`${MODEL_BASE}/decoder_fp16.onnx`, { cache: "force-cache" }).then(response => {
          if (!response.ok) throw new Error("Không tải được mô hình OCR chữ viết tay.");
          return response.arrayBuffer();
        }),
        fetch(`${MODEL_BASE}/vocab.txt`, { cache: "force-cache" }),
      ]);
      if (!vocabResponse.ok) throw new Error("Không tải được từ điển OCR chữ viết tay.");
      // Both sessions share one WASM backend initialization; create them in sequence
      // so they cannot race the runtime startup.
      const encoder = await ort.InferenceSession.create(encoderBytes, { executionProviders: ["wasm"] });
      const decoder = await ort.InferenceSession.create(decoderBytes, { executionProviders: ["wasm"] });
      const vocabText = await vocabResponse.text();
      return { ort, encoder, decoder, vocab: vocabText.split(/\r?\n/) };
    })().catch(error => {
      modelPromise = undefined;
      throw error;
    });
  }
  return modelPromise;
}

function cropLine(bitmap: ImageBitmap, line: HandwritingBox): ImageData | null {
  const lineHeight = Math.max(12, line.bbox.y1 - line.bbox.y0);
  // Keep the crop close to the target handwriting. Large padding made the line
  // recognizer shrink small digits to only a few pixels after resizing to 32px.
  const padding = Math.max(4, Math.round(lineHeight * 0.4));
  const horizontalPadding = Math.max(8, Math.round(lineHeight * 0.45));
  const top = Math.max(0, Math.floor(line.bbox.y0 - padding));
  const bottom = Math.min(bitmap.height, Math.ceil(line.bbox.y1 + padding));
  if (bottom - top < 8) return null;
  // Anchor crops to the detected row instead of a fixed page percentage. A receipt
  // may be shifted, cropped, or photographed at a different scale; fixed x offsets
  // can cut the handwritten value off even when Tesseract found the correct label.
  const printedLabelWords = line.kind === "amountWords"
    ? (line.words ?? []).filter(word => /thanh|tien|viet|bang|chu/.test(word.text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()))
    : [];
  const labelEnd = printedLabelWords.length >= 2
    ? Math.max(...printedLabelWords.map(word => word.bbox.x1))
    : line.bbox.x0;
  const left = Math.max(0, Math.floor((line.kind === "amountWords" && printedLabelWords.length >= 2 ? labelEnd : line.bbox.x0) - horizontalPadding));
  const right = Math.min(bitmap.width, Math.ceil(
    line.kind === "amountWords"
      ? Math.max(line.bbox.x1 + horizontalPadding, bitmap.width * 0.92)
      : line.bbox.x1 + horizontalPadding,
  ));
  const canvas = document.createElement("canvas");
  canvas.width = right - left;
  canvas.height = bottom - top;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) return null;
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(bitmap, left, top, canvas.width, bottom - top, 0, 0, canvas.width, canvas.height);
  const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
  // OCR line boxes can include the full invoice column. Trim the pale paper and
  // red template rules so the line recognizer receives a tight handwritten crop.
  const rowInk = new Uint16Array(pixels.height);
  const columnInk = new Uint16Array(pixels.width);
  for (let y = 0; y < pixels.height; y++) {
    for (let x = 0; x < pixels.width; x++) {
      if (pixels.data[(y * pixels.width + x) * 4] < 172) {
        rowInk[y]++;
        columnInk[x]++;
      }
    }
  }
  const rows = Array.from(rowInk.keys()).filter(y => rowInk[y] >= 2);
  const columns = Array.from(columnInk.keys()).filter(x => columnInk[x] >= 2);
  if (rows.length < 3 || columns.length < 3) return pixels;
  const pad = Math.max(4, Math.round(lineHeight * 0.2));
  const x0 = Math.max(0, columns[0] - pad), y0 = Math.max(0, rows[0] - pad);
  const x1 = Math.min(pixels.width, columns.at(-1)! + pad + 1);
  const y1 = Math.min(pixels.height, rows.at(-1)! + pad + 1);
  return context.getImageData(x0, y0, Math.max(1, x1 - x0), Math.max(1, y1 - y0));
}

function makeLineTensor(ort: Ort, image: ImageData) {
  const scaledWidth = Math.max(32, Math.ceil((32 * image.width) / image.height));
  // The VietOCR export pads line images to the next multiple of 40 pixels.
  const width = Math.ceil(scaledWidth / 40) * 40;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = 32;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("Không thể xử lý dòng chữ viết tay.");
  context.fillStyle = "#fff";
  context.fillRect(0, 0, width, 32);
  const source = document.createElement("canvas");
  source.width = image.width;
  source.height = image.height;
  const sourceContext = source.getContext("2d");
  if (!sourceContext) throw new Error("Không thể xử lý dòng chữ viết tay.");
  sourceContext.putImageData(image, 0, 0);
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(source, 0, 0, scaledWidth, 32);
  const pixels = context.getImageData(0, 0, width, 32).data;
  const values = new Float32Array(3 * 32 * width);
  const plane = 32 * width;
  for (let pixel = 0; pixel < plane; pixel++) {
    const target = pixel * 4;
    values[pixel] = pixels[target] / 255;
    values[plane + pixel] = pixels[target + 1] / 255;
    values[plane * 2 + pixel] = pixels[target + 2] / 255;
  }
  return new ort.Tensor("float32", values, [1, 3, 32, width]);
}

async function recognizeLine(model: Awaited<ReturnType<typeof loadModel>>, pixels: ImageData) {
  const encoded = await model.encoder.run({ [model.encoder.inputNames[0]]: makeLineTensor(model.ort, pixels) });
  const memory = encoded[model.encoder.outputNames[0]];
  const ids = [1];
  for (let step = 0; step < MAX_TOKENS; step++) {
    const tokens = BigInt64Array.from(ids, id => BigInt(id));
    const decoded = await model.decoder.run({
      [model.decoder.inputNames[0]]: new model.ort.Tensor("int64", tokens, [ids.length, 1]),
      [model.decoder.inputNames[1]]: memory,
    });
    const logits = decoded[model.decoder.outputNames[0]].data as Float32Array;
    let next = 0, highest = Number.NEGATIVE_INFINITY;
    for (let index = 0; index < logits.length; index++) {
      if (logits[index] > highest) { highest = logits[index]; next = index; }
    }
    if (next === 2) break;
    ids.push(next);
  }
  return ids.slice(1).map(id => model.vocab[id] ?? "").join("").trim();
}

export async function recognizeHandwrittenLines(image: Blob, lineBoxes: OcrLineBox[]) {
  const bitmap = await createImageBitmap(image);
  try {
    const model = await loadModel();
    const normalize = (text: string) => text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    const dateLabel = lineBoxes.find(line => /ngay|thang|nam|date/.test(normalize(line.text)));
    const amountWordsLabel = lineBoxes.find(line => /viet bang chu/.test(normalize(line.text)))
      ?? [...lineBoxes].reverse().find(line => /thanh tien/.test(normalize(line.text)));
    // Thermal receipt OCR frequently mangles "Tổng tiền" into forms like
    // "teng tiegn". Still send that total row through handwriting OCR because
    // customers often write a corrected amount beside the printed total.
    const amountNumberLabel = [...lineBoxes].reverse().find(line => /\bcong\b|tong\s*tien|teng\s*tiegn|tong\s*cong|total/.test(normalize(line.text)));
    const footer = lineBoxes.find(line => /nguoi nhan hang|da nhan du tien|nguoi viet hoa don/.test(normalize(line.text)));
    const selected: HandwritingBox[] = [];
    if (dateLabel) selected.push({ ...dateLabel, kind: "date" });
    else if (footer) {
      const height = Math.max(16, footer.bbox.y1 - footer.bbox.y0);
      selected.push({ text: "ngay", confidence: 0, kind: "date", bbox: { x0: bitmap.width * 0.52, x1: bitmap.width, y0: Math.max(0, footer.bbox.y0 - height * 1.9), y1: Math.max(1, footer.bbox.y0 - height * 0.25) } });
    } else if (amountWordsLabel) {
      // On handwritten Vietnamese sales invoices Tesseract often misses the
      // faint printed date label. It sits immediately below the amount-in-words row.
      const height = Math.max(24, amountWordsLabel.bbox.y1 - amountWordsLabel.bbox.y0);
      const y0 = Math.min(bitmap.height - height, amountWordsLabel.bbox.y1 + height * 2.1);
      selected.push({ text: "ngay", confidence: 0, kind: "date", bbox: { x0: bitmap.width * 0.52, x1: bitmap.width, y0, y1: y0 + height } });
    }
    if (amountWordsLabel) selected.push({ ...amountWordsLabel, kind: "amountWords" });
    if (amountNumberLabel) {
      // On the common Vietnamese handwritten sales form, the amount is written
      // in the last “Thành tiền” table column immediately ABOVE the printed CỘNG row.
      // The old fixed positive offset sent the crop below the total, into the date/signature area.
      const tableTotalHeader = [...lineBoxes].reverse().find(line =>
        line.bbox.y0 < amountNumberLabel.bbox.y0
        && /thanh tien/.test(normalize(line.text))
        && !/viet bang chu/.test(normalize(line.text))
      );
      if (!tableTotalHeader) {
        // Printed receipts with a handwritten correction place the ink on the
        // same total row. Keep that whole row as the crop instead of looking
        // above it as we do for handwritten sales-form tables.
        selected.push({ ...amountNumberLabel, kind: "amountNumber" });
      } else {
      const amountColumnWord = tableTotalHeader?.words?.find(word => /thanh/.test(normalize(word.text)));
      const totalWord = amountNumberLabel.words?.find(word => /cong|tong|total/.test(normalize(word.text)));
      const labelTop = totalWord?.bbox.y0 ?? amountNumberLabel.bbox.y0;
      const rowHeight = Math.max(10, Math.min(24, (totalWord?.bbox.y1 ?? amountNumberLabel.bbox.y1) - labelTop));
      const totalRowTop = Math.max(0, labelTop - rowHeight * 2.2);
      selected.push({
        ...amountNumberLabel,
        kind: "amountNumber",
        bbox: {
          x0: amountColumnWord?.bbox.x0 ?? bitmap.width * 0.68,
          x1: bitmap.width * 0.98,
          y0: totalRowTop,
          y1: Math.max(totalRowTop + rowHeight, labelTop - rowHeight * 0.25),
        },
      });
      }
    }

    // Printed/electronic receipts are already handled by full-page Tesseract.
    // On handwriting-heavy pages, revisit low-confidence lines with the line
    // recognizer so item names and notes are available in the editable OCR text.
    const knownRows = new Set(selected.map(line => `${line.bbox.y0}:${line.bbox.y1}`));
    const uncertainLines = lineBoxes
      .filter(line => line.text.trim().length >= 2 && line.confidence < 75)
      .sort((a, b) => a.bbox.y0 - b.bbox.y0)
      .filter(line => !knownRows.has(`${line.bbox.y0}:${line.bbox.y1}`));
    for (const line of uncertainLines) {
      if (selected.length >= MAX_LINES) break;
      selected.push({ ...line, kind: "text" });
    }

    const recognized = { date: "", amountWords: "", amountNumber: "" };
    const recognizedLines: string[] = [];
    for (const line of selected) {
      const pixels = cropLine(bitmap, line);
      if (!pixels) continue;
      const text = await recognizeLine(model, pixels);
      if (!text) continue;
      recognizedLines.push(text);
      if (line.kind !== "text") recognized[line.kind] = text;
    }
    return { ...recognized, text: [...new Set(recognizedLines)].join("\n") };
  } finally {
    bitmap.close();
  }
}
