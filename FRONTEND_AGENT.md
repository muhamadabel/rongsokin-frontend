# FRONTEND AGENT GUIDE — Rongsok.in
> Baca seluruh dokumen ini sebelum menulis satu baris kode pun.
> Dokumen ini adalah satu-satunya source of truth untuk frontend.

---

## 1. KONTEKS PROYEK

**Rongsok.in** adalah marketplace daur ulang berbasis geolocation yang menghubungkan penjual sampah (Customer) dengan pengepul/lapak (Collector) di Yogyakarta. Proyek ini dibuat untuk Lomba OLIVIA.

**Stack wajib:**
- Framework : Next.js 14+ (App Router `/app` directory)
- Styling : Tailwind CSS v3 (extend config, jangan hardcode hex)
- Language : TypeScript strict mode
- Icons : Lucide React (satu-satunya icon library)
- Map : Leaflet.js + react-leaflet (hanya di halaman yang butuh map)
- Real-time : Socket.IO Client
- HTTP Client : Axios (bukan fetch langsung di komponen)
- State : Zustand (global), React useState/useReducer (local)
- Form : React Hook Form + Zod resolver

**Yang DILARANG keras:**
- PHP, Laravel, atau non-JS stack apapun
- Fetch API langsung di dalam komponen UI
- Hardcode warna hex di komponen (pakai token Tailwind)
- Mix icon library (hanya Lucide React)
- Payment gateway (fitur ini MVP, belum ada)
- In-app chat (arahkan ke WhatsApp eksternal)

---

## 2. DESIGN SYSTEM

### Warna (tambahkan ke `tailwind.config.ts`)

```ts
colors: {
  brand: {
    50:  '#F0F9FF',
    100: '#E0F2FE',
    200: '#BAE6FD',
    300: '#7DD3FC',
    400: '#38BDF8',
    500: '#0EA5E9', // PRIMARY
    600: '#0284C7',
    700: '#0369A1', // DARK
    800: '#075985',
    900: '#0C4A6E',
  },
  ink: {
    DEFAULT: '#0C1A27',
    muted:   '#64748B',
    faint:   '#CBD5E1',
  },
  surface: {
    DEFAULT: '#FFFFFF',
    raised:  '#F8FAFC',
    sunken:  '#F0F9FF',
  },
  status: {
    success: '#22C55E',
    warning: '#F59E0B',
    error:   '#EF4444',
    info:    '#0EA5E9',
  }
}
```

### Font (import di `app/layout.tsx`)

```ts
import { Plus_Jakarta_Sans, DM_Sans, JetBrains_Mono } from 'next/font/google'
// Plus Jakarta Sans → heading, nama lapak, angka besar (font-display)
// DM Sans          → body text, label, paragraf (font-body)
// JetBrains Mono   → harga, ID transaksi (font-mono)
```

### Spacing Rule
Gunakan kelipatan 4 saja: `4, 8, 12, 16, 20, 24, 32, 40, 48, 64`.
Jangan pakai angka tanggung seperti 5, 7, 11, 18, dst.

### Border Radius
```
rounded-sm   → badge kecil, input
rounded-md   → tombol, chip
rounded-lg   → card utama
rounded-xl   → modal, panel besar
rounded-full → avatar, status dot, toggle
```

### Shadow
```
shadow-sm  → card (rest)
shadow-md  → card (hover)
shadow-lg  → modal, dropdown
```

### Tombol — 3 varian saja
```tsx
// PRIMARY
<button className="bg-brand-500 hover:bg-brand-600 text-white rounded-md px-4 py-2.5 text-sm font-medium font-body transition-colors">

// OUTLINE
<button className="border border-brand-500 text-brand-700 hover:bg-brand-50 rounded-md px-4 py-2.5 text-sm font-medium font-body transition-colors">

// GHOST
<button className="text-brand-600 hover:bg-brand-50 rounded-md px-4 py-2.5 text-sm font-medium font-body transition-colors">

// DANGER (hanya untuk aksi destruktif)
<button className="bg-red-500 hover:bg-red-600 text-white rounded-md px-4 py-2.5 text-sm font-medium font-body transition-colors">
```

