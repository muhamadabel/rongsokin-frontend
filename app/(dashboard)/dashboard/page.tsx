"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useMe } from "@/hooks/useAuth";
import { useOrdersList } from "@/hooks/useOrders";
import { useWasteCategories, useSearchCollectors } from "@/hooks/useDiscovery";
import { DEFAULT_COORDS, formatRupiah, formatDistance, formatDate } from "@/lib/utils";
import { useSocket } from "@/hooks/useSocket";
import DesktopNav from "@/components/ui/DesktopNav";
import BottomNav from "@/components/ui/BottomNav";
import { Button } from "@/components/ui/Button";
import {
  Archive,
  Refresh,
  Tools,
  FileLines,
  DesktopPc,
  Star,
  MapPinAlt,
  ArrowRight,
  Dollar,
  ScaleBalanced,
  ArrowRightToBracket,
  CheckCircle,
  CloseCircle,
  Clock,
  ChevronRight,
  Bell,
  Plus,
} from "flowbite-react-icons/outline";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";

const categoryIcons: Record<string, any> = {
  Kardus: Archive,
  Plastik: Refresh,
  Logam: Tools,
  Kertas: FileLines,
  Elektronik: DesktopPc,
};

const STATUS_CONFIG: Record<string, { label: string; style: string; dot: string }> = {
  PENDING: {
    label: "Menunggu Pengepul",
    style: "bg-amber-50 text-amber-700 border-amber-200",
    dot: "bg-amber-400",
  },
  CONFIRMED: {
    label: "Pengepul Ditemukan",
    style: "bg-brand-50 text-brand-700 border-brand-200",
    dot: "bg-brand-500",
  },
  IN_PROGRESS: {
    label: "Sedang Diproses",
    style: "bg-blue-50 text-blue-700 border-blue-200",
    dot: "bg-blue-500",
  },
  AWAITING_CONFIRMATION: {
    label: "Menunggu Konfirmasimu",
    style: "bg-purple-50 text-purple-700 border-purple-200",
    dot: "bg-purple-500",
  },
  COMPLETED: {
    label: "Selesai",
    style: "bg-green-50 text-green-700 border-green-200",
    dot: "bg-green-500",
  },
  CANCELLED: {
    label: "Dibatalkan",
    style: "bg-red-50 text-red-600 border-red-200",
    dot: "bg-red-400",
  },
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
          setCoords({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
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
    (sum, o) => sum + (o.actualWeight || o.estimatedWeight || 0),
    0
  );
  const totalEarnings = completedOrders.reduce(
    (sum, o) => sum + (o.totalPrice || o.agreedPrice || 0),
    0
  );

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const firstName = me?.name?.split(" ")[0] || "Kamu";

  if (isMeLoading || isOrdersLoading) {
    return (
      <div className="min-h-screen bg-surface flex flex-col justify-between pb-20 md:pb-0">
        <DesktopNav />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Refresh className="w-10 h-10 text-brand-500 animate-spin" />
            <span className="text-sm font-bold text-ink-muted">Memuat dashboardmu...</span>
          </div>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="pb-20 md:pb-8 bg-surface min-h-screen">
      <DesktopNav />

      {/* MOBILE HEADER */}
      <header className="sticky top-0 z-50 bg-white border-b border-ink-faint px-4 py-3 shadow-sm md:hidden flex justify-between items-center">
        <div>
          <p className="text-[10px] text-ink-muted font-bold uppercase tracking-wider">{greeting},</p>
          <h1 className="font-display font-extrabold text-base text-ink">{firstName} 👋</h1>
        </div>
        <div className="flex items-center gap-2">
          <button className="w-9 h-9 rounded-full bg-surface-raised border border-ink-faint flex items-center justify-center text-ink-muted hover:text-ink transition-colors">
            <Bell size={18} />
          </button>
          <button
            onClick={handleLogout}
            className="w-9 h-9 rounded-full bg-surface-raised border border-ink-faint flex items-center justify-center text-ink-muted hover:text-status-error transition-colors"
          >
            <ArrowRightToBracket size={18} />
          </button>
        </div>
      </header>

      <main className="max-w-6xl w-full mx-auto px-4 md:px-8 py-5 space-y-5">

        {/* ACTIVE ORDER ALERT — paling atas jika ada */}
        {activeOrder && (
          <section>
            <Link
              href={`/orders/${activeOrder.id}`}
              className="block bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 border border-amber-200 flex items-center justify-center shrink-0">
                  <Clock size={20} className="text-amber-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-700 bg-amber-200 rounded px-1.5 py-0.5">
                      Pesanan Aktif
                    </span>
                    <span
                      className={`text-[9px] font-extrabold uppercase tracking-wider border rounded-full px-2 py-0.5 ${
                        STATUS_CONFIG[activeOrder.status]?.style || "bg-surface-raised text-ink-muted border-ink-faint"
                      }`}
                    >
                      {STATUS_CONFIG[activeOrder.status]?.label || activeOrder.status}
                    </span>
                  </div>
                  <p className="text-sm font-bold text-ink truncate">
                    Setor {activeOrder.category?.name || "Sampah"} ·{" "}
                    {activeOrder.estimatedWeight} kg
                  </p>
                  <p className="text-[10px] text-ink-muted">
                    {formatDate(activeOrder.createdAt)} · {activeOrder.method}
                  </p>
                </div>
                <ChevronRight size={18} className="text-amber-500 shrink-0" />
              </div>
              {activeOrder.status === "AWAITING_CONFIRMATION" && (
                <div className="mt-3 pt-3 border-t border-amber-200">
                  <p className="text-xs font-bold text-amber-800 flex items-center gap-2">
                    <Bell size={12} /> Pengepul sudah menimbang — tap untuk konfirmasi harga!
                  </p>
                </div>
              )}
            </Link>
          </section>
        )}

        {/* QUICK ACTION + STATS */}
        <section className="grid grid-cols-3 gap-3">
          {/* Jual Sekarang */}
          <Link
            href="/orders/new"
            className="col-span-1 bg-brand-600 rounded-xl p-4 flex flex-col items-center justify-center gap-2 text-white shadow-md hover:bg-brand-700 transition-colors text-center"
          >
            <Plus size={24} />
            <span className="text-xs font-extrabold leading-tight">Jual<br />Sekarang</span>
          </Link>

          {/* Total Sampah */}
          <div className="col-span-1 bg-white border border-ink-faint rounded-xl p-4 flex flex-col gap-1 shadow-sm">
            <div className="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center">
              <ScaleBalanced size={16} className="text-brand-500" />
            </div>
            <div className="text-xs font-bold text-ink-muted">Total Sampah</div>
            <div className="text-base font-display font-black text-ink font-mono">
              {totalWeight.toFixed(1)} kg
            </div>
          </div>

          {/* Total Pendapatan */}
          <div className="col-span-1 bg-white border border-ink-faint rounded-xl p-4 flex flex-col gap-1 shadow-sm">
            <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
              <Dollar size={16} className="text-status-success" />
            </div>
            <div className="text-xs font-bold text-ink-muted">Pendapatan</div>
            <div className="text-base font-display font-black text-ink font-mono">
              {formatRupiah(totalEarnings)}
            </div>
          </div>
        </section>

        {/* JUAL PER KATEGORI */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-display font-extrabold text-ink uppercase tracking-wider">
              Jual Cepat per Kategori
            </h2>
          </div>
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
            {categories && categories.length > 0 ? (
              categories.map((cat) => {
                const Icon = categoryIcons[cat.name] || Archive;
                return (
                  <Link
                    key={cat.id}
                    href={`/orders/new?category=${cat.id}`}
                    className="flex flex-col items-center gap-2 bg-white border border-ink-faint rounded-xl p-4 min-w-[88px] shadow-sm hover:border-brand-500 hover:shadow-md transition-all group shrink-0"
                  >
                    <div className="w-11 h-11 bg-surface-raised border border-ink-faint rounded-full flex items-center justify-center group-hover:bg-brand-50 group-hover:border-brand-200 transition-colors">
                      <Icon size={22} className="text-ink-muted group-hover:text-brand-500 transition-colors" />
                    </div>
                    <span className="text-[10px] font-bold text-ink-muted group-hover:text-ink text-center">
                      {cat.name}
                    </span>
                  </Link>
                );
              })
            ) : (
              [1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="w-20 h-24 bg-white border border-ink-faint rounded-xl animate-pulse shrink-0" />
              ))
            )}
          </div>
        </section>

        {/* PENGEPUL TERDEKAT */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-display font-extrabold text-ink uppercase tracking-wider">
              Pengepul Terdekat
            </h2>
            <span className="text-xs font-bold text-ink-muted flex items-center gap-1">
              <MapPinAlt size={12} className="text-brand-500" />
              {coords === DEFAULT_COORDS ? "Yogyakarta (default)" : "Lokasimu"}
            </span>
          </div>

          <div className="space-y-2">
            {isNearbyLoading ? (
              [1, 2].map((i) => (
                <div key={i} className="bg-white border border-ink-faint rounded-xl p-4 h-20 animate-pulse" />
              ))
            ) : nearbyCollectors && nearbyCollectors.length > 0 ? (
              nearbyCollectors.slice(0, 3).map((collector) => (
                <div
                  key={collector.id}
                  className="bg-white border border-ink-faint rounded-xl p-4 flex items-center gap-3 shadow-sm hover:border-brand-400 transition-colors"
                >
                  <div className="w-10 h-10 bg-brand-50 rounded-lg flex items-center justify-center shrink-0 border border-brand-100">
                    <Archive size={20} className="text-brand-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-sm text-ink truncate">{collector.shopName}</h3>
                      <span className="text-[9px] font-bold text-status-success bg-green-50 border border-green-200 rounded-full px-1.5 py-0.5 shrink-0">
                        🟢 Buka
                      </span>
                    </div>
                    <p className="text-[10px] text-ink-muted truncate">
                      {collector.description || "Mitra Pengepul Rongsok.in"}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <div className="flex items-center gap-0.5 text-[10px]">
                        <Star size={10} className="text-status-warning fill-status-warning" />
                        <span className="font-bold text-ink">{collector.priorityScore || "4.9"}</span>
                      </div>
                      {collector.distance && (
                        <>
                          <span className="text-ink-faint">·</span>
                          <span className="text-[10px] font-bold text-brand-600">
                            {formatDistance(collector.distance)}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <Link
                    href={`/orders/new`}
                    className="shrink-0 text-xs font-bold text-brand-600 bg-brand-50 border border-brand-200 rounded-lg px-3 py-1.5 hover:bg-brand-100 transition-colors"
                  >
                    Jual
                  </Link>
                </div>
              ))
            ) : (
              <div className="bg-white border border-ink-faint rounded-xl p-6 text-center text-xs text-ink-muted">
                Belum ada pengepul terdaftar di sekitar lokasimu (radius 5km).<br />
                Coba perluas pencarianmu atau tunggu pengepul baru bergabung.
              </div>
            )}
          </div>
        </section>

        {/* RIWAYAT SETORAN */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-display font-extrabold text-ink uppercase tracking-wider">
              Riwayat Setoranku
            </h2>
            {orders && orders.length > 3 && (
              <Link href="/orders" className="text-brand-500 text-xs font-bold flex items-center gap-1">
                Lihat Semua <ArrowRight size={12} />
              </Link>
            )}
          </div>

          <div className="space-y-2">
            {orders && orders.length > 0 ? (
              orders.slice(0, 5).map((order) => {
                const statusConf = STATUS_CONFIG[order.status] || {
                  label: order.status,
                  style: "bg-surface-raised text-ink-muted border-ink-faint",
                  dot: "bg-ink-muted",
                };
                return (
                  <Link
                    key={order.id}
                    href={`/orders/${order.id}`}
                    className="bg-white border border-ink-faint rounded-xl p-4 flex items-center gap-3 shadow-sm hover:border-brand-400 hover:shadow-md transition-all"
                  >
                    <div className="w-9 h-9 bg-surface-raised border border-ink-faint rounded-lg flex items-center justify-center shrink-0">
                      {order.status === "COMPLETED" ? (
                        <CheckCircle size={18} className="text-status-success" />
                      ) : order.status === "CANCELLED" ? (
                        <CloseCircle size={18} className="text-red-500" />
                      ) : (
                        <Clock size={18} className="text-amber-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-sm text-ink truncate">
                        Setor {order.category?.name || "Sampah"}
                      </h3>
                      <p className="text-[10px] text-ink-muted">{formatDate(order.createdAt)}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-sm font-bold text-ink font-mono">
                        {order.actualWeight || order.estimatedWeight} kg
                      </div>
                      <span
                        className={`inline-block text-[9px] font-extrabold px-2 py-0.5 rounded-full border tracking-wide uppercase mt-1 ${statusConf.style}`}
                      >
                        {statusConf.label}
                      </span>
                    </div>
                  </Link>
                );
              })
            ) : (
              <div className="bg-white border border-ink-faint rounded-xl p-8 text-center space-y-3">
                <div className="w-12 h-12 bg-surface-raised rounded-full flex items-center justify-center mx-auto">
                  <Archive size={24} className="text-ink-faint" />
                </div>
                <p className="text-xs text-ink-muted">
                  Belum ada riwayat setoran.
                </p>
                <Link href="/orders/new">
                  <Button className="text-xs px-4 py-2 mx-auto">
                    Jual Sampah Pertamamu →
                  </Button>
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
