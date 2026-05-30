# 🚀 PROMPT CONTEXT: SPESIFIKASI SISTEM RONGSOK.IN
> *Salin seluruh isi dokumen ini dan berikan kepada AI sebagai 'System Prompt' atau 'Context' agar AI tersebut dapat membuat proposal, BAB IV, paper, atau dokumentasi sistem dengan 100% data yang akurat dan tanpa halusinasi.*

---

## 1. KONTEKS PROYEK & PERSONA
* **Nama Platform**: Rongsok.in
* **Deskripsi**: Marketplace daur ulang sampah kering berbasis geolokalisi (*spatial-matching*) yang menghubungkan penjual sampah/barang bekas (**Customer**) dengan pengepul/gudang rosok (**Collector/Pengepul**).
* **Wilayah Operasional**: Daerah Istimewa Yogyakarta (khususnya wilayah Sleman, Bantul, dan Kota Yogyakarta).
* **Tujuan**: Mengatasi masalah transparansi timbangan di lapangan, mempermudah distribusi rantai pasok sampah kering, dan digitalisasi UMKM pengepul rosok. Target kompetisi: Lomba OLIVIA Yogyakarta.
* **Peran Pengguna (Role)**: 
  1. `CUSTOMER`: Pemilik sampah kering yang ingin menjual barang bekasnya dengan metode penjemputan (*pick-up*) atau diantar (*drop-off*).
  2. `COLLECTOR` (Pengepul): Pemilik lapak rosok yang menimbang, membeli, dan mengelola dana hasil daur ulang.
  3. `ADMIN`: Pihak internal platform yang mengelola master data kategori sampah, monitoring transaksi nasional, dan memverifikasi berkas pendaftaran Pengepul baru.

---

## 2. TECH STACK (ARSITEKTUR CLIENT-SERVER)
Platform ini dibangun dengan pembagian tanggung jawab terpisah (*decoupled Client-Server architecture*):

### A. Frontend Layer (Sisi Klien)
* **Framework & Bahasa**: Next.js 14+ (App Router), TypeScript (Strict Mode).
* **Styling**: Tailwind CSS (Token warna kustom: `brand-*` untuk identitas, `surface-*` untuk latar belakang, `ink-*` untuk teks). Menggunakan prinsip *mobile-first responsivity* (breakpoints dasar 375px).
* **Desain Estetika**: Premium dengan gaya *Glassmorphism* (semi-transparan dengan efek filter blur) dan tema gelap (*dark mode*) pada dasbor pengepul.
* **State Management**: Zustand (untuk `authStore` dan `orderStore`).
* **Kueri Data & HTTP**: TanStack Query (React Query) v5 dan Axios (terintegrasi dengan JWT interceptor).
* **Icons**: Lucide React.
* **Geolokasi & Peta**: HTML5 Geolocation API terintegrasi dengan kustom **Yogyakarta SVG Vector Grid Map** pada sisi dasbor pengepul (bukan Leaflet/Google Maps biasa untuk efisiensi performa rendering).

### B. Backend Layer (Sisi Server API)
* **Framework & Bahasa**: Express.js (Node.js).
* **Database Relasional**: PostgreSQL (di-host di Supabase cloud).
* **Peta Spasial (GIS)**: Ekstensi **PostGIS** diaktifkan di PostgreSQL untuk mengelola koordinat geospasial menggunakan tipe data `Geography(Point, 4326)`.
* **Indeks Database**: Indeks spasial **GIST** (*Generalized Search Tree*) diaktifkan pada kolom `location` untuk mempercepat pemrosesan kueri jarak spasial.
* **Object-Relational Mapping (ORM)**: Prisma ORM.
* **Manajemen Kontainer & Host**: Docker Swarm, CapRover PaaS, di-host pada Pop!_OS 24.04 LTS (Home Lab Server).
* **Jalur Keamanan Terowongan**: **Cloudflare Tunnel** (`cloudflared`) untuk menyembunyikan IP publik server dan mengenkripsi data HTTPS end-to-end.

