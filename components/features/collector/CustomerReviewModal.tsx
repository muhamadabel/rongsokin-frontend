"use client";

import { useRouter } from "next/navigation";
import {
  X,
  Star,
  User as UserIcon,
  Check,
  Navigation,
  MessageSquare,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { VerifiedBadge } from "@/components/ui/VerifiedBadge";
import { useUpdateOrderStatus } from "@/hooks/useOrders";
import { useUserRatings } from "@/hooks/useRatings";
import { getOrderItems, getOrderTotalEstWeight, formatDistance, formatDate } from "@/lib/utils";
import { Order } from "@/types";
import toast from "react-hot-toast";

/** Bintang read-only untuk skor 0..5 */
function Stars({ score, size = 12 }: { score: number; size?: number }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          size={size}
          className={s <= Math.round(score) ? "fill-status-warning text-status-warning" : "text-ink-faint"}
        />
      ))}
    </span>
  );
}

interface Props {
  order: Order;
  canAccept?: boolean;
  onClose: () => void;
  /** Dipanggil setelah order diterima/ditolak — parent menghapus dari antrean */
  onDone: (id: string) => void;
}

/**
 * Detail customer + ULASAN & BINTANG yang customer terima dari pengepul lain,
 * supaya pengepul bisa menilai reputasi customer SEBELUM Terima/Tolak.
 */
