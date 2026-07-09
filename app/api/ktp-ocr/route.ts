import { NextRequest, NextResponse } from "next/server";

// Baca NIK + Nama dari foto KTP pakai Gemini (vision) — DI SERVER.
// API key TIDAK pernah sampai ke browser: cuma dibaca dari process.env di sini.
// Set GEMINI_API_KEY di Environment Variables Vercel (punyamu sendiri).
export const runtime = "nodejs";
export const maxDuration = 30;

// Model bisa diganti tanpa ubah kode lewat env GEMINI_MODEL.
// Default: gemini-2.5-flash (tier gratis, stabil). gemini-2.0-flash sudah di-shutdown.
const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

const PROMPT = `Kamu pembaca KTP Indonesia. Dari gambar ini, ekstrak NIK (16 digit angka) dan Nama lengkap pemilik.
Balas HANYA dengan JSON valid, tanpa teks atau penjelasan lain, bentuk persis:
{"nik":"<16 digit angka saja, atau string kosong jika tak terbaca>","nama":"<nama lengkap HURUF KAPITAL, atau string kosong>","terbaca":<true jika NIK & nama jelas terbaca; false jika foto buram/terpotong/silau/bukan KTP>,"alasan":"<jika terbaca=false, satu kalimat singkat kenapa>"}
Aturan: NIK harus tepat 16 digit angka (hapus spasi/titik). Kalau ragu atau gambar tidak jelas, set terbaca=false dan kosongkan nik.`;

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    // Key belum diset di Vercel → 503 supaya FE jatuh ke OCR lokal (tetap jalan).
    return NextResponse.json({ error: "gemini_not_configured" }, { status: 503 });
  }

  let imageBase64 = "";
  let mimeType = "image/jpeg";
  try {
    const body = await req.json();
    imageBase64 = typeof body?.imageBase64 === "string" ? body.imageBase64 : "";
    if (typeof body?.mimeType === "string" && body.mimeType) mimeType = body.mimeType;
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
  if (!imageBase64) {
    return NextResponse.json({ error: "no_image" }, { status: 400 });
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

  let geminiRes: Response;
  try {
    geminiRes = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { inline_data: { mime_type: mimeType, data: imageBase64 } },
              { text: PROMPT },
            ],
          },
        ],
        generationConfig: { responseMimeType: "application/json", temperature: 0 },
      }),
    });
  } catch {
    return NextResponse.json({ error: "gemini_unreachable" }, { status: 502 });
  }

  if (!geminiRes.ok) {
    const detail = await geminiRes.text().catch(() => "");
    return NextResponse.json(
      { error: "gemini_error", status: geminiRes.status, detail: detail.slice(0, 300) },
      { status: 502 }
    );
  }

  const data = await geminiRes.json().catch(() => null);
  const parts = data?.candidates?.[0]?.content?.parts;
  const text: string | undefined = Array.isArray(parts)
    ? (parts.find((p: { text?: string }) => typeof p?.text === "string")?.text ?? undefined)
    : undefined;

  if (!text) {
    return NextResponse.json({ error: "empty_response" }, { status: 502 });
  }

  let parsed: { nik?: unknown; nama?: unknown; terbaca?: unknown; alasan?: unknown } | null = null;
  try {
    parsed = JSON.parse(text);
  } catch {
    // Kadang model bungkus pakai ```json ... ``` → ambil blok JSON-nya.
    const m = text.match(/\{[\s\S]*\}/);
    if (m) {
      try {
        parsed = JSON.parse(m[0]);
      } catch {
        parsed = null;
      }
    }
  }
  if (!parsed) {
    return NextResponse.json({ error: "parse_failed" }, { status: 502 });
  }

  const nikDigits = String(parsed.nik ?? "").replace(/\D/g, "");
  const nik = nikDigits.length === 16 ? nikDigits : "";
  const nama = String(parsed.nama ?? "").trim().toUpperCase();
  const terbaca = parsed.terbaca === true && nik.length === 16;

  return NextResponse.json({
    nik,
    nama,
    terbaca,
    alasan: terbaca ? "" : String(parsed.alasan ?? "Foto kurang jelas"),
  });
}