### C. Layanan Pihak Ketiga & Real-time
* **Komunikasi Waktu Nyata**: **Socket.IO** (WebSockets) untuk broadcast instan pesanan baru dan pembaruan status transaksi.
* **Penyimpanan Gambar Biner**: **Cloudinary Storage**. Proses unggah gambar (foto sampah, foto profil lapak, foto timbangan, foto rating) dikirim asinkron langsung dari klien Next.js menggunakan secure signature, mengembalikan URL statis CDN Cloudinary.

---

## 3. DATA MODEL & SKEMA DATABASE
Tabel-tabel relasional utama dalam basis data PostgreSQL dikelola melalui model Prisma berikut:

1. **User**: Menyimpan identitas digital pengguna.
   * Kolom: `id` (UUID), `name`, `email`, `passwordHash` (Bcrypt), `role` (CUSTOMER, COLLECTOR, ADMIN), `avatarUrl`, `avgRating` (Float), `location` (PostGIS Geography Point 4326), `createdAt`.
2. **CollectorProfile**: Informasi profil lapak pengepul (Relasi 1-to-1 dengan `User`).
   * Kolom: `id` (UUID), `userId` (FK), `shopName`, `description`, `shopImageUrl`, `radiusKm` (jarak penjemputan, default 5 km), `isOpen` (status operasional), `isPremium`, `priorityScore` (skor Listing).
3. **WasteCategory**: Kategori sampah kering (dikelola Admin).
   * Kolom: `id` (UUID), `name` (Kardus, Kertas, Plastik, Logam, Elektronik), `iconUrl`.
4. **CollectorCatalog**: Tabel pemetaan harga beli per kategori sampah milik pengepul.
   * Kolom: `id`, `collectorId` (FK), `categoryId` (FK), `priceMin`, `priceMax`, `isActive`.
5. **Order**: Transaksi utama penjualan sampah.
   * Kolom: `id` (UUID), `customerId` (FK), `collectorId` (FK, Nullable), `categoryId` (FK), `method` (PICKUP, DROPOFF), `photoUrl` (kondisi awal sampah), `transactionProofUrl` (bukti foto timbangan aktual), `estimatedWeight` (kg), `actualWeight` (kg), `agreedPrice` (Rp), `totalPrice` (Rp), `status` (Enum), `createdAt`, `updatedAt`.
6. **Rating**: Ulasan timbal balik pasca-transaksi.
   * Kolom: `id`, `orderId` (FK), `raterId` (FK), `rateeId` (FK), `score` (1-5), `reviewText`, `photoUrl` (bukti pelayanan).

---

## 4. FITUR PREMIUM RIIL & ALUR KERJA UTAMA

### A. Alur Transaksi OMS Ganda (Dual-Confirmation Flow)
Mengikat kedua belah pihak secara transparan untuk memutus kecurangan timbangan:
1. **PENDING**: Customer membuat order 6-tahap (Kategori $\rightarrow$ Estimasi Berat $\rightarrow$ Unggah Foto Cloudinary $\rightarrow$ Metode $\rightarrow$ GPS $\rightarrow$ Review). Notifikasi dibroadcast spasial via Socket.IO ke pengepul terdekat.
2. **CONFIRMED**: Pengepul mengambil pesanan dari peta interaktif. Customer menerima info kontak pengepul lengkap dengan tombol pintas WhatsApp (`wa.me/`).
3. **IN_PROGRESS**: Pengepul menuju lokasi dan melakukan penimbangan fisik di lapangan.
4. **AWAITING_CONFIRMATION**: Pengepul memasukkan angka berat bersih aktual, harga sepakat dari katalog, dan mengunggah **Foto Bukti Timbangan Fisik/Nota** (`transactionProofUrl`). Data dikunci dan tidak bisa ditutup sepihak oleh pengepul.
5. **COMPLETED**: Customer memeriksa detail nota digital di layar HP, dan menekan tombol **"Setuju & Selesaikan Transaksi"**. Status bergeser ke COMPLETED, memotong saldo E-Wallet pengepul, menerbitkan Struk Digital permanen, serta memicu pop-up **Mutual Rating** (ulasan dua arah antara customer dan pengepul).

