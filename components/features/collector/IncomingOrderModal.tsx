"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  X,
  Star,
  Phone,
  MessageSquare,
  MapPin,
  Check,
  User as UserIcon,
  Eye,
  ShieldAlert,
  Navigation,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { VerifiedBadge } from "@/components/ui/VerifiedBadge";
import OrderRouteMap from "@/components/features/orders/OrderRouteMap";
import { useUpdateOrderStatus } from "@/hooks/useOrders";
import { getOrderItems, getOrderTotalEstWeight, formatDistance, googleMapsLink } from "@/lib/utils";
import { Order } from "@/types";
import toast from "react-hot-toast";

interface Props {
  order: Order;
  canAccept?: boolean;
  onClose: () => void;
  /** Dipanggil setelah order diterima/ditolak — parent menghapus dari antrean */
  onDone: (id: string) => void;
}

export default function IncomingOrderModal({ order, canAccept = true, onClose, onDone }: Props) {
  const router = useRouter();
  const [showPhoto, setShowPhoto] = useState(false);
  const updateOrderStatus = useUpdateOrderStatus(order.id);

  const customer = order.customer;
  const customerName = customer?.name || "Customer";
  const phone = customer?.phone || "";
  const waNumber = phone.replace(/[^0-9]/g, "");
  const waLink = waNumber
    ? `https://wa.me/${waNumber.startsWith("0") ? "62" + waNumber.slice(1) : waNumber}`
    : "";
  const rating = customer?.avgRating ?? 0;
  const ratingLabel = rating > 0 ? rating.toFixed(1) : "Baru";

  const customerCoords =
    order.customerLat != null && order.customerLng != null
      ? { lat: order.customerLat, lng: order.customerLng }
      : null;
  const collectorCoords =
    order.collectorLat != null && order.collectorLng != null
      ? { lat: order.collectorLat, lng: order.collectorLng }
      : null;
  const addressText = order.addressText || customer?.addressText || "";

  const items = getOrderItems(order);

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

  const handleReject = () => {
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
            Detail Pesanan
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
                <img src={customer.avatarUrl} alt={customerName} className="w-full h-full object-cover" />
              ) : (
                <UserIcon size={26} />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="font-display font-extrabold text-base text-ink flex items-center gap-1.5 flex-wrap">
                {customerName}
                {customer?.isVerified && <VerifiedBadge size="sm" />}
              </h4>
              <div className="flex items-center gap-3 mt-0.5">
                <span className="flex items-center gap-1 text-xs font-bold text-ink">
                  <Star size={12} className="fill-status-warning text-status-warning" />
                  {ratingLabel}
                </span>
                {order.distanceKm != null && (
                  <span className="flex items-center gap-1 text-xs font-bold text-brand-700 font-mono">
                    <Navigation size={11} /> {formatDistance(order.distanceKm * 1000)}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* KONTAK */}
          {(waLink || phone) && (
            <div className="flex gap-2">
              {waLink && (
                <a href={waLink} target="_blank" rel="noopener noreferrer" className="flex-1">
                  <Button variant="outline" className="w-full gap-2 py-2.5 text-sm">
                    <MessageSquare size={16} /> Chat WA
                  </Button>
                </a>
              )}
              {phone && (
                <a href={`tel:${phone}`} className="flex-1">
                  <Button className="w-full gap-2 py-2.5 text-sm">
                    <Phone size={16} /> Telepon
                  </Button>
                </a>
              )}
            </div>
          )}

          {/* ALAMAT */}
          {addressText && (
            <div className="bg-surface rounded-2xl p-3.5 flex items-start gap-2.5">
              <MapPin size={16} className="text-brand-700 shrink-0 mt-0.5" />
              <p className="text-sm text-ink leading-relaxed">{addressText}</p>
            </div>
          )}

          {/* PETA LOKASI (customer + pengepul) */}
          {customerCoords && (
            <div className="space-y-2">
              <OrderRouteMap
                customer={customerCoords}
                collector={collectorCoords ?? customerCoords}
                height={200}
              />
              <a
                href={googleMapsLink(customerCoords.lat, customerCoords.lng)}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                <Button variant="outline" className="w-full gap-2 py-2 text-xs">
                  <Navigation size={14} /> Rute ke lokasi customer (Google Maps)
                </Button>
              </a>
            </div>
          )}

          {/* FOTO LIVE */}
          {order.photoUrl ? (
            <button
              type="button"
              onClick={() => setShowPhoto(true)}
              className="relative w-full h-40 rounded-2xl overflow-hidden block"
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
            <div className="w-full rounded-2xl bg-status-error/10 border border-status-error/30 px-3 py-2.5 flex items-center gap-2">
              <ShieldAlert size={14} className="text-status-error shrink-0" />
              <span className="text-[11px] font-bold text-status-error">
                Tanpa foto live — waspadai pesanan fiktif.
              </span>
            </div>
          )}

          {/* ITEM SETORAN */}
          <div className="bg-surface rounded-2xl p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-mute uppercase tracking-widest">
                Item Setoran
              </span>
              <span className="text-[9px] font-extrabold uppercase tracking-wider bg-surface-raised text-ink-muted px-2 py-0.5 rounded-full">
                {order.method}
              </span>
            </div>
            {items.length > 0 ? (
              items.map((it) => (
                <div key={it.id || it.categoryId} className="flex items-center justify-between gap-3">
                  <span className="text-sm font-bold text-ink truncate">
                    {it.category?.name || "Rongsokan"}
                  </span>
                  <span className="text-sm font-bold text-ink font-mono shrink-0">
                    {(it.estimatedWeight || 0).toFixed(1)} kg
                  </span>
                </div>
              ))
            ) : (
              <span className="text-xs text-ink-muted">—</span>
            )}
            <div className="flex items-center justify-between pt-2 mt-1 border-t border-dashed border-ink-faint">
              <span className="text-xs font-bold text-mute uppercase tracking-wider">Total Est.</span>
              <span className="text-sm font-extrabold text-ink font-mono">
                {getOrderTotalEstWeight(order).toFixed(1)} kg
              </span>
            </div>
          </div>
        </div>

        {/* FOOTER AKSI */}
        <div className="sticky bottom-0 bg-surface-raised border-t border-ink-faint px-5 py-4 flex gap-3">
          <Button
            variant="outline"
            onClick={handleReject}
            disabled={updateOrderStatus.isPending}
            className="flex-1 gap-2"
          >
            <X size={16} /> Tolak
          </Button>
          <Button
            onClick={handleAccept}
            disabled={updateOrderStatus.isPending || !canAccept}
            className="flex-[2] gap-2"
          >
            <Check size={16} /> {updateOrderStatus.isPending ? "Memproses…" : "Ambil Pesanan"}
          </Button>
        </div>

        {/* Lightbox foto */}
        {showPhoto && order.photoUrl && (
          <div
            className="fixed inset-0 z-[160] bg-ink/90 flex items-center justify-center p-4"
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
    </div>
  );
}
