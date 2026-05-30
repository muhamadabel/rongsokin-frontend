"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import DesktopNav from "@/components/ui/DesktopNav";
import BottomNav from "@/components/ui/BottomNav";
import { 
  Store, Archive, MapPinAlt, Check, Close, Clock, ChevronDown, ChevronUp, 
  Tools, Refresh, FileLines, DesktopPc, Star, ArrowRightToBracket
} from "flowbite-react-icons/outline";
import { 
  Wallet, CreditCard, ArrowUpRight, Map, Navigation, User, MapPin, 
  AlertCircle, CheckCircle2, ChevronRight, MessageSquare, Plus, FileText
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuthStore } from "@/store/authStore";
import { useSocket } from "@/hooks/useSocket";
import { useOrderStore } from "@/store/orderStore";
import { useOrdersList, useUpdateOrderStatus } from "@/hooks/useOrders";
import { useCollectorProfile, useUpdateCollectorProfile, useUpdateCatalogs } from "@/hooks/useCollector";
import { useWasteCategories } from "@/hooks/useDiscovery";
import { formatRupiah, formatDate } from "@/lib/utils";
import toast from "react-hot-toast";

const categoryIcons: Record<string, any> = {
  Kardus: Archive,
  Plastik: Refresh,
  Logam: Tools,
  Kertas: FileLines,
  Elektronik: DesktopPc,
};

