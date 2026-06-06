"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Search,
  Archive,
  RefreshCw,
  Wrench,
  Box,
  Wine,
  Tv,
  Droplets,
  Star,
  CheckCircle2,
  Truck,
  Tag,
  ShieldCheck,
  MapPin,
  ArrowRight,
  Building2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";
import BottomNav from "@/components/ui/BottomNav";
import DesktopNav from "@/components/ui/DesktopNav";
import {
  useSearchCollectors,
  useWasteCategories,
  useDiscoveryStats,
} from "@/hooks/useDiscovery";
import { DEFAULT_COORDS, formatDistance, formatRupiah } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";

// Statik — 6 kategori utama (showcase landing, tidak fetch BE)
const CATEGORIES = [
  { name: "Plastik", icon: RefreshCw },
  { name: "Kertas & Kardus", icon: Box },
  { name: "Logam & Besi", icon: Wrench },
  { name: "Kaca & Botol", icon: Wine },
  { name: "Elektronik", icon: Tv },
  { name: "Lain-lain", icon: Droplets },
];

// Harga perkiraan pasar (Rp/kg) untuk widget estimasi cuan di hero — bukan harga final
const ESTIMATOR = [
  { name: "Plastik", price: 2500, icon: RefreshCw },
  { name: "Kardus", price: 2000, icon: Box },
  { name: "Logam", price: 5000, icon: Wrench },
  { name: "Kaca", price: 800, icon: Wine },
];

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Pilih Kategori Sampah",
    desc: "Pilih jenis rongsok yang ingin kamu jual: kardus, plastik, logam, kertas, atau elektronik.",
    icon: Archive,
  },
  {
    step: "02",
    title: "Temukan Pengepul Terdekat",
    desc: "Sistem kami otomatis mencocokkan dengan pengepul aktif di sekitar lokasimu.",
    icon: MapPin,
  },
  {
    step: "03",
    title: "Dijemput atau Antar Sendiri",
    desc: "Pengepul datang ke tempatmu, atau kamu antar langsung ke lapak. Berat ditimbang di tempat.",
    icon: Truck,
  },
  {
    step: "04",
    title: "Terima Pembayaran",
    desc: "Harga transparan, pembayaran langsung. Dapat struk digital sebagai bukti transaksi.",
    icon: ShieldCheck,
  },
];