export default function CustomerReviewModal({ order, canAccept = true, onClose, onDone }: Props) {
  const router = useRouter();
  const updateOrderStatus = useUpdateOrderStatus(order.id);

  const customer = order.customer;
  const customerId = customer?.id || order.customerId;
  const name = customer?.name || "Customer";
  const rating = customer?.avgRating ?? 0;
  const ratingLabel = rating > 0 ? rating.toFixed(1) : "Baru";

  const { data: reviews, isLoading: reviewsLoading } = useUserRatings(customerId);
  const items = getOrderItems(order);

  const accept = () => {
    if (!canAccept) {
      toast.error("Verifikasi KTP dulu sebelum menerima pesanan.");
      return;
    }
    updateOrderStatus.mutate(
      { action: "accept" },
      {
        onSuccess: () => {
          toast.success("Pesanan diterima! Mengarahkan ke pelacakan…");
          onDone(order.id);
          router.push(`/orders/${order.id}`);
        },
        onError: (err: unknown) => {
          const e = err as { response?: { data?: { message?: string } } };
          toast.error(e?.response?.data?.message || "Gagal menerima pesanan.");
        },
      }
    );
  };

  const reject = () => {
    updateOrderStatus.mutate(
      { action: "reject" },
      {
        onSuccess: () => {
          toast.success("Pesanan ditolak.");
          onDone(order.id);
        },
        onError: () => {
          toast.success("Pesanan ditolak.");
          onDone(order.id);
        },
      }
    );
  };

  return (
    <div
      className="fixed inset-0 z-[150] flex items-end md:items-center justify-center md:p-4 bg-ink/70 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-surface-raised rounded-t-2xl md:rounded-2xl shadow-2xl max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-surface-raised border-b border-ink-faint px-5 py-4 flex items-center justify-between">
          <h3 className="font-display font-extrabold text-base text-ink tracking-tight">
            Profil Customer
          </h3>
          <button
            onClick={onClose}
            className="p-2 -mr-2 text-ink-muted hover:bg-surface rounded-full transition-colors"
            aria-label="Tutup"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* PROFIL CUSTOMER */}
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-brand-100 overflow-hidden flex items-center justify-center text-ink shrink-0">
              {customer?.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={customer.avatarUrl} alt={name} className="w-full h-full object-cover" />
              ) : (
                <UserIcon size={26} />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="font-display font-extrabold text-base text-ink flex items-center gap-1.5 flex-wrap">
                {name}
                {customer?.isVerified && <VerifiedBadge size="sm" />}
              </h4>
              <div className="flex items-center gap-3 mt-0.5">
                <span className="flex items-center gap-1 text-xs font-bold text-ink">
                  <Stars score={rating} />
                  <span className="font-mono ml-0.5">{ratingLabel}</span>
                  {reviews && reviews.length > 0 && (
                    <span className="text-mute font-normal">({reviews.length})</span>
                  )}
                </span>
                {order.distanceKm != null && (
                  <span className="flex items-center gap-1 text-xs font-bold text-brand-700 font-mono">
                    <Navigation size={11} /> {formatDistance(order.distanceKm * 1000)}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* RINGKAS PESANAN */}
          <div className="bg-surface rounded-2xl p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-mute uppercase tracking-widest">
                Pesanan
              </span>
              <span className="text-[9px] font-extrabold uppercase tracking-wider bg-surface-raised text-ink-muted px-2 py-0.5 rounded-full">
                {order.method}
              </span>
            </div>
            {items.map((it) => (
              <div key={it.id || it.categoryId} className="flex items-center justify-between gap-3">
                <span className="text-sm font-bold text-ink truncate">
                  {it.category?.name || "Rongsokan"}
                </span>
                <span className="text-sm font-bold text-ink font-mono shrink-0">
                  {(it.estimatedWeight || 0).toFixed(1)} kg
                </span>
              </div>
            ))}
            <div className="flex items-center justify-between pt-2 mt-1 border-t border-dashed border-ink-faint">
              <span className="text-xs font-bold text-mute uppercase tracking-wider">Total Est.</span>
              <span className="text-sm font-extrabold text-ink font-mono">
                {getOrderTotalEstWeight(order).toFixed(1)} kg
              </span>
            </div>
          </div>

          {/* ULASAN CUSTOMER (dari pengepul lain) */}
          <div className="space-y-2">
            <h5 className="text-[10px] font-bold text-mute uppercase tracking-widest">
              Ulasan dari Pengepul Lain
            </h5>
            {reviewsLoading ? (
              <div className="flex items-center gap-2 text-xs text-ink-muted py-2">
                <Loader2 size={14} className="animate-spin" /> Memuat ulasan…
              </div>
            ) : reviews && reviews.length > 0 ? (
              <div className="space-y-2">
                {reviews.map((r) => (
                  <div key={r.id} className="bg-surface rounded-2xl p-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-7 h-7 rounded-full bg-brand-100 overflow-hidden flex items-center justify-center text-brand-800 font-bold text-[11px] shrink-0">
                          {r.rater?.avatarUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={r.rater.avatarUrl} alt={r.rater?.name || "P"} className="w-full h-full object-cover" />
                          ) : (
                            (r.rater?.name || "P").charAt(0).toUpperCase()
                          )}
                        </div>
                        <span className="text-xs font-bold text-ink truncate">
                          {r.rater?.name || "Pengepul"}
                        </span>
                      </div>
                      <Stars score={r.score} size={11} />
                    </div>
                    {r.reviewText && (
                      <p className="text-[11px] text-ink-muted leading-relaxed mt-1.5">{r.reviewText}</p>
                    )}
                    <span className="text-[9px] text-mute font-mono block mt-1">
                      {formatDate(r.createdAt)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-surface rounded-2xl p-4 text-center">
                <MessageSquare size={22} className="mx-auto text-ink-faint mb-1.5" />
                <p className="text-[11px] text-ink-muted">
                  Customer ini belum punya ulasan. Pertimbangkan foto & jaraknya.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* FOOTER AKSI */}
        <div className="sticky bottom-0 bg-surface-raised border-t border-ink-faint px-5 py-4 flex gap-3">
          <Button
            variant="outline"
            onClick={reject}
            disabled={updateOrderStatus.isPending}
            className="flex-1 gap-2"
          >
            <X size={16} /> Tolak
          </Button>
          <Button
            onClick={accept}
            disabled={updateOrderStatus.isPending || !canAccept}
            className="flex-[2] gap-2"
          >
            <Check size={16} /> {updateOrderStatus.isPending ? "Memproses…" : "Terima Pesanan"}
          </Button>
        </div>
      </div>
    </div>
  );
}