### Badge Status
```tsx
// BUKA
<span className="bg-green-50 text-green-700 border border-green-200 rounded-full px-2.5 py-0.5 text-xs font-medium">🟢 Buka</span>

// TUTUP
<span className="bg-red-50 text-red-600 border border-red-200 rounded-full px-2.5 py-0.5 text-xs font-medium">🔴 Tutup</span>

// PENDING
<span className="bg-amber-50 text-amber-700 border border-amber-200 rounded-full px-2.5 py-0.5 text-xs font-medium">⏳ Menunggu</span>

// CONFIRMED
<span className="bg-brand-50 text-brand-700 border border-brand-200 rounded-full px-2.5 py-0.5 text-xs font-medium">✅ Dikonfirmasi</span>
```

### Icon Mapping (Lucide React — ukuran konsisten)
```tsx
import { Package, Recycle, Wrench, FileText, Monitor, MapPin, Star,
         CheckCircle, XCircle, Bell, ShoppingBag, Scale, Camera,
         MessageCircle, User, Settings, History, ArrowLeft, Search,
         SlidersHorizontal, LogOut, Plus, Pencil, Trash2, Timer,
         Banknote, AlertCircle, Info, CheckCircle2 } from 'lucide-react'

// Ukuran:
// Inline teks    → size={14}
// Dalam tombol   → size={16}
// Dalam card     → size={20}
// Fitur besar    → size={32} atau size={40}
// Hero/ilustrasi → size={48} atau size={64}

// Mapping kategori:
// Kardus     → <Package />
// Plastik    → <Recycle />
// Besi/Logam → <Wrench />
// Kertas     → <FileText />
// Elektronik → <Monitor />
```

---

## 3. STRUKTUR FOLDER

```
app/
├── (public)/                  ← Layout tanpa sidebar (landing, login, register)
│   ├── page.tsx               ← Landing page
│   ├── pengepul/[id]/page.tsx ← Detail pengepul (public)
│   ├── login/page.tsx
│   └── register/page.tsx
├── (dashboard)/               ← Layout dengan sidebar/bottom nav (requires auth)
│   ├── dashboard/page.tsx
│   ├── orders/
│   │   ├── page.tsx           ← List pesanan
│   │   ├── new/page.tsx       ← Form buat pesanan
│   │   └── [id]/page.tsx      ← Tracking pesanan real-time
│   ├── collector/
│   │   ├── profile/page.tsx   ← Setup/edit profil lapak
│   │   └── catalogs/page.tsx  ← Manajemen katalog harga
│   └── ratings/page.tsx
components/
├── ui/                        ← Atomic: Button, Badge, Input, Card, Avatar, Skeleton
├── layout/                    ← Navbar, Sidebar, BottomNav, Footer, PageWrapper
└── features/
    ├── discovery/             ← CollectorCard, SearchBar, CategoryFilter, MapView
    ├── orders/                ← OrderCard, StatusBadge, StatusTimeline, OrderForm
    ├── rating/                ← StarRating, RatingPopup
    ├── auth/                  ← RoleSelector, RegisterForm, LoginForm
    └── receipt/               ← DigitalReceipt, TransactionHistory
hooks/
├── useAuth.ts
├── useDiscovery.ts
├── useOrders.ts
├── useSocket.ts
└── useCollector.ts
lib/
├── axios.ts                   ← Axios instance dengan interceptor JWT
├── socket.ts                  ← Socket.IO client singleton
└── utils.ts                   ← formatRupiah, formatDistance, formatDate
store/
├── authStore.ts               ← Zustand: user, token, role
└── orderStore.ts              ← Zustand: active orders, real-time updates
types/
└── index.ts                   ← Semua TypeScript interface
```

---

## 4. BACKEND API INTEGRATION

