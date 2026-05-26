"use client";

import Link from "next/link";
import { useEffect } from "react";
import {
  Search,
  Archive,
  Refresh,
  Tools,
  FileLines,
  DesktopPc,
  Star,
  CheckCircle,
  Truck,
  Tag,
  ShieldCheck,
  MapPinAlt,
  ArrowRight,
  UserCircle,
  Building,
} from "flowbite-react-icons/outline";
import { Button } from "@/components/ui/Button";
import BottomNav from "@/components/ui/BottomNav";
import DesktopNav from "@/components/ui/DesktopNav";
import { useSearchCollectors, useWasteCategories } from "@/hooks/useDiscovery";
import { DEFAULT_COORDS, formatDistance } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";


import { useRouter } from "next/navigation";


const CATEGORIES = [
  { name: "Kardus", icon: Archive, color: "bg-amber-50 text-amber-600 border-amber-200" },
  { name: "Plastik", icon: Refresh, color: "bg-blue-50 text-blue-600 border-blue-200" },
  { name: "Logam", icon: Tools, color: "bg-slate-50 text-slate-600 border-slate-200" },
  { name: "Kertas", icon: FileLines, color: "bg-green-50 text-green-600 border-green-200" },
  { name: "Elektronik", icon: DesktopPc, color: "bg-purple-50 text-purple-600 border-purple-200" },
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
    icon: MapPinAlt,
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

  useEffect(() => {
    if (token && user?.role === "COLLECTOR") {
      router.replace("/collector");
    }
  }, [token, user, router]);

  const { data: categories } = useWasteCategories();

  const { data: collectors } = useSearchCollectors({
    lat: DEFAULT_COORDS.lat,
    lng: DEFAULT_COORDS.lng,
    radius: 50,
  });

  const featuredCollectors = collectors?.slice(0, 6) || [];

  return (
    <div className="pb-20 md:pb-0 bg-surface min-h-screen">
      <DesktopNav />

      {/* MOBILE HEADER */}
      <header className="sticky top-0 z-50 bg-white border-b border-ink-faint px-4 py-3 shadow-sm md:hidden">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-brand-500 rounded flex items-center justify-center text-white font-black text-xl">
            R
          </div>
          <span className="font-display font-extrabold text-lg tracking-tighter text-ink">
            Rongsok.in
          </span>
          <div className="flex-1 relative ml-2">
            <input
              type="text"
              placeholder="Cari pengepul, kategori..."
              className="w-full bg-surface-raised border border-ink-faint rounded-full py-2 px-10 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-ink-muted" />
          </div>
          {token ? (
            <Link href="/dashboard">
              <Button variant="outline" className="px-4 py-1.5 h-auto text-xs bg-white">
                Dashboard
              </Button>
            </Link>
          ) : (
            <Link href="/login">
              <Button variant="outline" className="px-4 py-1.5 h-auto text-xs bg-white">
                Masuk
              </Button>
            </Link>
          )}
        </div>
      </header>

      {/* HERO — two column */}
      <section className="px-4 py-5 md:px-8 md:py-10 max-w-6xl mx-auto">
        <div className="bg-white border border-ink-faint rounded-2xl shadow-sm overflow-hidden">
          <div className="flex flex-col md:flex-row items-center">
            {/* LEFT */}
            <div className="flex-1 px-6 py-8 md:px-12 md:py-12 space-y-5">
              <div className="inline-flex items-center gap-2 bg-brand-50 border border-brand-100 rounded-full px-3 py-1">
                <span className="w-2 h-2 rounded-full bg-brand-500 animate-pulse" />
                <span className="text-xs font-bold text-brand-700">
                  Marketplace Daur Ulang #1 Yogyakarta
                </span>
              </div>
              <h1 className="text-3xl md:text-4xl font-display font-extrabold text-ink leading-tight">
                Jual Rongsokmu,<br />
                <span className="text-brand-500">Dapat Uang</span> Sekarang ♻️
              </h1>
              <p className="text-sm text-ink-muted font-body leading-relaxed max-w-sm">
                Platform marketplace daur ulang berbasis geolokasi. Hubungkan penjual sampah
                dengan pengepul terpercaya di Yogyakarta secara real-time.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 pt-1">
                <Link href={token ? "/orders/new" : "/register"}>
                  <Button className="bg-brand-700 hover:bg-brand-800 text-white font-bold px-6 py-3 shadow-md flex items-center gap-2">
                    {token ? "Jual Sekarang" : "Mulai Jual Gratis"} <ArrowRight size={16} />
                  </Button>
                </Link>
                {!token && (
                  <Link href="/register?role=COLLECTOR">
                    <Button variant="outline" className="px-6 py-3 font-bold flex items-center gap-2">
                      <Building size={16} /> Daftar sebagai Pengepul
                    </Button>
                  </Link>
                )}
              </div>
              {/* Trust badges */}
              <div className="flex flex-wrap gap-4 pt-1">
                <span className="flex items-center gap-1.5 text-xs font-bold text-ink-muted">
                  <CheckCircle size={14} className="text-status-success" />
                  Gratis Daftar
                </span>
                <span className="flex items-center gap-1.5 text-xs font-bold text-ink-muted">
                  <Truck size={14} className="text-brand-500" />
                  Jemput ke Rumah
                </span>
                <span className="flex items-center gap-1.5 text-xs font-bold text-ink-muted">
                  <Tag size={14} className="text-brand-500" />
                  Harga Transparan
                </span>
                <span className="flex items-center gap-1.5 text-xs font-bold text-ink-muted">
                  <ShieldCheck size={14} className="text-brand-500" />
                  Transaksi Aman
                </span>
              </div>
            </div>

            {/* RIGHT */}
            <div className="hidden md:flex shrink-0 w-80 h-64 items-center justify-center pr-8">
              <div className="w-72 h-60 rounded-2xl bg-gradient-to-br from-brand-50 to-brand-100 flex items-center justify-center overflow-hidden border border-brand-200">
                <img
                  src="/recycle-hero.png"
                  alt="Rongsok siap dijual"
                  className="w-full h-full object-contain scale-110"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STATS BAR */}
      <section className="px-4 md:px-8 mb-8 max-w-6xl mx-auto">
        <div className="grid grid-cols-3 gap-3">
          {[
            { value: "500+", label: "Transaksi" },
            { value: `${featuredCollectors.length || "10"}+`, label: "Pengepul Aktif" },
            { value: "5 Kategori", label: "Jenis Sampah" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-white border border-ink-faint rounded-xl p-4 text-center shadow-sm"
            >
              <div className="text-xl font-display font-black text-brand-600">{stat.value}</div>
              <div className="text-[10px] font-bold text-ink-muted uppercase tracking-wider mt-0.5">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="px-4 md:px-8 mb-8 max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-display font-extrabold text-ink">
            Kategori Sampah
          </h2>
          <Link href={token ? "/orders/new" : "/register"} className="text-brand-500 text-xs font-bold">
            Jual Sekarang →
          </Link>
        </div>
        <div className="grid grid-cols-5 gap-3">
          {CATEGORIES.map((cat) => (
            <Link
              href={token ? `/orders/new?category=${cat.name.toLowerCase()}` : `/search?category=${cat.name.toLowerCase()}`}
              key={cat.name}
              className="flex flex-col items-center gap-2 bg-white border border-ink-faint rounded-xl p-3 shadow-sm hover:border-brand-400 hover:shadow-md transition-all group"
            >
              <div
                className={`w-11 h-11 rounded-full border flex items-center justify-center transition-colors ${cat.color}`}
              >
                <cat.icon size={20} />
              </div>
              <span className="text-[10px] font-bold text-ink-muted text-center group-hover:text-ink">
                {cat.name}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="px-4 md:px-8 mb-8 max-w-6xl mx-auto">
        <h2 className="text-base font-display font-extrabold text-ink mb-4">
          Cara Kerja Rongsok.in
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {HOW_IT_WORKS.map((step) => (
            <div
              key={step.step}
              className="bg-white border border-ink-faint rounded-xl p-5 shadow-sm space-y-3 hover:border-brand-300 hover:shadow-md transition-all"
            >
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-black text-brand-500 bg-brand-50 border border-brand-100 rounded-full px-2 py-0.5">
                  {step.step}
                </span>
                <div className="w-8 h-8 bg-brand-50 border border-brand-100 rounded-lg flex items-center justify-center">
                  <step.icon size={18} className="text-brand-600" />
                </div>
              </div>
              <h3 className="font-display font-extrabold text-sm text-ink">{step.title}</h3>
              <p className="text-xs text-ink-muted leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURED COLLECTORS */}
      <section className="px-4 md:px-8 mb-8 max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-display font-extrabold text-ink flex items-center gap-2">
            🔥 Mitra Pengepul Terdaftar
          </h2>
          <Link href="/search" className="text-brand-500 text-xs font-bold">
            Lihat Semua →
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {featuredCollectors.length > 0 ? (
            featuredCollectors.map((collector) => (
              <Link
                key={collector.id}
                href={`/pengepul/${collector.id}`}
                className="bg-white border border-ink-faint rounded-xl p-4 text-center shadow-sm hover:border-brand-300 hover:shadow-md transition-all block"
              >
                <div className="w-12 h-12 bg-brand-50 border border-brand-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Archive size={24} className="text-brand-500" />
                </div>
                <div className="text-xs font-bold text-ink line-clamp-2 leading-tight mb-1">
                  {collector.shopName}
                </div>
                <div className="flex items-center justify-center gap-1 text-[10px] text-ink-muted">
                  <Star size={10} className="text-status-warning fill-status-warning" />
                  <span className="font-bold text-ink">{collector.priorityScore || "4.9"}</span>
                </div>
                {collector.distance && (
                  <div className="mt-1 text-[9px] text-brand-600 font-bold">
                    {formatDistance(collector.distance)}
                  </div>
                )}
              </Link>
            ))
          ) : (
            [1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="bg-white border border-ink-faint rounded-xl p-4 text-center shadow-sm"
              >
                <div className="w-12 h-12 bg-surface-raised rounded-full mx-auto mb-2 animate-pulse" />
                <div className="h-3 bg-surface-raised rounded w-3/4 mx-auto mb-2 animate-pulse" />
                <div className="h-2 bg-surface-raised rounded w-1/2 mx-auto animate-pulse" />
              </div>
            ))
          )}
        </div>
      </section>

      {/* CTA BOTTOM BANNER */}
      <section className="px-4 md:px-8 mb-8 max-w-6xl mx-auto">
        <div className="bg-brand-600 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-4 shadow-lg">
          <div className="text-white space-y-1 text-center md:text-left">
            <h2 className="text-xl font-display font-extrabold">Siap mulai daur ulang?</h2>
            <p className="text-sm text-brand-100">
              Daftar gratis, jual rongsokmu, dan dapat uang dalam hitungan menit.
            </p>
          </div>
          <div className="flex gap-3 shrink-0 flex-wrap justify-center">
            <Link href="/register">
              <button className="bg-white text-brand-700 hover:bg-brand-50 font-bold px-6 py-2.5 rounded-md text-sm flex items-center gap-2 shadow-md transition-colors">
                <UserCircle size={16} /> Daftar Customer
              </button>
            </Link>
            <Link href="/register?role=COLLECTOR">
              <button className="bg-transparent border-2 border-white text-white hover:bg-white/10 font-bold px-6 py-2.5 rounded-md text-sm flex items-center gap-2 transition-colors">
                <Building size={16} /> Daftar Pengepul
              </button>
            </Link>
          </div>
        </div>
      </section>

      <BottomNav />
    </div>
  );
}
