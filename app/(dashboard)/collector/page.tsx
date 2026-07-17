"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import DesktopNav from "@/components/ui/DesktopNav";
import BottomNav from "@/components/ui/BottomNav";
import { VerifiedBadge } from "@/components/ui/VerifiedBadge";
import {
  Store,
  Archive,
  Check,
  X,
  Clock,
  ChevronDown,
  ChevronUp,
  Wrench,
  RefreshCw,
  Box,
  Wine,
  Tv,
  Droplets,
  FileText,
  LogOut,
  CreditCard,
  ArrowDownRight,
  Eye,
  ShieldAlert,
  ImageOff,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { CollectorSkeleton } from "@/components/ui/Skeleton";
import { useAuthStore } from "@/store/authStore";
import { useMe } from "@/hooks/useAuth";
import { useSocket } from "@/hooks/useSocket";
import { useOrderStore } from "@/store/orderStore";
import { useOrdersList, useUpdateOrderStatus } from "@/hooks/useOrders";
import {
  useCollectorProfile,
  useUpdateCollectorProfile,
  useUpdateCatalogs,
} from "@/hooks/useCollector";
import { useCategoryTree } from "@/hooks/useDiscovery";
import {
  formatRupiah,
  formatDate,
  unitLabel,
  getOrderTotalEstWeight,
  getOrderTotalActualWeight,
  getOrderTotalPrice,
  getOrderCategoryLabel,
  getOrderItems,
} from "@/lib/utils";
import { Order } from "@/types";
import toast from "react-hot-toast";

const mainIcon = (name: string): any => {
  if (name.includes("Plastik")) return RefreshCw;
  if (name.includes("Kertas") || name.includes("Kardus")) return Box;
  if (name.includes("Logam") || name.includes("Besi")) return Wrench;
  if (name.includes("Kaca") || name.includes("Botol")) return Wine;
  if (name.includes("Elektronik")) return Tv;
  return Droplets;
};

// ── Incoming order card (real-time socket queue) ─────────────────────────
function IncomingOrderCard({
  order,
  onRemove,
  canAccept = true,
}: {
  order: Order;
  onRemove: (id: string) => void;
  canAccept?: boolean;
}) {
  const router = useRouter();
  const [showPhoto, setShowPhoto] = useState(false);
  const updateOrderStatus = useUpdateOrderStatus(order.id);

  // Sisa waktu tawaran DIHITUNG dari order.createdAt — bukan reset ke 15:00 tiap
  // refresh. Expiry 15 menit sejak order dibuat; kalau lewat, tampil 00:00 (tak
  // auto-hapus supaya tak flicker dengan polling PENDING yang re-add order).
  const OFFER_TTL = 900; // detik (15 menit)
  const computeLeft = () =>
    Math.max(0, Math.ceil(OFFER_TTL - (Date.now() - new Date(order.createdAt).getTime()) / 1000));
  const [timeLeft, setTimeLeft] = useState(computeLeft);

  useEffect(() => {
    setTimeLeft(computeLeft());
    const timer = setInterval(() => setTimeLeft(computeLeft()), 1000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order.createdAt]);

  const handleAccept = () => {
    if (!canAccept) {
      toast.error("Verifikasi KTP dulu sebelum menerima pesanan.");
      return;
    }
    updateOrderStatus.mutate(
      { action: "accept" },
      {
        onSuccess: () => {
          toast.success("Pesanan diterima! Mengarahkan ke pelacakan…");
          onRemove(order.id);
          router.push(`/orders/${order.id}`);
        },
        onError: (err: any) => {
          toast.error(err.response?.data?.message || "Gagal menerima pesanan.");
        },
      }
    );
  };

  const handleReject = () => {
    updateOrderStatus.mutate(
      { action: "reject" as any },
      {
        onSuccess: () => {
          toast.success("Pesanan ditolak.");
          onRemove(order.id);
        },
        onError: () => {
          toast.success("Pesanan ditolak.");
          onRemove(order.id);
        },
      }
    );
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeString = `${minutes.toString().padStart(2, "0")}:${seconds
    .toString()
    .padStart(2, "0")}`;

  return (
    <div className="bg-surface rounded-2xl p-4">
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-surface-raised text-ink rounded-2xl flex items-center justify-center shrink-0">
            <Archive size={20} />
          </div>
          <div>
            <h4 className="font-bold text-sm text-ink flex items-center gap-2">
              <span className="bg-brand-500 text-ink text-[9px] px-1.5 py-0.5 rounded-full uppercase font-extrabold">
                New
              </span>
              {getOrderCategoryLabel(order)}
            </h4>
            <p className="text-[10px] text-ink-muted font-medium mt-0.5 font-mono">
              est. {getOrderTotalEstWeight(order).toFixed(1)} kg • {order.method}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 bg-surface-raised px-2 py-1 rounded-full">
          <Clock size={12} className={timeLeft < 60 ? "text-status-error" : "text-ink-muted"} />
          <span
            className={`text-xs font-mono font-bold ${
              timeLeft < 60 ? "text-status-error" : "text-ink"
            }`}
          >
            {timeString}
          </span>
        </div>
      </div>

      {/* Foto live tumpukan rongsok — bukti anti pesanan fiktif */}
      {order.photoUrl ? (
        <button
          type="button"
          onClick={() => setShowPhoto(true)}
          className="relative w-full h-32 rounded-2xl overflow-hidden mb-3 block"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={order.photoUrl} alt="Foto rongsok" className="w-full h-full object-cover" />
          <span className="absolute top-2 left-2 bg-brand-500 text-ink text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wide">
            Foto Live
          </span>
          <span className="absolute bottom-2 right-2 bg-ink/70 text-white text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1">
            <Eye size={11} /> Perbesar
          </span>
        </button>
      ) : (
        <div className="w-full rounded-2xl mb-3 bg-status-error/10 border border-status-error/30 px-3 py-2 flex items-center gap-2">
          <ImageOff size={14} className="text-status-error shrink-0" />
          <span className="text-[11px] font-bold text-status-error">
            Tanpa foto live — waspadai pesanan fiktif.
          </span>
        </div>
      )}

      {order.photoUrl && (
        <p className="text-[10px] text-ink-muted flex items-start gap-1.5 mb-2.5">
          <ShieldAlert size={12} className="shrink-0 mt-0.5 text-status-warning" />
          Periksa foto. Tolak bila tampak palsu / tidak sesuai.
        </p>
      )}

      <div className="flex gap-2 pt-1">
        <Button
          variant="outline"
          onClick={handleReject}
          className="flex-1 py-2 text-xs"
          disabled={updateOrderStatus.isPending}
        >
          <X size={14} /> Tolak
        </Button>
        <Button
          onClick={handleAccept}
          className="flex-1 py-2 text-xs"
          disabled={updateOrderStatus.isPending || !canAccept}
        >
          <Check size={14} /> Terima
        </Button>
      </div>

      {/* Lightbox foto */}
      {showPhoto && order.photoUrl && (
        <div
          className="fixed inset-0 z-[100] bg-ink/90 flex items-center justify-center p-4"
          onClick={() => setShowPhoto(false)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={order.photoUrl}
            alt="Foto rongsok"
            className="max-w-full max-h-[82vh] rounded-2xl object-contain"
          />
          <button
            type="button"
            onClick={() => setShowPhoto(false)}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-surface-raised text-ink flex items-center justify-center"
            aria-label="Tutup"
          >
            <X size={20} />
          </button>
        </div>
      )}
    </div>
  );
}

// ── Request table row (own hook — fixes Rules of Hooks) ──────────────────
function RequestRow({
  order,
  index,
  onAccepted,
  canAccept = true,
}: {
  order: Order;
  index: number;
  onAccepted: (id: string) => void;
  canAccept?: boolean;
}) {
  const router = useRouter();
  const [showPhoto, setShowPhoto] = useState(false);
  const updateOrderStatus = useUpdateOrderStatus(order.id);
  const distance = `${((index + 1) * 0.8).toFixed(1)} km`;

  const handleAccept = () => {
    if (!canAccept) {
      toast.error("Verifikasi KTP dulu sebelum menerima pesanan.");
      return;
    }
    updateOrderStatus.mutate(
      { action: "accept" },
      {
        onSuccess: () => {
          toast.success("Pesanan diterima! Mengarahkan ke pelacakan…");
          onAccepted(order.id);
          router.push(`/orders/${order.id}`);
        },
        onError: (err: any) => {
          toast.error(err.response?.data?.message || "Gagal menerima pesanan.");
        },
      }
    );
  };

  const items = getOrderItems(order);

  return (
    <tr className="hover:bg-surface transition-colors">
      <td className="p-3 font-bold text-ink">
        <div className="flex items-center gap-2">
          {order.photoUrl ? (
            <button
              type="button"
              onClick={() => setShowPhoto(true)}
              className="relative w-10 h-10 rounded-lg overflow-hidden shrink-0 border border-ink-faint"
              aria-label="Lihat foto rongsok"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={order.photoUrl} alt="Foto" className="w-full h-full object-cover" />
              <span className="absolute inset-0 bg-ink/0 hover:bg-ink/20 flex items-center justify-center transition-colors">
                <Eye size={12} className="text-white opacity-0 hover:opacity-100" />
              </span>
            </button>
          ) : (
            <span
              className="w-10 h-10 rounded-lg shrink-0 bg-status-error/10 border border-status-error/30 flex items-center justify-center"
              title="Tanpa foto live"
            >
              <ImageOff size={14} className="text-status-error" />
            </span>
          )}
          <span>Customer Terdekat</span>
        </div>
        {showPhoto && order.photoUrl && (
          <div
            className="fixed inset-0 z-[100] bg-ink/90 flex items-center justify-center p-4"
            onClick={() => setShowPhoto(false)}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={order.photoUrl}
              alt="Foto rongsok"
              className="max-w-full max-h-[82vh] rounded-2xl object-contain"
            />
            <button
              type="button"
              onClick={() => setShowPhoto(false)}
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-surface-raised text-ink flex items-center justify-center"
              aria-label="Tutup"
            >
              <X size={20} />
            </button>
          </div>
        )}
      </td>
      <td className="p-3">
        <div className="flex flex-wrap gap-1 max-w-[160px]">
          {items.length > 0 ? (
            items.map((it) => (
              <span
                key={it.id || it.categoryId}
                className="bg-brand-100 text-brand-800 px-2 py-0.5 rounded-full font-bold uppercase tracking-wide text-[9px] font-mono"
              >
                {it.category?.name || it.categoryId.slice(0, 6)}
              </span>
            ))
          ) : (
            <span className="text-mute text-[10px]">—</span>
          )}
        </div>
      </td>
      <td className="p-3 font-extrabold font-mono text-ink">
        {getOrderTotalEstWeight(order).toFixed(1)} kg
      </td>
      <td className="p-3 text-ink-muted font-mono font-medium">{distance}</td>
      <td className="p-3">
        <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider bg-surface text-ink-muted">
          {order.method}
        </span>
      </td>
      <td className="p-3 text-right">
        <button
          onClick={handleAccept}
          disabled={updateOrderStatus.isPending || !canAccept}
          className="bg-brand-500 hover:bg-brand-600 text-ink font-bold text-[10px] px-3.5 py-2 rounded-2xl transition-all inline-flex items-center gap-1 cursor-pointer disabled:opacity-50"
        >
          <Check size={10} /> Ambil
        </button>
      </td>
    </tr>
  );
}

export default function CollectorDashboard() {
  const router = useRouter();
  const logout = useAuthStore((state) => state.logout);
  const initFromStorage = useAuthStore((state) => state.initFromStorage);

  useEffect(() => {
    initFromStorage();
  }, [initFromStorage]);

  useSocket();

  const incomingOrders = useOrderStore((state) => state.incomingOrders);
  const removeIncomingOrder = useOrderStore((state) => state.removeIncomingOrder);
  const addIncomingOrder = useOrderStore((state) => state.addIncomingOrder);

  // Antrean KADALUWARSA: tawaran order PENDING hanya berlaku 15 menit sejak dibuat.
  // Difilter saat render (bukan dihapus dari store) supaya polling PENDING yang
  // me-re-add order lama tidak bikin kartu muncul-hilang (flicker).
  const OFFER_TTL_MS = 15 * 60 * 1000;
  const [nowTick, setNowTick] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNowTick(Date.now()), 5000);
    return () => clearInterval(t);
  }, []);
  const liveIncoming = incomingOrders.filter(
    (o) => nowTick - new Date(o.createdAt).getTime() < OFFER_TTL_MS
  );

  const { data: me } = useMe();
  const needsVerify = me?.isVerified === false; // hanya gate kalau eksplisit false

  const { data: profile, isLoading: isProfileLoading } = useCollectorProfile();
  const { mains } = useCategoryTree();
  const { data: orders, isLoading: isOrdersLoading } = useOrdersList({
    role: "collector",
    limit: 100,
  });

  // Antrean TIDAK boleh cuma mengandalkan socket: kalau halaman di-refresh (atau
  // order masuk sebelum dashboard dibuka), event socket sudah lewat & store kosong.
  // Tarik ulang order PENDING yang di-broadcast ke pengepul ini lewat REST — ini
  // juga sumber createdAt ASLI (payload socket cuma punya waktu event tiba),
  // supaya countdown 15 menit akurat & tidak mulai ulang tiap refresh.
  const { data: pendingBroadcast } = useOrdersList(
    { role: "collector", status: "PENDING", limit: 100 },
    { refetchInterval: 8000 }
  );
  useEffect(() => {
    pendingBroadcast?.forEach((o) => addIncomingOrder(o));
  }, [pendingBroadcast, addIncomingOrder]);

  const updateProfile = useUpdateCollectorProfile();
  const updateCatalogs = useUpdateCatalogs();

  const [isCatalogExpanded, setIsCatalogExpanded] = useState(false);
  const [editedCatalogs, setEditedCatalogs] = useState<
    Record<string, { minPrice: number; maxPrice: number; isActive: boolean }>
  >({});

  // Init harga per kategori
  useEffect(() => {
    if (mains.length > 0) {
      const initial: typeof editedCatalogs = {};
      mains.forEach((cat) => {
        const existing = profile?.catalogs?.find((c) => c.categoryId === cat.id);
        initial[cat.id] = {
          minPrice: existing?.minPrice ?? 1000,
          maxPrice: existing?.maxPrice ?? 2000,
          isActive: existing?.isActive ?? false,
        };
      });
      setEditedCatalogs(initial);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile, mains.length]);

  const today = new Date().toDateString();
  const completedToday =
    orders?.filter(
      (o) => o.status === "COMPLETED" && new Date(o.updatedAt).toDateString() === today
    ) || [];

  const todayTrxCount = completedToday.length;
  const todayWeight = completedToday.reduce((sum, o) => sum + getOrderTotalActualWeight(o), 0);
  const todayPayout = completedToday.reduce((sum, o) => sum + getOrderTotalPrice(o), 0);

  const completedOrdersList = orders?.filter((o) => o.status === "COMPLETED") || [];
  const recentTransactions = completedOrdersList.map((o) => ({
    id: `TRX-${o.id.slice(-4).toUpperCase()}`,
    date: formatDate(o.updatedAt),
    label: `${getOrderCategoryLabel(o)} #${o.id.slice(-5).toUpperCase()}`,
    amount: getOrderTotalPrice(o),
  }));

  const handleToggleOpen = () => {
    if (needsVerify) {
      toast.error("Verifikasi KTP dulu sebelum membuka lapak.");
      return;
    }
    const newStatus = !profile?.isOpen;
    updateProfile.mutate(
      {
        isOpen: newStatus,
        shopName: profile?.shopName || "Lapak Pengepul",
        description: profile?.description || "",
        radiusKm: profile?.radiusKm || 5,
      },
      {
        onSuccess: () => toast.success(`Lapak berhasil ${newStatus ? "DIBUKA" : "DITUTUP"}!`),
        onError: () => toast.error("Gagal memperbarui status operasional lapak."),
      }
    );
  };

  const handleValChange = (catId: string, field: "minPrice" | "maxPrice", val: number) => {
    setEditedCatalogs((prev) => ({ ...prev, [catId]: { ...prev[catId], [field]: val } }));
  };

  const handleToggleCatalogActive = (catId: string) => {
    setEditedCatalogs((prev) => ({
      ...prev,
      [catId]: { ...prev[catId], isActive: !prev[catId]?.isActive },
    }));
  };

  const handleSaveCatalogs = () => {
    const payload = Object.entries(editedCatalogs).map(([categoryId, data]) => ({
      categoryId,
      minPrice: Number(data.minPrice),
      maxPrice: Number(data.maxPrice),
      isActive: data.isActive,
    }));

    updateCatalogs.mutate(payload, {
      onSuccess: () => toast.success("Katalog harga berhasil diperbarui!"),
      onError: (err: any) =>
        toast.error(err.response?.data?.message || "Gagal memperbarui katalog."),
    });
  };

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const isPageLoading = isProfileLoading || isOrdersLoading;

  if (isPageLoading) {
    return <CollectorSkeleton />;
  }

  return (
    <div className="min-h-screen bg-surface pb-24 md:pb-8 flex flex-col">
      <DesktopNav />

      {/* MOBILE HEADER */}
      <header className="sticky top-0 z-40 bg-surface-raised border-b border-ink-faint px-4 py-4 flex items-center justify-between md:hidden">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-brand-500 rounded-2xl flex items-center justify-center text-ink">
            <Store size={18} />
          </div>
          <h1 className="font-display font-extrabold text-lg tracking-tight text-ink">
            Dasbor Lapak
          </h1>
        </div>
        <button
          onClick={handleLogout}
          className="p-2 text-ink-muted hover:text-status-error transition-colors rounded-full hover:bg-surface cursor-pointer"
        >
          <LogOut size={20} />
        </button>
      </header>

      <main className="flex-1 px-4 md:px-8 py-5 md:py-8 max-w-6xl w-full mx-auto space-y-6">
        {/* BANNER VERIFIKASI — pengepul belum KYC tidak bisa buka lapak/terima order */}
        {needsVerify && (
          <section className="bg-status-warning/15 border border-status-warning/40 rounded-2xl p-4 flex items-start gap-3">
            <ShieldAlert size={20} className="text-ink shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-sm text-ink">Akun belum terverifikasi</h3>
              <p className="text-xs text-ink-muted mt-0.5">
                Verifikasi KTP dulu untuk bisa membuka lapak & menerima pesanan.
              </p>
            </div>
            <Link
              href="/profile/verify"
              className="shrink-0 bg-ink text-white text-xs font-bold rounded-full px-4 py-2 hover:opacity-90 transition-opacity"
            >
              Verifikasi
            </Link>
          </section>
        )}

        {/* STATUS TOGGLE */}
        <section className="bg-surface-raised rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-xs font-bold text-mute uppercase tracking-widest">
                  Status Lapak
                </h2>
                {me?.isVerified && <VerifiedBadge size="xs" />}
              </div>
              <div className="flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  {profile?.isOpen && (
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-500 opacity-75"></span>
                  )}
                  <span
                    className={`relative inline-flex rounded-full h-3 w-3 ${
                      profile?.isOpen ? "bg-brand-500" : "bg-ink-faint"
                    }`}
                  ></span>
                </span>
                <span className="font-display font-extrabold text-2xl text-ink">
                  {profile?.isOpen ? "BUKA" : "TUTUP"}
                </span>
              </div>
            </div>
            <button
              onClick={handleToggleOpen}
              disabled={needsVerify}
              className={`w-16 h-8 rounded-full p-1 cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                profile?.isOpen ? "bg-brand-500" : "bg-surface-sunken"
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full bg-surface-raised transform transition-transform ${
                  profile?.isOpen ? "translate-x-8" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </section>

        {/* REQUESTS + INCOMING QUEUE */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* REQUEST TABLE */}
          <section className="lg:col-span-2 bg-surface-raised rounded-2xl p-6 space-y-4">
            <div className="flex justify-between items-center gap-3 flex-wrap">
              <h3 className="font-display font-extrabold text-base text-ink tracking-tight flex items-center gap-2">
                <FileText className="text-brand-700" size={18} />
                Request Jemput Terdekat
              </h3>
              {liveIncoming.length > 0 && (
                <span className="bg-brand-100 text-brand-800 text-[9px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full">
                  {liveIncoming.length} Aktif
                </span>
              )}
            </div>

            <div className="overflow-x-auto border border-ink-faint rounded-2xl">
              <table className="w-full text-left border-collapse text-xs md:text-sm">
                <thead>
                  <tr className="bg-surface border-b border-ink-faint text-mute font-bold text-[10px] uppercase tracking-wider font-mono">
                    <th className="p-3">Nama &amp; Area</th>
                    <th className="p-3">Kategori</th>
                    <th className="p-3">Berat Est.</th>
                    <th className="p-3">Jarak</th>
                    <th className="p-3">Metode</th>
                    <th className="p-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-faint">
                  {liveIncoming.length > 0 ? (
                    liveIncoming.map((order, idx) => (
                      <RequestRow
                        key={order.id}
                        order={order}
                        index={idx}
                        onAccepted={removeIncomingOrder}
                        canAccept={!needsVerify}
                      />
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="p-10 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-12 h-12 bg-surface rounded-full flex items-center justify-center text-ink-muted">
                            <Archive size={20} />
                          </div>
                          <p className="font-bold text-ink text-sm">Belum ada request</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* INCOMING QUEUE */}
          <section className="bg-surface-raised rounded-2xl p-6 space-y-4">
            <h3 className="font-display font-extrabold text-base text-ink tracking-tight flex items-center gap-2">
              <Store className="text-brand-700" size={18} />
              Antrean Masuk
              {liveIncoming.length > 0 && (
                <span className="bg-brand-500 text-ink text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full">
                  {liveIncoming.length}
                </span>
              )}
            </h3>

            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {liveIncoming.length > 0 ? (
                liveIncoming.map((order) => (
                  <IncomingOrderCard
                    key={order.id}
                    order={order}
                    onRemove={removeIncomingOrder}
                    canAccept={!needsVerify}
                  />
                ))
              ) : (
                <div className="bg-surface rounded-2xl p-8 flex flex-col items-center text-center">
                  <Clock size={28} className="text-ink-faint mb-2" />
                  <span className="text-xs font-bold text-ink">Antrean Kosong</span>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* PAYMENT INFO + HISTORY + STATS */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* COD INFO (dark polarity card) */}
          <div className="bg-ink rounded-2xl p-5 text-forest-ink flex flex-col justify-between gap-4">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold text-forest-muted uppercase tracking-widest font-mono">
                Metode Pembayaran
              </span>
              <CreditCard className="text-brand-500" size={16} />
            </div>
            <div>
              <span className="bg-brand-500/15 text-brand-500 rounded-full px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-wider inline-flex items-center gap-1">
                🤝 Manual (COD)
              </span>
              <p className="text-[11px] text-forest-muted leading-relaxed mt-3">
                Pembayaran tunai / transfer langsung ke penjual setelah timbangan disepakati.
              </p>
            </div>
          </div>

          {/* PURCHASE HISTORY */}
          <div className="bg-surface-raised rounded-2xl p-5 space-y-3 flex flex-col">
            <h4 className="font-display font-extrabold text-xs text-mute uppercase tracking-widest">
              Riwayat Pembelian Rosok
            </h4>
            <div className="space-y-2.5 flex-1 mt-1 overflow-y-auto max-h-48 pr-1">
              {recentTransactions.length > 0 ? (
                recentTransactions.map((trx) => (
                  <div
                    key={trx.id}
                    className="flex justify-between items-center text-xs pb-2 border-b border-dashed border-ink-faint last:border-none"
                  >
                    <div>
                      <span className="font-bold text-ink block leading-tight">{trx.label}</span>
                      <span className="text-[10px] text-mute mt-0.5 block">
                        {trx.date} • {trx.id}
                      </span>
                    </div>
                    <span className="font-bold font-mono text-status-error">
                      -{formatRupiah(trx.amount)}
                    </span>
                  </div>
                ))
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center py-8 text-xs text-ink-muted">
                  <FileText size={24} className="text-ink-faint mb-2" />
                  Belum ada transaksi pembelian selesai.
                </div>
              )}
            </div>
          </div>

          {/* TODAY STATS */}
          <div className="bg-surface-raised rounded-2xl p-5 space-y-4">
            <h4 className="font-display font-extrabold text-xs text-mute uppercase tracking-widest">
              Statistik Hari Ini
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-surface p-3 rounded-2xl">
                <span className="block text-[9px] font-bold text-mute uppercase tracking-widest mb-1">
                  Transaksi
                </span>
                <span className="font-extrabold text-lg text-ink font-mono">
                  {todayTrxCount} <span className="text-xs font-semibold text-mute">trx</span>
                </span>
              </div>
              <div className="bg-surface p-3 rounded-2xl">
                <span className="block text-[9px] font-bold text-mute uppercase tracking-widest mb-1">
                  Total Berat
                </span>
                <span className="font-extrabold text-lg text-ink font-mono">
                  {todayWeight.toFixed(1)} <span className="text-xs font-semibold text-mute">kg</span>
                </span>
              </div>
              <div className="bg-surface p-3 rounded-2xl col-span-2 flex justify-between items-center">
                <div>
                  <span className="block text-[9px] font-bold text-mute uppercase tracking-widest">
                    Total Pengeluaran
                  </span>
                  <span className="font-extrabold text-lg text-ink font-mono mt-1 block">
                    {formatRupiah(todayPayout)}
                  </span>
                </div>
                <div className="w-8 h-8 rounded-2xl bg-brand-100 text-brand-800 flex items-center justify-center shrink-0">
                  <ArrowDownRight size={16} />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CATALOG MANAGER (COLLAPSIBLE) */}
        <section className="bg-surface-raised rounded-2xl overflow-hidden">
          <button
            onClick={() => setIsCatalogExpanded(!isCatalogExpanded)}
            className="w-full p-5 flex items-center justify-between cursor-pointer hover:bg-surface transition-colors text-left"
          >
            <h3 className="font-display font-extrabold text-lg text-ink tracking-tight">
              Manajemen Katalog
            </h3>
            <div className="w-8 h-8 bg-surface text-ink rounded-full flex items-center justify-center shrink-0">
              {isCatalogExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>
          </button>

          {isCatalogExpanded && (
            <div className="border-t border-ink-faint p-5">
              <p className="text-xs text-ink-muted mb-4">
                Aktifkan kategori yang kamu terima & atur rentang harganya.
              </p>

              <div className="space-y-2.5">
                {mains.map((cat) => {
                  const Icon = mainIcon(cat.name);
                  const data =
                    editedCatalogs[cat.id] || { minPrice: 1000, maxPrice: 2000, isActive: false };
                  const unit = unitLabel(cat.unit);
                  return (
                    <div
                      key={cat.id}
                      className={`p-4 rounded-2xl transition-colors ${
                        data.isActive ? "bg-brand-100" : "bg-surface"
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div
                          className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                            data.isActive ? "bg-brand-500 text-ink" : "bg-surface-raised text-ink-muted"
                          }`}
                        >
                          <Icon size={20} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="font-bold text-sm text-ink block">{cat.name}</span>
                          {cat.description && (
                            <span className="text-[10px] text-ink-muted leading-snug block">
                              {cat.description}
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => handleToggleCatalogActive(cat.id)}
                          className={`w-10 h-6 rounded-full p-1 cursor-pointer transition-colors shrink-0 ${
                            data.isActive ? "bg-brand-500" : "bg-surface-sunken"
                          }`}
                        >
                          <div
                            className={`w-4 h-4 rounded-full bg-surface-raised transform transition-transform ${
                              data.isActive ? "translate-x-4" : "translate-x-0"
                            }`}
                          />
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[9px] font-bold text-mute uppercase tracking-widest mb-1 block">
                            Min (Rp/{unit})
                          </label>
                          <input
                            type="number"
                            value={data.minPrice}
                            onChange={(e) =>
                              handleValChange(cat.id, "minPrice", Number(e.target.value))
                            }
                            disabled={!data.isActive}
                            className="w-full bg-surface-raised border border-ink rounded-md p-2 text-sm font-mono font-bold focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-50"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] font-bold text-mute uppercase tracking-widest mb-1 block">
                            Max (Rp/{unit})
                          </label>
                          <input
                            type="number"
                            value={data.maxPrice}
                            onChange={(e) =>
                              handleValChange(cat.id, "maxPrice", Number(e.target.value))
                            }
                            disabled={!data.isActive}
                            className="w-full bg-surface-raised border border-ink rounded-md p-2 text-sm font-mono font-bold focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-50"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 flex justify-end sticky bottom-2">
                <Button onClick={handleSaveCatalogs} disabled={updateCatalogs.isPending}>
                  {updateCatalogs.isPending ? "Menyimpan…" : "Simpan Perubahan"}
                </Button>
              </div>
            </div>
          )}
        </section>
      </main>

      <BottomNav />
    </div>
  );
}
