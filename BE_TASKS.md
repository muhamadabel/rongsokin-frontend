# Backend Tasks — Rongsok.in

> Dokumen tunggal untuk tim Backend.
> Berisi **semua** perubahan yang dibutuhkan FE: critical fix, schema, endpoint baru, security.
>
> **Host BE**: `https://be-rongsokin.hallojanu.xyz`
> **Stack BE**: Express + Prisma + Supabase PostgreSQL + PostGIS + Socket.IO + JWT
>
> **FE sudah siap auto-switch**: tiap endpoint baru yang BE buat akan otomatis dipakai FE — tidak perlu deploy FE ulang. Selama BE belum jadi, FE pakai mock/local fallback.

---

## 📋 Master Checklist

### 🔴 P0 — Critical Fix (FE patah parsial tanpa ini)
- [ ] **A1** Buat `GET /api/v1/orders` (list dengan filter)
- [ ] **A2** Buat `GET /api/v1/discovery/collectors/:id` (detail lapak)
- [ ] **A3** Tambah action `reject` & `cancel` di `PATCH /api/v1/orders/:id`
- [ ] **A4** Lepas `protect` dari `/discovery/search` + buat `categoryId` opsional

### 🟠 P1 — Schema & Security Prerequisites
- [ ] **B1** Tambah kolom `User.phone` (sekarang FE kirim tapi di-drop diam-diam)
- [ ] **B2** JWT include `role` di payload + aktifkan middleware `authorize`
- [ ] **B3** Buat tabel `OrderItem` + migrasi data Order lama
- [ ] **B4** Drop kolom legacy di `Order`: `categoryId`, `estimatedWeight`, `actualWeight`, `agreedPrice`

### 🟢 P2 — New Endpoints (urutkan sesuai prioritas tim)

**Edit Profil**
- [ ] **C1** `PATCH /api/v1/auth/me` (update profil + lokasi)
- [ ] **C2** Update `GET /api/v1/auth/me` — sertakan `phone`, `lat`, `lng`

**Multi-Category Orders** (1 order bisa banyak kategori sampah)
- [ ] **D1** `POST /api/v1/orders` terima `items[]` di body
- [ ] **D2** `PATCH /api/v1/orders/:id` action `validate` terima `items[]`
- [ ] **D3** Update spatial matching query: pengepul harus accept SEMUA kategori
- [ ] **D4** Update socket emit `new_order` include `items[]`
- [ ] **D5** Update Receipt `detailsJson` include items breakdown

**Admin Console** (sesuai BAB III §3.3.a)
- [ ] **E1** `GET /api/v1/admin/stats` (KPI + weekly transactions)
- [ ] **E2** `GET /api/v1/admin/orders?status=&page=&limit=` (monitoring)
- [ ] **E3** `POST /api/v1/admin/categories`
- [ ] **E4** `PATCH /api/v1/admin/categories/:id`
- [ ] **E5** `DELETE /api/v1/admin/categories/:id`

---

# 🔴 P0 — Critical Fixes

## A1. `GET /orders` (list dengan filter)

FE sudah panggil endpoint ini di Dashboard, Riwayat, Profile — saat ini selalu 404 → halaman tampil kosong padahal data ada di DB.

### Spec

```
GET /api/v1/orders
  Headers: Authorization: Bearer <token>
  Query:
    status?  string       — filter by OrderStatus
    role?    string       — 'customer' | 'collector'
    limit?   number       — default 10
```

### Controller (file `controllers/order.js`)

```js
const listOrders = async (req, res, next) => {
  try {
    const { status, role, limit = 10 } = req.query;
    const userId = req.user.id;

    const where = {};
    if (status) where.status = status;
    if (role === 'collector') {
      where.collectorId = userId;
    } else {
      // default: customer view
      where.customerId = userId;
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        customer: { select: { id: true, name: true, email: true, phone: true, avatarUrl: true } },
        collector: { select: { id: true, name: true, email: true, phone: true, avatarUrl: true, collectorProfile: true } },
        // setelah multi-category: include items: { include: { category: true } }
        // sebelum: include category: true
        category: true,
      },
      orderBy: { createdAt: 'desc' },
      take: Number(limit),
    });

    res.status(200).json({ status: 'success', data: orders });
  } catch (error) {
    next(error);
  }
};
```

### Routes (file `routes/order.js`)

