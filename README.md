# FE Rongsok.in ♻️

**Frontend Repository untuk Platform Ekosistem Daur Ulang Sirkular — Rongsok.in**

Antarmuka web (mobile-first) yang menghubungkan penghasil sampah (**Customer**) dengan pengepul/lapak (**Collector**) lewat penemuan berbasis geolokasi, manajemen pesanan real-time, dan transaksi yang transparan.

**Submission:** Lomba OLIVIA | **Target Wilayah:** Yogyakarta
**Backend:** [be-rongsok.in](https://github.com/januarsyah901/be-rongsok.in) (Express + Prisma + PostGIS + Socket.IO)

## 📋 Overview

Rongsok.in mengubah rantai jual-beli rongsok yang informal menjadi platform terstruktur. Repository frontend ini menangani seluruh pengalaman pengguna:

- **Discovery Geolokasi** — temukan pengepul terdekat (PostGIS di server), urutkan berdasar jarak, rating, atau harga ambil
- **Order Lifecycle** — buat pesanan multi-kategori, lacak status real-time, peta rute jemput/antar, validasi timbangan, struk digital
- **Real-time + Fallback** — Socket.IO untuk notifikasi instan, dengan *polling* TanStack Query sebagai cadangan bila WebSocket tidak tersedia
- **KYC** — verifikasi KTP dengan OCR di sisi klien + foto kamera-only (anti pesanan fiktif)
- **Eco-Impact** — gamifikasi dampak lingkungan + papan peringkat + kartu dampak yang bisa diunduh
- **Dua Peran** — UI adaptif untuk Customer & Collector dari satu basis kode

## 🏗️ Tech Stack

| Layer | Teknologi | Alasan |
|-------|-----------|--------|
| **Framework** | Next.js 16 (App Router) | Routing modern, RSC, deploy mulus di Vercel |
| **Language** | TypeScript 5 (strict) | Type-safety end-to-end |
| **UI Runtime** | React 19 | Komponen deklaratif terbaru |
| **Styling** | Tailwind CSS 4 | Design token (`brand-*`, `ink-*`, `surface-*`, `forest-*`), tanpa hardcode hex |
| **Icons** | Lucide React | Satu set ikon konsisten |
| **State Global** | Zustand | Ringan — auth, order, notifikasi |
| **Data Fetching** | TanStack Query (React Query) | Cache, refetch, *polling* fallback real-time |
| **HTTP** | Axios | Instance terpusat + interceptor token |
| **Real-time** | Socket.IO Client | Notifikasi pesanan & live tracking |
| **Maps** | Leaflet + React-Leaflet | Pemilih lokasi & peta rute jemput/antar |
| **Forms** | React Hook Form + Zod | Validasi & inferensi tipe |
| **OCR** | Tesseract.js | Baca NIK & nama dari foto KTP (KYC) |
| **Image** | Cloudinary (via BE `/upload`) | Penyimpanan foto sampah, KTP, avatar |
| **Export** | html-to-image | Unduh kartu dampak ekologis |
| **Notifikasi UI** | react-hot-toast | Toast non-blocking |
| **Deployment** | Vercel | Auto-deploy tiap push ke `main` |

**Node version:** `>=18.0.0`

## 📂 Project Structure

```
.
├── app/                          # Next.js App Router
│   ├── (auth)/                   # login, register (pilih role + KYC)
│   ├── (dashboard)/              # area ter-autentikasi
│   │   ├── dashboard/            # beranda Customer (pesanan aktif, pengepul terdekat)
│   │   ├── collector/            # dasbor Lapak (antrean, katalog, status buka)
│   │   ├── orders/               # buat pesanan (6 langkah) & pelacakan [id]
│   │   ├── profile/              # profil, edit, verifikasi KYC
│   │   ├── notifications/        # pusat notifikasi
│   │   ├── eco/                  # dampak ekologis & papan peringkat
│   │   └── admin/                # kelola kategori (admin)
│   ├── search/                   # pencarian pengepul + sorting
│   ├── pengepul/[id]/            # profil publik pengepul + ulasan
│   ├── cara-kerja/               # panduan alur (beda untuk Customer & Pengepul)
│   └── page.tsx                  # landing publik
├── components/
│   ├── ui/                       # Button, Input, BottomNav, DesktopNav, NotificationBell, Skeleton
│   └── features/                 # discovery, orders, rating, profile, eco-impact
├── hooks/                        # useAuth, useDiscovery, useOrders, useCollector,
│                                 # useSocket, useNotifications, useLiveTracking, useUserCoords
├── lib/                          # axios, socket, upload, utils, categoryIcons
├── store/                        # authStore, orderStore, notificationStore (Zustand)
├── types/                        # seluruh interface (User, Order, Collector, dst)
└── README.md
```

## 🚀 Quick Start

### Prerequisites
- Node.js >= 18
- Backend Rongsok.in berjalan (lokal atau hosted)

### Installation

```bash
# 1. Clone
git clone https://github.com/muhamadabel/rongsokin-frontend.git
cd rongsokin-frontend

# 2. Install dependencies
npm install

# 3. Setup environment
cp .env.example .env.local   # lalu isi nilainya (lihat di bawah)

# 4. Jalankan dev server
npm run dev
```

Aplikasi berjalan di `http://localhost:3000`.

### Environment Variables

```env
# Base URL REST API backend
NEXT_PUBLIC_API_URL=https://be-rongsokin.hallojanu.xyz/api/v1

# URL Socket.IO (real-time)
NEXT_PUBLIC_SOCKET_URL=https://be-rongsokin.hallojanu.xyz

# Cloudinary (upload langsung opsional — upload utama lewat BE /upload)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=...
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=...
```

## ⚙️ Cara Kerja (Arsitektur Frontend)

```
Browser (Next.js / React)
   │
   ├── Axios (lib/axios.ts) ──► REST API  →  https://.../api/v1
   │      └── interceptor menyisipkan Bearer token (JWT) dari Zustand
   │
   ├── Socket.IO (lib/socket.ts) ──► WebSocket  →  notifikasi & live location
   │      └── fallback: TanStack Query refetchInterval bila WS mati
   │
   └── Leaflet ──► peta lokasi & rute jemput/antar
```

- **Autentikasi:** `useAuth` (login/register) menyimpan JWT + user ke `localStorage` dan `authStore` (Zustand). Interceptor Axios menyertakan token di setiap request. Route ter-proteksi dijaga di `(dashboard)/layout.tsx`.
- **Stateless UI:** komponen UI hanya menerima props; semua logika data ada di `hooks/` (TanStack Query). Setiap fetch punya *skeleton*, *error state*, dan *empty state*.
- **Discovery:** `useDiscovery` memanggil `GET /discovery/search` (PostGIS di server) dalam radius 50km; hasil diurutkan di klien berdasar **jarak / rating / harga ambil**.
- **Order lifecycle:** `PENDING → CONFIRMED → IN_PROGRESS → AWAITING_CONFIRMATION → COMPLETED` (atau `CANCELLED`). Pelacakan menampilkan status hero, peta rute, live tracking GPS pihak yang bergerak, validasi timbangan, struk digital, lalu rating dua arah.
- **Real-time tahan-banting:** `useSocket` mendengar `new_order` & `order_status_updated`; bila WebSocket tidak terhubung (mis. keterbatasan hosting), `useNotifications` + `useOrders` mem-*poll* perubahan via TanStack Query sehingga update tetap muncul.
- **KYC:** `tesseract.js` membaca NIK & nama dari foto KTP di browser; foto sampah wajib kamera-only sebagai anti pesanan fiktif. Verifikasi final ditentukan server.
- **Eco-Impact:** kontribusi daur ulang divisualkan jadi tier & papan peringkat; kartu dampak diekspor ke PNG via `html-to-image`.

## 🎨 Design System

- **Mobile-first**, base 375px, breakpoint naik ke atas.
- **Token warna** lewat Tailwind (`brand-*`, `ink-*`, `surface-*`, `forest-*`) — dilarang hardcode hex.
- **Font:** `font-display` (heading), `font-body` (teks), `font-mono` (harga/ID/berat).
- **Tombol:** primary, outline, ghost, danger.
- **Spacing** kelipatan 4.

## 🔌 Integrasi Backend

| Modul | Endpoint utama |
|-------|----------------|
| Auth | `POST /auth/register`, `POST /auth/login`, `GET/PATCH /auth/me` |
| Upload | `POST /upload` (multipart `image`, maks 5MB → Cloudinary) |
| Discovery | `GET /discovery/search`, `GET /discovery/collectors/:id`, `GET /discovery/categories` |
| Orders | `POST /orders`, `GET /orders`, `GET /orders/:id`, `PATCH /orders/:id` |
| Ratings | `POST /ratings`, `GET /ratings/user/:userId` |
| Collector | `POST/PATCH /collector/profile`, `PATCH /collector/catalogs` |

Format error backend seragam: `{ status: "error", message: "...", errors: [] }` → ditampilkan via toast/inline.

## 📦 Deployment

Frontend di-deploy ke **Vercel** dan otomatis ter-*build* setiap push ke branch `main`.

```bash
npm run build   # build produksi
npm run start   # jalankan hasil build secara lokal
```

Set environment variables (`NEXT_PUBLIC_*`) di dashboard Vercel.

## 📄 License

Private project untuk Lomba OLIVIA.

---

**Rongsok.in — Connecting Waste to Value** ♻️