### Base URL
```ts
// lib/axios.ts
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1'
```

### Axios Instance dengan JWT Auto-Attach
```ts
// lib/axios.ts
import axios from 'axios'

const api = axios.create({ baseURL: BASE_URL })

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api
```

### Error Response Format (dari BE)
```ts
// Semua error dari BE formatnya:
{ status: "error", message: "...", errors: [] }
// Handle di komponen dengan try/catch dan tampilkan message-nya
```

---

## 5. SEMUA ENDPOINT API

### AUTH MODULE
```
POST   /auth/register          → Registrasi user baru
POST   /auth/login             → Login, return JWT token
GET    /auth/me                → Get profile user yang sedang login (requires auth)
```

**Register payload:**
```ts
{
  name: string
  email: string
  phone: string
  password: string
  role: 'CUSTOMER' | 'COLLECTOR'
}
```

**Login payload:**
```ts
{ email: string; password: string }
// Response: { token: string; user: User }
```

---

### DISCOVERY MODULE (Public — tidak perlu auth)
```
GET /discovery/search?lat=X&lng=Y&category=kardus&radius=5
    → Cari pengepul terdekat (PostGIS)
    → Query params: lat (float), lng (float), category (string), radius (number, km)
    → Response: Array<CollectorProfile>

GET /discovery/collectors/:id
    → Detail profil pengepul lengkap
    → Response: CollectorProfile dengan katalog harga dan rating
```

---

### ORDER MANAGEMENT MODULE (requires auth)
```
POST   /orders                        → Buat pesanan baru (Customer)
GET    /orders                        → List semua pesanan user (paginated)
GET    /orders/:id                    → Detail pesanan
PATCH  /orders/:id/accept             → Pengepul terima pesanan
PATCH  /orders/:id/reject             → Pengepul tolak pesanan
PATCH  /orders/:id/validate           → Pengepul submit berat & harga aktual
PATCH  /orders/:id/confirm            → Customer konfirmasi harga → COMPLETED
```

**POST /orders payload:**
```ts
{
  category_id: string
  estimated_weight: number        // dalam kg
  photo_url: string               // URL dari Cloudinary (upload dulu)
  lat: number
  lng: number
  method: 'PICKUP' | 'DROPOFF'   // Jemput atau Antar
}
```

**PATCH /orders/:id/validate payload:**
```ts
{
  actual_weight: number           // berat aktual hasil timbang
  final_price: number             // total harga (Rupiah)
}
```

**Order Status Flow:**
```
PENDING → CONFIRMED → IN_PROGRESS → AWAITING_CONFIRMATION → COMPLETED
                                                          ↘ CANCELLED
```

---

### RATING MODULE (requires auth)
```
POST /ratings                    → Submit rating (hanya setelah order COMPLETED)
GET  /ratings/user/:userId       → Lihat semua rating yang diterima user
```

**POST /ratings payload:**
```ts
{
  order_id: string
  ratee_id: string               // ID user yang diberi rating
  score: number                  // 1–5
  comment?: string
}
```

---

### COLLECTOR PROFILE MODULE (requires auth, COLLECTOR only)
```
POST  /collector/profile         → Setup profil lapak (setelah registrasi)
PATCH /collector/profile         → Update profil lapak
PATCH /collector/catalogs        → Update daftar harga per kategori
```

**POST/PATCH /collector/profile payload:**
```ts
{
  lapak_name: string
  description?: string
  radius_km: number              // radius layanan dalam km
  lat: number
  lng: number
  photo_url?: string
  is_open: boolean
}
```

**PATCH /collector/catalogs payload:**
```ts
{
  catalogs: Array<{
    category_id: string
    price_min: number            // harga minimum per kg (Rupiah)
    price_max: number            // harga maksimum per kg (Rupiah)
    is_active: boolean
  }>
}
```

---

## 6. SOCKET.IO REAL-TIME

