// OCR KTP di sisi klien (Tesseract.js, gratis, tanpa server).
// Mengekstrak NIK (16 digit) & Nama dari foto KTP. Hasil bersifat best-effort —
// kalau gagal/keliru, FE menyediakan koreksi manual (lihat halaman register).

export interface KtpOcrResult {
  nik: string | null;
  name: string | null;
  rawText: string;
}

/** Ambil deretan digit terpanjang/paling mendekati 16 dari teks OCR. */
function extractNik(text: string): string | null {
  const lines = text.split(/\n/);
  let best: string | null = null;
  for (const line of lines) {
    // OCR sering salah baca: O→0, I/l→1, B→8, S→5, Z→2 — hanya pada baris yang dominan angka
    const cleaned = line
      .replace(/[Oo]/g, "0")
      .replace(/[IilL]/g, "1")
      .replace(/[B]/g, "8")
      .replace(/[Ss]/g, "5")
      .replace(/[Zz]/g, "2");
    const digits = cleaned.replace(/\D/g, "");
    if (digits.length >= 15 && digits.length <= 18) {
      const candidate = digits.slice(0, 16);
      if (candidate.length === 16) {
        // Prioritaskan baris yang memang mengandung kata NIK
        if (/nik/i.test(line)) return candidate;
        if (!best) best = candidate;
      }
    }
  }
  return best;
}

/** Ambil Nama dari baris yang mengandung "Nama". */
function extractName(text: string): string | null {
  const lines = text.split(/\n/);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/nama/i.test(line)) {
      let val = line.replace(/.*nama/i, "").replace(/[:.]/g, " ").trim();
      // Kadang nama ada di baris berikutnya
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

export async function recognizeKtp(image: Blob | string): Promise<KtpOcrResult> {
  const { recognize } = await import("tesseract.js");
  const { data } = await recognize(image, "ind+eng");
  const rawText = data.text || "";
  return {
    nik: extractNik(rawText),
    name: extractName(rawText),
    rawText,
  };
}