```js
router.get('/', protect, listOrders);  // ⬅ tambah baris ini
```

---

## A2. `GET /discovery/collectors/:id`

FE pakai endpoint ini di halaman `/pengepul/[id]` (detail lapak). Saat ini 404 → halaman selalu "Tidak Ditemukan".

### Spec

```
GET /api/v1/discovery/collectors/:id
  (no auth — publik)
```

### Controller (file `controllers/discovery.js`)

```js
const getCollectorDetail = async (req, res, next) => {
  try {
    const collector = await prisma.collectorProfile.findUnique({
      where: { id: req.params.id },
      include: {
        user: { select: { id: true, name: true, phone: true, avatarUrl: true, avgRating: true } },
        catalogs: {
          include: { category: true },
          where: { isActive: true },
        },
      },
    });

    if (!collector) {
      return res.status(404).json({ status: 'error', message: 'Pengepul tidak ditemukan' });
    }

    res.status(200).json({ status: 'success', data: collector });
  } catch (error) {
    next(error);
  }
};
```

### Routes (file `routes/discovery.js`)

```js
router.get('/collectors/:id', getCollectorDetail);  // ⬅ public, tanpa protect
```

---

## A3. `PATCH /orders/:id` — tambah action `reject` & `cancel`

Saat ini handler `updateStatus` hanya support `accept`, `validate`, `confirm`. FE punya tombol "Tolak" (collector) dan "Batalkan" (customer) yang error karena belum ada case-nya.

### Tambah ke switch di `controllers/order.js` → `updateStatus`

```js
case 'reject':
  // Collector menolak → hapus mapping (atau status di OrderCollector jadi 'rejected')
  if (order.status !== 'PENDING') {
    return res.status(400).json({ status: 'error', message: 'Order sudah diproses' });
  }
  await prisma.orderCollector.updateMany({
    where: { orderId: id, collectorId: req.user.id },
    data: { status: 'rejected' }
  });
  // Tidak ubah status Order — biar order masih bisa diambil pengepul lain
  return res.status(200).json({ status: 'success', data: { orderId: id, status: order.status, rejected: true } });

case 'cancel':
  // Customer batalkan
  if (!['PENDING', 'CONFIRMED', 'IN_PROGRESS'].includes(order.status)) {
    return res.status(400).json({ status: 'error', message: 'Order tidak bisa dibatalkan pada status ini' });
  }
  if (order.customerId !== req.user.id) {
    return res.status(403).json({ status: 'error', message: 'Bukan order Anda' });
  }
  newStatus = 'CANCELLED';
  await prisma.order.update({ where: { id }, data: { status: newStatus } });
  break;
```

---

## A4. Buka `/discovery/search` publik + opsional categoryId

**Masalah saat ini:**
1. Route pakai `protect` → Landing publik tidak bisa fetch (FE 401)
2. Wajib `categoryId` di query → kalau kosong return 400

### Fix

**`routes/discovery.js`** — lepas `protect`:
```js
router.get('/search', search);  // ⬅ hapus 'protect'
```

**`controllers/discovery.js`** — buat categoryId opsional:
```js
const search = async (req, res, next) => {
  try {
    const { lat, lng, categoryId, radius = 5 } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({ status: 'error', message: 'lat & lng wajib' });
    }

    // Build WHERE clause secara dinamis
    const categoryFilter = categoryId
      ? Prisma.sql`AND cc."categoryId" = ${categoryId}`
      : Prisma.sql``;

    const collectors = await prisma.$queryRaw`
      SELECT DISTINCT
        cp.id, cp."shopName", cp.description, cp."priorityScore",
        u.name as "ownerName",
        ST_Distance(u.location, ST_SetSRID(ST_MakePoint(${parseFloat(lng)}, ${parseFloat(lat)}), 4326)::geography) as distance
      FROM "CollectorProfile" cp
      JOIN "User" u ON cp."userId" = u.id
      LEFT JOIN "CollectorCatalog" cc ON cp.id = cc."collectorId" AND cc."isActive" = true
      WHERE
        cp."isOpen" = true
        ${categoryFilter}
        AND ST_DWithin(u.location, ST_SetSRID(ST_MakePoint(${parseFloat(lng)}, ${parseFloat(lat)}), 4326)::geography, ${parseFloat(radius)} * 1000)
      ORDER BY cp."isPremium" DESC, distance ASC
    `;

    res.status(200).json({ status: 'success', data: collectors });
  } catch (error) {
    next(error);
  }
};
```

