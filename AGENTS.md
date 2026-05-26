# AGENTS.md — Rongsok.in
> Baca dokumen ini SEPENUHNYA sebelum menulis satu baris kode.
> Untuk detail design system, warna, font, komponen UI — baca FRONTEND_AGENT.md.
> Jika ada yang ambigu → TANYA DULU, jangan asumsi sendiri.

---

## 1. KONTEKS PROYEK

**Rongsok.in** adalah marketplace daur ulang berbasis geolokasi yang menghubungkan penjual sampah (Customer) dengan pengepul/lapak (Collector) di Yogyakarta. Dibuat untuk Lomba OLIVIA.

**Status saat ini:**
- UI baru sudah ada sebagian (lihat file existing di `app/`, `components/ui/`)
- Semua halaman masih STATIC / dummy data
- Backend sudah JALAN di `http://localhost:3000`
- Tugas: sambungkan semua halaman ke real API + lengkapi halaman yang belum ada

---

## 2. TECH STACK (TIDAK BOLEH DIGANTI)

| Layer | Teknologi |
|---|---|
| Framework | Next.js 14+ App Router |
| Language | TypeScript strict |
| Styling | Tailwind CSS (token dari FRONTEND_AGENT.md) |
| Icons | Lucide React ONLY |
| State Global | Zustand |
| HTTP | Axios (instance di `lib/axios.ts` — SUDAH ADA, jangan buat baru) |
| Data Fetching | TanStack Query (React Query) |
| Form | React Hook Form + Zod |
| Real-time | Socket.IO Client |
| Map | Leaflet.js + react-leaflet |

**DILARANG KERAS:**
- Fetch/axios langsung di dalam komponen UI
- Hardcode warna hex (pakai token `brand-*`, `ink-*`, `surface-*`)
- Tambah icon library selain Lucide React
- Payment gateway atau in-app chat

---

## 3. STRUKTUR FOLDER

```
app/
├── (public)/              ← Tanpa auth: landing, login, register, detail pengepul
├── (dashboard)/           ← Requires auth: dashboard, orders, collector, profile
├── layout.tsx
└── page.tsx               ← Redirect ke (public)/page.tsx atau dashboard

components/
├── ui/                    ← Button, Input, BottomNav, DesktopNav (SUDAH ADA — reuse)
├── layout/                ← PageWrapper, Sidebar
└── features/
    ├── discovery/         ← CollectorCard, SearchBar, CategoryFilter
    ├── orders/            ← OrderCard, StatusTimeline, OrderForm
    ├── rating/            ← StarRating, RatingPopup
    ├── auth/              ← LoginForm, RegisterForm (dengan logika)
    └── receipt/           ← DigitalReceipt

hooks/
├── useAuth.ts             ← login, register, me
├── useDiscovery.ts        ← search collectors
├── useOrders.ts           ← CRUD orders
├── useSocket.ts           ← real-time events
└── useCollector.ts        ← collector profile & catalogs

lib/
├── axios.ts               ← SUDAH ADA — jangan ubah
├── socket.ts              ← singleton socket.io client
└── utils.ts               ← formatRupiah, formatDistance, formatDate

store/
├── authStore.ts           ← { user, token, role, setAuth, logout }
└── orderStore.ts          ← { activeOrders, incomingOrders, updateStatus }

types/
└── index.ts               ← Semua interface (User, Order, Collector, dst)
```

---

## 4. ENVIRONMENT VARIABLES

```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1
NEXT_PUBLIC_SOCKET_URL=http://localhost:3000
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=...
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=...
```

---

## 5. SEMUA API ENDPOINT + PAYLOAD

### Base URL: `process.env.NEXT_PUBLIC_API_URL`
### Auth header: `Authorization: Bearer <token>` (axios interceptor sudah handle)

---

### AUTH

```
POST /auth/register
Body: { name, email, phone, password, role: 'CUSTOMER' | 'COLLECTOR' }
Response: { token, user }

POST /auth/login
Body: { email, password }
Response: { token, user: { id, name, email, phone, role } }

GET /auth/me
Header: Bearer token
Response: { user }
```

---

### DISCOVERY (tidak perlu auth)

