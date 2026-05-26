"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import DesktopNav from "@/components/ui/DesktopNav";
import BottomNav from "@/components/ui/BottomNav";
import { 
  Store, Archive, MapPinAlt, Check, Close, Clock, ChevronDown, ChevronUp, 
  Tools, Refresh, FileLines, DesktopPc, Star, ArrowRightToBracket
} from "flowbite-react-icons/outline";
import { Button } from "@/components/ui/Button";
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
    updateOrderStatus.mutate(
      { action: "reject" as any },
      {
        onSuccess: () => {
          toast.success("Pesanan ditolak.");
          onRemove(order.id);
        },
        onError: () => {
          // Fallback: remove locally
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
              {order.categoryId}
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

  const handleToggleOpen = () => {
    const newStatus = !profile?.isOpen;
    updateProfile.mutate(
      { isOpen: newStatus },
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
    <div className="min-h-screen bg-surface pb-24 md:pb-8 flex flex-col">
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

        {/* INCOMING ORDERS */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-extrabold text-lg text-ink flex items-center gap-2">
              Pesanan Masuk
              {incomingOrders.length > 0 && (
                <span className="bg-status-error text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full">
                  {incomingOrders.length}
                </span>
              )}
            </h3>
          </div>
          
          {incomingOrders.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {incomingOrders.map((order) => (
                <IncomingOrderCard key={order.id} order={order} onRemove={removeIncomingOrder} />
              ))}
            </div>
          ) : (
            <div className="bg-white border border-ink-faint border-dashed rounded-xl p-8 flex flex-col items-center text-center shadow-sm">
              <div className="w-16 h-16 bg-surface rounded-full flex items-center justify-center mb-4 border border-ink-faint">
                <Archive size={32} className="text-ink-faint" />
              </div>
              <h4 className="font-bold text-ink">Belum ada pesanan</h4>
              <p className="text-xs text-ink-muted mt-1">Pesanan rongsok dari customer di sekitarmu akan muncul di sini secara real-time.</p>
            </div>
          )}
        </section>

        {/* STATISTIK */}
        <section>
          <h3 className="font-display font-extrabold text-lg text-ink mb-4">Statistik Hari Ini</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white border border-ink-faint p-4 rounded-xl shadow-sm">
              <span className="block text-[10px] font-bold text-ink-muted uppercase tracking-widest mb-1">Selesai</span>
              <span className="font-black text-xl text-ink font-mono">{todayTrxCount} <span className="text-xs font-medium text-ink-muted">trx</span></span>
            </div>
            <div className="bg-white border border-ink-faint p-4 rounded-xl shadow-sm">
              <span className="block text-[10px] font-bold text-ink-muted uppercase tracking-widest mb-1">Total Berat</span>
              <span className="font-black text-xl text-ink font-mono">{todayWeight.toFixed(1)} <span className="text-xs font-medium text-ink-muted">kg</span></span>
            </div>
            <div className="bg-white border border-ink-faint p-4 rounded-xl shadow-sm col-span-2">
              <span className="block text-[10px] font-bold text-ink-muted uppercase tracking-widest mb-1">Total Pengeluaran (Rp)</span>
              <span className="font-black text-xl text-brand-600 font-mono">{formatRupiah(todayPayout)}</span>
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