---

# 🟠 P1 — Schema & Security

## B1. Tambah `User.phone`

Saat ini FE kirim `phone` saat register, tapi BE schema tidak punya kolom ini → silently dropped.

### `prisma/schema.prisma`

```prisma
model User {
  // ...field existing tetap...
  phone  String?   // ⬅ tambah ini
  // ...
}
```

### Update Zod register schema (`controllers/auth.js`)

```js
const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(['CUSTOMER', 'COLLECTOR']),
  phone: z.string().optional(),       // ⬅ tambah
  avatarUrl: z.string().optional(),
});

// Di handler register:
const user = await prisma.user.create({
  data: {
    name: data.name,
    email: data.email,
    passwordHash: hashedPassword,
    role: data.role,
    phone: data.phone,              // ⬅ tambah
    avatarUrl: data.avatarUrl,
  }
});
```

### Migrasi

```bash
npx prisma migrate dev --name add_user_phone
```

---

## B2. JWT include `role` + Aktifkan `authorize` Middleware

Saat ini di `utils/auth.js`:
```js
const generateToken = (userId) => jwt.sign({ id: userId }, ...);
```
JWT cuma berisi `id`. Middleware `authorize` di `middlewares/auth.js` masih placeholder (`next()` kosong) → siapapun yang login bisa hit `/admin/*`.

### Fix `utils/auth.js`

```js
const generateToken = (user) => jwt.sign(
  { id: user.id, role: user.role },   // ⬅ include role
  process.env.JWT_SECRET || 'secret',
  { expiresIn: '7d' }
);
```

Update pemanggil (login, register handler):
```js
const token = generateToken(user);  // sebelumnya: generateToken(user.id)
```

### Fix `middlewares/auth.js`

```js
const authorize = (...roles) => (req, res, next) => {
  if (!req.user?.role || !roles.includes(req.user.role)) {
    return res.status(403).json({ status: 'error', message: 'Forbidden — butuh role: ' + roles.join(', ') });
  }
  next();
};

module.exports = { protect, authorize };
```

Wajib dipasang di semua route `/admin/*` (lihat section E).

---

## B3 + B4. Schema `OrderItem` + Migrasi Order Lama

Multi-category orders: 1 order bisa punya banyak kategori (Kardus + Plastik + Logam).
Pattern: header-detail.

### `prisma/schema.prisma`

```prisma
model OrderItem {
  id              String   @id @default(uuid())
  order           Order    @relation(fields: [orderId], references: [id], onDelete: Cascade)
  orderId         String
  category        WasteCategory @relation(fields: [categoryId], references: [id])
  categoryId      String
  estimatedWeight Float
  actualWeight    Float?
  agreedPrice     Float?   // per kg, diisi saat collector validate
  subtotal        Float?   // = actualWeight * agreedPrice

  @@unique([orderId, categoryId])  // 1 order tidak boleh duplikat kategori
}

model Order {
  // HAPUS field-field ini (pindah ke OrderItem):
  //   categoryId, estimatedWeight, actualWeight, agreedPrice
  //
  // TAMBAH:
  items OrderItem[]
  // Tetap ada:
  // id, customerId, collectorId, method, photoUrl, transactionProofUrl,
  // totalPrice (= SUM(items.subtotal)), status, createdAt, updatedAt
}

model WasteCategory {
  // tambah balikan relasi:
  orderItems OrderItem[]
}
```

### Migrasi Data (jalankan SEBELUM drop kolom)

```sql
-- 1. Setelah `npx prisma migrate dev --name add_order_item`
--    (tabel OrderItem terbentuk, kolom Order lama masih ada)

-- 2. Salin data legacy → OrderItem
INSERT INTO "OrderItem" (id, "orderId", "categoryId", "estimatedWeight", "actualWeight", "agreedPrice", subtotal)
SELECT
  gen_random_uuid()::text,
  id,
  "categoryId",
  "estimatedWeight",
  "actualWeight",
  "agreedPrice",
  CASE WHEN "actualWeight" IS NOT NULL AND "agreedPrice" IS NOT NULL
       THEN "actualWeight" * "agreedPrice"
       ELSE NULL END
FROM "Order"
WHERE "categoryId" IS NOT NULL;

-- 3. Edit prisma/schema.prisma — hapus kolom legacy dari Order
-- 4. Migrate lagi:
--    npx prisma migrate dev --name drop_order_legacy_fields
```