```
GET /discovery/search?lat=X&lng=Y&category=kardus&radius=5
Response: CollectorProfile[]

GET /discovery/collectors/:id
Response: CollectorProfile (lengkap dengan catalogs dan ratings)
```

Default koordinat Yogyakarta jika GPS tidak tersedia:
```ts
export const DEFAULT_COORDS = { lat: -7.7956, lng: 110.3695 }
```

---

### ORDERS (requires auth)

```
POST /orders
Body: {
  category_id: string,
  estimated_weight: number,
  photo_url: string,        ← upload Cloudinary dulu, kirim URL-nya
  lat: number,
  lng: number,
  method: 'PICKUP' | 'DROPOFF'
}
Response: { order }

GET /orders
Query: ?status=active | ?limit=5 | ?role=collector
Response: PaginatedResponse<Order>

GET /orders/:id
Response: { order }

PATCH /orders/:id/accept
Body: {} (kosong)
Role: COLLECTOR only

PATCH /orders/:id/reject
Body: {} (kosong)
Role: COLLECTOR only

PATCH /orders/:id/validate
Body: { actual_weight: number, final_price: number }
Role: COLLECTOR only

PATCH /orders/:id/confirm
Body: {} (kosong)
Role: CUSTOMER only → status jadi COMPLETED
```

**Order Status Flow:**
```
PENDING → CONFIRMED → IN_PROGRESS → AWAITING_CONFIRMATION → COMPLETED
                                                          ↘ CANCELLED
```

---

### RATINGS (requires auth, hanya setelah COMPLETED)

```
POST /ratings
Body: { order_id, ratee_id, score: 1–5, comment?: string }

GET /ratings/user/:userId
Response: Rating[]
```

---

### COLLECTOR PROFILE (requires auth, COLLECTOR only)

```
POST /collector/profile
Body: {
  lapak_name: string,
  description?: string,
  radius_km: number,
  lat: number,
  lng: number,
  photo_url?: string,
  is_open: boolean
}

PATCH /collector/profile
Body: (sama seperti POST, field yang ingin diupdate)

PATCH /collector/catalogs
Body: {
  catalogs: [{
    category_id: string,
    price_min: number,
    price_max: number,
    is_active: boolean
  }]
}
```

---

### ERROR FORMAT (dari BE)

```ts
{ status: "error", message: "...", errors: [] }
// Selalu tampilkan message ke user via toast atau inline error
```

---

## 6. UPLOAD FOTO (Cloudinary — direct from FE)

```ts
const uploadToCloudinary = async (file: File): Promise<string> => {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!)
  const res = await axios.post(
    `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
    formData
  )
  return res.data.secure_url
}
```

---

## 7. SOCKET.IO REAL-TIME

```ts
// lib/socket.ts — singleton
import { io, Socket } from 'socket.io-client'

let socket: Socket | null = null

export const getSocket = (token: string): Socket => {
  if (!socket) {
    socket = io(process.env.NEXT_PUBLIC_SOCKET_URL!, { auth: { token } })
  }
  return socket
}

export const disconnectSocket = () => {
  socket?.disconnect()
  socket = null
}
```

**Events:**
| Event | Siapa Dengar | Payload |
|---|---|---|
| `new_order` | Collector | `{ order_id, category, est_weight, photo_url, customer_area, method, expires_in }` |
| `order_status_updated` | Customer & Collector | `{ order_id, status, updated_at }` |

Socket diinisialisasi SATU KALI di root layout setelah login. Gunakan hook `useSocket`.

---

## 8. AUTH FLOW

```
Register → POST /auth/register → simpan token ke localStorage → POST /collector/profile (jika COLLECTOR) → redirect dashboard

Login → POST /auth/login → simpan token + user ke localStorage + authStore → redirect sesuai role:
  - CUSTOMER → /dashboard
  - COLLECTOR → /collector/dashboard

Protected route → cek authStore.token → jika null, redirect ke /login

Logout → hapus localStorage → reset authStore → disconnect socket → redirect /login
```

---

## 9. ZUSTAND STORES

```ts
// store/authStore.ts
interface AuthStore {
  user: User | null
  token: string | null
  setAuth: (user: User, token: string) => void
  logout: () => void
  initFromStorage: () => void   // panggil di layout useEffect
}