### Setup Client Singleton
```ts
// lib/socket.ts
import { io, Socket } from 'socket.io-client'

let socket: Socket | null = null

export const getSocket = (token: string): Socket => {
  if (!socket) {
    socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001', {
      auth: { token }
    })
  }
  return socket
}

export const disconnectSocket = () => {
  socket?.disconnect()
  socket = null
}
```

### Custom Hook
```ts
// hooks/useSocket.ts
export const useSocket = () => {
  const { token } = useAuthStore()

  useEffect(() => {
    if (!token) return
    const socket = getSocket(token)

    // Customer: dengarkan update status pesanan
    socket.on('order_status_updated', (data: { order_id: string; status: OrderStatus }) => {
      useOrderStore.getState().updateOrderStatus(data.order_id, data.status)
    })

    // Pengepul: dengarkan pesanan masuk baru
    socket.on('new_order', (data: NewOrderPayload) => {
      useOrderStore.getState().addIncomingOrder(data)
      // tampilkan toast notifikasi
    })

    return () => {
      socket.off('order_status_updated')
      socket.off('new_order')
    }
  }, [token])
}
```

### Events yang Didengarkan
| Event | Siapa | Payload |
|---|---|---|
| `new_order` | Pengepul | `{ order_id, category, est_weight, photo_url, customer_area, method, expires_in }` |
| `order_status_updated` | Customer & Pengepul | `{ order_id, status, updated_at }` |

---

## 7. TYPESCRIPT INTERFACES

```ts
// types/index.ts

export type Role = 'CUSTOMER' | 'COLLECTOR' | 'ADMIN'
export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'IN_PROGRESS' | 'AWAITING_CONFIRMATION' | 'COMPLETED' | 'CANCELLED'
export type OrderMethod = 'PICKUP' | 'DROPOFF'

export interface User {
  id: string
  name: string
  email: string
  phone: string
  role: Role
  avatar_url?: string
  created_at: string
}

export interface WasteCategory {
  id: string
  name: string           // "Kardus", "Plastik", dll
  icon: string           // nama icon Lucide
  unit: string           // "kg"
}

export interface CollectorCatalog {
  id: string
  category: WasteCategory
  price_min: number
  price_max: number
  is_active: boolean
}

export interface CollectorProfile {
  id: string
  user: User
  lapak_name: string
  description?: string
  photo_url?: string
  radius_km: number
  is_open: boolean
  rating_avg: number
  rating_count: number
  distance_m?: number    // diisi saat hasil search (dari PostGIS)
  catalogs: CollectorCatalog[]
}

export interface Order {
  id: string
  customer: User
  collector?: CollectorProfile
  category: WasteCategory
  photo_url: string
  estimated_weight: number
  actual_weight?: number
  final_price?: number
  status: OrderStatus
  method: OrderMethod
  lat: number
  lng: number
  created_at: string
  updated_at: string
}

export interface Rating {
  id: string
  order_id: string
  rater: User
  ratee: User
  score: number
  comment?: string
  created_at: string
}

export interface Receipt {
  id: string
  order: Order
  category_name: string
  actual_weight: number
  price_per_kg: number
  total_price: number
  issued_at: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  total_pages: number
}
```

---

## 8. HALAMAN & LAYOUT

### Layout Umum
- **Mobile (< 768px):** Single column, **Bottom Navbar** 4 item (Beranda, Cari, Pesanan, Profil)
- **Tablet (768px+):** 2 kolom grid, sidebar collapsed
- **Desktop (1024px+):** 3–4 kolom grid, sidebar expanded (`w-64`)

### Navbar (public pages)
```
[Logo ♻️ Rongsok.in]     [Cari Pengepul] [Cara Kerja]     [Masuk] [Daftar]
```
- Sticky, bg white, border-bottom saat scroll
- Mobile: hanya logo + hamburger menu