---

# 🟢 P2 — New Endpoints

## C. Edit Profil

### C1. `PATCH /auth/me`

FE sudah panggil di halaman `/profile/edit`. Saat ini 404.

```
PATCH /api/v1/auth/me
  Headers: Authorization: Bearer <token>
  Body (semua opsional):
    {
      "name": "Budi Santoso",
      "phone": "08123456789",
      "avatarUrl": "https://res.cloudinary.com/.../avatar.jpg",
      "lat": -7.7956,
      "lng": 110.3695
    }
  Response: { status, data: User }
```

### Controller (file `controllers/auth.js`)

```js
const updateMeSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().optional(),
  avatarUrl: z.string().url().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
});

const updateMe = async (req, res, next) => {
  try {
    const data = updateMeSchema.parse(req.body);
    const userId = req.user.id;

    // Update kolom biasa via Prisma
    const updateData = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.avatarUrl !== undefined) updateData.avatarUrl = data.avatarUrl;

    if (Object.keys(updateData).length > 0) {
      await prisma.user.update({ where: { id: userId }, data: updateData });
    }

    // Update lokasi PostGIS lewat raw SQL
    if (data.lat !== undefined && data.lng !== undefined) {
      await prisma.$executeRaw`
        UPDATE "User"
        SET location = ST_SetSRID(ST_MakePoint(${data.lng}, ${data.lat}), 4326)::geography
        WHERE id = ${userId};
      `;
    }

    // Return user lengkap (termasuk lat/lng parsed)
    const user = await prisma.$queryRaw`
      SELECT
        id, name, email, role, "avgRating", "avatarUrl", phone,
        ST_Y(location::geometry) as lat,
        ST_X(location::geometry) as lng,
        "createdAt"
      FROM "User"
      WHERE id = ${userId}
      LIMIT 1
    `;

    res.status(200).json({ status: 'success', data: user[0] });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(422).json({ status: 'error', message: 'Validation failed', errors: error.errors });
    }
    next(error);
  }
};
```

### Routes (file `routes/auth.js`)

```js
router.patch('/me', protect, updateMe);  // ⬅ tambah
```

### C2. Update `GET /auth/me` — sertakan field baru

Saat ini response cuma `{ id, name, email, role, avgRating, avatarUrl }`. **Tambah** `phone`, `lat`, `lng`.

```js
const me = async (req, res, next) => {
  try {
    const result = await prisma.$queryRaw`
      SELECT
        id, name, email, role, "avgRating", "avatarUrl", phone,
        ST_Y(location::geometry) as lat,
        ST_X(location::geometry) as lng,
        "createdAt"
      FROM "User"
      WHERE id = ${req.user.id}
      LIMIT 1
    `;
    res.status(200).json({ status: 'success', data: result[0] });
  } catch (error) {
    next(error);
  }
};
```

---

## D. Multi-Category Orders

Order bisa berisi beberapa kategori sekaligus (Kardus + Plastik). Pengepul yang menerima **SEMUA** kategori akan dapat notifikasi.

### D1. `POST /orders` — terima `items[]`

**Body baru:**
```json
{
  "items": [
    { "categoryId": "uuid-kardus", "estimatedWeight": 8.5 },
    { "categoryId": "uuid-plastik", "estimatedWeight": 4.2 }
  ],
  "photoUrl": "https://...",
  "lat": -7.7956,
  "lng": 110.3695,
  "method": "PICKUP"
}
```

> **Backward compat**: FE juga ikut kirim `categoryId` & `estimatedWeight` top-level kalau cuma 1 item, supaya BE legacy tetap jalan selama transisi. Setelah migrasi selesai, BE boleh ignore field top-level itu.

### Controller (file `controllers/order.js`)