// store/orderStore.ts
interface OrderStore {
  incomingOrders: Order[]       // untuk collector (real-time)
  activeOrders: Order[]         // untuk customer
  addIncomingOrder: (order: Order) => void
  removeIncomingOrder: (id: string) => void
  updateOrderStatus: (id: string, status: OrderStatus) => void
}
```

---

## 10. URUTAN BUILD (IKUTI INI)

Kerjakan berurutan, jangan lompat:

```
1. types/index.ts            ← semua interface dulu
2. lib/utils.ts              ← formatRupiah, formatDistance, formatDate
3. lib/socket.ts             ← socket singleton
4. store/authStore.ts        ← zustand auth
5. store/orderStore.ts       ← zustand orders
6. hooks/useAuth.ts          ← login, register, useMe (TanStack Query)
7. hooks/useDiscovery.ts     ← useSearchCollectors
8. hooks/useOrders.ts        ← useOrders, useOrder, usePatchOrder
9. hooks/useCollector.ts     ← useCollectorProfile, useCatalogs
10. hooks/useSocket.ts       ← real-time listener
11. Halaman per halaman (lihat section 11)
```

---

## 11. HALAMAN — PRIORITAS & SPEC

### A. Landing Page `/` — REFACTOR (sudah ada, sambungkan data)

File existing: `app/page.tsx` — **JANGAN ganti UI-nya**, hanya sambungkan data.

```ts
// Ganti dummy data dengan:
const { data: kardusCollectors } = useSearchCollectors({ category: 'kardus', ...DEFAULT_COORDS })
const { data: plastikCollectors } = useSearchCollectors({ category: 'plastik', ...DEFAULT_COORDS })
// dst per kategori
```

---

### B. Login `/login` — REFACTOR

File existing: `app/(auth)/login/page.tsx` — UI sudah ada, tambahkan logika:

```ts
// Sambungkan ke:
const { mutate: login, isPending } = useLogin()

// onSubmit:
login({ email, password }, {
  onSuccess: (data) => {
    authStore.setAuth(data.user, data.token)
    router.push(data.user.role === 'COLLECTOR' ? '/collector/dashboard' : '/dashboard')
  },
  onError: (err) => setError(err.response.data.message)
})
```

Catatan: Login pakai **email**, bukan nomor WA (sesuaikan label input dari "Nomor WhatsApp" ke "Email").

---

### C. Register `/register` — REFACTOR + LENGKAPI

3 step (lihat FRONTEND_AGENT.md section 9C):
- **Step 1:** Pilih role (CUSTOMER / COLLECTOR)
- **Step 2:** Form: name, email, phone, password → POST /auth/register
- **Step 3:** Khusus COLLECTOR → form profil lapak → POST /collector/profile

```ts
// Step 2:
const { mutate: register } = useRegister()
register({ name, email, phone, password, role }, {
  onSuccess: (data) => {
    authStore.setAuth(data.user, data.token)
    if (role === 'COLLECTOR') goToStep(3)
    else router.push('/dashboard')
  }
})

// Step 3:
const { mutate: setupProfile } = useSetupCollectorProfile()
setupProfile({ lapak_name, radius_km, lat, lng, is_open: true }, {
  onSuccess: () => router.push('/collector/dashboard')
})
```

---

### D. Customer Dashboard `/dashboard` — BUAT BARU

Lihat FRONTEND_AGENT.md section 9D untuk layout detail.

```ts
// Data yang difetch:
const { data: me } = useMe()
const { data: activeOrder } = useOrders({ status: 'active', limit: 1 })
const { data: recentOrders } = useOrders({ limit: 5 })
const { data: nearbyCollectors } = useSearchCollectors({ ...userCoords, radius: 5 })
```

---

### E. Collector Dashboard `/collector/dashboard` — REFACTOR

File existing: `app/(dashboard)/collector/page.tsx` — UI sudah bagus, sambungkan data + socket.

```ts
// Real-time pesanan masuk:
const { incomingOrders } = useOrderStore()
useSocket()  // listen 'new_order' → addIncomingOrder

