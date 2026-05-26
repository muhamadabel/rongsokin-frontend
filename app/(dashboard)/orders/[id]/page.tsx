"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import DesktopNav from "@/components/ui/DesktopNav";
import BottomNav from "@/components/ui/BottomNav";
import { 
  Archive, RefreshCw, Wrench, FileText, Monitor, CheckCircle, 
  Clock, MapPin, Phone, MessageSquare, Scale, DollarSign, 
  ChevronRight, Star, Info, AlertCircle, ArrowLeft
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuthStore } from "@/store/authStore";
import { useOrderDetails, useUpdateOrderStatus } from "@/hooks/useOrders";
import { getSocket } from "@/lib/socket";
import { formatRupiah, formatDate } from "@/lib/utils";
import toast from "react-hot-toast";
import api from "@/lib/axios";

const categoryIcons: Record<string, any> = {
  Kardus: Archive,
  Plastik: RefreshCw,
  Logam: Wrench,
  Kertas: FileText,
  Elektronik: Monitor,
};

export default function OrderTrackingPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const initFromStorage = useAuthStore((state) => state.initFromStorage);
  
  useEffect(() => {
    initFromStorage();
  }, [initFromStorage]);

  const { data: order, isLoading, refetch } = useOrderDetails(id);
  const updateOrderStatus = useUpdateOrderStatus(id);

  // Status index for progress bar
  const statusFlow = ["PENDING", "CONFIRMED", "IN_PROGRESS", "AWAITING_CONFIRMATION", "COMPLETED"];
  const currentStepIdx = statusFlow.indexOf(order?.status || "PENDING");

  // Local form states for validation (Collector)
  const [actualWeight, setActualWeight] = useState("");
  const [agreedPrice, setAgreedPrice] = useState("");

  // Rating States
  const [ratingScore, setRatingScore] = useState(5);
  const [ratingComment, setRatingComment] = useState("");
  const [showRating, setShowRating] = useState(false);
  const [ratingSubmitted, setRatingSubmitted] = useState(false);
  const [ratingLoading, setRatingLoading] = useState(false);

  // Join Socket order room
  useEffect(() => {
    if (!token || !id) return;
    const socket = getSocket(token);
    socket.emit("join_room", `order:${id}`);
    
    const handleStatusUpdate = (payload: { orderId: string; status: any }) => {
      if (payload.orderId === id) {
        refetch();
        toast.success(`Status pesanan diperbarui menjadi ${payload.status}!`, {
          icon: "🔔",
        });
      }
    };
    
    socket.on("order_status_update", handleStatusUpdate);
    socket.on("order_status_updated", handleStatusUpdate);
    
    return () => {
      socket.off("order_status_update", handleStatusUpdate);
      socket.off("order_status_updated", handleStatusUpdate);
    };
  }, [token, id, refetch]);

  // Show rating popup automatically if status is COMPLETED
  useEffect(() => {
    if (order?.status === "COMPLETED" && !ratingSubmitted) {
      setShowRating(true);
    }
  }, [order?.status, ratingSubmitted]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface flex flex-col justify-between pb-20 md:pb-0">
        <DesktopNav />
        <div className="flex-1 flex items-center justify-center">
          <RefreshCw className="w-10 h-10 text-brand-500 animate-spin" />
        </div>
        <BottomNav />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-surface flex flex-col justify-between pb-20 md:pb-0">
        <DesktopNav />
        <div className="flex-1 flex flex-col items-center justify-center gap-3">
          <Info className="w-12 h-12 text-status-error" />
          <h3 className="font-bold text-ink">Pesanan Tidak Ditemukan</h3>
          <Link href="/dashboard">
            <Button>Kembali ke Beranda</Button>
          </Link>
        </div>
        <BottomNav />
      </div>
    );
  }

  const isCustomer = user?.role === "CUSTOMER";
  const isCollector = user?.role === "COLLECTOR";

  const partner = isCustomer ? order.collector : order.customer;
  const waNumber = partner?.phone ? partner.phone.replace(/[^0-9]/g, "") : "";
  const waLink = waNumber ? `https://wa.me/${waNumber.startsWith("0") ? "62" + waNumber.slice(1) : waNumber}` : "";

  // Event validation submit (Collector)
  const handleValidateSubmit = () => {
    if (!actualWeight || !agreedPrice) {
      toast.error("Mohon isi berat aktual dan harga per kg!");
      return;
    }
    
    const weightNum = Number(actualWeight);
    const priceNum = Number(agreedPrice);
    
    updateOrderStatus.mutate(
      {
        action: "validate",
        actualWeight: weightNum,
        agreedPrice: priceNum,
      },
      {
        onSuccess: () => {
          toast.success("Validasi timbangan berhasil dikirim! Menunggu konfirmasi customer...");
          refetch();
        },
        onError: (err: any) => {
          toast.error(err.response?.data?.message || "Gagal mengirim validasi.");
        },
      }
    );
  };

  // Event approval submit (Customer)
  const handleApproveSubmit = () => {
    updateOrderStatus.mutate(
      { action: "confirm" },
      {
        onSuccess: () => {
          toast.success("Transaksi disetujui! Pembayaran diproses.");
          refetch();
        },
        onError: (err: any) => {
          toast.error(err.response?.data?.message || "Gagal menyetujui transaksi.");
        },
      }
    );
  };

  const handleCancelOrder = () => {
    if (!window.confirm("Apakah Anda yakin ingin membatalkan pesanan ini?")) return;

    updateOrderStatus.mutate(
      { action: "cancel" },
      {
        onSuccess: () => {
          toast.success("Pesanan berhasil dibatalkan.");
          refetch();
        },
        onError: (err: any) => {
          toast.error(err.response?.data?.message || "Gagal membatalkan pesanan.");
        },
      }
    );
  };

  // Event rating submit
  const handleRatingSubmit = async () => {
    setRatingLoading(true);
    try {
      const rateeId = isCustomer ? order.collectorId : order.customerId;
      await api.post("/ratings", {
        order_id: order.id,
        ratee_id: rateeId,
        score: ratingScore,
        comment: ratingComment,
      });
      toast.success("Ulasan Anda berhasil dikirim!");
      setRatingSubmitted(true);
      setShowRating(false);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Gagal mengirim ulasan.");
    } finally {
      setRatingLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface pb-24 md:pb-8 flex flex-col">
      <DesktopNav />

      {/* MOBILE HEADER */}
      <header className="sticky top-0 z-50 bg-white border-b border-ink-faint px-4 py-4 flex items-center gap-4 md:hidden">
        <button onClick={() => router.back()} className="p-2 -ml-2 text-ink-muted hover:bg-surface-raised rounded-full transition-colors">
          <ArrowLeft size={24} />
        </button>
        <h1 className="font-display font-extrabold text-lg tracking-tight">Pelacakan Setoran</h1>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 md:px-8 py-6 space-y-6">
        
        {/* PROGRESS STEPPER BAR */}
        <section className="bg-white border border-ink-faint rounded-2xl p-6 shadow-sm">
          <h3 className="font-display font-bold text-sm text-ink-muted uppercase tracking-widest mb-6">Status Perjalanan</h3>
          
          <div className="relative flex justify-between items-center w-full">
            {statusFlow.map((s, idx) => {
              const isPassed = idx < currentStepIdx;
              const isCurrent = idx === currentStepIdx;
              const isFuture = idx > currentStepIdx;
              
              let label = "Menunggu";
              if (s === "CONFIRMED") label = "Diterima";
              if (s === "IN_PROGRESS") label = "Jemput";
              if (s === "AWAITING_CONFIRMATION") label = "Timbang";
              if (s === "COMPLETED") label = "Selesai";

              return (
                <div key={s} className="flex flex-col items-center gap-2 z-10">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${
                    isPassed 
                      ? "bg-brand-500 border-brand-500 text-white" 
                      : isCurrent 
                      ? "border-brand-500 text-brand-500 ring-4 ring-brand-100 animate-pulse" 
                      : "border-ink-faint bg-white text-ink-faint"
                  }`}>
                    {isPassed ? <CheckCircle size={16} /> : idx + 1}
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${isCurrent || isPassed ? "text-brand-600 font-extrabold" : "text-ink-muted"}`}>
                    {label}
                  </span>
                </div>
              );
            })}
            
            {/* Connecting Line */}
            <div className="absolute left-4 right-4 top-4 h-0.5 bg-surface-raised -z-0">
              <div 
                className="h-full bg-brand-500 transition-all duration-500" 
                style={{ width: `${(currentStepIdx / (statusFlow.length - 1)) * 100}%` }}
              />
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* LEFT COLUMN: DETAIL SETORAN */}
          <div className="lg:col-span-2 space-y-6">
            <section className="bg-white border border-ink-faint rounded-2xl p-6 shadow-sm space-y-6">
              <div className="flex justify-between items-start border-b border-surface-raised pb-4">
                <div>
                  <span className="text-[10px] font-bold text-ink-muted uppercase tracking-widest block font-mono">ID TRANSAKSI</span>
                  <span className="font-mono text-xs font-bold text-ink bg-surface-raised px-2.5 py-1 rounded-md border border-ink-faint mt-1 inline-block">
                    {order.id}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-ink-muted uppercase tracking-widest block text-right font-display">TANGGAL MASUK</span>
                  <span className="text-xs text-ink font-semibold mt-1 block">{formatDate(order.createdAt)}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-display font-extrabold text-sm text-ink uppercase tracking-wider">Detail Rongsokan</h4>
                  
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 bg-surface-raised p-3 rounded-xl border border-ink-faint">
                      <div className="w-10 h-10 bg-brand-50 text-brand-500 rounded-lg flex items-center justify-center shrink-0">
                        <Archive size={20} />
                      </div>
                      <div>
                        <span className="text-[9px] font-bold text-ink-muted uppercase tracking-wider block">Kategori</span>
                        <span className="text-xs font-extrabold text-ink">{order.category?.name || "Rongsokan"}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 bg-surface-raised p-3 rounded-xl border border-ink-faint">
                      <div className="w-10 h-10 bg-blue-50 text-blue-500 rounded-lg flex items-center justify-center shrink-0">
                        <Scale size={20} />
                      </div>
                      <div>
                        <span className="text-[9px] font-bold text-ink-muted uppercase tracking-wider block">Estimasi Berat</span>
                        <span className="text-xs font-extrabold text-ink font-mono">{order.estimatedWeight} kg</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 bg-surface-raised p-3 rounded-xl border border-ink-faint">
                      <div className="w-10 h-10 bg-purple-50 text-purple-500 rounded-lg flex items-center justify-center shrink-0">
                        <MapPin size={20} />
                      </div>
                      <div>
                        <span className="text-[9px] font-bold text-ink-muted uppercase tracking-wider block">Metode Penyerahan</span>
                        <span className="text-xs font-extrabold text-ink">{order.method === "PICKUP" ? "📦 Dijemput Kurir" : "🚶 Antar Sendiri"}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-display font-extrabold text-sm text-ink uppercase tracking-wider">Foto Rongsokan</h4>
                  {order.photoUrl ? (
                    <div className="relative border border-ink-faint rounded-xl overflow-hidden aspect-video bg-black flex items-center justify-center shadow-sm">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={order.photoUrl} alt="Rongsokan" className="max-w-full max-h-full object-contain" />
                    </div>
                  ) : (
                    <div className="border border-ink-faint border-dashed rounded-xl p-8 flex flex-col items-center text-center text-xs text-ink-muted bg-surface-raised">
                      <Archive size={28} className="text-ink-faint mb-2" />
                      Tidak ada foto yang diunggah.
                    </div>
                  )}
                </div>
              </div>
            </section>
          </div>

          {/* RIGHT COLUMN: ACTIONS, STATS & CONTACT */}
          <div className="space-y-6">
            
            {/* ACTION CARD: COLLECTOR WEIGH & VALIDATE */}
            {isCollector && order.status === "IN_PROGRESS" && (
              <section className="bg-white border-2 border-brand-500 rounded-2xl p-6 shadow-md space-y-4 animate-in fade-in zoom-in-95">
                <div className="flex items-center gap-2 text-brand-600">
                  <Scale size={20} className="animate-bounce" />
                  <h3 className="font-display font-extrabold text-sm uppercase tracking-wider">Form Timbangan Pengepul</h3>
                </div>
                <p className="text-xs text-ink-muted">
                  Silakan timbang sampah customer secara jujur dan masukkan berat aktual serta harga satuan per kg yang disepakati.
                </p>
                
                <div className="space-y-3 pt-2">
                  <div>
                    <label className="text-[10px] font-bold text-ink-muted uppercase tracking-widest mb-1.5 block">Berat Aktual (kg)</label>
                    <Input 
                      type="number" 
                      placeholder="Contoh: 5.4"
                      value={actualWeight}
                      onChange={(e) => setActualWeight(e.target.value)}
                      className="rounded-xl font-bold font-mono h-11"
                      step="0.1"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-ink-muted uppercase tracking-widest mb-1.5 block">Harga Satuan (Rp/kg)</label>
                    <Input 
                      type="number" 
                      placeholder="Contoh: 2000"
                      value={agreedPrice}
                      onChange={(e) => setAgreedPrice(e.target.value)}
                      className="rounded-xl font-bold font-mono h-11"
                    />
                  </div>
                </div>

                <Button 
                  onClick={handleValidateSubmit}
                  disabled={updateOrderStatus.isPending}
                  className="w-full py-3 shadow-md mt-2 font-bold"
                >
                  {updateOrderStatus.isPending ? "Mengirim..." : "Kirim Rincian Timbangan"}
                </Button>
              </section>
            )}

            {/* ACTION CARD: CUSTOMER REVIEW & APPROVAL */}
            {isCustomer && order.status === "AWAITING_CONFIRMATION" && (
              <section className="bg-white border-2 border-brand-500 rounded-2xl p-6 shadow-md space-y-4 animate-in fade-in zoom-in-95">
                <div className="flex items-center gap-2 text-brand-600">
                  <DollarSign size={20} className="animate-pulse" />
                  <h3 className="font-display font-extrabold text-sm uppercase tracking-wider">Persetujuan Transaksi</h3>
                </div>
                <p className="text-xs text-ink-muted leading-relaxed">
                  Pengepul telah menyelesaikan penimbangan. Periksa kembali detail timbangan di bawah ini:
                </p>

                <div className="bg-surface-raised border border-ink-faint rounded-xl p-4 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-ink-muted font-medium">Berat Timbangan:</span>
                    <span className="font-bold font-mono text-ink">{order.actualWeight} kg</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-ink-muted font-medium">Harga Sepakat:</span>
                    <span className="font-bold font-mono text-ink">{formatRupiah(order.agreedPrice || 0)} /kg</span>
                  </div>
                  <div className="border-t border-ink-faint pt-2 flex justify-between items-center text-sm">
                    <span className="text-ink font-bold">Total Pendapatan:</span>
                    <span className="font-black text-brand-600 font-mono text-base">
                      {formatRupiah((order.actualWeight || 0) * (order.agreedPrice || 0))}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button 
                    onClick={handleApproveSubmit}
                    disabled={updateOrderStatus.isPending}
                    className="w-full py-3 bg-status-success hover:bg-green-600 text-white font-bold shadow-md"
                  >
                    {updateOrderStatus.isPending ? "Memproses..." : "Setujui & Selesaikan"}
                  </Button>
                </div>
              </section>
            )}

            {/* PARTNER CONTACT CARD */}
            {partner && (
              <section className="bg-white border border-ink-faint rounded-2xl p-5 shadow-sm space-y-4">
                <h4 className="font-display font-extrabold text-xs text-ink-muted uppercase tracking-widest">
                  Hubungi {isCustomer ? "Mitra Pengepul" : "Customer"}
                </h4>
                
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 bg-brand-50 rounded-full flex items-center justify-center shrink-0 border border-brand-100">
                    <Phone className="text-brand-500" size={18} />
                  </div>
                  <div className="flex-1">
                    <h5 className="font-bold text-sm text-ink">{partner.name}</h5>
                    <p className="text-[10px] text-ink-muted mt-0.5">{partner.phone || "Tidak ada nomor WhatsApp"}</p>
                  </div>
                </div>

                {waLink && (
                  <a href={waLink} target="_blank" rel="noopener noreferrer" className="block">
                    <Button variant="outline" className="w-full py-2.5 text-xs font-bold border-brand-500 text-brand-600 hover:bg-brand-50 flex items-center justify-center gap-2">
                      <MessageSquare size={14} /> Hubungi via WhatsApp
                    </Button>
                  </a>
                )}
              </section>
            )}

            {/* CANCEL ORDER CARD */}
            {['PENDING', 'CONFIRMED', 'IN_PROGRESS'].includes(order.status) && (
              <section className="bg-white border border-ink-faint rounded-2xl p-5 shadow-sm space-y-3">
                <h4 className="font-display font-extrabold text-xs text-ink-muted uppercase tracking-widest">
                  Kelola Pesanan
                </h4>
                <p className="text-[11px] text-ink-muted leading-relaxed">
                  Apakah Anda salah memasukkan data atau ingin membatalkan transaksi ini?
                </p>
                <Button 
                  onClick={handleCancelOrder}
                  disabled={updateOrderStatus.isPending}
                  className="w-full py-2 bg-status-error hover:bg-red-600 border-transparent text-white font-bold shadow-sm text-xs cursor-pointer"
                >
                  {updateOrderStatus.isPending ? "Membatalkan..." : "Batalkan Pesanan"}
                </Button>
              </section>
            )}

            {/* DIGITAL RECEIPT (COMPLETED STATUS) */}
            {order.status === "COMPLETED" && (
              <section className="bg-white border border-ink-faint rounded-2xl p-6 shadow-sm space-y-4 relative overflow-hidden animate-in fade-in zoom-in-95">
                {/* Visual receipt border styling */}
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-brand-500 to-green-400" />
                
                <div className="flex justify-between items-center border-b border-surface-raised pb-3 pt-1">
                  <h4 className="font-display font-black text-sm text-ink uppercase tracking-wider flex items-center gap-1">
                    🧾 DIGITAL RECEIPT
                  </h4>
                  <span className="bg-green-50 text-status-success border border-green-200 rounded-md px-2 py-0.5 text-[9px] font-black uppercase tracking-wider">
                    LUNAS
                  </span>
                </div>

                <div className="space-y-2.5 font-mono text-[11px] text-ink-muted">
                  <div className="flex justify-between">
                    <span>Penjual:</span>
                    <span className="font-bold text-ink">{order.customer?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pengepul:</span>
                    <span className="font-bold text-ink">{order.collector?.name || order.collector?.collectorProfile?.shopName || "Mitra Pengepul"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Barang:</span>
                    <span className="font-bold text-ink">{order.category?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Berat Aktual:</span>
                    <span className="font-bold text-ink">{order.actualWeight} kg</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Harga Satuan:</span>
                    <span className="font-bold text-ink">{formatRupiah(order.agreedPrice || 0)} /kg</span>
                  </div>
                  
                  <div className="border-t border-dashed border-ink-faint my-3 pt-3 flex justify-between items-center text-sm font-sans">
                    <span className="text-ink font-bold">TOTAL BAYAR:</span>
                    <span className="font-black text-green-600 font-mono text-base">
                      {formatRupiah(order.totalPrice || (order.actualWeight || 0) * (order.agreedPrice || 0))}
                    </span>
                  </div>
                </div>

                {/* Impact stats (WOW aesthetic addition) */}
                <div className="bg-brand-50 border border-brand-100 rounded-xl p-3.5 mt-2 flex items-start gap-3">
                  <RefreshCw className="text-brand-500 shrink-0 mt-0.5" size={16} />
                  <div>
                    <h5 className="font-bold text-brand-900 text-xs">Dampak Ekologis Kamu</h5>
                    <p className="text-[10px] text-brand-700 leading-relaxed mt-0.5">
                      Dengan mendaur ulang {(order.actualWeight || 0).toFixed(1)} kg {order.category?.name.toLowerCase()}, Anda telah mencegah emisi karbon berbahaya dan menyelamatkan sumber daya alam!
                    </p>
                  </div>
                </div>
              </section>
            )}

          </div>

        </div>
      </main>

      {/* RATING DIALOG MODAL (COMPLETED ONLY) */}
      {showRating && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-ink/50 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl border border-ink-faint p-6 space-y-6 relative overflow-hidden animate-in zoom-in-95">
            <div className="absolute top-0 left-0 right-0 h-1 bg-brand-500" />
            
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-brand-50 rounded-full flex items-center justify-center text-brand-500 mx-auto shadow-inner">
                <Star className="fill-brand-500 text-transparent" size={24} />
              </div>
              <h3 className="font-display font-extrabold text-base text-ink">Beri Rating Setoran</h3>
              <p className="text-xs text-ink-muted leading-relaxed">
                Bagaimana pengalaman daur ulang Anda dengan <strong>{partner?.name}</strong>?
              </p>
            </div>

            {/* Stars Selector */}
            <div className="flex justify-center items-center gap-2 py-2">
              {[1, 2, 3, 4, 5].map((star) => {
                const isActive = ratingScore >= star;
                return (
                  <button
                    key={star}
                    onClick={() => setRatingScore(star)}
                    className="hover:scale-115 transition-transform"
                  >
                    <Star 
                      size={32} 
                      className={`transition-colors ${isActive ? 'fill-status-warning text-status-warning' : 'text-ink-faint hover:text-brand-300'}`} 
                    />
                  </button>
                );
              })}
            </div>

            {/* Comment Form */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-ink-muted uppercase tracking-widest block font-display">Ulasan Singkat (Opsional)</label>
              <textarea
                value={ratingComment}
                onChange={(e) => setRatingComment(e.target.value)}
                placeholder="Contoh: Sangat ramah, timbangan tepat..."
                className="w-full border border-ink-faint rounded-xl p-3 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 min-h-[70px]"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => setShowRating(false)}
                className="flex-1 py-2 text-xs font-bold"
                disabled={ratingLoading}
              >
                Nanti Saja
              </Button>
              <Button 
                onClick={handleRatingSubmit}
                className="flex-[2] py-2 text-xs font-bold shadow-md"
                disabled={ratingLoading}
              >
                {ratingLoading ? "Mengirim..." : "Kirim Ulasan"}
              </Button>
            </div>

          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