```js
const orderItemSchema = z.object({
  categoryId: z.string(),
  estimatedWeight: z.number().positive(),
});

const orderSchema = z.object({
  items: z.array(orderItemSchema).min(1),
  method: z.enum(['PICKUP', 'DROPOFF']),
  photoUrl: z.string().optional(),
  lat: z.number(),
  lng: z.number(),
});

const createOrder = async (req, res, next) => {
  try {
    const data = orderSchema.parse(req.body);
    const io = req.app.get('io');
    const categoryIds = data.items.map(i => i.categoryId);
    const n = categoryIds.length;

    // 1. Create Order + Items dalam satu transaksi
    const order = await prisma.order.create({
      data: {
        customerId: req.user.id,
        method: data.method,
        photoUrl: data.photoUrl,
        status: 'PENDING',
        items: {
          create: data.items.map(it => ({
            categoryId: it.categoryId,
            estimatedWeight: it.estimatedWeight,
          })),
        },
      },
      include: { items: { include: { category: true } } },
    });

    // 2. Cari pengepul yang accept SEMUA kategori
    const collectors = await prisma.$queryRaw`
      SELECT cp.id, cp."userId"
      FROM "CollectorProfile" cp
      JOIN "User" u ON cp."userId" = u.id
      JOIN "CollectorCatalog" cc ON cp.id = cc."collectorId"
      WHERE
        cc."categoryId" IN (${Prisma.join(categoryIds)})
        AND cc."isActive" = true
        AND cp."isOpen" = true
        AND ST_DWithin(
          u.location,
          ST_SetSRID(ST_MakePoint(${data.lng}, ${data.lat}), 4326)::geography,
          cp."radiusKm" * 1000
        )
      GROUP BY cp.id, cp."userId"
      HAVING COUNT(DISTINCT cc."categoryId") = ${n}
    `;

    // 3. Map order → collector candidates + broadcast socket
    if (collectors.length > 0) {
      await prisma.orderCollector.createMany({
        data: collectors.map(c => ({
          orderId: order.id,
          collectorId: c.userId,
          status: 'notified',
        })),
      });

      const payload = {
        orderId: order.id,
        items: order.items.map(it => ({
          id: it.id,
          categoryId: it.categoryId,
          estimatedWeight: it.estimatedWeight,
          category: it.category,
        })),
        method: data.method,
      };

      collectors.forEach(c => {
        io.to(`collector:${c.userId}`).emit('new_order', payload);
      });
    }

    res.status(201).json({ status: 'success', data: order });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(422).json({ status: 'error', message: 'Validation failed', errors: error.errors });
    }
    next(error);
  }
};
```

### D2. `PATCH /orders/:id` action `validate` — terima `items[]`

**Body baru:**
```json
{
  "action": "validate",
  "items": [
    { "id": "orderItem-uuid-1", "actualWeight": 8.7, "agreedPrice": 2200 },
    { "id": "orderItem-uuid-2", "actualWeight": 4.0, "agreedPrice": 4500 }
  ]
}
```

### Ubah case `validate` di switch:

```js
case 'validate': {
  if (order.status !== 'CONFIRMED' && order.status !== 'IN_PROGRESS') {
    return res.status(400).json({ status: 'error', message: 'Invalid state' });
  }
  const { items, transactionProofUrl } = req.body;
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ status: 'error', message: 'items wajib (array)' });
  }

  // Update setiap OrderItem
  await prisma.$transaction(
    items.map(it =>
      prisma.orderItem.update({
        where: { id: it.id },
        data: {
          actualWeight: parseFloat(it.actualWeight),
          agreedPrice: parseFloat(it.agreedPrice),
          subtotal: parseFloat(it.actualWeight) * parseFloat(it.agreedPrice),
        },
      })
    )
  );

  // Recompute totalPrice + status
  const updatedItems = await prisma.orderItem.findMany({ where: { orderId: id } });
  const totalPrice = updatedItems.reduce((s, it) => s + (it.subtotal || 0), 0);

  newStatus = 'AWAITING_CONFIRMATION';
  await prisma.order.update({
    where: { id },
    data: {
      status: newStatus,
      totalPrice,
      transactionProofUrl: transactionProofUrl || null,
    },
  });
  break;
}
```

### D5. Receipt `detailsJson` — include items breakdown

Di case `confirm`, saat generate Receipt:

```js
const items = await prisma.orderItem.findMany({
  where: { orderId: order.id },
  include: { category: true },
});

await prisma.receipt.create({
  data: {
    orderId: order.id,
    detailsJson: {
      customer: order.customerId,
      collector: order.collectorId,
      items: items.map(it => ({
        category: it.category.name,
        actualWeight: it.actualWeight,
        agreedPrice: it.agreedPrice,
        subtotal: it.subtotal,
      })),
      total: items.reduce((s, it) => s + (it.subtotal || 0), 0),
      transactionProofUrl: updatedOrder.transactionProofUrl,
    },
  },
});
```

