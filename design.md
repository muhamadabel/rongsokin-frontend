# DESIGN.md — Rongsok.in (Wise-inspired Design Language)

> Sumber kebenaran visual baru. Semua redesign mengikuti dokumen ini.
> Token diimplementasikan di `app/globals.css` (`@theme`). Jangan hardcode hex —
> pakai class token (`brand-*`, `surface`, `ink*`, `canvas-soft`, dst).

---

## 1. Filosofi

Rongsok.in mengadopsi bahasa visual ala **Wise**: tenang seperti majalah
Skandinavia, bukan seperti bank. Ciri utama:

- **Satu aksen hijau lime** (`#9fe870`) untuk SEMUA primary CTA. Tidak ada aksen kedua.
- **Kanvas sage** (`#e8ebe6`) sebagai latar halaman; **kartu putih** mengambang di atasnya.
  Kontras permukaan = elevasi (bukan shadow berat).
- **Tipografi dua suara**: Manrope (display, weight 800/900) untuk hero/heading;
  Inter (body) untuk segala sisanya. Kontras chunky vs netral = cerita tipografi.
- **Radius 24px** kanonik untuk kartu & tombol (pill-rectangle). Tidak pernah sudut tajam.
- **Ink near-black** (`#0e0f0c`) untuk teks. Teks di atas lime = ink/forest, **bukan putih**.

---

## 2. Warna (token)

### Brand / Lime (ramp `brand-*`)
| Token | Hex | Pakai |
|---|---|---|
| `brand-50` | `#f0fbe8` | tint paling lembut |
| `brand-100` | `#e2f6d5` | badge bg / soft surface (primary-pale) |
| `brand-200` | `#c5edab` | neutral fill (primary-neutral) |
| `brand-300` | `#b3e892` | hover pale |
| `brand-400` | `#9fe870` | **primary lime** |
| `brand-500` | `#9fe870` | **primary lime — CTA utama** |
| `brand-600` | `#7ac74f` | lime hover (sedikit lebih dalam) |
| `brand-700` | `#2e7d32` | aksen/teks forest mid |
| `brand-800` | `#163300` | ink-deep forest (teks di atas lime) |
| `brand-900` | `#0d2200` | forest paling gelap |

> **Teks di atas `brand-500` selalu `text-ink` / `text-brand-800`** (forest `#163300`), bukan putih.

### Surface
| Token | Hex | Pakai |
|---|---|---|
| `surface` / `canvas-soft` | `#e8ebe6` | latar halaman (sage) |
| `surface-raised` / `canvas` | `#ffffff` | interior kartu |
| `surface-sunken` | `#dfe3dc` | sage sedikit lebih dalam |

### Ink / Teks
| Token | Hex | Pakai |
|---|---|---|
| `ink` | `#0e0f0c` | teks & heading default |
| `ink-muted` / `body` | `#454745` | body sekunder |
| `mute` | `#868685` | caption, placeholder, fine print |
| `ink-faint` | `#c4c9bf` | border hairline / garis tipis |

### Semantic
| Token | Hex | Pakai |
|---|---|---|
| `status-success` | `#2ead4b` | sukses (positive) |
| `status-warning` | `#ffd11a` | peringatan (teks `#4a3b1c`) |
| `status-error` | `#d03238` | error / destruktif |
| `status-info` | `#38c8ff` | info (accent cyan) |

### Aksen ilustratif (jarang)
`accent-orange` `#ffc091` · `accent-cyan` `#38c8ff`.

---

## 3. Tipografi

- **Display** → Manrope. Hero/heading besar **weight 800–900**. Tracking ketat (`tracking-tight`).
- **Body** → Inter. Body, label, nav (weight 400–600).
- **Mono** → JetBrains Mono. Angka, berat (kg), harga (Rp), ID order, eyebrow caps.

| Peran | Class | Ukuran rujukan |
|---|---|---|
| Hero mega | `font-display font-black` | 48–72px (`text-5xl`/`text-6xl`) |
| Hero | `font-display font-extrabold` | 36–48px |
| Section head | `font-display font-extrabold` | 24–32px |
| Body lead | `font-body` | 18–20px |
| Body | `font-body` | 16px |
| Caption | `font-body` | 12–14px |
| Angka/harga | `font-mono` | sesuai konteks |

Prinsip: **900 untuk hero, 600 untuk sisanya.** Hero tidak pernah ≤ weight 700.

---

## 4. Bentuk & Radius

| Class | Nilai | Pakai |
|---|---|---|
| `rounded-sm` | 8px | pill kecil, badge |
| `rounded-md` | 12px | input form, chrome kecil |
| `rounded-lg` | 16px | kartu mid |
| `rounded-xl` | 20px | kartu / tombol |
| `rounded-2xl` | 24px | **kanonik kartu + tombol Wise** |
| `rounded-full` | 9999px | pill status, ikon bulat |

Tombol & kartu utama: **`rounded-2xl` (24px)**. Tidak ada sudut tajam pada elemen UI.

---

## 5. Spacing

Base 4px. Token: 2,4,8,12,16,24,32,48. Section band: padding 48px atas/bawah desktop.
Interior kartu: 24px.

---

## 6. Elevasi

- **Flat (default)**: tanpa shadow/border.
- **Hairline**: border 1px `ink-faint` untuk input, outline tertiary.
- **Soft card**: kartu putih di atas kanvas sage — kontras permukaan ITU elevasinya.
  Shadow sangat halus (`shadow-sm`) boleh untuk angkat kartu, tapi jangan berat.

---

## 7. Komponen

### Tombol (3 varian + danger)
- **primary** → `bg-brand-500 text-ink` (ink-on-lime), `rounded-2xl`, padding `px-6 py-3`, hover `bg-brand-600`.
- **secondary/outline** → `bg-surface-raised text-ink border border-ink`, `rounded-2xl`.
- **ghost** → transparan, teks ink, hover `bg-surface-sunken`.
- **danger** → `bg-status-error text-white`, `rounded-2xl`.

### Kartu
- **default** → `bg-surface-raised text-ink rounded-2xl p-6`, tanpa border (duduk di sage).
- **sage feature** → `bg-surface-sunken` / `canvas-soft`.
- **green feature** → `bg-brand-100`.
- **dark promo** → `bg-ink text-brand-500` (polarity flip — hijau lime di atas ink).

### Input
- `bg-surface-raised text-ink border border-ink rounded-md px-4 py-3`, placeholder `mute`.

### Nav
- top nav `bg-surface-raised`; link `font-body font-semibold`; active = ink/lime.
- bottom nav (mobile) center action = pill lime ink.

### Badge status
- positive → `bg-brand-100 text-brand-800 rounded-full`.
- warning → `bg-[#fff4cc] text-[#4a3b1c]`.
- negative → `bg-status-error/10 text-status-error`.

### Struk digital (COMPLETED)
Replika nota kasir: kartu putih, garis putus-putus (`border-dashed`), teks mono,
potongan bergelombang bawah, cap **LUNAS** hijau lime.

---

## 8. Do / Don't

**Do**
- Reserve lime untuk SETIAP primary CTA.
- Hero pakai Manrope weight 900.
- `rounded-2xl` 24px untuk tombol & kartu.
- Siklus permukaan: sage canvas → kartu putih.
- Pakai semantic palette untuk status — jangan pakai lime sebagai indikator sukses.

**Don't**
- Jangan tambah aksen brand kedua.
- Jangan hero weight ≤ 700.
- Jangan CTA sudut tajam.
- Jangan lime di atas background hijau.
- Jangan teks putih di atas lime (pakai ink/forest).
