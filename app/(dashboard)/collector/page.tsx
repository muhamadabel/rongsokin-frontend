"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import DesktopNav from "@/components/ui/DesktopNav";
import BottomNav from "@/components/ui/BottomNav";
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
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { CollectorSkeleton } from "@/components/ui/Skeleton";
import { useAuthStore } from "@/store/authStore";
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
}: {
  order: Order;
  onRemove: (id: string) => void;
}) {
  const router = useRouter();
  const [timeLeft, setTimeLeft] = useState(900);
  const updateOrderStatus = useUpdateOrderStatus(order.id);

  useEffect(() => {
    if (timeLeft <= 0) {
      onRemove(order.id);
      return;
    }
    const timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, order.id, onRemove]);

  const handleAccept = () => {
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
          disabled={updateOrderStatus.isPending}
        >
          <Check size={14} /> Terima
        </Button>
      </div>
    </div>
  );
}

// ── Request table row (own hook — fixes Rules of Hooks) ──────────────────
function RequestRow({
  order,
  index,
  onAccepted,
}: {
  order: Order;
  index: number;
  onAccepted: (id: string) => void;
}) {
  const router = useRouter();
  const updateOrderStatus = useUpdateOrderStatus(order.id);
  const distance = `${((index + 1) * 0.8).toFixed(1)} km`;

  const handleAccept = () => {
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
      <td className="p-3 font-bold text-ink">Customer Terdekat</td>
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
          disabled={updateOrderStatus.isPending}
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

  const { data: profile, isLoading: isProfileLoading } = useCollectorProfile();
  const { mains, childrenOf, leaves } = useCategoryTree();
  const { data: orders, isLoading: isOrdersLoading } = useOrdersList({
    role: "collector",
    limit: 100,
  });

  const updateProfile = useUpdateCollectorProfile();
  const updateCatalogs = useUpdateCatalogs();

  const [isCatalogExpanded, setIsCatalogExpanded] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [editedCatalogs, setEditedCatalogs] = useState<
    Record<string, { minPrice: number; maxPrice: number; isActive: boolean }>
  >({});

  // Init harga per ITEM (leaf)
  useEffect(() => {
    if (leaves.length > 0) {
      const initial: typeof editedCatalogs = {};
      leaves.forEach((cat) => {
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
  }, [profile, leaves.length]);

  const leavesOfMain = (mainId: string): typeof leaves => {
    const ch = childrenOf[mainId];
    return ch && ch.length > 0 ? ch : leaves.filter((l) => l.id === mainId);
  };

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
        {/* STATUS TOGGLE */}
        <section className="bg-surface-raised rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xs font-bold text-mute uppercase tracking-widest mb-1">
                Status Lapak
              </h2>
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
              className={`w-16 h-8 rounded-full p-1 cursor-pointer transition-colors ${
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
              {incomingOrders.length > 0 && (
                <span className="bg-brand-100 text-brand-800 text-[9px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full">
                  {incomingOrders.length} Aktif
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
                  {incomingOrders.length > 0 ? (
                    incomingOrders.map((order, idx) => (
                      <RequestRow
                        key={order.id}
                        order={order}
                        index={idx}
                        onAccepted={removeIncomingOrder}
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
              {incomingOrders.length > 0 && (
                <span className="bg-brand-500 text-ink text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full">
                  {incomingOrders.length}
                </span>
              )}
            </h3>

            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {incomingOrders.length > 0 ? (
                incomingOrders.map((order) => (
                  <IncomingOrderCard
                    key={order.id}
                    order={order}
                    onRemove={removeIncomingOrder}
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
                Aktifkan item yang kamu terima & atur rentang harganya. Dikelompokkan per
                kategori utama.
              </p>

              <div className="space-y-3">
                {mains.map((main) => {
                  const Icon = mainIcon(main.name);
                  const groupLeaves = leavesOfMain(main.id);
                  const activeCount = groupLeaves.filter(
                    (l) => editedCatalogs[l.id]?.isActive
                  ).length;
                  const isOpen = expandedGroups[main.id] ?? false;

                  return (
                    <div key={main.id} className="rounded-2xl border border-ink-faint overflow-hidden">
                      <button
                        onClick={() =>
                          setExpandedGroups((p) => ({ ...p, [main.id]: !isOpen }))
                        }
                        className="w-full p-3 flex items-center gap-3 text-left hover:bg-surface transition-colors"
                      >
                        <div
                          className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 ${
                            activeCount > 0 ? "bg-brand-500 text-ink" : "bg-surface text-ink-muted"
                          }`}
                        >
                          <Icon size={18} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="font-bold text-sm text-ink block">{main.name}</span>
                          <span className="text-[11px] text-mute">
                            {activeCount > 0
                              ? `${activeCount} item aktif`
                              : `${groupLeaves.length} item`}
                          </span>
                        </div>
                        <ChevronDown
                          size={18}
                          className={`text-ink-muted transition-transform ${isOpen ? "rotate-180" : ""}`}
                        />
                      </button>

                      {isOpen && (
                        <div className="px-3 pb-3 space-y-2 bg-surface/40">
                          {groupLeaves.map((leaf) => {
                            const data =
                              editedCatalogs[leaf.id] || {
                                minPrice: 1000,
                                maxPrice: 2000,
                                isActive: false,
                              };
                            const unit = unitLabel(leaf.unit);
                            return (
                              <div
                                key={leaf.id}
                                className={`p-3 rounded-2xl transition-colors ${
                                  data.isActive ? "bg-brand-100" : "bg-surface-raised"
                                }`}
                              >
                                <div className="flex items-center justify-between gap-2 mb-2">
                                  <span className="font-bold text-sm text-ink">{leaf.name}</span>
                                  <button
                                    onClick={() => handleToggleCatalogActive(leaf.id)}
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
                                        handleValChange(leaf.id, "minPrice", Number(e.target.value))
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
                                        handleValChange(leaf.id, "maxPrice", Number(e.target.value))
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
                      )}
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