function IncomingOrderCard({ order, onRemove }: { order: any; onRemove: (id: string) => void }) {
  const router = useRouter();
  const [timeLeft, setTimeLeft] = useState(order.expires_in || order.initialTime || 900);
  const updateOrderStatus = useUpdateOrderStatus(order.id);

  useEffect(() => {
    if (timeLeft <= 0) {
      onRemove(order.id);
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft((prev: number) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft, order.id, onRemove]);

  const handleAccept = () => {
    // If it's a simulated order
    if (order.id.startsWith("MOCK-")) {
      const loadToast = toast.loading("Menerima pesanan...");
      setTimeout(() => {
        toast.dismiss(loadToast);
        toast.success("Pesanan diterima! (Mode Simulasi)");
        onRemove(order.id);
      }, 1000);
      return;
    }

    updateOrderStatus.mutate(
      { action: "accept" },
      {
        onSuccess: () => {
          toast.success("Pesanan diterima! Mengarahkan ke pelacakan...");
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
    if (order.id.startsWith("MOCK-")) {
      toast.success("Pesanan ditolak.");
      onRemove(order.id);
      return;
    }

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
  const timeString = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;

  return (
    <div className="bg-white border border-brand-200 rounded-xl p-4 shadow-sm animate-in fade-in zoom-in-95">
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-brand-50 text-brand-500 rounded-lg flex items-center justify-center shrink-0 border border-brand-100">
            <Archive size={20} />
          </div>
          <div>
            <h4 className="font-bold text-sm text-ink flex items-center gap-2">
              <span className="bg-status-error text-white text-[9px] px-1.5 py-0.5 rounded uppercase font-black animate-pulse">New</span>
              {order.categoryId || order.category?.name || "Rongsokan"}
            </h4>
            <p className="text-[10px] text-ink-muted font-medium mt-0.5">
              est. {order.estimatedWeight} kg • {order.method}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 bg-brand-50 text-brand-600 px-2 py-1 rounded-md">
          <Clock size={12} className={timeLeft < 60 ? "text-status-error animate-pulse" : ""} />
          <span className={`text-xs font-mono font-bold ${timeLeft < 60 ? "text-status-error" : ""}`}>{timeString}</span>
        </div>
      </div>
      
      <div className="flex gap-2 pt-2">
        <Button 
          variant="outline" 
          onClick={handleReject} 
          className="flex-1 border-status-error text-status-error hover:bg-status-error/10 h-9 text-xs"
          disabled={updateOrderStatus.isPending}
        >
          <Close size={14} className="mr-1" /> Tolak
        </Button>
        <Button 
          onClick={handleAccept} 
          className="flex-1 bg-status-success hover:bg-green-600 border-transparent text-white h-9 text-xs"
          disabled={updateOrderStatus.isPending}
        >
          <Check size={14} className="mr-1" /> Terima
        </Button>
      </div>
    </div>
  );
}

export default function CollectorDashboard() {
  const router = useRouter();
  const logout = useAuthStore((state) => state.logout);
  const initFromStorage = useAuthStore((state) => state.initFromStorage);
  
  useEffect(() => {
    initFromStorage();
  }, [initFromStorage]);

  // Connect socket.io
  useSocket();

  const incomingOrders = useOrderStore((state) => state.incomingOrders);
  const removeIncomingOrder = useOrderStore((state) => state.removeIncomingOrder);

  const { data: profile, isLoading: isProfileLoading } = useCollectorProfile();
  const { data: categories } = useWasteCategories();
  const { data: orders, isLoading: isOrdersLoading } = useOrdersList({ role: "collector", limit: 100 });

  const updateProfile = useUpdateCollectorProfile();
  const updateCatalogs = useUpdateCatalogs();

  const [isCatalogExpanded, setIsCatalogExpanded] = useState(false);
  const [editedCatalogs, setEditedCatalogs] = useState<
    Record<string, { minPrice: number; maxPrice: number; isActive: boolean }>
  >({});

  // (E-Wallet states removed as payments are fully manual/COD)

  // ─── PREMIUM INTERACTIVE MAP STATES ──────────────────────────────────
  const [selectedMapOrder, setSelectedMapOrder] = useState<any | null>(null);
  const [hiddenPins, setHiddenPins] = useState<string[]>([]);
  
  // Static mockup pins representing nearby requests (Removed for pure production data mode)
  const mockMapPins: any[] = [];

  // Sync profile catalogs with state
  useEffect(() => {
    if (profile?.catalogs && categories) {
      const initial: typeof editedCatalogs = {};
      categories.forEach((cat) => {
        const existing = profile.catalogs?.find((c) => c.categoryId === cat.id);
        initial[cat.id] = {
          minPrice: existing?.minPrice ?? 1000,
          maxPrice: existing?.maxPrice ?? 2000,
          isActive: existing?.isActive ?? false,
        };
      });
      setEditedCatalogs(initial);
    } else if (categories) {
      const initial: typeof editedCatalogs = {};
      categories.forEach((cat) => {
        initial[cat.id] = {
          minPrice: 1000,
          maxPrice: 2000,
          isActive: false,
        };
      });
      setEditedCatalogs(initial);
    }
  }, [profile, categories]);

  // Aggregate today's stats
  const today = new Date().toDateString();
  const completedToday = orders?.filter(
    (o) => o.status === "COMPLETED" && new Date(o.updatedAt).toDateString() === today
  ) || [];

  const todayTrxCount = completedToday.length;
  const todayWeight = completedToday.reduce((sum, o) => sum + (o.actualWeight || 0), 0);
  const todayPayout = completedToday.reduce((sum, o) => sum + (o.totalPrice || o.agreedPrice || 0), 0);

  // Combine dynamic completed orders and local session transactions
  const completedOrdersList = orders?.filter((o) => o.status === "COMPLETED") || [];
  const recentTransactions = [
    ...completedOrdersList.map((o) => ({
      id: `TRX-${o.id.slice(-4).toUpperCase()}`,
      date: formatDate(o.updatedAt),
      type: "PAYOUT",
      label: `Pembelian Rosok #${o.id.slice(-5).toUpperCase()}`,
      amount: o.totalPrice || (o.actualWeight || 0) * (o.agreedPrice || 0)
    }))
  ];

  const handleToggleOpen = () => {
    const newStatus = !profile?.isOpen;
    updateProfile.mutate(
      { 
        isOpen: newStatus,
        shopName: profile?.shopName || "Lapak Pengepul",
        description: profile?.description || "",
        radiusKm: profile?.radiusKm || 5
      },
      {
        onSuccess: () => {
          toast.success(`Lapak berhasil ${newStatus ? "DIBUKA" : "DITUTUP"}!`);
        },
        onError: () => {
          toast.error("Gagal memperbarui status operasional lapak.");
        },
      }
    );
  };

  const handleValChange = (catId: string, field: "minPrice" | "maxPrice", val: number) => {
    setEditedCatalogs((prev) => ({
      ...prev,
      [catId]: {
        ...prev[catId],
        [field]: val,
      },
    }));
  };

  const handleToggleCatalogActive = (catId: string) => {
    setEditedCatalogs((prev) => ({
      ...prev,
      [catId]: {
        ...prev[catId],
        isActive: !prev[catId]?.isActive,
      },
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
      onSuccess: () => {
        toast.success("Katalog harga berhasil diperbarui!");
      },
      onError: (err: any) => {
        toast.error(err.response?.data?.message || "Gagal memperbarui katalog.");
      },
    });
  };

  const handleLogout = () => {
    logout();
    router.push("/login");
  };



  // ─── MAP PIN HANDLERS ────────────────────────────────────────────────
  const handleMapOrderAccept = (order: any) => {
    if (order.id.startsWith("MOCK-")) {
      const loadToast = toast.loading("Menerima pesanan...");
      setTimeout(() => {
        toast.dismiss(loadToast);
        toast.success("Pesanan berhasil diterima! (Mode Simulasi)");
        setHiddenPins((prev) => [...prev, order.id]);
        setSelectedMapOrder(null);
      }, 1200);
    } else {
      // Real order matching
      const updateOrderStatus = useUpdateOrderStatus(order.id);
      updateOrderStatus.mutate(
        { action: "accept" },
        {
          onSuccess: () => {
            toast.success("Pesanan diterima! Mengarahkan ke pelacakan...");
            setSelectedMapOrder(null);
            router.push(`/orders/${order.id}`);
          },
          onError: (err: any) => {
            toast.error(err.response?.data?.message || "Gagal menerima pesanan.");
          }
        }
      );
    }
  };

  // Combine real incoming orders and mock pins (filtering hidden pins)
  const activeMapPins = [
    ...incomingOrders.map((o, idx) => ({
      id: o.id,
      sellerName: "Customer Terdekat",
      categoryName: o.categoryId,
      categoryId: o.categoryId,
      estimatedWeight: o.estimatedWeight,
      distance: `${(idx + 1) * 0.8} km`,
      coords: { x: 160 + idx * 40, y: 130 + idx * 30 },
      estEarnings: o.estimatedWeight * 2200,
      method: o.method,
      phone: "08123456789"
    })),
    ...mockMapPins
  ].filter((p) => !hiddenPins.includes(p.id));

  const isPageLoading = isProfileLoading || isOrdersLoading;

  if (isPageLoading) {
    return (
      <div className="min-h-screen bg-surface flex flex-col justify-between pb-24 md:pb-0">
        <DesktopNav />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Refresh className="w-10 h-10 text-brand-500 animate-spin" />
            <span className="text-sm font-bold text-ink-muted">Memuat Dasbor Lapak...</span>
          </div>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface pb-24 md:pb-8 flex flex-col font-sans">
      <DesktopNav />
      
      {/* MOBILE HEADER */}
      <header className="sticky top-0 z-40 bg-white border-b border-ink-faint px-4 py-4 flex items-center justify-between shadow-sm md:hidden">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center text-white">
            <Store size={18} />
          </div>
          <h1 className="font-display font-extrabold text-lg tracking-tight text-ink">Dasbor Lapak</h1>
        </div>
        <button onClick={handleLogout} className="p-2 text-ink-muted hover:text-status-error transition-colors rounded-full hover:bg-surface-raised cursor-pointer">
          <ArrowRightToBracket size={20} />
        </button>
      </header>

      <main className="flex-1 px-4 md:px-8 py-4 md:py-8 max-w-6xl w-full mx-auto space-y-6">
        
        {/* TOP TOGGLE */}
        <section className={`rounded-2xl p-6 shadow-sm border transition-colors ${profile?.isOpen ? 'bg-status-success/10 border-status-success/20' : 'bg-status-error/5 border-status-error/20'}`}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-ink-muted uppercase tracking-widest mb-1">Status Lapak</h2>
              <div className="flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  {profile?.isOpen && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-status-success opacity-75"></span>}
                  <span className={`relative inline-flex rounded-full h-3 w-3 ${profile?.isOpen ? 'bg-status-success' : 'bg-status-error'}`}></span>
                </span>
                <span className={`font-display font-black text-2xl ${profile?.isOpen ? 'text-status-success' : 'text-status-error'}`}>
                  {profile?.isOpen ? 'BUKA' : 'TUTUP'}
                </span>
              </div>
            </div>
            <div 
              onClick={handleToggleOpen}
              className={`w-16 h-8 rounded-full p-1 cursor-pointer transition-colors ${profile?.isOpen ? 'bg-status-success' : 'bg-surface-raised border border-ink-faint'}`}
            >
              <div className={`w-6 h-6 rounded-full bg-white shadow-sm transform transition-transform ${profile?.isOpen ? 'translate-x-8' : 'translate-x-0'}`} />
            </div>
          </div>
        </section>

        {/* MOCK MAP AND INCOMING ORDERS GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* INTERACTIVE VECTOR MAP PANEL */}
          <section className="lg:col-span-2 backdrop-blur-md bg-white border border-ink-faint rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-display font-extrabold text-base text-ink tracking-tight flex items-center gap-2">
                  <FileText className="text-brand-500" size={18} />
                  Daftar Request Jemput Terdekat
                </h3>
                <p className="text-xs text-ink-muted">Daftar permintaan setoran sampah rosok aktif dari customer di sekitar Anda</p>
              </div>
              {activeMapPins.length > 0 && (
                <span className="bg-emerald-50 text-emerald-600 border border-emerald-200 text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md animate-pulse">
                  {activeMapPins.length} Request Aktif
                </span>
              )}
            </div>

            {/* Table layout of incoming pickup requests */}
            <div className="overflow-x-auto border border-ink-faint rounded-xl bg-white shadow-sm">
              <table className="w-full text-left border-collapse text-xs md:text-sm">
                <thead>
                  <tr className="bg-surface-raised border-b border-ink-faint text-ink-muted font-bold text-[10px] uppercase tracking-wider font-mono">
                    <th className="p-3">Nama &amp; Area</th>
                    <th className="p-3">Kategori</th>
                    <th className="p-3">Berat Est.</th>
                    <th className="p-3">Jarak</th>
                    <th className="p-3">Metode</th>
                    <th className="p-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-faint">
                  {activeMapPins.length > 0 ? (
                    activeMapPins.map((pin) => (
                      <tr key={pin.id} className="hover:bg-surface-raised/50 transition-colors">
                        <td className="p-3 font-bold text-ink">
                          {pin.sellerName}
                        </td>
                        <td className="p-3">
                          <span className="bg-brand-50 text-brand-700 border border-brand-200 px-2 py-0.5 rounded font-black uppercase tracking-wide text-[9px] font-mono">
                            {pin.categoryName}
                          </span>
                        </td>
                        <td className="p-3 font-extrabold font-mono text-ink">
                          {pin.estimatedWeight} kg
                        </td>
                        <td className="p-3 text-ink-muted font-mono font-medium">
                          {pin.distance}
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider border ${
                            pin.method === 'PICKUP' 
                              ? 'bg-blue-50 text-blue-700 border-blue-200' 
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}>
                            {pin.method}
                          </span>
                        </td>
                        <td className="p-3 text-right flex justify-end gap-2">
                          <button
                            onClick={() => handleMapOrderAccept(pin)}
                            className="bg-brand-600 hover:bg-brand-700 text-white font-bold text-[10px] px-3.5 py-1.5 rounded-lg shadow-sm transition-all flex items-center gap-1 cursor-pointer"
                          >
                            <Check size={10} /> Ambil
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="p-10 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-12 h-12 bg-surface-raised rounded-full border border-ink-faint flex items-center justify-center text-ink-muted">
                            <Archive size={20} />
                          </div>
                          <div className="space-y-1">
                            <p className="font-bold text-ink text-sm">Tidak Ada Request Aktif</p>
                            <p className="text-xs text-ink-muted">Belum ada request penjemputan baru di sekitar Anda. Pastikan status lapak BUKA.</p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* INCOMING ORDERS SIDEBAR */}
          <section className="backdrop-blur-md bg-white border border-ink-faint rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="font-display font-extrabold text-base text-ink tracking-tight flex items-center gap-2">
              <Store className="text-blue-500" size={18} />
              Antrean Pesanan Masuk
              {incomingOrders.length > 0 && (
                <span className="bg-status-error text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full animate-pulse">
                  {incomingOrders.length}
                </span>
              )}
            </h3>
            
            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {incomingOrders.length > 0 ? (
                incomingOrders.map((order) => (
                  <IncomingOrderCard key={order.id} order={order} onRemove={removeIncomingOrder} />
                ))
              ) : (
                <div className="border border-ink-faint border-dashed rounded-xl p-8 flex flex-col items-center text-center">
                  <Clock size={28} className="text-ink-faint mb-2" />
                  <span className="text-xs font-bold text-ink">Antrean Kosong</span>
                  <p className="text-[10px] text-ink-muted mt-0.5">Sambil menunggu pesanan masuk, Anda bisa mengambil pesanan simulasi di peta sebelah kiri!</p>
                </div>
              )}
            </div>
          </section>

        </div>

        {/* E-WALLET AND STATS PANEL */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* INFORMASI PEMBAYARAN MANUAL */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 border border-slate-800 rounded-2xl p-5 shadow-xl text-slate-100 flex flex-col justify-between relative overflow-hidden">
            {/* Gloss pattern design */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-brand-500/10 rounded-full blur-2xl -mr-6 -mt-6" />
            
            <div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Metode Pembayaran</span>
                <Wallet className="text-brand-400" size={16} />
              </div>
              <div className="mt-3">
                <span className="bg-brand-500/20 text-brand-400 border border-brand-500/30 rounded px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-wider inline-flex items-center gap-1">
                  🤝 Pembayaran Manual (COD) Aktif
                </span>
              </div>
              <div className="mt-5 space-y-2">
                <h4 className="font-display font-extrabold text-sm text-white">Transaksi Tatap Muka</h4>
                <p className="text-[11px] text-slate-400 leading-relaxed font-semibold">
                  Semua penyelesaian pembayaran dilakukan secara langsung dan mandiri oleh Pengepul kepada Penjual (Tunai / Transfer Bank / QRIS Personal) setelah timbangan disepakati.
                </p>
              </div>
            </div>

            <div className="mt-5 bg-slate-800/40 border border-slate-700/50 rounded-xl p-3 text-[10px] text-slate-400 leading-normal flex items-start gap-2">
              <AlertCircle size={14} className="text-amber-400 shrink-0 mt-0.5" />
              <span>Sistem Rongsok.in hanya memvalidasi nominal timbangan &amp; harga sepakat untuk menerbitkan Nota Digital resmi.</span>
            </div>
          </div>

          {/* RIWAYAT TRANSAKSI PEMBELIAN */}
          <div className="bg-white border border-ink-faint rounded-2xl p-5 shadow-sm space-y-3 flex flex-col justify-between">
            <h4 className="font-display font-extrabold text-xs text-ink-muted uppercase tracking-widest">
              Riwayat Pembelian Rosok
            </h4>
            
            <div className="space-y-2.5 flex-1 mt-2 overflow-y-auto max-h-48 pr-1">
              {recentTransactions && recentTransactions.length > 0 ? (
                recentTransactions.map((trx) => (
                  <div key={trx.id} className="flex justify-between items-center text-xs pb-2 border-b border-surface-raised last:border-none">
                    <div>
                      <span className="font-bold text-ink block leading-tight">{trx.label}</span>
                      <span className="text-[10px] text-ink-muted mt-0.5 block">{trx.date} • {trx.id}</span>
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

          {/* STATISTIK HARI INI */}
          <div className="bg-white border border-ink-faint rounded-2xl p-5 shadow-sm space-y-4">
            <h4 className="font-display font-extrabold text-xs text-ink-muted uppercase tracking-widest">
              Statistik Setoran Hari Ini
            </h4>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-surface-raised border border-ink-faint p-3 rounded-xl">
                <span className="block text-[9px] font-bold text-ink-muted uppercase tracking-widest mb-1">Transaksi</span>
                <span className="font-black text-lg text-ink font-mono">{todayTrxCount} <span className="text-xs font-semibold text-ink-muted">trx</span></span>
              </div>
              <div className="bg-surface-raised border border-ink-faint p-3 rounded-xl">
                <span className="block text-[9px] font-bold text-ink-muted uppercase tracking-widest mb-1">Total Berat</span>
                <span className="font-black text-lg text-ink font-mono">{todayWeight.toFixed(1)} <span className="text-xs font-semibold text-ink-muted">kg</span></span>
              </div>
              <div className="bg-surface-raised border border-ink-faint p-3 rounded-xl col-span-2 flex justify-between items-center">
                <div>
                  <span className="block text-[9px] font-bold text-ink-muted uppercase tracking-widest">Total Pengeluaran</span>
                  <span className="font-black text-lg text-brand-600 font-mono mt-1 block">{formatRupiah(todayPayout)}</span>
                </div>
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-500 border border-emerald-100 flex items-center justify-center shrink-0">
                  <CreditCard size={16} />
                </div>
              </div>
            </div>
          </div>

        </section>

        {/* KATALOG HARGA (COLLAPSIBLE) */}
        <section className="bg-white border border-ink-faint rounded-xl shadow-sm overflow-hidden">
          <div 
            onClick={() => setIsCatalogExpanded(!isCatalogExpanded)}
            className="p-4 flex items-center justify-between cursor-pointer hover:bg-surface-raised transition-colors"
          >
            <div>
              <h3 className="font-display font-extrabold text-lg text-ink">Manajemen Katalog</h3>
              <p className="text-xs text-ink-muted mt-0.5">Atur daftar rongsokan yang kamu terima beserta rentang harganya.</p>
            </div>
            <div className="w-8 h-8 bg-brand-50 text-brand-500 rounded-full flex items-center justify-center shrink-0">
              {isCatalogExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>
          </div>
          
          {isCatalogExpanded && (
            <div className="border-t border-ink-faint p-4 animate-in slide-in-from-top-2">
              <div className="space-y-4">
                {categories?.map((cat) => {
                  const IconComponent = categoryIcons[cat.name] || Archive;
                  const data = editedCatalogs[cat.id] || { minPrice: 1000, maxPrice: 2000, isActive: false };
                  
                  return (
                    <div 
                      key={cat.id} 
                      className={`flex flex-col md:flex-row md:items-center gap-4 p-4 rounded-xl border transition-colors ${
                        data.isActive ? 'border-brand-200 bg-brand-50/30' : 'border-ink-faint bg-surface'
                      }`}
                    >
                      <div className="flex items-center gap-3 md:w-1/3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border ${
                          data.isActive ? 'bg-brand-500 text-white border-transparent' : 'bg-surface-raised text-ink-muted border-ink-faint'
                        }`}>
                          <IconComponent size={20} />
                        </div>
                        <span className="font-bold text-sm text-ink">{cat.name}</span>
                      </div>
                      
                      <div className="flex-1 grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] font-bold text-ink-muted uppercase tracking-widest mb-1 block">Min (Rp/kg)</label>
                          <input 
                            type="number" 
                            value={data.minPrice} 
                            onChange={(e) => handleValChange(cat.id, "minPrice", Number(e.target.value))}
                            disabled={!data.isActive} 
                            className="w-full bg-white border border-ink-faint rounded-lg p-2 text-sm font-mono font-bold focus:outline-none focus:ring-2 focus:ring-brand-500" 
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-ink-muted uppercase tracking-widest mb-1 block">Max (Rp/kg)</label>
                          <input 
                            type="number" 
                            value={data.maxPrice} 
                            onChange={(e) => handleValChange(cat.id, "maxPrice", Number(e.target.value))}
                            disabled={!data.isActive} 
                            className="w-full bg-white border border-ink-faint rounded-lg p-2 text-sm font-mono font-bold focus:outline-none focus:ring-2 focus:ring-brand-500" 
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between md:justify-end md:w-32 mt-2 md:mt-0 pt-3 md:pt-0 border-t border-ink-faint md:border-none">
                        <span className="text-xs font-bold text-ink-muted md:hidden">Status Aktif</span>
                        <div 
                          onClick={() => handleToggleCatalogActive(cat.id)}
                          className={`w-10 h-6 rounded-full p-1 cursor-pointer transition-colors ${data.isActive ? 'bg-brand-500' : 'bg-surface-raised border border-ink-faint'}`}
                        >
                          <div className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform ${data.isActive ? 'translate-x-4' : 'translate-x-0'}`} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              <div className="mt-4 flex justify-end">
                <Button 
                  onClick={handleSaveCatalogs}
                  disabled={updateCatalogs.isPending}
                  className="font-bold px-6 shadow-md"
                >
                  {updateCatalogs.isPending ? "Menyimpan..." : "Simpan Perubahan"}
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
