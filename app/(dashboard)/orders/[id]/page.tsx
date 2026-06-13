"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import DesktopNav from "@/components/ui/DesktopNav";
import BottomNav from "@/components/ui/BottomNav";
import {
  Archive,
  RefreshCw,
  Wrench,
  FileText,
  Monitor,
  Sparkles,
  CheckCircle2,
  MapPin,
  Phone,
  MessageSquare,
  Scale,
  Star,
  Info,
  ArrowLeft,
  Truck,
  Loader2,
  XCircle,
  Download,
  Navigation,
} from "lucide-react";

const categoryIcons: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  Kardus: Archive,
  Plastik: RefreshCw,
  Logam: Wrench,
  Kertas: FileText,
  Elektronik: Monitor,
};
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { OrderDetailSkeleton } from "@/components/ui/Skeleton";
import { useAuthStore } from "@/store/authStore";
import { useOrderDetails, useUpdateOrderStatus } from "@/hooks/useOrders";
import { getSocket } from "@/lib/socket";
import {
  formatRupiah,
  formatDate,
  formatDistance,
  haversineMeters,
  unitLabel,
  getOrderItems,
  getOrderTotalEstWeight,
  getOrderTotalActualWeight,
  getOrderTotalPrice,
  getOrderCategoryLabel,
} from "@/lib/utils";
import toast from "react-hot-toast";
import api from "@/lib/axios";
import EcoImpactModal from "@/components/features/eco-impact/EcoImpactModal";
import OrderRouteMap from "@/components/features/orders/OrderRouteMap";
import { useLiveTracking } from "@/hooks/useLiveTracking";
import { useUserRatings } from "@/hooks/useRatings";

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

  const statusFlow = ["PENDING", "CONFIRMED", "IN_PROGRESS", "AWAITING_CONFIRMATION", "COMPLETED"];
  const currentStepIdx = statusFlow.indexOf(order?.status || "PENDING");

  /** Form validate per-item: key = OrderItem.id atau categoryId fallback.
   *  rejected = pengepul menandai kategori ini tidak dibeli (mis. tidak laku). */
  const [validateForm, setValidateForm] = useState<
    Record<string, { actualWeight: string; agreedPrice: string; rejected?: boolean }>
  >({});

  const [ratingScore, setRatingScore] = useState(5);
  const [ratingComment, setRatingComment] = useState("");
  const [showRating, setShowRating] = useState(false);
  const [ratingSubmitted, setRatingSubmitted] = useState(false);
  const [ratingLoading, setRatingLoading] = useState(false);

  // Eco impact: modal apresiasi dampak ekologis (khusus customer) muncul saat order COMPLETED
  const [showEcoImpact, setShowEcoImpact] = useState(false);
  const [ecoImpactSeen, setEcoImpactSeen] = useState(false);

  useEffect(() => {
    if (!token || !id) return;
    const socket = getSocket(token);
    socket.emit("join_room", `order:${id}`);

    const handleStatusUpdate = (payload: { orderId: string; status: any }) => {
      if (payload.orderId === id) {
        refetch();
        toast.success(`Status pesanan diperbarui menjadi ${payload.status}!`, { icon: "🔔" });
      }
    };

    socket.on("order_status_update", handleStatusUpdate);
    socket.on("order_status_updated", handleStatusUpdate);

    return () => {
      socket.off("order_status_update", handleStatusUpdate);
      socket.off("order_status_updated", handleStatusUpdate);
    };
  }, [token, id, refetch]);

  // Cek apakah current user SUDAH pernah menilai order ini → jangan munculkan modal lagi.
  // Pakai ratings yang diterima partner (rateeId), cari yang raterId = aku & orderId = order ini.
  const rateeIdForCheck = order
    ? user?.role === "CUSTOMER"
      ? order.collectorId
      : order.customerId
    : undefined;
  const { data: partnerRatings, isLoading: ratingsLoading } = useUserRatings(
    rateeIdForCheck || undefined
  );
  const alreadyRated = !!partnerRatings?.some(
    (r) => r.orderId === id && r.raterId === user?.id
  );

  useEffect(() => {
    if (order?.status === "COMPLETED") {
      const isCustomerUser = user?.role === "CUSTOMER";
      // Customer: tampilkan kartu dampak ekologis dulu, baru rating setelah ditutup.
      if (isCustomerUser && !ecoImpactSeen) {
        setShowEcoImpact(true);
        setShowRating(false);
      } else if (!ratingSubmitted && !alreadyRated && !ratingsLoading) {
        setShowRating(true);
      }
    }
  }, [order?.status, user?.role, ecoImpactSeen, ratingSubmitted, alreadyRated, ratingsLoading]);

  // ── Sudah sampai (arrive) + live tracking ────────────────────────────────
  const arriveInFlight = useRef(false);
  const doArrive = (auto: boolean) => {
    if (arriveInFlight.current) return;
    arriveInFlight.current = true;
    updateOrderStatus.mutate(
      { action: "arrive" },
      {
        onSuccess: () => {
          toast.success(auto ? "Terdeteksi sudah sampai di lokasi! 📍" : "Ditandai sudah sampai!");
          refetch();
        },
        onError: (err: any) => {
          arriveInFlight.current = false;
          toast.error(err.response?.data?.message || "Gagal menandai sampai.");
        },
      }
    );
  };
  const livePos = useLiveTracking({
    order,
    orderId: id,
    role: user?.role,
    onAutoArrive: () => doArrive(true),
  });

  if (isLoading) {
    return <OrderDetailSkeleton />;
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-surface flex flex-col justify-between pb-20 md:pb-0">
        <DesktopNav />
        <div className="flex-1 flex flex-col items-center justify-center gap-3 px-6 text-center">
          <Info className="w-12 h-12 text-status-error" />
          <h3 className="font-display font-extrabold text-lg text-ink">Pesanan Tidak Ditemukan</h3>
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
  const partnerName =
    partner?.name ||
    partner?.collectorProfile?.shopName ||
    (isCustomer ? "Pengepul" : "Customer");
  const waNumber = partner?.phone ? partner.phone.replace(/[^0-9]/g, "") : "";
  const waLink = waNumber
    ? `https://wa.me/${waNumber.startsWith("0") ? "62" + waNumber.slice(1) : waNumber}`
    : "";

  // Kontak aktif: ada partner & order sedang berjalan (penjemputan/otw/timbang)
  const activeStatuses = ["CONFIRMED", "IN_PROGRESS", "AWAITING_CONFIRMATION"];
  const showContact = !!partner && activeStatuses.includes(order.status);

  // Peta rute antar/jemput (butuh koordinat kedua pihak dari getOrderDetails)
  const custLoc =
    order.customerLat != null && order.customerLng != null
      ? { lat: order.customerLat, lng: order.customerLng }
      : null;
  const collLoc =
    order.collectorLat != null && order.collectorLng != null
      ? { lat: order.collectorLat, lng: order.collectorLng }
      : null;
  const showRoute = activeStatuses.includes(order.status) && !!custLoc && !!collLoc;
  const routeDistance = showRoute ? haversineMeters(custLoc!, collLoc!) : 0;
  // Arah navigasi: PICKUP → pengepul menuju customer; DROPOFF → customer menuju lapak
  const navOrigin = order.method === "PICKUP" ? collLoc : custLoc;
  const navDest = order.method === "PICKUP" ? custLoc : collLoc;
  const navUrl =
    showRoute && navOrigin && navDest
      ? `https://www.google.com/maps/dir/?api=1&origin=${navOrigin.lat},${navOrigin.lng}&destination=${navDest.lat},${navDest.lng}&travelmode=driving`
      : "";

  // Fase OTW (CONFIRMED): pihak yang bergerak + tombol "Sudah Sampai"
  const moverIsCollector = order.method === "PICKUP";
  const iAmMover = moverIsCollector ? isCollector : isCustomer;
  const isOtw = order.status === "CONFIRMED";

  // Pesan hero per status
  const partnerLabel = isCustomer ? "Pengepul" : "Customer";
  const statusMeta: { title: string; desc: string; tone: "wait" | "active" | "done" | "cancel"; Icon: React.ComponentType<{ size?: number; className?: string }> } =
    order.status === "PENDING"
      ? {
          title: "Menunggu pengepul…",
          desc: "Pesananmu sedang ditawarkan ke pengepul terdekat. Mohon tunggu sebentar.",
          tone: "wait",
          Icon: Loader2,
        }
      : order.status === "CONFIRMED"
      ? {
          title:
            order.method === "PICKUP"
              ? isCustomer
                ? "Pengepul menuju lokasimu"
                : "Menuju lokasi customer"
              : isCustomer
              ? "Menuju lapak pengepul"
              : "Customer menuju lapakmu",
          desc: "Posisi dilacak langsung di peta. Tekan ‘Sudah Sampai’ kalau sudah tiba (cadangan bila GPS bermasalah).",
          tone: "active",
          Icon: Truck,
        }
      : order.status === "IN_PROGRESS"
      ? {
          title: "Sudah sampai di lokasi",
          desc: isCustomer
            ? "Pengepul sedang menimbang rongsokmu."
            : "Timbang rongsok lalu kirim rincian ke customer.",
          tone: "active",
          Icon: MapPin,
        }
      : order.status === "AWAITING_CONFIRMATION"
      ? {
          title: "Menunggu persetujuan timbangan",
          desc: isCustomer
            ? "Cek hasil timbangan & harga, lalu setujui untuk menyelesaikan."
            : "Menunggu customer menyetujui hasil timbangan.",
          tone: "active",
          Icon: Scale,
        }
      : order.status === "COMPLETED"
      ? {
          title: "Transaksi selesai 🎉",
          desc: "Terima kasih sudah mendaur ulang lewat Rongsok.in!",
          tone: "done",
          Icon: CheckCircle2,
        }
      : {
          title: "Pesanan dibatalkan",
          desc: "Pesanan ini sudah tidak aktif.",
          tone: "cancel",
          Icon: XCircle,
        };

  const heroTone =
    statusMeta.tone === "active"
      ? "bg-brand-100 border-brand-200"
      : statusMeta.tone === "done"
      ? "bg-brand-100 border-brand-200"
      : statusMeta.tone === "cancel"
      ? "bg-status-error/10 border-status-error/30"
      : "bg-surface border-ink-faint";

  const handleValidateSubmit = () => {
    const items = getOrderItems(order);
    const payloadItems = items.map((it) => {
      const key = it.id || it.categoryId;
      const form = validateForm[key];
      const rejected = !!form?.rejected;
      // Item ditolak (tidak dibeli) → kirim 0/0 supaya tidak masuk total bayar.
      return {
        id: it.id,
        actualWeight: rejected ? 0 : Number(form?.actualWeight || 0),
        agreedPrice: rejected ? 0 : Number(form?.agreedPrice || 0),
        rejected,
      };
    });

    const accepted = payloadItems.filter((p) => !p.rejected);
    if (accepted.length === 0) {
      toast.error("Minimal 1 kategori harus diterima. Kalau semua tidak laku, batalkan saja pesanannya.");
      return;
    }
    const invalid = accepted.find((p) => p.actualWeight <= 0 || p.agreedPrice <= 0);
    if (invalid) {
      toast.error("Isi berat & harga untuk kategori yang diterima, atau tandai 'Tidak diterima'.");
      return;
    }

    updateOrderStatus.mutate(
      {
        action: "validate",
        items: payloadItems.map(({ id, actualWeight, agreedPrice }) => ({
          id,
          actualWeight,
          agreedPrice,
        })),
      },
      {
        onSuccess: () => {
          toast.success("Validasi timbangan dikirim! Menunggu konfirmasi customer…");
          refetch();
        },
        onError: (err: any) => {
          toast.error(err.response?.data?.message || "Gagal mengirim validasi.");
        },
      }
    );
  };

  const setItemValidateField = (
    key: string,
    field: "actualWeight" | "agreedPrice",
    value: string
  ) => {
    setValidateForm((prev) => ({
      ...prev,
      [key]: { ...(prev[key] || { actualWeight: "", agreedPrice: "" }), [field]: value },
    }));
  };

  const toggleItemRejected = (key: string) => {
    setValidateForm((prev) => ({
      ...prev,
      [key]: {
        ...(prev[key] || { actualWeight: "", agreedPrice: "" }),
        rejected: !prev[key]?.rejected,
      },
    }));
  };

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

  const handleRatingSubmit = async () => {
    setRatingLoading(true);
    try {
      const rateeId = isCustomer ? order.collectorId : order.customerId;
      await api.post("/ratings", {
        orderId: order.id,
        rateeId,
        score: ratingScore,
        reviewText: ratingComment,
      });
      toast.success("Ulasan Anda berhasil dikirim!");
      setRatingSubmitted(true);
      setShowRating(false);
    } catch (error: any) {
      const status = error.response?.status;
      const msg: string = error.response?.data?.message || error.message || "";
      // Sudah pernah menilai order ini (unique orderId+raterId) → perlakukan sebagai selesai
      const isDuplicate =
        status === 409 || /unique|already|sudah|raterId|orderId/i.test(msg);
      if (isDuplicate) {
        toast("Kamu sudah memberi rating untuk transaksi ini. ⭐");
        setRatingSubmitted(true);
        setShowRating(false);
      } else {
        toast.error(msg || "Gagal mengirim ulasan.");
      }
    } finally {
      setRatingLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface pb-24 md:pb-8 flex flex-col">
      <DesktopNav />

      {/* MOBILE HEADER */}
      <header className="sticky top-0 z-50 bg-surface-raised border-b border-ink-faint px-4 py-4 flex items-center gap-4 md:hidden">
        <button
          onClick={() => router.back()}
          className="p-2 -ml-2 text-ink-muted hover:bg-surface rounded-full transition-colors"
        >
          <ArrowLeft size={22} />
        </button>
        <h1 className="font-display font-extrabold text-lg tracking-tight">Pelacakan Setoran</h1>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 md:px-8 py-6 space-y-6">
        {/* STATUS HERO + KONTAK WHATSAPP */}
        <section className={`rounded-2xl p-6 border ${heroTone}`}>
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-surface-raised flex items-center justify-center shrink-0 text-ink">
              <statusMeta.Icon
                size={24}
                className={order.status === "PENDING" ? "animate-spin text-brand-700" : "text-brand-700"}
              />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-display font-extrabold text-lg text-ink tracking-tight leading-tight">
                {statusMeta.title}
              </h2>
              <p className="text-sm text-ink-muted mt-1 leading-relaxed">{statusMeta.desc}</p>
            </div>
          </div>

          {showContact && (
            <div className="mt-4 flex flex-col sm:flex-row gap-2">
              {waLink ? (
                <a
                  href={waLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 block"
                >
                  <Button className="w-full flex items-center justify-center gap-2">
                    <MessageSquare size={18} /> Chat {partnerLabel} via WhatsApp
                  </Button>
                </a>
              ) : (
                <span className="flex-1 text-xs text-ink-muted bg-surface-raised rounded-xl px-3 py-2.5 text-center">
                  Nomor WhatsApp {partnerLabel.toLowerCase()} belum tersedia.
                </span>
              )}
              {partner?.phone && (
                <a href={`tel:${partner.phone}`} className="sm:w-auto block">
                  <Button variant="outline" className="w-full flex items-center justify-center gap-2">
                    <Phone size={18} /> Telepon
                  </Button>
                </a>
              )}
            </div>
          )}
        </section>

        {/* PETA RUTE ANTAR/JEMPUT */}
        {showRoute && custLoc && collLoc && (
          <section className="bg-surface-raised rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-display font-extrabold text-sm text-ink tracking-tight flex items-center gap-2">
                <Navigation size={16} className="text-brand-700" />
                {order.method === "PICKUP" ? "Rute Penjemputan" : "Rute Antar ke Lapak"}
              </h3>
              <span className="text-[11px] font-bold text-brand-700 font-mono">
                ± {formatDistance(routeDistance)}
              </span>
            </div>

            <OrderRouteMap customer={custLoc} collector={collLoc} live={isOtw ? livePos : null} />

            <div className="flex items-center gap-3 flex-wrap text-[11px] text-ink-muted">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-brand-500 border border-ink shrink-0" /> Customer
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-surface-raised border border-ink shrink-0" /> Pengepul
              </span>
              {isOtw && livePos && (
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-status-success shrink-0" /> Posisi sekarang
                </span>
              )}
            </div>

            <p className="text-[11px] text-ink-muted leading-relaxed">
              {order.method === "PICKUP"
                ? isCollector
                  ? "Arahkan ke lokasi customer untuk menjemput rongsok."
                  : "Pengepul sedang menuju lokasimu — pantau posisinya di peta."
                : isCustomer
                ? "Antar rongsokmu ke lapak pengepul mengikuti rute ini."
                : "Customer sedang menuju lapakmu — pantau posisinya di peta."}
            </p>

            {/* OTW: status live tracking + tombol Sudah Sampai (cadangan GPS) */}
            {isOtw && (
              <div className="space-y-2 border-t border-ink-faint pt-3">
                <div className="flex items-center gap-2 text-[11px] font-semibold rounded-xl px-3 py-2 bg-surface">
                  {livePos ? (
                    <>
                      <span className="inline-flex rounded-full h-2.5 w-2.5 bg-status-success shrink-0" />
                      <span className="text-ink">
                        Live tracking aktif{iAmMover ? " — lokasimu sedang dibagikan" : ""}
                      </span>
                    </>
                  ) : (
                    <span className="text-ink-muted">
                      {iAmMover
                        ? "Mengaktifkan GPS… izinkan akses lokasi untuk live tracking."
                        : "Menunggu posisi live dari lawan…"}
                    </span>
                  )}
                </div>
                {iAmMover ? (
                  <>
                    <Button
                      onClick={() => doArrive(false)}
                      disabled={updateOrderStatus.isPending}
                      className="w-full flex items-center justify-center gap-2 text-sm"
                    >
                      <MapPin size={16} /> Saya Sudah Sampai
                    </Button>
                    <p className="text-[10px] text-mute text-center leading-relaxed">
                      Status berubah otomatis saat terdeteksi dekat lokasi. Tombol ini cadangan
                      kalau GPS bermasalah.
                    </p>
                  </>
                ) : (
                  <p className="text-[11px] text-ink-muted text-center leading-relaxed">
                    Menunggu {partnerLabel.toLowerCase()} tiba di lokasi… posisinya terlihat di peta.
                  </p>
                )}
              </div>
            )}

            {navUrl && (
              <a href={navUrl} target="_blank" rel="noopener noreferrer" className="block">
                <Button
                  variant="outline"
                  className="w-full flex items-center justify-center gap-2 text-xs"
                >
                  <Navigation size={16} /> Buka Navigasi di Google Maps
                </Button>
              </a>
            )}
          </section>
        )}

        {/* OTW tanpa peta (koordinat belum lengkap) — tombol Sudah Sampai untuk pihak yang OTW */}
        {isOtw && !showRoute && (
          <section className="bg-surface-raised rounded-2xl p-5 space-y-3">
            <h3 className="font-display font-extrabold text-sm text-ink tracking-tight flex items-center gap-2">
              <MapPin size={16} className="text-brand-700" /> Konfirmasi Tiba di Lokasi
            </h3>
            {iAmMover ? (
              <>
                <p className="text-[11px] text-ink-muted leading-relaxed">
                  Peta rute tidak tersedia (lokasi belum lengkap). Tekan tombol saat kamu sudah
                  sampai di lokasi.
                </p>
                <Button
                  onClick={() => doArrive(false)}
                  disabled={updateOrderStatus.isPending}
                  className="w-full flex items-center justify-center gap-2 text-sm"
                >
                  <MapPin size={16} /> Saya Sudah Sampai
                </Button>
              </>
            ) : (
              <p className="text-[11px] text-ink-muted leading-relaxed">
                Menunggu {partnerLabel.toLowerCase()} tiba di lokasi…
              </p>
            )}
          </section>
        )}

        {/* PROGRESS STEPPER */}
        <section className="bg-surface-raised rounded-2xl p-6">
          <h3 className="font-display font-bold text-xs text-mute uppercase tracking-widest mb-6">
            Status Perjalanan
          </h3>

          <div className="relative flex justify-between items-center w-full">
            {statusFlow.map((s, idx) => {
              const isPassed = idx < currentStepIdx;
              const isCurrent = idx === currentStepIdx;

              let label = "Menunggu";
              if (s === "CONFIRMED") label = "Diterima";
              if (s === "IN_PROGRESS") label = "Sampai";
              if (s === "AWAITING_CONFIRMATION") label = "Timbang";
              if (s === "COMPLETED") label = "Selesai";

              return (
                <div key={s} className="flex flex-col items-center gap-2 z-10">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all font-mono text-xs font-bold ${
                      isPassed
                        ? "bg-brand-500 border-brand-500 text-ink"
                        : isCurrent
                        ? "border-ink text-ink bg-brand-100 ring-4 ring-brand-100"
                        : "border-ink-faint bg-surface-raised text-ink-faint"
                    }`}
                  >
                    {isPassed ? <CheckCircle2 size={16} /> : idx + 1}
                  </div>
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider ${
                      isCurrent || isPassed ? "text-ink" : "text-mute"
                    }`}
                  >
                    {label}
                  </span>
                </div>
              );
            })}

            <div className="absolute left-4 right-4 top-4 h-0.5 bg-surface-sunken -z-0">
              <div
                className="h-full bg-brand-500 transition-all duration-500"
                style={{ width: `${(currentStepIdx / (statusFlow.length - 1)) * 100}%` }}
              />
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT: DETAIL */}
          <div className="lg:col-span-2 space-y-6">
            <section className="bg-surface-raised rounded-2xl p-6 space-y-6">
              <div className="flex justify-between items-start border-b border-ink-faint pb-4">
                <div>
                  <span className="text-[10px] font-bold text-mute uppercase tracking-widest block">
                    ID Transaksi
                  </span>
                  <span className="font-mono text-xs font-bold text-ink bg-surface px-2.5 py-1 rounded-md mt-1 inline-block">
                    {order.id.slice(0, 12)}…
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-mute uppercase tracking-widest block">
                    Tanggal Masuk
                  </span>
                  <span className="text-xs text-ink font-semibold mt-1 block">
                    {formatDate(order.createdAt)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-display font-extrabold text-sm text-ink tracking-tight">
                    Detail Rongsokan
                  </h4>

                  {/* Item list */}
                  <div className="bg-surface rounded-2xl p-3 space-y-2">
                    {getOrderItems(order).map((it) => {
                      const Icon = (it.category && categoryIcons[it.category.name]) || Sparkles;
                      return (
                        <div
                          key={it.id || it.categoryId}
                          className="flex items-start gap-3 py-1.5"
                        >
                          <div className="w-9 h-9 bg-brand-500 rounded-2xl flex items-center justify-center text-ink shrink-0">
                            <Icon size={16} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="text-sm font-bold text-ink block truncate">
                              {it.category?.name || "Kategori"}
                            </span>
                            <span className="text-[10px] text-mute font-mono">
                              est. {it.estimatedWeight} {unitLabel(it.category?.unit)}
                              {it.actualWeight != null &&
                                ` · aktual ${it.actualWeight} ${unitLabel(it.category?.unit)}`}
                            </span>
                            {it.notes && (
                              <p className="text-[11px] text-ink-muted italic leading-snug mt-0.5">
                                “{it.notes}”
                              </p>
                            )}
                          </div>
                          {it.subtotal != null && (
                            <span className="text-xs font-bold text-ink font-mono shrink-0">
                              {formatRupiah(it.subtotal)}
                            </span>
                          )}
                        </div>
                      );
                    })}
                    <div className="border-t border-dashed border-ink-faint pt-2 flex justify-between items-center">
                      <span className="text-[10px] font-bold text-mute uppercase tracking-wider">
                        Jumlah Kategori
                      </span>
                      <span className="text-sm font-extrabold text-ink font-mono">
                        {getOrderItems(order).length}
                      </span>
                    </div>
                  </div>

                  {/* Metode */}
                  <div className="flex items-center gap-3 bg-surface p-3 rounded-2xl">
                    <div className="w-10 h-10 bg-surface-raised text-ink rounded-2xl flex items-center justify-center shrink-0">
                      <MapPin size={20} />
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-mute uppercase tracking-wider block">
                        Metode Penyerahan
                      </span>
                      <span className="text-xs font-extrabold text-ink">
                        {order.method === "PICKUP" ? "📦 Dijemput Kurir" : "🚶 Antar Sendiri"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-display font-extrabold text-sm text-ink tracking-tight">
                    Foto Rongsokan
                  </h4>
                  {order.photoUrl ? (
                    <div className="rounded-2xl overflow-hidden aspect-video bg-ink flex items-center justify-center">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={order.photoUrl}
                        alt="Rongsokan"
                        className="max-w-full max-h-full object-contain"
                      />
                    </div>
                  ) : (
                    <div className="bg-surface rounded-2xl p-8 flex flex-col items-center text-center text-xs text-ink-muted">
                      <Archive size={28} className="text-ink-faint mb-2" />
                      Tidak ada foto yang diunggah.
                    </div>
                  )}
                </div>
              </div>
            </section>
          </div>

          {/* RIGHT: ACTIONS */}
          <div className="space-y-6">
            {/* COLLECTOR VALIDATE — per item (setelah sampai di lokasi) */}
            {isCollector && order.status === "IN_PROGRESS" && (
              <section className="bg-surface-raised border border-ink rounded-2xl p-6 space-y-4">
                <div className="flex items-center gap-2 text-ink">
                  <Scale size={20} />
                  <h3 className="font-display font-extrabold text-sm tracking-tight">
                    Form Timbangan
                  </h3>
                </div>

                <div className="space-y-3">
                  {getOrderItems(order).map((it) => {
                    const key = it.id || it.categoryId;
                    const form = validateForm[key] || { actualWeight: "", agreedPrice: "" };
                    const aw = Number(form.actualWeight) || 0;
                    const ap = Number(form.agreedPrice) || 0;
                    const rejected = !!form.rejected;
                    return (
                      <div
                        key={key}
                        className={`rounded-2xl p-3 space-y-2.5 ${
                          rejected ? "bg-surface opacity-80" : "bg-surface"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className={`text-sm font-bold ${
                              rejected ? "text-ink-muted line-through" : "text-ink"
                            }`}
                          >
                            {it.category?.name || "Kategori"}
                            <span className="text-[10px] text-mute font-mono ml-1.5 no-underline">
                              est. {it.estimatedWeight} {unitLabel(it.category?.unit)}
                            </span>
                          </span>
                          <button
                            type="button"
                            onClick={() => toggleItemRejected(key)}
                            className={`shrink-0 text-[10px] font-bold rounded-full px-2.5 py-1 border transition-colors cursor-pointer ${
                              rejected
                                ? "bg-status-error/10 text-status-error border-status-error/40"
                                : "bg-surface-raised text-ink-muted border-ink-faint hover:border-ink"
                            }`}
                          >
                            {rejected ? "✓ Tidak diterima" : "Tidak diterima?"}
                          </button>
                        </div>
                        {it.notes && !rejected && (
                          <p className="text-[11px] text-ink-muted italic leading-snug -mt-1">
                            “{it.notes}”
                          </p>
                        )}

                        {rejected ? (
                          <div className="flex items-center gap-2 text-[11px] font-semibold text-status-error bg-status-error/5 rounded-xl px-3 py-2">
                            <XCircle size={14} className="shrink-0" />
                            Kategori ini tidak dibeli — tidak masuk total bayar.
                          </div>
                        ) : (
                          <>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="text-[9px] font-bold text-mute uppercase tracking-wider mb-1 block">
                                  Aktual ({unitLabel(it.category?.unit)})
                                </label>
                                <Input
                                  type="number"
                                  placeholder="0"
                                  value={form.actualWeight}
                                  onChange={(e) =>
                                    setItemValidateField(key, "actualWeight", e.target.value)
                                  }
                                  className="font-bold font-mono py-2 text-center"
                                  step="0.1"
                                />
                              </div>
                              <div>
                                <label className="text-[9px] font-bold text-mute uppercase tracking-wider mb-1 block">
                                  Harga (Rp/{unitLabel(it.category?.unit)})
                                </label>
                                <Input
                                  type="number"
                                  placeholder="0"
                                  value={form.agreedPrice}
                                  onChange={(e) =>
                                    setItemValidateField(key, "agreedPrice", e.target.value)
                                  }
                                  className="font-bold font-mono py-2 text-center"
                                />
                              </div>
                            </div>
                            {aw > 0 && ap > 0 && (
                              <div className="flex justify-between items-center pt-1 text-[11px]">
                                <span className="text-mute font-bold">Subtotal</span>
                                <span className="font-extrabold text-ink font-mono">
                                  {formatRupiah(aw * ap)}
                                </span>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Grand total preview */}
                {(() => {
                  const grandTotal = getOrderItems(order).reduce((sum, it) => {
                    const key = it.id || it.categoryId;
                    const form = validateForm[key];
                    if (form?.rejected) return sum;
                    return sum + (Number(form?.actualWeight) || 0) * (Number(form?.agreedPrice) || 0);
                  }, 0);
                  if (grandTotal <= 0) return null;
                  return (
                    <div className="bg-brand-100 rounded-2xl px-4 py-2.5 flex items-center justify-between">
                      <span className="text-xs font-bold text-brand-800">Total Bayar</span>
                      <span className="font-mono font-extrabold text-ink">
                        {formatRupiah(grandTotal)}
                      </span>
                    </div>
                  );
                })()}

                <Button
                  onClick={handleValidateSubmit}
                  disabled={updateOrderStatus.isPending}
                  className="w-full"
                >
                  {updateOrderStatus.isPending ? "Mengirim…" : "Kirim Rincian Timbangan"}
                </Button>
              </section>
            )}

            {/* CUSTOMER APPROVE */}
            {isCustomer && order.status === "AWAITING_CONFIRMATION" && (
              <section className="bg-surface-raised border border-ink rounded-2xl p-6 space-y-4">
                <div className="flex items-center gap-2 text-ink">
                  <CheckCircle2 size={20} />
                  <h3 className="font-display font-extrabold text-sm tracking-tight">
                    Persetujuan Transaksi
                  </h3>
                </div>
                <div className="bg-surface rounded-2xl p-4 space-y-2.5">
                  {getOrderItems(order).map((it) => {
                    const aw = it.actualWeight || 0;
                    const ap = it.agreedPrice || 0;
                    const subtotal = it.subtotal ?? aw * ap;
                    const itemRejected = aw === 0;
                    return (
                      <div key={it.id || it.categoryId} className="space-y-1">
                        <div className="flex justify-between text-xs gap-2">
                          <span
                            className={`font-bold ${
                              itemRejected ? "text-ink-muted line-through" : "text-ink"
                            }`}
                          >
                            {it.category?.name || "Kategori"}
                          </span>
                          {itemRejected ? (
                            <span className="font-bold text-status-error text-[11px] shrink-0">
                              Tidak diterima
                            </span>
                          ) : (
                            <span className="font-mono text-mute">
                              {aw} {unitLabel(it.category?.unit)} × {formatRupiah(ap)}
                            </span>
                          )}
                        </div>
                        {!itemRejected && (
                          <div className="flex justify-end">
                            <span className="font-bold font-mono text-ink text-xs">
                              {formatRupiah(subtotal)}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  <div className="border-t border-dashed border-ink-faint pt-2 flex justify-between items-center text-sm">
                    <span className="text-ink font-bold">Total Pendapatan</span>
                    <span className="font-extrabold text-ink font-mono text-base">
                      {formatRupiah(getOrderTotalPrice(order))}
                    </span>
                  </div>
                </div>
                <Button
                  onClick={handleApproveSubmit}
                  disabled={updateOrderStatus.isPending}
                  className="w-full"
                >
                  {updateOrderStatus.isPending ? "Memproses…" : "Setujui & Selesaikan"}
                </Button>
              </section>
            )}

            {/* PARTNER CONTACT */}
            {partner && (
              <section className="bg-surface-raised rounded-2xl p-5 space-y-4">
                <h4 className="font-display font-extrabold text-xs text-mute uppercase tracking-widest">
                  Hubungi {isCustomer ? "Mitra Pengepul" : "Customer"}
                </h4>
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 bg-brand-100 rounded-full flex items-center justify-center shrink-0">
                    <Phone className="text-brand-800" size={18} />
                  </div>
                  <div className="flex-1">
                    <h5 className="font-bold text-sm text-ink">{partner.name}</h5>
                    <p className="text-[10px] text-ink-muted mt-0.5">
                      {partner.phone || "Tidak ada nomor WhatsApp"}
                    </p>
                  </div>
                </div>
                {waLink && (
                  <a href={waLink} target="_blank" rel="noopener noreferrer" className="block">
                    <Button variant="outline" className="w-full text-xs flex items-center justify-center gap-2">
                      <MessageSquare size={14} /> Hubungi via WhatsApp
                    </Button>
                  </a>
                )}
              </section>
            )}

            {/* CANCEL */}
            {["PENDING", "CONFIRMED", "IN_PROGRESS"].includes(order.status) && (
              <section className="bg-surface-raised rounded-2xl p-5 space-y-3">
                <h4 className="font-display font-extrabold text-xs text-mute uppercase tracking-widest">
                  Kelola Pesanan
                </h4>
                <Button
                  variant="danger"
                  onClick={handleCancelOrder}
                  disabled={updateOrderStatus.isPending}
                  className="w-full text-xs"
                >
                  {updateOrderStatus.isPending ? "Membatalkan…" : "Batalkan Pesanan"}
                </Button>
              </section>
            )}

            {/* DIGITAL RECEIPT */}
            {order.status === "COMPLETED" && (
              <section className="bg-surface-raised rounded-t-2xl p-6 pb-8 space-y-4 relative receipt-edge">
                <div className="flex justify-between items-center border-b border-dashed border-ink-faint pb-3">
                  <h4 className="font-display font-extrabold text-sm text-ink uppercase tracking-wider flex items-center gap-1.5">
                    🧾 Digital Receipt
                  </h4>
                  <span className="bg-brand-500 text-ink rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-widest">
                    LUNAS
                  </span>
                </div>

                <div className="space-y-2 font-mono text-[11px] text-ink-muted">
                  <div className="flex justify-between gap-3">
                    <span>Penjual:</span>
                    <span className="font-bold text-ink text-right">{order.customer?.name}</span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span>Pengepul:</span>
                    <span className="font-bold text-ink text-right">
                      {order.collector?.name ||
                        order.collector?.collectorProfile?.shopName ||
                        "Mitra Pengepul"}
                    </span>
                  </div>

                  <div className="border-t border-dashed border-ink-faint my-3 pt-3 space-y-2">
                    {getOrderItems(order).map((it) => {
                      const aw = it.actualWeight || 0;
                      const ap = it.agreedPrice || 0;
                      const subtotal = it.subtotal ?? aw * ap;
                      const itemRejected = aw === 0;
                      return (
                        <div key={it.id || it.categoryId}>
                          <div className="flex justify-between gap-3">
                            <span
                              className={`font-bold ${
                                itemRejected ? "text-mute line-through" : "text-ink"
                              }`}
                            >
                              {it.category?.name || "Kategori"}
                            </span>
                            <span
                              className={`font-bold ${
                                itemRejected ? "text-status-error text-[10px]" : "text-ink"
                              }`}
                            >
                              {itemRejected ? "Tidak diterima" : formatRupiah(subtotal)}
                            </span>
                          </div>
                          {!itemRejected && (
                            <div className="flex justify-between gap-3 text-mute text-[10px]">
                              <span>
                                {aw} {unitLabel(it.category?.unit)} × {formatRupiah(ap)}
                              </span>
                            </div>
                          )}
                          {it.notes && (
                            <div className="text-mute text-[10px] italic pl-1 mt-0.5">
                              · {it.notes}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div className="border-t border-dashed border-ink-faint pt-3 flex justify-between items-center text-sm">
                    <span className="text-ink font-bold font-body">TOTAL BAYAR</span>
                    <span className="font-extrabold text-ink font-mono text-base">
                      {formatRupiah(getOrderTotalPrice(order))}
                    </span>
                  </div>
                </div>

                <div className="bg-brand-100 rounded-2xl p-3.5 flex flex-col gap-3">
                  <div className="flex items-start gap-3">
                    <RefreshCw className="text-brand-800 shrink-0 mt-0.5" size={16} />
                    <div>
                      <h5 className="font-bold text-brand-800 text-xs">Dampak Ekologis Kamu</h5>
                      <p className="text-[10px] text-brand-700 leading-relaxed mt-0.5">
                        Dengan mendaur ulang {getOrderTotalActualWeight(order).toFixed(1)} kg sampah
                        di pesanan ini, kamu mencegah emisi karbon berbahaya dan menyelamatkan
                        sumber daya alam!
                      </p>
                    </div>
                  </div>
                  {isCustomer && (
                    <button
                      onClick={() => setShowEcoImpact(true)}
                      className="w-full text-xs font-semibold py-2 px-3 flex items-center justify-center gap-1.5 border border-brand-800 text-brand-800 hover:bg-brand-200 rounded-2xl cursor-pointer transition-colors"
                    >
                      <Download size={14} /> Unduh Kartu Dampak
                    </button>
                  )}
                </div>
              </section>
            )}
          </div>
        </div>
      </main>

      {/* ECO IMPACT MODAL — apresiasi dampak ekologis (customer), muncul sebelum rating */}
      {showEcoImpact && (
        <EcoImpactModal
          customerName={order.customer?.name || "Kawan Rongsok"}
          actualWeight={getOrderTotalActualWeight(order)}
          orderId={order.id}
          avatarUrl={order.customer?.avatarUrl}
          onClose={() => {
            setShowEcoImpact(false);
            setEcoImpactSeen(true);
          }}
        />
      )}

      {/* RATING MODAL */}
      {showRating && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-ink/50 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-surface-raised rounded-2xl p-6 space-y-6">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-brand-100 rounded-full flex items-center justify-center text-brand-800 mx-auto">
                <Star className="fill-brand-500 text-brand-800" size={24} />
              </div>
              <h3 className="font-display font-extrabold text-base text-ink">Beri Rating Setoran</h3>
              <p className="text-xs text-ink-muted leading-relaxed">
                Bagaimana pengalaman daur ulangmu dengan <strong>{partner?.name}</strong>?
              </p>
            </div>

            <div className="flex justify-center items-center gap-2 py-2">
              {[1, 2, 3, 4, 5].map((star) => {
                const isActive = ratingScore >= star;
                return (
                  <button
                    key={star}
                    onClick={() => setRatingScore(star)}
                    className="hover:scale-110 transition-transform"
                  >
                    <Star
                      size={32}
                      className={`transition-colors ${
                        isActive
                          ? "fill-status-warning text-status-warning"
                          : "text-ink-faint"
                      }`}
                    />
                  </button>
                );
              })}
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-mute uppercase tracking-widest block">
                Ulasan Singkat (Opsional)
              </label>
              <textarea
                value={ratingComment}
                onChange={(e) => setRatingComment(e.target.value)}
                placeholder="Contoh: Sangat ramah, timbangan tepat…"
                className="w-full border border-ink rounded-md bg-surface-raised p-3 text-xs text-ink placeholder:text-mute focus:outline-none focus:ring-2 focus:ring-brand-500 min-h-[70px]"
              />
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowRating(false)}
                className="flex-1 text-xs"
                disabled={ratingLoading}
              >
                Nanti Saja
              </Button>
              <Button
                onClick={handleRatingSubmit}
                className="flex-[2] text-xs"
                disabled={ratingLoading}
              >
                {ratingLoading ? "Mengirim…" : "Kirim Ulasan"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* STICKY MOBILE CONTACT BAR — selalu kebuka selama proses berjalan */}
      {showContact && waLink && (
        <div className="fixed bottom-20 left-0 right-0 z-40 px-4 md:hidden">
          <div className="max-w-6xl mx-auto bg-surface-raised rounded-2xl border border-ink-faint p-2 flex gap-2 shadow-lg">
            <a href={waLink} target="_blank" rel="noopener noreferrer" className="flex-1 block">
              <Button className="w-full flex items-center justify-center gap-2">
                <MessageSquare size={18} /> Chat {partnerLabel}
              </Button>
            </a>
            {partner?.phone && (
              <a href={`tel:${partner.phone}`} className="block">
                <Button variant="outline" className="px-4 flex items-center justify-center">
                  <Phone size={18} />
                </Button>
              </a>
            )}
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
