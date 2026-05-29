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
  AlertCircle, CheckCircle2, ChevronRight, MessageSquare
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

  // ─── PREMIUM E-WALLET STATES ──────────────────────────────────────────
  const [walletBalance, setWalletBalance] = useState(254500);
  const [recentTransactions, setRecentTransactions] = useState([
    { id: "TRX-043", date: "Hari ini", type: "INCOME", label: "Setoran Rosok #RSK-9921", amount: 33000 },
    { id: "TRX-042", date: "Kemarin", type: "INCOME", label: "Setoran Rosok #RSK-9812", amount: 45000 },
    { id: "TRX-041", date: "27 Mei", type: "WITHDRAW", label: "Penarikan Bank BCA", amount: 150000 }
  ]);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [selectedBank, setSelectedBank] = useState("BCA");
  const [accountNumber, setAccountNumber] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawStatus, setWithdrawStatus] = useState<"idle" | "processing" | "success">("idle");

  // ─── PREMIUM INTERACTIVE MAP STATES ──────────────────────────────────
  const [selectedMapOrder, setSelectedMapOrder] = useState<any | null>(null);
  const [hiddenPins, setHiddenPins] = useState<string[]>([]);
  
  // Static mockup pins representing nearby requests
  const mockMapPins = [
    { id: "MOCK-001", sellerName: "Ibu Ratna", categoryName: "Kardus", categoryId: "kardus", estimatedWeight: 15, distance: "1.2 km", coords: { x: 140, y: 70 }, estEarnings: 33000, method: "PICKUP", phone: "08123456789" },
    { id: "MOCK-002", sellerName: "Mas Danang", categoryName: "Logam", categoryId: "logam", estimatedWeight: 8, distance: "2.5 km", coords: { x: 270, y: 100 }, estEarnings: 68000, method: "PICKUP", phone: "08987654321" },
    { id: "MOCK-003", sellerName: "Mbak Dwi", categoryName: "Plastik", categoryId: "plastik", estimatedWeight: 22, distance: "1.8 km", coords: { x: 170, y: 220 }, estEarnings: 99000, method: "DROPOFF", phone: "087712345678" }
  ];

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

  // ─── E-WALLET HANDLERS ──────────────────────────────────────────────
  const handleWithdrawSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountNumber || !withdrawAmount) {
      toast.error("Mohon isi semua data penarikan.");
      return;
    }
    const amt = Number(withdrawAmount);
    if (amt > walletBalance) {
      toast.error("Saldo tidak mencukupi!");
      return;
    }
    if (amt < 10000) {
      toast.error("Minimal penarikan adalah Rp 10.000.");
      return;
    }

    setWithdrawStatus("processing");
    setTimeout(() => {
      setWithdrawStatus("success");
      setTimeout(() => {
        setWalletBalance((prev) => prev - amt);
        setRecentTransactions((prev) => [
          {
            id: `TRX-${Math.floor(Math.random() * 900) + 100}`,
            date: "Hari ini",
            type: "WITHDRAW",
            label: `Penarikan Bank ${selectedBank}`,
            amount: amt
          },
          ...prev
        ]);
        toast.success(`Berhasil mencairkan ${formatRupiah(amt)} ke rekening ${selectedBank}!`);
        setIsWithdrawOpen(false);
        setWithdrawStatus("idle");
        setAccountNumber("");
        setWithdrawAmount("");
      }, 1500);
    }, 2000);
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
                  <Map className="text-brand-500" size={18} />
                  Peta Pesanan Terdekat
                </h3>
                <p className="text-xs text-ink-muted">Pantau titik penjemputan sampah rosok di Yogyakarta</p>
              </div>
              <span className="text-[10px] font-bold text-brand-600 bg-brand-50 border border-brand-200 px-2 py-0.5 rounded-full uppercase tracking-wider">
                Interactive Map
              </span>
            </div>

            {/* Styled vector map of Yogyakarta */}
            <div className="relative h-64 w-full bg-slate-950 rounded-xl overflow-hidden shadow-inner">
              <svg viewBox="0 0 400 300" className="w-full h-full">
                {/* Grid Pattern */}
                <defs>
                  <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                    <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />

                {/* Sleman (North) Boundary */}
                <path d="M 50 10 L 350 10 L 330 110 L 70 110 Z" fill="rgba(16,185,129,0.01)" stroke="rgba(16,185,129,0.1)" strokeWidth="1" strokeDasharray="3 3" />
                <text x="200" y="35" className="fill-slate-600 font-extrabold text-[8px] uppercase tracking-widest text-center" textAnchor="middle">Sleman</text>

                {/* Kota Yogyakarta Boundary */}
                <path d="M 70 110 L 330 110 L 300 200 L 100 200 Z" fill="rgba(16,185,129,0.04)" stroke="rgba(16,185,129,0.2)" strokeWidth="1.5" />
                <text x="200" y="155" className="fill-brand-400/40 font-extrabold text-[8px] uppercase tracking-widest text-center" textAnchor="middle">Kota Yogyakarta</text>

                {/* Bantul Boundary */}
                <path d="M 100 200 L 300 200 L 260 290 L 140 290 Z" fill="rgba(16,185,129,0.01)" stroke="rgba(16,185,129,0.1)" strokeWidth="1" strokeDasharray="3 3" />
                <text x="200" y="245" className="fill-slate-600 font-extrabold text-[8px] uppercase tracking-widest text-center" textAnchor="middle">Bantul</text>

                {/* River Styling */}
                <path d="M 180 10 Q 150 150 160 295" fill="none" stroke="rgba(59,130,246,0.1)" strokeWidth="2.5" />
                <path d="M 230 10 Q 250 130 220 295" fill="none" stroke="rgba(59,130,246,0.08)" strokeWidth="2" />

                {/* Lapak/Gudang Center Marker */}
                <g transform="translate(200, 150)">
                  <circle r="12" className="fill-brand-500/20 stroke-brand-500/30 stroke-1 animate-ping" />
                  <circle r="6" className="fill-brand-500 stroke-white stroke-2 shadow" />
                  <text y="-10" className="fill-brand-300 font-bold text-[8px] uppercase tracking-wider text-center" textAnchor="middle">Lapak Anda</text>
                </g>

                {/* Dynamic/Mock Order Pins */}
                {activeMapPins.map((pin) => {
                  const isSelected = selectedMapOrder?.id === pin.id;
                  return (
                    <g 
                      key={pin.id} 
                      transform={`translate(${pin.coords.x}, ${pin.coords.y})`}
                      className="cursor-pointer"
                      onClick={() => setSelectedMapOrder(pin)}
                    >
                      <circle r="10" className={`stroke-white stroke-1 transition-all ${isSelected ? 'fill-amber-500 scale-120 animate-pulse' : 'fill-brand-600 hover:fill-amber-500'}`} />
                      <circle r="4" className="fill-white" />
                      <text y="-12" className="fill-white font-extrabold text-[9px] bg-slate-900 border border-slate-800 px-1 py-0.5 rounded shadow" textAnchor="middle">
                        {pin.estimatedWeight}kg
                      </text>
                    </g>
                  );
                })}
              </svg>

              {/* Float helper */}
              <div className="absolute bottom-3 left-3 bg-slate-900/90 border border-slate-800 rounded-lg px-2.5 py-1.5 text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-brand-500 animate-pulse" /> Tap Marker Pin Untuk Detail
              </div>
            </div>

            {/* EXPANDABLE MAP ORDER DRAWER */}
            {selectedMapOrder && (
              <div className="bg-brand-50 border border-brand-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in slide-in-from-bottom-3 duration-200">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-brand-500 text-white rounded-lg flex items-center justify-center shrink-0 shadow-sm border border-brand-400">
                    <Navigation size={18} className="animate-spin" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-brand-900 font-display flex items-center gap-2">
                      Setoran Kategori: {selectedMapOrder.categoryName}
                      <span className="bg-amber-100 text-amber-700 border border-amber-200 text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider font-mono">
                        {selectedMapOrder.distance}
                      </span>
                    </h4>
                    <p className="text-xs text-brand-700 font-medium mt-0.5">
                      Seller: {selectedMapOrder.sellerName} · {selectedMapOrder.method}
                    </p>
                    <div className="flex gap-4 mt-2.5 text-[11px] font-bold text-brand-900 font-mono">
                      <span>Estimasi: {selectedMapOrder.estimatedWeight} Kg</span>
                      <span>Pendapatan: {formatRupiah(selectedMapOrder.estEarnings)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setSelectedMapOrder(null)}
                    className="px-3 py-2 border border-brand-300 hover:border-brand-400 text-brand-700 hover:text-brand-900 font-bold rounded-lg text-xs transition-colors cursor-pointer bg-white"
                  >
                    Batal
                  </button>
                  <button 
                    onClick={() => handleMapOrderAccept(selectedMapOrder)}
                    className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-lg text-xs shadow-md transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <Check size={14} /> Ambil Pesanan
                  </button>
                </div>
              </div>
            )}
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
          
          {/* PREMIUM E-WALLET CARD */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 border border-slate-800 rounded-2xl p-5 shadow-xl text-slate-100 flex flex-col justify-between relative overflow-hidden">
            {/* Gloss pattern design */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl -mr-6 -mt-6" />
            
            <div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Dompet Mitra</span>
                <Wallet className="text-emerald-400" size={16} />
              </div>
              <div className="mt-4">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">SALDO AKTIF</span>
                <h3 className="font-display font-black text-2xl text-emerald-400 tracking-tight mt-1 font-mono">
                  {formatRupiah(walletBalance)}
                </h3>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button 
                onClick={() => setIsWithdrawOpen(true)}
                className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-bold py-2.5 rounded-xl shadow-md shadow-emerald-500/10 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <ArrowUpRight size={14} /> Tarik Saldo
              </button>
            </div>
          </div>

          {/* RIWAYAT MUTASI DOMPET */}
          <div className="bg-white border border-ink-faint rounded-2xl p-5 shadow-sm space-y-3 flex flex-col justify-between">
            <h4 className="font-display font-extrabold text-xs text-ink-muted uppercase tracking-widest">
              Riwayat Mutasi Saldo
            </h4>
            
            <div className="space-y-2.5 flex-1 mt-2">
              {recentTransactions.map((trx) => (
                <div key={trx.id} className="flex justify-between items-center text-xs pb-2 border-b border-surface-raised last:border-none">
                  <div>
                    <span className="font-bold text-ink block leading-tight">{trx.label}</span>
                    <span className="text-[10px] text-ink-muted mt-0.5 block">{trx.date} • {trx.id}</span>
                  </div>
                  <span className={`font-bold font-mono ${trx.type === 'INCOME' ? 'text-status-success' : 'text-status-error'}`}>
                    {trx.type === 'INCOME' ? `+${formatRupiah(trx.amount)}` : `-${formatRupiah(trx.amount)}`}
                  </span>
                </div>
              ))}
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

      {/* PREMIUM TARIK SALDO MODAL */}
      {isWithdrawOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl border border-ink-faint p-6 space-y-6 relative overflow-hidden animate-in zoom-in-95">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 to-green-400" />

            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto border border-emerald-100">
                <Wallet size={24} />
              </div>
              <h3 className="font-display font-extrabold text-base text-ink">Penarikan Saldo Dompet</h3>
              <p className="text-xs text-ink-muted">Transfer pencairan pendapatan lapak Anda ke rekening Bank</p>
            </div>

            {withdrawStatus === "idle" && (
              <form onSubmit={handleWithdrawSubmit} className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-ink-muted uppercase tracking-widest mb-1.5 block">Bank Tujuan</label>
                  <select 
                    value={selectedBank}
                    onChange={(e) => setSelectedBank(e.target.value)}
                    className="w-full bg-white border border-ink-faint rounded-xl p-3 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 font-semibold"
                  >
                    <option value="BCA">Bank Central Asia (BCA)</option>
                    <option value="Mandiri">Bank Mandiri</option>
                    <option value="BNI">Bank Negara Indonesia (BNI)</option>
                    <option value="BRI">Bank Rakyat Indonesia (BRI)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-ink-muted uppercase tracking-widest mb-1.5 block">Nomor Rekening</label>
                  <Input 
                    type="number"
                    placeholder="Contoh: 8012345678"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    className="rounded-xl font-bold font-mono h-11"
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-ink-muted uppercase tracking-widest mb-1.5 block">Nominal Pencairan (Rp)</label>
                  <Input 
                    type="number"
                    placeholder="Minimal Rp 10.000"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    className="rounded-xl font-bold font-mono h-11 text-emerald-600 focus:text-emerald-700"
                    max={walletBalance}
                    min="10000"
                    required
                  />
                  <div className="flex gap-2 mt-2">
                    <button 
                      type="button"
                      onClick={() => setWithdrawAmount(String(Math.min(50000, walletBalance)))}
                      className="flex-1 py-1 bg-surface-raised border border-ink-faint rounded text-[10px] font-extrabold text-ink-muted hover:border-brand-500 transition-colors"
                    >
                      50rb
                    </button>
                    <button 
                      type="button"
                      onClick={() => setWithdrawAmount(String(Math.min(100000, walletBalance)))}
                      className="flex-1 py-1 bg-surface-raised border border-ink-faint rounded text-[10px] font-extrabold text-ink-muted hover:border-brand-500 transition-colors"
                    >
                      100rb
                    </button>
                    <button 
                      type="button"
                      onClick={() => setWithdrawAmount(String(walletBalance))}
                      className="flex-1 py-1 bg-surface-raised border border-ink-faint rounded text-[10px] font-extrabold text-ink-muted hover:border-brand-500 transition-colors"
                    >
                      Semua
                    </button>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button 
                    type="button"
                    onClick={() => setIsWithdrawOpen(false)}
                    className="flex-1 py-3 border border-ink-faint hover:bg-surface-raised text-ink-muted font-bold rounded-xl text-xs transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                  <Button 
                    type="submit"
                    className="flex-[2] py-3 text-xs font-bold shadow-md bg-emerald-500 hover:bg-emerald-600 text-slate-950"
                  >
                    Kirim Pencairan
                  </Button>
                </div>
              </form>
            )}

            {withdrawStatus === "processing" && (
              <div className="py-8 flex flex-col items-center justify-center space-y-4 animate-in fade-in">
                <Refresh className="w-12 h-12 text-emerald-500 animate-spin" />
                <div className="text-center">
                  <span className="text-sm font-bold text-ink">Mengirim Permintaan...</span>
                  <p className="text-[10px] text-ink-muted mt-1">Mengamankan jaringan transfer perbankan</p>
                </div>
              </div>
            )}

            {withdrawStatus === "success" && (
              <div className="py-8 flex flex-col items-center justify-center space-y-4 animate-in zoom-in-95">
                <CheckCircle2 className="w-14 h-14 text-status-success animate-bounce" />
                <div className="text-center">
                  <span className="text-base font-extrabold text-brand-600">Pencairan Berhasil!</span>
                  <p className="text-xs text-ink-muted mt-1">Saldo telah berhasil ditransfer ke rekening Anda.</p>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
