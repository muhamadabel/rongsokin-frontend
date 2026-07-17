// OCR KTP di sisi klien (Tesseract.js, gratis, tanpa server).
// Mengekstrak NIK (16 digit) & Nama dari foto KTP.
// Pakai pre-processing (grayscale + normalisasi kontras + upscale) + 2 pass
// (pass kedua khusus angka) supaya NIK lebih akurat terbaca.

export interface KtpOcrResult {
  nik: string | null;
  name: string | null;
  rawText: string;
}

// ── Pre-processing gambar ────────────────────────────────────────────────
function loadImage(src: Blob | string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = typeof src === "string" ? src : URL.createObjectURL(src);
  });
}

/** Grayscale + normalisasi kontras (stretch min–max) + sedikit boost + upscale. */
function preprocess(img: HTMLImageElement): HTMLCanvasElement {
  const targetW = Math.min(1800, Math.max(img.width, 1100));
  const scale = targetW / img.width;
  const w = Math.round(img.width * scale);
  const h = Math.round(img.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0, w, h);

  const imageData = ctx.getImageData(0, 0, w, h);
  const d = imageData.data;

  // Grayscale + cari min/max buat normalisasi
  const gray = new Float32Array(w * h);
  let min = 255;
  let max = 0;
  for (let i = 0, p = 0; i < d.length; i += 4, p++) {
    const g = d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114;
    gray[p] = g;
    if (g < min) min = g;
    if (g > max) max = g;
  }
  const range = Math.max(1, max - min);

  for (let i = 0, p = 0; i < d.length; i += 4, p++) {
    let v = ((gray[p] - min) * 255) / range; // normalisasi 0–255
    v = (v - 128) * 1.35 + 128; // boost kontras
    v = v < 0 ? 0 : v > 255 ? 255 : v;
    d[i] = d[i + 1] = d[i + 2] = v;
  }
  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

// ── Parsing ──────────────────────────────────────────────────────────────
/** Ambil deretan 16 digit dari teks OCR, koreksi salah-baca umum. */
function extractNik(text: string): string | null {
  const lines = text.split(/\n/);
  let best: string | null = null;
  for (const line of lines) {
    const cleaned = line
      .replace(/[OoQD]/g, "0")
      .replace(/[IilL|!]/g, "1")
      .replace(/[B]/g, "8")
      .replace(/[Ss]/g, "5")
      .replace(/[Zz]/g, "2")
      .replace(/[Gg]/g, "6")
      .replace(/[Tt]/g, "7");
    const digits = cleaned.replace(/\D/g, "");
    if (digits.length >= 15 && digits.length <= 18) {
      const candidate = digits.slice(0, 16);
      if (candidate.length === 16) {
        if (/nik/i.test(line)) return candidate; // baris yang ada kata "NIK" diprioritaskan
        if (!best) best = candidate;
      }
    }
  }
  return best;
}

/** Ambil 16 digit dari hasil pass angka-saja — utamakan baris yang ~16 digit. */
function extractNikDigitsOnly(text: string): string | null {
  // Per baris: NIK = baris dengan ~16 digit (tanggal/RT-RW jauh lebih pendek)
  for (const line of text.split(/\n/)) {
    const digits = line.replace(/\D/g, "");
    if (digits.length >= 15 && digits.length <= 17) return digits.slice(0, 16);
  }
  // Cadangan: cari 16 digit beruntun di seluruh teks
  const m = text.replace(/\D/g, "").match(/\d{16}/);
  return m ? m[0] : null;
}

function extractName(text: string): string | null {
  const lines = text.split(/\n/);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/nama/i.test(line)) {
      let val = line.replace(/.*nama/i, "").replace(/[:.]/g, " ").trim();
      if (val.length < 3 && lines[i + 1]) val = lines[i + 1].trim();
      val = val
        .replace(/[^A-Za-z .'-]/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .toUpperCase();
      if (val.length >= 3) return val;
    }
  }
  return null;
}

// ── Recognize ──────────────────────────────────────────────────────────────
export async function recognizeKtp(image: Blob | string): Promise<KtpOcrResult> {
  const { createWorker } = await import("tesseract.js");
  const img = await loadImage(image);
  const canvas = preprocess(img);

  const worker = await createWorker("eng");
  try {
    // Pass 1 — teks penuh: ambil Nama + coba NIK
    const { data } = await worker.recognize(canvas);
    const rawText = data.text || "";
    let nik = extractNik(rawText);
    const name = extractName(rawText);

    // Pass 2 — khusus angka: kalau NIK belum ketemu / kurang yakin
    if (!nik) {
      await worker.setParameters({
        tessedit_char_whitelist: "0123456789",
      });
      const r2 = await worker.recognize(canvas);
      nik = extractNikDigitsOnly(r2.data.text || "") || extractNik(r2.data.text || "");
    }

    return { nik, name, rawText };
  } finally {
    await worker.terminate();
  }
}