### Update `GET /orders/:id` — include items

```js
const order = await prisma.order.findUnique({
  where: { id: req.params.id },
  include: {
    customer: true,
    collector: { include: { collectorProfile: true } },
    items: { include: { category: true } },
    receipt: true,
  },
});
```

---

## E. Admin Console

Sesuai BAB III §3.3.a — Use Case Admin punya 3 fitur: kelola kategori, monitoring transaksi, statistik. Semua endpoint butuh `protect, authorize('ADMIN')`.

### Setup route file `routes/admin.js` (baru)

```js
const express = require('express');
const router = express.Router();
const { getStats, getOrders, createCategory, updateCategory, deleteCategory } = require('../controllers/admin');
const { protect, authorize } = require('../middlewares/auth');

router.use(protect, authorize('ADMIN'));  // ⬅ semua route admin pakai middleware ini

router.get('/stats', getStats);
router.get('/orders', getOrders);
router.post('/categories', createCategory);
router.patch('/categories/:id', updateCategory);
router.delete('/categories/:id', deleteCategory);

module.exports = router;
```

Tambahkan di `server.js`:
```js
app.use('/api/v1/admin', require('./routes/admin'));
```

### E1. `GET /admin/stats`

```js
const getStats = async (req, res, next) => {
  try {
    // Aggregate
    const [activeCount, completed, customerCount, collectorCount] = await Promise.all([
      prisma.order.count({
        where: { status: { in: ['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'AWAITING_CONFIRMATION'] } },
      }),
      prisma.order.findMany({
        where: { status: 'COMPLETED' },
        include: { items: true },
      }),
      prisma.user.count({ where: { role: 'CUSTOMER' } }),
      prisma.user.count({ where: { role: 'COLLECTOR' } }),
    ]);

    const totalWeightKg = completed.reduce((s, o) => s + o.items.reduce((ss, i) => ss + (i.actualWeight || 0), 0), 0);
    const totalPayout = completed.reduce((s, o) => s + (o.totalPrice || 0), 0);

    // Weekly aggregation (7 hari terakhir)
    const since = new Date();
    since.setDate(since.getDate() - 7);
    const weekly = await prisma.$queryRaw`
      SELECT
        DATE("createdAt") as date,
        COUNT(*) as count,
        SUM("totalPrice") as amount
      FROM "Order"
      WHERE status = 'COMPLETED' AND "createdAt" >= ${since}
      GROUP BY DATE("createdAt")
      ORDER BY date ASC
    `;
    // Untuk weight per day: bisa join ke OrderItem, tergantung butuh exact atau ringkas

    res.status(200).json({
      status: 'success',
      data: {
        totalWeightKg,
        totalPayout,
        activeOrders: activeCount,
        totalCustomers: customerCount,
        totalCollectors: collectorCount,
        weeklyTransactions: weekly.map(w => ({
          day: ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'][new Date(w.date).getDay()],
          date: w.date,
          weight: 0,  // hitung dari items kalau perlu detail
          amount: Number(w.amount || 0),
          count: Number(w.count),
        })),
      },
    });
  } catch (error) {
    next(error);
  }
};
```

### E2. `GET /admin/orders?status=&page=&limit=`

```js
const getOrders = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const where = status ? { status } : {};
    const skip = (Number(page) - 1) * Number(limit);

    const [data, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          customer: { select: { id: true, name: true } },
          collector: { select: { id: true, name: true } },
          items: { include: { category: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: Number(limit),
        skip,
      }),
      prisma.order.count({ where }),
    ]);

    res.status(200).json({
      status: 'success',
      data: { data, total, page: Number(page), limit: Number(limit) },
    });
  } catch (error) {
    next(error);
  }
};
```

### E3/E4/E5. CRUD Categories

