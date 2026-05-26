"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Archive, Refresh, Tools, FileLines, DesktopPc,
  CheckCircle, Clock, CloseCircle,
  ChevronRight, WandMagicSparkles
} from "flowbite-react-icons/outline";
import BottomNav from "@/components/ui/BottomNav";
import DesktopNav from "@/components/ui/DesktopNav";
import { useOrdersList } from "@/hooks/useOrders";
import { useMe } from "@/hooks/useAuth";
import { useAuthStore } from "@/store/authStore";
import { formatRupiah, formatDate } from "@/lib/utils";

const categoryIcons: Record<string, any> = {
  Kardus: Archive,
  Plastik: Refresh,
  Logam: Tools,
  Kertas: FileLines,
  Elektronik: DesktopPc,
};

export default function OrdersPage() {
  const [filter, setFilter] = useState("Semua");
  const initFromStorage = useAuthStore((state) => state.initFromStorage);

  useEffect(() => {
    initFromStorage();
  }, [initFromStorage]);

  const { data: me } = useMe();
  const { data: orders, isLoading } = useOrdersList({
    role: me?.role === "COLLECTOR" ? "collector" : "customer",
    limit: 100,
  });

  const filters = ["Semua", "Berhasil", "Dalam Proses", "Dibatalkan"];

  const filteredOrders = orders?.filter((order) => {
    if (filter === "Berhasil") return order.status === "COMPLETED";
    if (filter === "Dalam Proses") return ["PENDING", "CONFIRMED", "IN_PROGRESS", "AWAITING_CONFIRMATION"].includes(order.status);
    if (filter === "Dibatalkan") return order.status === "CANCELLED";
    return true; // Semua
  }) || [];

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "PENDING":
        return "Mencari Pengepul";
      case "CONFIRMED":
        return "Diterima";
      case "IN_PROGRESS":
        return "Penjemputan";
      case "AWAITING_CONFIRMATION":
        return "Perlu Konfirmasi";
      case "COMPLETED":
        return "Berhasil";
      case "CANCELLED":
        return "Batal";
      default:
        return status;
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "bg-status-success/10 text-status-success";
      case "CANCELLED":
        return "bg-status-error/10 text-status-error";
      case "PENDING":
      case "CONFIRMED":
      case "IN_PROGRESS":
      case "AWAITING_CONFIRMATION":
        return "bg-status-warning/10 text-status-warning";
      default:
        return "bg-ink-faint/10 text-ink-muted";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return <CheckCircle size={12} />;
      case "CANCELLED":
        return <CloseCircle size={12} />;
      default:
        return <Clock size={12} />;
    }
  };

  return (
    <div className="min-h-screen bg-surface pb-24 md:pb-0">
      <DesktopNav />
      {/* MOBILE HEADER */}
      <header className="sticky top-0 z-40 bg-white border-b border-ink-faint px-4 py-4 flex items-center justify-between shadow-sm md:hidden">
        <h1 className="font-display font-extrabold text-lg tracking-tight text-ink">Riwayat Setoran</h1>
        <div className="w-8 h-8 bg-surface-raised rounded-full flex items-center justify-center">
          <Archive size={16} className="text-ink-muted" />
        </div>
      </header>

      {/* FILTERS */}
      <div className="bg-white border-b border-ink-faint px-4 py-3 flex gap-3 overflow-x-auto no-scrollbar sticky top-[61px] z-30">
        {filters.map((f) => (
          <button 
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${filter === f ? 'bg-brand-500 text-white shadow-md' : 'bg-surface-raised text-ink-muted hover:bg-brand-50 hover:text-brand-600'}`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* HISTORY LIST */}
      <main className="px-4 md:px-8 py-4 md:py-8 max-w-6xl mx-auto space-y-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Refresh className="w-8 h-8 text-brand-500 animate-spin" />
            <span className="text-xs font-bold text-ink-muted">Memuat riwayat setoran...</span>
          </div>
        ) : filteredOrders.length > 0 ? (
          filteredOrders.map((order) => {
            const Icon = categoryIcons[order.category?.name || ""] || WandMagicSparkles;
            const isCompleted = order.status === "COMPLETED";
            const isCancelled = order.status === "CANCELLED";
            
            return (
              <Link 
                href={`/orders/${order.id}`} 
                key={order.id} 
                className={`block bg-white rounded-xl border border-ink-faint p-4 shadow-sm hover:border-brand-300 transition-all cursor-pointer group ${isCancelled ? 'opacity-80' : ''}`}
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 bg-brand-50 text-brand-500 rounded-lg flex items-center justify-center shrink-0 border border-brand-100 ${isCancelled ? 'bg-surface-raised text-ink-muted border-ink-faint' : ''}`}>
                      <Icon size={20} />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-ink group-hover:text-brand-600 transition-colors capitalize">
                        Setor {order.category?.name || "Rongsokan"}
                      </h4>
                      <p className="text-[10px] text-ink-muted font-mono mt-0.5">{formatDate(order.createdAt)}</p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-md uppercase flex items-center gap-1 border border-transparent ${getStatusStyle(order.status)}`}>
                    {getStatusIcon(order.status)} {getStatusLabel(order.status)}
                  </span>
                </div>
                
                <div className="flex justify-between items-center pt-3 border-t border-ink-faint">
                  <div className="text-[10px] font-bold text-ink-muted uppercase tracking-widest">
                    {isCompleted 
                      ? (me?.role === "COLLECTOR" ? "Total Keluar" : "Total Cuan")
                      : isCancelled 
                      ? "Status Akhir"
                      : "Estimasi Berat"
                    }
                  </div>
                  <div className="flex items-center gap-2">
                    {isCompleted ? (
                      <span className="text-sm font-black text-brand-600 font-mono">
                        {formatRupiah(order.totalPrice || (order.actualWeight || 0) * (order.agreedPrice || 0))}
                      </span>
                    ) : isCancelled ? (
                      <span className="text-xs text-ink-muted font-bold font-sans">
                        Transaksi Dibatalkan
                      </span>
                    ) : (
                      <span className="text-sm font-extrabold text-ink font-mono">
                        {order.estimatedWeight} kg
                      </span>
                    )}
                    <ChevronRight size={16} className="text-ink-muted group-hover:text-brand-500 transition-all" />
                  </div>
                </div>
              </Link>
            );
          })
        ) : (
          <div className="bg-white border border-ink-faint border-dashed rounded-2xl p-12 flex flex-col items-center text-center shadow-sm">
            <div className="w-16 h-16 bg-surface rounded-full flex items-center justify-center mb-4 border border-ink-faint shadow-inner">
              <Archive size={32} className="text-ink-faint" />
            </div>
            <h4 className="font-bold text-ink">Belum ada riwayat transaksi</h4>
            <p className="text-xs text-ink-muted mt-1 max-w-xs leading-relaxed">
              API dari BE: Riwayat setoran untuk filter &quot;{filter}&quot; saat ini masih kosong di database.
            </p>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
