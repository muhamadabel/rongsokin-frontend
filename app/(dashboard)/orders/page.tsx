"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Archive,
  RefreshCw,
  Wrench,
  FileText,
  Monitor,
  CheckCircle2,
  Clock,
  XCircle,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import BottomNav from "@/components/ui/BottomNav";
import DesktopNav from "@/components/ui/DesktopNav";
import { useOrdersList } from "@/hooks/useOrders";
import { useMe } from "@/hooks/useAuth";
import { useAuthStore } from "@/store/authStore";
import {
  formatRupiah,
  formatDate,
  getOrderTotalEstWeight,
  getOrderTotalActualWeight,
  getOrderTotalPrice,
  getOrderCategoryLabel,
  getOrderItems,
} from "@/lib/utils";

const categoryIcons: Record<string, any> = {
  Kardus: Archive,
  Plastik: RefreshCw,
  Logam: Wrench,
  Kertas: FileText,
  Elektronik: Monitor,
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

  const filteredOrders =
    orders?.filter((order) => {
      if (filter === "Berhasil") return order.status === "COMPLETED";
      if (filter === "Dalam Proses")
        return ["PENDING", "CONFIRMED", "IN_PROGRESS", "AWAITING_CONFIRMATION"].includes(
          order.status
        );
      if (filter === "Dibatalkan") return order.status === "CANCELLED";
      return true;
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
        return "bg-brand-100 text-brand-800";
      case "CANCELLED":
        return "bg-status-error/10 text-status-error";
      default:
        return "bg-[#fff4cc] text-[#4a3b1c]";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return <CheckCircle2 size={12} />;
      case "CANCELLED":
        return <XCircle size={12} />;
      default:
        return <Clock size={12} />;
    }
  };

  return (
    <div className="min-h-screen bg-surface pb-24 md:pb-0">
      <DesktopNav />

      {/* MOBILE HEADER */}
      <header className="bg-surface-raised border-b border-ink-faint px-4 py-4 md:hidden">
        <h1 className="font-display font-extrabold text-lg tracking-tight text-ink">
          Riwayat Setoran
        </h1>
      </header>

      <main className="px-4 md:px-8 py-5 md:py-8 max-w-6xl mx-auto space-y-5">
        <h1 className="hidden md:block font-display text-3xl font-extrabold tracking-tight text-ink">
          Riwayat Setoran
        </h1>

        {/* FILTERS */}
        <div className="flex gap-2.5 overflow-x-auto no-scrollbar -mx-1 px-1">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-colors cursor-pointer border ${
                filter === f
                  ? "bg-brand-500 text-ink border-brand-500"
                  : "bg-surface-raised text-ink-muted border-ink-faint hover:border-ink"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-surface-raised rounded-2xl p-4 h-24 animate-pulse" />
            ))}
          </div>
        ) : filteredOrders.length > 0 ? (
          filteredOrders.map((order) => {
            const items = getOrderItems(order);
            const primaryName = items[0]?.category?.name || "";
            const Icon = categoryIcons[primaryName] || Sparkles;
            const isCompleted = order.status === "COMPLETED";
            const isCancelled = order.status === "CANCELLED";

            return (
              <Link
                href={`/orders/${order.id}`}
                key={order.id}
                className={`block bg-surface-raised rounded-2xl p-4 hover:bg-brand-100 transition-colors cursor-pointer group ${
                  isCancelled ? "opacity-70" : ""
                }`}
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-surface text-ink rounded-2xl flex items-center justify-center shrink-0 relative">
                      <Icon size={20} />
                      {items.length > 1 && (
                        <span className="absolute -top-1 -right-1 bg-brand-500 text-ink rounded-full text-[9px] font-extrabold w-4 h-4 flex items-center justify-center font-mono">
                          {items.length}
                        </span>
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-ink capitalize">
                        Setor {getOrderCategoryLabel(order)}
                      </h4>
                      <p className="text-[10px] text-mute font-mono mt-0.5">
                        {formatDate(order.createdAt)}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase flex items-center gap-1 ${getStatusStyle(
                      order.status
                    )}`}
                  >
                    {getStatusIcon(order.status)} {getStatusLabel(order.status)}
                  </span>
                </div>

                <div className="flex justify-between items-center pt-3 border-t border-dashed border-ink-faint">
                  <div className="text-[10px] font-bold text-mute uppercase tracking-widest">
                    {isCompleted
                      ? me?.role === "COLLECTOR"
                        ? "Total Keluar"
                        : "Total Cuan"
                      : isCancelled
                      ? "Status Akhir"
                      : "Estimasi Berat"}
                  </div>
                  <div className="flex items-center gap-2">
                    {isCompleted ? (
                      <span className="text-sm font-extrabold text-ink font-mono">
                        {formatRupiah(getOrderTotalPrice(order))}
                      </span>
                    ) : isCancelled ? (
                      <span className="text-xs text-mute font-semibold">Dibatalkan</span>
                    ) : (
                      <span className="text-sm font-extrabold text-ink font-mono">
                        {getOrderTotalEstWeight(order).toFixed(1)} kg
                      </span>
                    )}
                    <ChevronRight
                      size={16}
                      className="text-mute group-hover:text-ink transition-colors"
                    />
                  </div>
                </div>
              </Link>
            );
          })
        ) : (
          <div className="bg-surface-raised rounded-2xl p-12 flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-surface rounded-full flex items-center justify-center mb-4">
              <Archive size={28} className="text-ink-faint" />
            </div>
            <h4 className="font-bold text-ink">Belum ada transaksi</h4>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