```js
const categorySchema = z.object({
  name: z.string().min(2),
  iconUrl: z.string().url().optional(),
});

const createCategory = async (req, res, next) => {
  try {
    const data = categorySchema.parse(req.body);
    const cat = await prisma.wasteCategory.create({ data });
    res.status(201).json({ status: 'success', data: cat });
  } catch (e) {
    if (e instanceof z.ZodError) return res.status(422).json({ status: 'error', message: 'Validation failed', errors: e.errors });
    if (e.code === 'P2002') return res.status(400).json({ status: 'error', message: 'Nama kategori sudah ada' });
    next(e);
  }
};

const updateCategory = async (req, res, next) => {
  try {
    const data = categorySchema.partial().parse(req.body);
    const cat = await prisma.wasteCategory.update({
      where: { id: req.params.id },
      data,
    });
    res.status(200).json({ status: 'success', data: cat });
  } catch (e) {
    if (e instanceof z.ZodError) return res.status(422).json({ status: 'error', message: 'Validation failed', errors: e.errors });
    next(e);
  }
};

const deleteCategory = async (req, res, next) => {
  try {
    // Cek apakah masih dipakai catalog/orderItem
    const inUse = await prisma.collectorCatalog.findFirst({ where: { categoryId: req.params.id } });
    if (inUse) {
      return res.status(400).json({ status: 'error', message: 'Kategori masih dipakai pengepul. Tidak bisa dihapus.' });
    }
    await prisma.wasteCategory.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (e) {
    next(e);
  }
};

module.exports = { getStats, getOrders, createCategory, updateCategory, deleteCategory };
```

---

# 🧪 Testing Checklist

## Smoke test setelah deploy

```bash
# Public endpoints
curl https://be-rongsokin.hallojanu.xyz/health
curl https://be-rongsokin.hallojanu.xyz/api/v1/discovery/categories
curl "https://be-rongsokin.hallojanu.xyz/api/v1/discovery/search?lat=-7.7956&lng=110.3695"   # tanpa auth, tanpa categoryId
curl https://be-rongsokin.hallojanu.xyz/api/v1/discovery/collectors/<any-collector-id>

# Auth flow
curl -X POST https://be-rongsokin.hallojanu.xyz/api/v1/auth/login -H "Content-Type: application/json" -d '{"email":"...","password":"..."}'
# → simpan token

# Test edit profile
curl -X PATCH https://be-rongsokin.hallojanu.xyz/api/v1/auth/me \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","phone":"081234","lat":-7.79,"lng":110.36}'

# Test list orders
curl "https://be-rongsokin.hallojanu.xyz/api/v1/orders?limit=5" -H "Authorization: Bearer <token>"

# Test multi-category create
curl -X POST https://be-rongsokin.hallojanu.xyz/api/v1/orders \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"items":[{"categoryId":"...","estimatedWeight":5}],"method":"PICKUP","lat":-7.79,"lng":110.36}'

# Test admin (login dulu sebagai user role=ADMIN)
curl https://be-rongsokin.hallojanu.xyz/api/v1/admin/stats -H "Authorization: Bearer <admin-token>"
```

---

# 📂 Appendix — Endpoint yang Sudah Ada (jangan ubah)

| Method | Path | Auth | Status |
|---|---|---|---|
| POST | `/auth/register` | ❌ | ✅ jalan |
| POST | `/auth/login` | ❌ | ✅ jalan |
| GET | `/auth/me` | ✅ | ✅ jalan (perlu tambah field — lihat C2) |
| GET | `/discovery/categories` | ❌ | ✅ jalan |
| GET | `/discovery/search` | ✅ | ✅ jalan (perlu adjust — lihat A4) |
| GET | `/collector/profile` | ✅ | ✅ jalan |
| POST | `/collector/profile` | ✅ | ✅ jalan |
| PATCH | `/collector/profile` | ✅ | ✅ jalan |
| PATCH | `/collector/catalogs` | ✅ | ✅ jalan |
| POST | `/orders` | ✅ | ✅ jalan (perlu update body — lihat D1) |
| GET | `/orders/:id` | ✅ | ✅ jalan (perlu update include — lihat D) |
| PATCH | `/orders/:id` | ✅ | ✅ jalan (perlu tambah case + update validate — lihat A3 & D2) |
| POST | `/ratings` | ✅ | ✅ jalan |
| GET | `/ratings/user/:userId` | ✅ | ✅ jalan |

---

**Estimasi effort:** P0 (~1 hari) · P1 schema (~0.5 hari) · Edit Profil (~0.5 hari) · Multi-Category (~1-2 hari) · Admin Console (~1 hari). **Total ~4-5 hari kerja.**

Setiap section di atas mandiri — bisa dikerjakan parallel kalau ada > 1 dev BE.