// Accept/reject:
const { mutate: acceptOrder } = usePatchOrder('accept')
const { mutate: rejectOrder } = usePatchOrder('reject')

// Validate (setelah timbang):
const { mutate: validateOrder } = usePatchOrder('validate')
// payload: { actual_weight, final_price }

// Toggle status lapak:
const { mutate: updateProfile } = useUpdateCollectorProfile()
updateProfile({ is_open: !currentIsOpen })
```

---

### F. Form Buat Pesanan `/orders/new` — BUAT BARU

6 step (lihat FRONTEND_AGENT.md section 9F):
1. Pilih kategori
2. Estimasi berat
3. Upload foto → Cloudinary → dapat URL
4. Pilih metode (PICKUP / DROPOFF)
5. Konfirmasi lokasi (GPS atau manual)
6. Review & submit

```ts
// Final submit:
const { mutate: createOrder } = useCreateOrder()
createOrder({
  category_id,
  estimated_weight,
  photo_url,   // dari Cloudinary
  lat, lng,
  method
}, {
  onSuccess: (data) => router.push(`/orders/${data.order.id}`)
})
```

---

### G. Tracking Pesanan `/orders/[id]` — BUAT BARU

```ts
const { id } = useParams()
const { data: order, refetch } = useOrder(id)

// Real-time update:
useEffect(() => {
  const socket = getSocket(token)
  socket.on('order_status_updated', ({ order_id, status }) => {
    if (order_id === id) refetch()
  })
}, [])
```

Tampilkan per status:
- `PENDING` → spinner + "Menunggu pengepul..."
- `CONFIRMED` → info pengepul + tombol WhatsApp (`wa.me/[phone]`)
- `IN_PROGRESS` → "Pengepul sedang menuju lokasimu"
- `AWAITING_CONFIRMATION` → card validasi: berat aktual + harga + tombol **Setuju**
  ```ts
  confirmOrder(id, {}, { onSuccess: () => refetch() })
  ```
- `COMPLETED` → DigitalReceipt + RatingPopup otomatis muncul
- `CANCELLED` → alasan pembatalan

---

### H. Profil & Katalog Pengepul

```
/collector/profile → GET + PATCH /collector/profile
/collector/catalogs → GET + PATCH /collector/catalogs
```

---

## 12. ATURAN CODING

1. **Stateless UI** — komponen UI hanya terima props, semua logic di hooks
2. **Skeleton** — WAJIB ada di setiap komponen yang fetch data
3. **Error state** — WAJIB ada tombol retry
4. **Empty state** — WAJIB ada ilustrasi + pesan
5. **Mobile-first** — base 375px, breakpoint naik ke atas
6. **Spacing** — kelipatan 4 saja (4, 8, 12, 16, 20, 24, 32, 40, 48, 64)
7. **Font** — `font-display` (heading), `font-body` (body), `font-mono` (harga/ID)
8. **Tombol** — 3 varian saja: primary, outline, ghost (+ danger untuk destruktif)
9. **No `any`** — TypeScript strict, semua punya type

---

## 13. PROTOKOL JIKA BINGUNG

> TANYA DULU. Jangan asumsi dan langsung implementasi.

Kapan harus tanya:
- Endpoint tidak jelas request/response-nya
- Ada konflik antara UI existing dan kebutuhan baru
- Butuh library baru
- Tidak yakin redirect flow

---

## 14. CHECKLIST SEBELUM COMMIT

- [ ] Tidak ada fetch/axios langsung di komponen UI
- [ ] Ada skeleton, error state, empty state
- [ ] Warna pakai token (`brand-*`, `ink-*`, `surface-*`)
- [ ] Font pakai `font-display` / `font-body` / `font-mono`
- [ ] Responsive mobile-first (test 375px)
- [ ] TypeScript clean (`tsc --noEmit`)
- [ ] Socket hanya inisialisasi SATU KALI
- [ ] Tidak ada payment gateway atau in-app chat
- [ ] Tombol WhatsApp pakai `wa.me/` eksternal

---

*Rongsok.in AGENTS.md v2.0 — UI Baru + BE Integration*
*Target: Lomba OLIVIA Yogyakarta*