export default function LandingPage() {
  const router = useRouter();
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const initFromStorage = useAuthStore((state) => state.initFromStorage);

  useEffect(() => {
    initFromStorage();
  }, [initFromStorage]);

  // Sudah login → langsung ke dasbor masing-masing (tidak ada Beranda saat login)
  useEffect(() => {
    if (token && user) {
      if (user.role === "COLLECTOR") router.replace("/collector");
      else if (user.role === "ADMIN") router.replace("/admin");
      else router.replace("/dashboard");
    }
  }, [token, user, router]);

  const { data: categories } = useWasteCategories();
  const { data: stats, isLoading: isStatsLoading } = useDiscoveryStats();

  // Widget estimasi cuan
  const [estIdx, setEstIdx] = useState(0);
  const [estWeight, setEstWeight] = useState(10);
  const est = ESTIMATOR[estIdx];
  const estTotal = Math.round(estWeight * est.price);

  const { data: collectors, isLoading: isCollectorsLoading } = useSearchCollectors({
    lat: DEFAULT_COORDS.lat,
    lng: DEFAULT_COORDS.lng,
    radius: 50,
  });

  const featuredCollectors = collectors?.slice(0, 6) || [];

  return (
    <div className="pb-20 md:pb-0 bg-surface min-h-screen">
      <DesktopNav />

      {/* MOBILE HEADER */}
      <header className="sticky top-0 z-50 bg-surface-raised border-b border-ink-faint px-4 py-3 md:hidden">
        <div className="flex items-center gap-3">
          <Logo size={36} />
          <span className="font-display font-extrabold text-lg tracking-tight text-ink">
            Rongsok.in
          </span>
          {token ? (
            <Link href="/dashboard" className="ml-auto">
              <Button variant="outline" className="px-4 py-2 h-auto text-xs">
                Dashboard
              </Button>
            </Link>
          ) : (
            <Link href="/login" className="ml-auto">
              <Button variant="outline" className="px-4 py-2 h-auto text-xs">
                Masuk
              </Button>
            </Link>
          )}
        </div>
      </header>

      {/* HERO — sage band, white converter card */}
      <section className="px-4 py-6 md:px-8 md:py-12 max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-center gap-8 md:gap-10">
          {/* LEFT — headline */}
          <div className="flex-1 space-y-6">
            <div className="inline-flex items-center gap-2 bg-brand-100 rounded-full px-3 py-1.5">
              <span className="w-2 h-2 rounded-full bg-brand-500 dot-live" />
              <span className="text-xs font-bold text-brand-800">
                Marketplace Daur Ulang Yogyakarta
              </span>
            </div>
            <h1 className="font-display text-4xl md:text-6xl font-extrabold text-ink leading-[1.05] tracking-tight">
              Jual rongsokmu,
              <br />
              <span className="bg-brand-500 px-2 rounded-lg box-decoration-clone">
                dapat uang
              </span>{" "}
              sekarang.
            </h1>
            <p className="text-base md:text-lg text-ink-muted font-body leading-relaxed max-w-md">
              Platform daur ulang berbasis geolokasi. Hubungkan penjual sampah dengan
              pengepul terpercaya di Yogyakarta secara real-time.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 pt-1">
              <Link href={token ? "/orders/new" : "/register"}>
                <Button className="text-base px-7 py-3.5 flex items-center gap-2 w-full sm:w-auto">
                  {token ? "Jual Sekarang" : "Mulai Jual Gratis"} <ArrowRight size={18} />
                </Button>
              </Link>
              {!token && (
                <Link href="/register?role=COLLECTOR">
                  <Button
                    variant="outline"
                    className="text-base px-7 py-3.5 flex items-center gap-2 w-full sm:w-auto"
                  >
                    <Building2 size={18} /> Daftar Pengepul
                  </Button>
                </Link>
              )}
            </div>
            <div className="flex flex-wrap gap-x-5 gap-y-2 pt-2">
              {[
                { icon: CheckCircle2, label: "Gratis Daftar" },
                { icon: Truck, label: "Jemput ke Rumah" },
                { icon: Tag, label: "Harga Transparan" },
                { icon: ShieldCheck, label: "Transaksi Aman" },
              ].map((b) => (
                <span
                  key={b.label}
                  className="flex items-center gap-1.5 text-xs font-semibold text-ink-muted"
                >
                  <b.icon size={15} className="text-brand-700" />
                  {b.label}
                </span>
              ))}
            </div>
          </div>

          {/* RIGHT — estimator interaktif */}
          <div className="w-full md:w-96 shrink-0">
            <div className="bg-surface-raised border border-ink rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-widest text-mute font-mono">
                  Estimasi Cuan
                </span>
                <span className="text-[10px] font-bold text-brand-800 bg-brand-100 rounded-full px-2 py-0.5">
                  COBA HITUNG
                </span>
              </div>

              {/* Pilih kategori */}
              <div className="grid grid-cols-4 gap-2">
                {ESTIMATOR.map((c, i) => {
                  const active = i === estIdx;
                  return (
                    <button
                      key={c.name}
                      onClick={() => setEstIdx(i)}
                      className={`flex flex-col items-center gap-1.5 rounded-xl py-2.5 border transition-colors ${
                        active
                          ? "bg-brand-500 border-brand-500 text-ink"
                          : "bg-surface border-ink-faint text-ink-muted hover:border-ink"
                      }`}
                    >
                      <c.icon size={18} />
                      <span className="text-[10px] font-bold">{c.name}</span>
                    </button>
                  );
                })}
              </div>

              {/* Berat — stepper */}
              <div className="bg-surface rounded-xl p-4">
                <div className="text-[11px] font-semibold text-mute mb-2">Kamu setor</div>
                <div className="flex items-center justify-between gap-3">
                  <button
                    onClick={() => setEstWeight((w) => Math.max(1, w - 1))}
                    className="w-9 h-9 rounded-full bg-surface-raised border border-ink-faint flex items-center justify-center text-ink hover:bg-brand-100 transition-colors shrink-0 font-bold text-lg"
                    aria-label="Kurangi"
                  >
                    −
                  </button>
                  <div className="font-display text-2xl font-extrabold text-ink font-mono text-center flex-1">
                    {estWeight} kg
                  </div>
                  <button
                    onClick={() => setEstWeight((w) => Math.min(999, w + 1))}
                    className="w-9 h-9 rounded-full bg-surface-raised border border-ink-faint flex items-center justify-center text-ink hover:bg-brand-100 transition-colors shrink-0 font-bold text-lg"
                    aria-label="Tambah"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-center">
                <div className="w-9 h-9 rounded-full bg-ink flex items-center justify-center text-brand-500">
                  <ArrowRight size={16} className="rotate-90" />
                </div>
              </div>

              {/* Hasil */}
              <div className="bg-brand-100 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-semibold text-brand-800">Perkiraan diterima</div>
                  <div className="font-display text-2xl font-extrabold text-ink font-mono">
                    {formatRupiah(estTotal)}
                  </div>
                </div>
                <div className="text-[10px] font-mono text-brand-800 text-right leading-tight">
                  {formatRupiah(est.price)}
                  <br />
                  per kg
                </div>
              </div>

              <p className="text-[10px] text-mute leading-relaxed">
                *Perkiraan harga pasar. Harga final ditentukan pengepul saat penimbangan.
              </p>

              <Link href={token ? "/orders/new" : "/register"}>
                <Button className="w-full">Mulai Transaksi</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* STATS BAR */}
      <section className="px-4 md:px-8 mb-10 max-w-6xl mx-auto">
        <div className="grid grid-cols-3 gap-3 md:gap-4">
          {[
            { value: `${stats?.totalTransactions ?? 0}`, label: "Transaksi" },
            {
              value: `${stats?.totalCollectors ?? featuredCollectors.length}`,
              label: "Pengepul",
            },
            {
              value: `${stats?.totalCategories ?? categories?.length ?? 0}`,
              label: "Kategori",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-surface-raised rounded-2xl p-5 text-center"
            >
              {isStatsLoading ? (
                <div className="h-8 md:h-9 w-12 mx-auto bg-surface rounded-md animate-pulse" />
              ) : (
                <div className="text-2xl md:text-3xl font-display font-extrabold text-ink font-mono">
                  {stat.value}
                </div>
              )}
              <div className="text-[10px] md:text-xs font-bold text-mute uppercase tracking-wider mt-1">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="px-4 md:px-8 mb-10 max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl md:text-2xl font-display font-extrabold text-ink tracking-tight">
            Kategori Sampah
          </h2>
          <Link
            href={token ? "/orders/new" : "/register"}
            className="text-ink text-sm font-semibold flex items-center gap-1 hover:gap-1.5 transition-all"
          >
            Jual Sekarang <ArrowRight size={14} />
          </Link>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {CATEGORIES.map((cat) => (
            <Link
              href={`/search?category=${encodeURIComponent(cat.name)}`}
              key={cat.name}
              className="flex flex-col items-center gap-3 bg-surface-raised rounded-2xl p-5 hover:bg-brand-100 transition-colors group"
            >
              <div className="w-12 h-12 rounded-full bg-surface flex items-center justify-center text-ink group-hover:bg-brand-500 transition-colors">
                <cat.icon size={22} />
              </div>
              <span className="text-[11px] font-bold text-ink text-center leading-tight">
                {cat.name}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="px-4 md:px-8 mb-10 max-w-6xl mx-auto">
        <h2 className="text-xl md:text-2xl font-display font-extrabold text-ink mb-5 tracking-tight">
          Cara Kerja Rongsok.in
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {HOW_IT_WORKS.map((step) => (
            <div
              key={step.step}
              className="bg-surface-raised rounded-2xl p-6 space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="w-11 h-11 bg-brand-100 rounded-2xl flex items-center justify-center text-brand-800">
                  <step.icon size={20} />
                </div>
                <span className="text-3xl font-display font-extrabold text-ink-faint font-mono">
                  {step.step}
                </span>
              </div>
              <h3 className="font-display font-extrabold text-base text-ink">{step.title}</h3>
              <p className="text-sm text-ink-muted leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURED COLLECTORS */}
      <section className="px-4 md:px-8 mb-10 max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl md:text-2xl font-display font-extrabold text-ink tracking-tight">
            Mitra Pengepul Terdaftar
          </h2>
          <Link
            href="/search"
            className="text-ink text-sm font-semibold flex items-center gap-1 hover:gap-1.5 transition-all"
          >
            Lihat Semua <ArrowRight size={14} />
          </Link>
        </div>
        {isCollectorsLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-surface-raised rounded-2xl p-5 text-center">
                <div className="w-12 h-12 bg-surface rounded-full mx-auto mb-3 animate-pulse" />
                <div className="h-3 bg-surface rounded w-3/4 mx-auto mb-2 animate-pulse" />
                <div className="h-2 bg-surface rounded w-1/2 mx-auto animate-pulse" />
              </div>
            ))}
          </div>
        ) : featuredCollectors.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {featuredCollectors.map((collector) => (
              <Link
                key={collector.id}
                href={`/pengepul/${collector.id}`}
                className="bg-surface-raised rounded-2xl p-5 text-center hover:bg-brand-100 transition-colors block"
              >
                <div className="w-12 h-12 bg-surface rounded-full flex items-center justify-center mx-auto mb-3 text-ink">
                  <Archive size={22} />
                </div>
                <div className="text-xs font-bold text-ink line-clamp-2 leading-tight mb-1.5">
                  {collector.shopName}
                </div>
                <div className="flex items-center justify-center gap-1 text-[11px] text-ink-muted">
                  <Star size={11} className="text-status-warning fill-status-warning" />
                  <span className="font-bold text-ink font-mono">
                    {collector.avgRating > 0 ? collector.avgRating.toFixed(1) : "Baru"}
                  </span>
                </div>
                {collector.distance != null && (
                  <div className="mt-1 text-[10px] text-brand-700 font-bold font-mono">
                    {formatDistance(collector.distance)}
                  </div>
                )}
              </Link>
            ))}
          </div>
        ) : (
          <div className="bg-surface-raised rounded-2xl p-8 text-center">
            <div className="w-12 h-12 bg-surface rounded-full flex items-center justify-center mx-auto mb-3 text-ink-faint">
              <Archive size={22} />
            </div>
            <p className="text-sm font-bold text-ink">Pengepul baru segera bergabung</p>
            <p className="text-xs text-ink-muted mt-1">
              Daftar jadi pengepul pertama di daerahmu.
            </p>
          </div>
        )}
      </section>

      {/* CTA BOTTOM — dark polarity band */}
      <section className="px-4 md:px-8 mb-10 max-w-6xl mx-auto">
        <div className="bg-ink rounded-2xl p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <h2 className="text-2xl md:text-4xl font-display font-extrabold text-brand-500 tracking-tight leading-tight">
              Siap mulai daur ulang?
            </h2>
            <p className="text-sm md:text-base text-forest-ink/80">
              Daftar gratis, jual rongsokmu, dan dapat uang dalam hitungan menit.
            </p>
          </div>
          <div className="flex gap-3 shrink-0 flex-wrap justify-center">
            <Link href="/register">
              <button className="bg-brand-500 text-ink hover:bg-brand-600 font-semibold px-6 py-3 rounded-2xl text-sm transition-colors">
                Daftar Customer
              </button>
            </Link>
            <Link href="/register?role=COLLECTOR">
              <button className="bg-transparent border border-forest-ink/40 text-forest-ink hover:bg-forest-3 font-semibold px-6 py-3 rounded-2xl text-sm transition-colors flex items-center gap-2">
                <Building2 size={16} /> Daftar Pengepul
              </button>
            </Link>
          </div>
        </div>
      </section>

      <BottomNav />
    </div>
  );
}