### Sidebar (dashboard pages, desktop)
```
[Logo]
───────────
🏠 Beranda
🔍 Cari Pengepul
📦 Pesanan Saya       ← Customer
🏪 Pesanan Masuk      ← Collector only
📋 Katalog Harga      ← Collector only
⭐ Rating & Ulasan
👤 Profil
⚙️ Pengaturan
───────────
🚪 Keluar
```
Item aktif: `bg-brand-50 text-brand-700 border-r-2 border-brand-500`

---

## 9. HALAMAN DETAIL

### A. Landing Page `/` (Public)

Layout inspirasi Itemku — bisa browse tanpa login:

1. **Navbar**
2. **Hero Section**
   - Headline: *"Jual Sampahmu, Dapat Uang, Tanpa Ribet"*
   - Search bar: dropdown kategori + input lokasi / "Gunakan Lokasi Saya" + tombol Cari
   - Chip filter cepat: Kardus · Plastik · Besi · Kertas · Elektronik
3. **Trust Bar** (strip): "Harga Transparan · Digital Receipt · Rating Dua Arah"
4. **Category Shortcut** — row ikon horizontal, scroll di mobile
5. **Section per Kategori** (mirip Itemku):
   - Heading: "Pengepul Kardus Terbaik"
   - Grid card pengepul (4 per baris desktop, 2 mobile)
   - Tombol "Lihat Semua →"
   - Ulangi untuk Plastik, Besi, Kertas
6. **Cara Kerja** — 3 langkah horizontal
7. **Stats Section** — bg brand-700, teks putih: `2.400+ kg · 80+ Pengepul · ⭐ 4.9`
8. **CTA Bottom** — dua tombol: Daftar sebagai Penjual / Pengepul
9. **Footer**

**Data fetch untuk landing page:**
```ts
// Public endpoint, tidak perlu auth
GET /discovery/search?lat=-7.797&lng=110.370&category=kardus&radius=10
GET /discovery/search?lat=-7.797&lng=110.370&category=plastik&radius=10
// dst per kategori, gunakan koordinat default Yogyakarta jika belum ada GPS
```

---

### B. Detail Pengepul `/pengepul/[id]` (Public)

```
[Banner/Foto Lapak]
[Avatar] [Nama Lapak] [⭐ 4.8 (32 ulasan)] [🟢 Buka]
[📍 Sleman, Yogyakarta] [Radius: 5 km] [Jam: 08.00–17.00]

── Katalog Harga ──
Kardus     Rp 1.500 – 2.000 / kg   [● Aktif]
Plastik    Rp 800 – 1.200 / kg     [● Aktif]
Besi       Rp 3.000 – 4.000 / kg   [● Aktif]

── Ulasan Terbaru ──
[R***y] ⭐⭐⭐⭐⭐ "Timbangan jujur, cepat datang"
[A***a] ⭐⭐⭐⭐   "Oke, recommended"

[Sticky bottom button mobile]
→ [Buat Pesanan] — redirect ke /login jika belum auth
```

**Data fetch:**
```ts
GET /discovery/collectors/:id
```

---

### C. Register `/register` — 3 Step

**Step 1 — Pilih Role:**
Dua kartu besar yang bisa diklik, role dipilih sekali dan permanent.
```
[🛍️ Saya Penjual Sampah]    [🏪 Saya Pengepul/Lapak]
"Jual sampah ke pengepul"    "Terima pesanan digital"
```
Kartu dipilih: `border-brand-500 border-2 ring-2 ring-brand-200`

**Step 2 — Form Registrasi:**
Nama · Email · No. HP · Password · Konfirmasi Password

**Step 3 (Collector only) — Profil Lapak:**
Nama Lapak · Deskripsi · Radius (slider) · Lokasi · Upload Foto

Progress bar 3 langkah di atas, navigasi Kembali/Lanjut antar step.

**API call:**
```ts
POST /auth/register   → step 2
POST /collector/profile → step 3 (jika role COLLECTOR)
```

---

### D. Dashboard Customer `/dashboard`