### B. Dasbor Pengepul & Peta Interaktif Yogyakarta SVG Grid
* Antarmuka dark-mode futuristik yang menampilkan **Peta Vektor SVG** Daerah Istimewa Yogyakarta (membagi wilayah Sleman, Bantul, dan Kota Jogja lengkap dengan rute jalan utama dan sungai).
* Menampilkan penanda pesanan spasial masuk yang berdenyut (*pulsating marker pin*) berwarna hijau-amber.
* Mengetuk penanda akan membuka laci informasi (*drawer*) bawah yang menampilkan rincian kategori sampah, jarak penjemputan, estimasi berat, taksiran pendapatan, serta tombol aksi cepat **"Ambil Pesanan"**.

### C. Dompet Mitra (E-Wallet) Pengepul
* Kartu saldo *glassmorphic* premium yang menampilkan nominal kas pengepul (dimulai dari Rp 0 untuk pendaftar baru).
* Modal interaktif **"Tarik Saldo"** teranimasi yang menyimulasikan pencairan dana ke rekening bank penampung (BCA, Mandiri, BNI, BRI) dengan tombol pintasan nominal (Rp 50.000, Rp 100.000, Rp 200.000) dan mutasi pengeluaran/pendapatan transaksi secara *real-time*.

### D. Konsol Pengawasan Admin & Verifikasi KYC
* Admin dapat melakukan pengawasan menyeluruh terhadap grafik transaksi nasional dan log aktivitas.
* Tombol **"Tinjau Berkas"** memicu jendela modal verifikasi KYC (*Know Your Customer*):
  - Menampilkan visualisasi kartu KTP digital (NIK, nama, foto) dan dokumen SIUP Pemda DIY yang diunggah.
  - Dilengkapi dengan **Indikator Kecocokan Biometrik Wajah** (skor simulasi pencocokan wajah swafoto/selfie dengan foto KTP sebesar 98%).
  - Tombol aksi cepat **"Setujui"** atau **"Tolak"** berkas secara langsung di dalam modal modal terpadu.

### E. Concurrency Guardrails & Auto-Expiry
* **Batas Transaksi Tunggal**: Customer hanya boleh memiliki 1 order aktif agar tidak terjadi sengketa armada. Pengepul juga dibatasi hanya menangani 1 transaksi aktif berjalan untuk menjamin kualitas penjemputan.
* **Auto-Cancellation 15 Menit**: Server secara terjadwal (interval 10 detik) memindai dan membatalkan otomatis semua pesanan `PENDING` yang telah kedaluwarsa selama 15 menit menjadi status `CANCELLED`.

---

## 5. KUERI LOGIKA SPASIAL (POSTGIS SQL)
Kueri utama yang dieksekusi server backend untuk menyaring pengepul dalam radius spasial penjemputan (contoh parameter: radius 50 km, Yogyakarta koordinat `-7.7956, 110.3695`):
```sql
SELECT DISTINCT
  cp.id, 
  cp."shopName", 
  cp.description, 
  cp."priorityScore",
  u.name as "ownerName",
  CASE 
    WHEN u.location IS NOT NULL THEN
      ST_Distance(u.location, ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography)
    ELSE NULL
  END as distance
FROM "CollectorProfile" cp
JOIN "User" u ON cp."userId" = u.id
LEFT JOIN "CollectorCatalog" cc ON cp.id = cc."collectorId" AND cc."isActive" = true
WHERE 
  cp."isOpen" = true AND
  (
    u.location IS NULL OR
    ST_DWithin(u.location, ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography, radius_in_km * 1000)
  )
ORDER BY cp."isPremium" DESC, cp."priorityScore" DESC
LIMIT 20;
```
*(Indeks spasial GIST menjamin kueri spasial di atas berjalan sangat efisien di bawah 200ms dengan beban pengujian data spasial yang besar).*
