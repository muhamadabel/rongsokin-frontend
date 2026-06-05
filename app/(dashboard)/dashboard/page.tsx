"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useMe } from "@/hooks/useAuth";
import { useOrdersList } from "@/hooks/useOrders";
import { useWasteCategories, useSearchCollectors } from "@/hooks/useDiscovery";
import {
  DEFAULT_COORDS,
  formatRupiah,
  formatDistance,
  formatDate,
  getOrderTotalEstWeight,
  getOrderTotalActualWeight,
  getOrderTotalPrice,
  getOrderCategoryLabel,
} from "@/lib/utils";
import { useSocket } from "@/hooks/useSocket";
import DesktopNav from "@/components/ui/DesktopNav";
import BottomNav from "@/components/ui/BottomNav";
import { Button } from "@/components/ui/Button";
import { DashboardSkeleton } from "@/components/ui/Skeleton";
import {
  Archive,
  RefreshCw,
  Wrench,
  FileText,
  Monitor,
  Star,
  MapPin,
  ArrowRight,
  Scale,
  LogOut,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronRight,
  Bell,
  Plus,
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";

const categoryIcons: Record<string, any> = {
  Kardus: Archive,
  Plastik: RefreshCw,
  Logam: Wrench,
  Kertas: FileText,
  Elektronik: Monitor,
};

const STATUS_CONFIG: Record<string, { label: string; style: string }> = {
  PENDING: { label: "Menunggu Pengepul", style: "bg-[#fff4cc] text-[#4a3b1c]" },
  CONFIRMED: { label: "Pengepul Ditemukan", style: "bg-brand-100 text-brand-800" },
  IN_PROGRESS: { label: "Sedang Diproses", style: "bg-[#dbeeff] text-[#0b4a6b]" },
  AWAITING_CONFIRMATION: { label: "Menunggu Konfirmasimu", style: "bg-[#ecdcff] text-[#3b1c5a]" },
  COMPLETED: { label: "Selesai", style: "bg-brand-100 text-brand-800" },
  CANCELLED: { label: "Dibatalkan", style: "bg-status-error/10 text-status-error" },
};

export default function CustomerDashboard() {
  const router = useRouter();
  const logout = useAuthStore((state) => state.logout);
  const initFromStorage = useAuthStore((state) => state.initFromStorage);
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    initFromStorage();
  }, [initFromStorage]);

  useEffect(() => {
    if (token && user?.role === "COLLECTOR") {
      router.replace("/collector");
    }
  }, [token, user, router]);

  useSocket();

  const { data: me, isLoading: isMeLoading } = useMe();
  const { data: orders, isLoading: isOrdersLoading } = useOrdersList({ limit: 50 });
  const { data: categories } = useWasteCategories();

  const [coords, setCoords] = useState(DEFAULT_COORDS);
  const [greeting, setGreeting] = useState("Halo");

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 11) setGreeting("Selamat pagi");
    else if (hour < 15) setGreeting("Selamat siang");
    else if (hour < 18) setGreeting("Selamat sore");
    else setGreeting("Selamat malam");
  }, []);

  useEffect(() => {
    if (typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCoords({ lat: position.coords.latitude, lng: position.coords.longitude });
        },
        () => {}
      );
    }
  }, []);

  const { data: nearbyCollectors, isLoading: isNearbyLoading } = useSearchCollectors({
    lat: coords.lat,
    lng: coords.lng,
    radius: 5,
  });

  const activeOrder = orders?.find(
    (o) => o.status !== "COMPLETED" && o.status !== "CANCELLED"
  );

  const completedOrders = orders?.filter((o) => o.status === "COMPLETED") || [];
  const totalWeight = completedOrders.reduce(
    (sum, o) => sum + (getOrderTotalActualWeight(o) || getOrderTotalEstWeight(o)),
    0
  );
  const totalEarnings = completedOrders.reduce((sum, o) => sum + getOrderTotalPrice(o), 0);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const firstName = me?.name?.split(" ")[0] || "Kamu";

  if (isMeLoading || isOrdersLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="pb-20 md:pb-8 bg-surface min-h-screen">
      <DesktopNav />

      {/* MOBILE HEADER */}
      <header className="sticky top-0 z-50 bg-surface-raised border-b border-ink-faint px-4 py-3 md:hidden flex justify-between items-center">
        <div>
          <p className="text-[10px] text-mute font-bold uppercase tracking-wider">{greeting},</p>
          <h1 className="font-display font-extrabold text-base text-ink">{firstName} 👋</h1>
        </div>
        <div className="flex items-center gap-2">
          <button className="w-9 h-9 rounded-2xl bg-surface flex items-center justify-center text-ink-muted hover:text-ink transition-colors">
            <Bell size={18} />
          </button>
          <button
            onClick={handleLogout}
            className="w-9 h-9 rounded-2xl bg-surface flex items-center justify-center text-ink-muted hover:text-status-error transition-colors"
          >
            <LogOut size={18} />
          </button>
        </div>
      </header>

      <main className="max-w-6xl w-full mx-auto px-4 md:px-8 py-5 space-y-6">
        <div className="hidden md:block">
          <p className="text-sm text-mute font-semibold">{greeting},</p>
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-ink">
            {firstName} 👋
          </h1>
        </div>

        {/* ACTIVE ORDER ALERT */}
        {activeOrder && (
          <Link
            href={`/orders/${activeOrder.id}`}
            className="block bg-ink rounded-2xl p-5 hover:brightness-110 transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-brand-500 flex items-center justify-center shrink-0 text-ink">
                <Clock size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-ink bg-brand-500 rounded-full px-2 py-0.5">
                    Pesanan Aktif
                  </span>
                  <span
                    className={`text-[9px] font-extrabold uppercase tracking-wider rounded-full px-2 py-0.5 ${
                      STATUS_CONFIG[activeOrder.status]?.style || "bg-surface text-ink-muted"
                    }`}
                  >
                    {STATUS_CONFIG[activeOrder.status]?.label || activeOrder.status}
                  </span>
                </div>
                <p className="text-sm font-bold text-forest-ink truncate">
                  Setor {getOrderCategoryLabel(activeOrder)} ·{" "}
                  {getOrderTotalEstWeight(activeOrder).toFixed(1)} kg
                </p>
                <p className="text-[10px] text-forest-muted">
                  {formatDate(activeOrder.createdAt)} · {activeOrder.method}
                </p>
              </div>
              <ChevronRight size={18} className="text-brand-500 shrink-0" />
            </div>
            {activeOrder.status === "AWAITING_CONFIRMATION" && (
              <div className="mt-3 pt-3 border-t border-forest-3">
                <p className="text-xs font-bold text-brand-500 flex items-center gap-2">
                  <Bell size={12} /> Pengepul sudah menimbang — tap untuk konfirmasi harga!
                </p>
              </div>
            )}
          </Link>
        )}

        {/* QUICK ACTION + STATS */}
        <section className="grid grid-cols-3 gap-3">
          <Link
            href="/orders/new"
            className="col-span-1 bg-brand-500 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 text-ink hover:bg-brand-600 transition-colors text-center"
          >
            <Plus size={24} strokeWidth={2.5} />
            <span className="text-xs font-extrabold leading-tight">
              Jual
              <br />
              Sekarang
            </span>
          </Link>

          <div className="col-span-1 bg-surface-raised rounded-2xl p-4 flex flex-col gap-1">
            <div className="w-8 h-8 rounded-2xl bg-surface flex items-center justify-center">
              <Scale size={16} className="text-ink" />
            </div>
            <div className="text-xs font-semibold text-mute mt-1">Total Sampah</div>
            <div className="text-base font-display font-extrabold text-ink font-mono">
              {totalWeight.toFixed(1)} kg
            </div>
          </div>

          <div className="col-span-1 bg-surface-raised rounded-2xl p-4 flex flex-col gap-1">
            <div className="w-8 h-8 rounded-2xl bg-brand-100 flex items-center justify-center">
              <ArrowRight size={16} className="text-brand-800 -rotate-45" />
            </div>
            <div className="text-xs font-semibold text-mute mt-1">Pendapatan</div>
            <div className="text-base font-display font-extrabold text-ink font-mono">
              {formatRupiah(totalEarnings)}
            </div>
          </div>
        </section>

        {/* JUAL PER KATEGORI */}
        <section className="space-y-3">
          <h2 className="text-base font-display font-extrabold text-ink tracking-tight">
            Jual Cepat per Kategori
          </h2>
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
            {categories && categories.length > 0
              ? categories.map((cat) => {
                  const Icon = categoryIcons[cat.name] || Archive;
                  return (
                    <Link
                      key={cat.id}
                      href={`/orders/new?category=${cat.id}`}
                      className="flex flex-col items-center gap-2 bg-surface-raised rounded-2xl p-4 min-w-[88px] hover:bg-brand-100 transition-colors group shrink-0"
                    >
                      <div className="w-11 h-11 bg-surface rounded-full flex items-center justify-center group-hover:bg-brand-500 transition-colors text-ink">
                        <Icon size={22} />
                      </div>
                      <span className="text-[11px] font-bold text-ink text-center">
                        {cat.name}
                      </span>
                    </Link>
                  );
                })
              : [1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="w-20 h-24 bg-surface-raised rounded-2xl animate-pulse shrink-0"
                  />
                ))}
          </div>
        </section>

        {/* PENGEPUL TERDEKAT */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-display font-extrabold text-ink tracking-tight">
              Pengepul Terdekat
            </h2>
            <span className="text-xs font-semibold text-mute flex items-center gap-1">
              <MapPin size={12} className="text-brand-700" />
              {coords === DEFAULT_COORDS ? "Yogyakarta" : "Lokasimu"}
            </span>
          </div>

          <div className="space-y-2">
            {isNearbyLoading ? (
              [1, 2].map((i) => (
                <div key={i} className="bg-surface-raised rounded-2xl p-4 h-20 animate-pulse" />
              ))
            ) : nearbyCollectors && nearbyCollectors.length > 0 ? (
              nearbyCollectors.slice(0, 3).map((collector) => (
                <div
                  key={collector.id}
                  className="bg-surface-raised rounded-2xl p-4 flex items-center gap-3"
                >
                  <div className="w-11 h-11 bg-surface rounded-2xl flex items-center justify-center shrink-0 text-ink">
                    <Archive size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-sm text-ink truncate">
                        {collector.shopName}
                      </h3>
                      <span className="text-[9px] font-bold text-brand-800 bg-brand-100 rounded-full px-1.5 py-0.5 shrink-0">
                        Buka
                      </span>
                    </div>
                    <p className="text-[11px] text-ink-muted truncate">
                      {collector.description || "Mitra Pengepul Rongsok.in"}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <div className="flex items-center gap-0.5 text-[11px]">
                        <Star size={10} className="text-status-warning fill-status-warning" />
                        <span className="font-bold text-ink font-mono">
                          {collector.avgRating > 0 ? collector.avgRating.toFixed(1) : "Baru"}
                        </span>
                      </div>
                      {collector.distance != null && (
                        <>
                          <span className="text-ink-faint">·</span>
                          <span className="text-[11px] font-bold text-brand-700 font-mono">
                            {formatDistance(collector.distance)}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <Link
                    href="/orders/new"
                    className="shrink-0 text-xs font-bold text-ink bg-brand-500 hover:bg-brand-600 rounded-2xl px-4 py-2 transition-colors"
                  >
                    Jual
                  </Link>
                </div>
              ))
            ) : (
              <div className="bg-surface-raised rounded-2xl p-6 text-center text-xs text-ink-muted">
                Belum ada pengepul di sekitarmu (radius 5km).
              </div>
            )}
          </div>
        </section>

        {/* RIWAYAT SETORAN */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-display font-extrabold text-ink tracking-tight">
              Riwayat Setoranku
            </h2>
            {orders && orders.length > 3 && (
              <Link
                href="/orders"
                className="text-ink text-xs font-semibold flex items-center gap-1"
              >
                Lihat Semua <ArrowRight size={12} />
              </Link>
            )}
          </div>

          <div className="space-y-2">
            {orders && orders.length > 0 ? (
              orders.slice(0, 5).map((order) => {
                const statusConf = STATUS_CONFIG[order.status] || {
                  label: order.status,
                  style: "bg-surface text-ink-muted",
                };
                return (
                  <Link
                    key={order.id}
                    href={`/orders/${order.id}`}
                    className="bg-surface-raised rounded-2xl p-4 flex items-center gap-3 hover:bg-brand-100 transition-colors"
                  >
                    <div className="w-9 h-9 bg-surface rounded-2xl flex items-center justify-center shrink-0">
                      {order.status === "COMPLETED" ? (
                        <CheckCircle2 size={18} className="text-status-success" />
                      ) : order.status === "CANCELLED" ? (
                        <XCircle size={18} className="text-status-error" />
                      ) : (
                        <Clock size={18} className="text-ink-muted" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-sm text-ink truncate">
                        Setor {getOrderCategoryLabel(order)}
                      </h3>
                      <p className="text-[10px] text-mute">{formatDate(order.createdAt)}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-sm font-bold text-ink font-mono">
                        {(
                          getOrderTotalActualWeight(order) || getOrderTotalEstWeight(order)
                        ).toFixed(1)}{" "}
                        kg
                      </div>
                      <span
                        className={`inline-block text-[9px] font-extrabold px-2 py-0.5 rounded-full tracking-wide uppercase mt-1 ${statusConf.style}`}
                      >
                        {statusConf.label}
                      </span>
                    </div>
                  </Link>
                );
              })
            ) : (
              <div className="bg-surface-raised rounded-2xl p-8 text-center space-y-3">
                <div className="w-12 h-12 bg-surface rounded-full flex items-center justify-center mx-auto">
                  <Archive size={24} className="text-ink-faint" />
                </div>
                <p className="text-xs text-ink-muted">Belum ada riwayat setoran.</p>
                <Link href="/orders/new" className="inline-block">
                  <Button className="text-xs px-4 py-2">Jual Sampah Pertamamu</Button>
                </Link>
              </div>
            )}
          </div>
        </section>
      </main>

      <BottomNav />
    </div>
  );
}