```
[Header] "Selamat datang, Rizky 👋"
[Search bar cepat — sama seperti hero]

[Pesanan Aktif] (jika ada)
┌─────────────────────────────────────┐
│ 📦 Kardus · PICKUP                  │
│ ●──●──○──○──○                       │  ← progress bar status
│ PENDING → CONFIRMED → dst           │
│ [Lihat Detail →]                    │
└─────────────────────────────────────┘

[Map kecil — Leaflet embed]
Pengepul terdekat dari lokasi kamu

[Riwayat Transaksi]
[Tabel/list card 5 terbaru, link ke semua]

[Stats Personal]
Total Sampah: 12.5 kg  |  Total Pendapatan: Rp 18.500
```

**Data fetch:**
```ts
GET /auth/me
GET /orders?status=active&limit=1
GET /orders?limit=5
GET /discovery/search?lat=...&lng=...&radius=5
```

---

### E. Dashboard Pengepul `/dashboard` (role: COLLECTOR)

```
[Toggle Status Lapak]  ← PALING PROMINENT
┌──────────────────────────────┐
│  Lapak kamu saat ini:        │
│  ● BUKA   [toggle]           │
└──────────────────────────────┘

[Pesanan Masuk] (real-time via Socket.IO)
┌─────────────────────────────────────┐
│ 🆕 Pesanan Baru!                    │
│ Kardus · est. 5 kg · PICKUP        │
│ 📍 0.8 km dari lapakmu             │
│ ⏰ 14:32 tersisa                    │
│ [✅ Terima]  [❌ Tolak]             │
└─────────────────────────────────────┘

[Statistik Hari Ini]
Pesanan Masuk: 4  |  Selesai: 3  |  Total: 12.5 kg  |  Rp 24.000

[Manajemen Katalog]
Tabel kategori + harga + toggle aktif/nonaktif + edit
```

**Data fetch:**
```ts
GET /auth/me
GET /orders?role=collector&status=incoming
GET /collector/profile
// Socket.IO: listen 'new_order'
```

---

### F. Form Buat Pesanan `/orders/new`

Step-by-step (jangan satu form panjang):

**Step 1** — Pilih Kategori (grid icon besar visual)
**Step 2** — Estimasi Berat (number input + kg)
**Step 3** — Upload Foto (drag & drop atau klik, upload ke Cloudinary dulu, simpan URL)
**Step 4** — Pilih Metode: `📦 Minta Dijemput` / `🚶 Antar Sendiri`
**Step 5** — Konfirmasi Lokasi (auto-fill GPS atau input manual)
**Step 6** — Review & Submit

Setiap step: progress bar di atas, tombol Kembali/Lanjut.

**Upload foto flow:**
```ts
// Upload langsung ke Cloudinary dari FE
// Jangan lewat BE untuk efisiensi
const formData = new FormData()
formData.append('file', file)
formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_PRESET)
const res = await axios.post(`https://api.cloudinary.com/v1_1/${cloud_name}/image/upload`, formData)
const photo_url = res.data.secure_url
```

**API call setelah dapat photo_url:**
```ts
POST /orders
Body: { category_id, estimated_weight, photo_url, lat, lng, method }
```

---

### G. Tracking Pesanan `/orders/[id]`

```
[Status Progress Bar — animated]
PENDING ●──────●──────○──────○──────○ COMPLETED

[Detail Pesanan]
Kategori: Kardus | Est. Berat: 5 kg | Metode: PICKUP
[Foto Sampah]

[Info Pengepul] (tampil setelah CONFIRMED)
Avatar + Nama Lapak + Jarak
[💬 Hubungi via WhatsApp] → buka wa.me/nomor

[Timeline Log]
✅ 10:30 — Pesanan dibuat
✅ 10:35 — Dikonfirmasi oleh Pak Budi Lapak Sleman

[Form Konfirmasi Harga] (tampil saat AWAITING_CONFIRMATION)
┌────────────────────────────────────┐
│ Pengepul melaporkan:               │
│ Berat aktual : 4.8 kg              │
│ Harga        : Rp 1.800/kg         │
│ Total        : Rp 8.640            │
│ [✅ Setuju & Selesaikan]           │
└────────────────────────────────────┘
```

**API call:**
```ts
GET  /orders/:id                    → initial data
PATCH /orders/:id/confirm           → customer setuju harga
// Socket.IO: listen 'order_status_updated' filter by order_id
```

---

### H. Form Rating (popup/modal setelah COMPLETED)

```
[Muncul otomatis setelah order COMPLETED]

Beri Rating untuk [Nama Pengepul/Customer]
⭐ ⭐ ⭐ ⭐ ☆   (klik bintang)
[Komentar... (opsional)]
[Kirim Rating]
```

**API call:**
```ts
POST /ratings
Body: { order_id, ratee_id, score, comment }
```

---

## 10. LOADING & ERROR STATES

### Skeleton (WAJIB ada di semua komponen yang fetch data)
```tsx
// Contoh skeleton card pengepul
<div className="animate-pulse bg-white rounded-lg p-4 border border-ink-faint">
  <div className="flex gap-3 mb-3">
    <div className="bg-slate-100 rounded-full w-12 h-12 shrink-0" />
    <div className="flex-1 space-y-2">
      <div className="bg-slate-100 rounded h-4 w-3/4" />
      <div className="bg-slate-100 rounded h-3 w-1/2" />
    </div>
  </div>
  <div className="bg-slate-100 rounded h-3 w-full mb-2" />
  <div className="bg-slate-100 rounded h-3 w-2/3" />
</div>
```

### Error State
```tsx
<div className="flex flex-col items-center py-12 text-ink-muted">
  <AlertCircle size={40} className="mb-3 text-status-error" />
  <p className="font-body text-sm">Gagal memuat data. Coba lagi.</p>
  <button onClick={retry} className="mt-3 text-brand-500 text-sm underline">
    Coba lagi
  </button>
</div>
```

### Empty State
```tsx
<div className="flex flex-col items-center py-12 text-ink-muted">
  <ShoppingBag size={40} className="mb-3" />
  <p className="font-body text-sm">Belum ada pesanan</p>
</div>
```

---

## 11. UTILITY FUNCTIONS

```ts
// lib/utils.ts

// Format harga ke Rupiah
export const formatRupiah = (amount: number): string =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount)
// Output: "Rp 1.500"

// Format jarak
export const formatDistance = (meters: number): string =>
  meters < 1000 ? `${meters} m` : `${(meters / 1000).toFixed(1)} km`

// Format tanggal Indonesia
export const formatDate = (iso: string): string =>
  new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(iso))

// Koordinat default Yogyakarta (fallback jika GPS tidak tersedia)
export const DEFAULT_COORDS = { lat: -7.7956, lng: 110.3695 }
```

---

## 12. ENVIRONMENT VARIABLES

```env
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your_unsigned_preset
```

---

## 13. CHECKLIST SEBELUM COMMIT

- [ ] Warna pakai token (`brand-500`, `ink-muted`) — bukan hardcode hex
- [ ] Font pakai `font-display` / `font-body` / `font-mono`
- [ ] Ikon dari Lucide React, ukuran konsisten dan square (`w-4 h-4`, `w-5 h-5`)
- [ ] Ada skeleton loading di semua komponen yang fetch
- [ ] Ada empty state dan error state
- [ ] Responsive: dicek di 375px (mobile) dan 1280px (desktop)
- [ ] Spacing kelipatan 4
- [ ] Border radius konsisten (card=lg, tombol=md, badge=full)
- [ ] Tombol hanya 3 varian (primary, outline, ghost, danger)
- [ ] Tidak ada API fetch langsung di komponen UI (pakai hooks)
- [ ] Tidak ada payment gateway
- [ ] Tombol WhatsApp buka `wa.me/` eksternal, bukan in-app chat

---

*Rongsok.in Frontend Agent Guide v1.0*
*Last updated: Sprint Plan 20-day MVP — Target: Lomba OLIVIA Yogyakarta*
