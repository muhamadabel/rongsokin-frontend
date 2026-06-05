"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Share2,
  MapPin,
  Clock,
  Star,
  Phone,
  MessageSquare,
  Archive,
  Wrench,
  RefreshCw,
  FileText,
  Monitor,
  Sparkles,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import DesktopNav from "@/components/ui/DesktopNav";
import BottomNav from "@/components/ui/BottomNav";
import { PengepulDetailSkeleton } from "@/components/ui/Skeleton";
import { useCollectorDetails, useWasteCategories } from "@/hooks/useDiscovery";
import { useUserRatings } from "@/hooks/useRatings";
import { formatRupiah, formatDate } from "@/lib/utils";
import toast from "react-hot-toast";

const categoryIcons: Record<string, any> = {
  Kardus: Archive,
  Plastik: RefreshCw,
  Logam: Wrench,
  Kertas: FileText,
  Elektronik: Monitor,
};

export default function PengepulDetailPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("harga");

  const { data: collector, isLoading: isCollectorLoading, error } = useCollectorDetails(id);
  const { data: categories, isLoading: isCategoriesLoading } = useWasteCategories();

  const collectorUserId = collector?.user?.id ?? (collector as { userId?: string } | undefined)?.userId;
  const { data: ratings, isLoading: isRatingsLoading } = useUserRatings(collectorUserId);

  if (isCollectorLoading || isCategoriesLoading) {
    return <PengepulDetailSkeleton />;
  }

  if (error || !collector) {
    return (
      <div className="min-h-screen bg-surface flex flex-col justify-between pb-24 md:pb-0">
        <DesktopNav />
        <div className="flex-1 flex flex-col items-center justify-center gap-3 px-6 text-center">
          <AlertCircle className="w-12 h-12 text-status-error" />
          <h3 className="font-display font-extrabold text-lg text-ink">
            Mitra Pengepul Tidak Ditemukan
          </h3>
          <p className="text-xs text-ink-muted max-w-xs">
            ID Pengepul tidak valid atau data telah dihapus.
          </p>
          <Button onClick={() => router.back()}>Kembali</Button>
        </div>
        <BottomNav />
      </div>
    );
  }

  const ratingAvg =
    ratings && ratings.length > 0
      ? ratings.reduce((s, r) => s + r.score, 0) / ratings.length
      : collector.user?.avgRating ?? null;
  const ratingCount = ratings?.length ?? 0;
  const ratingLabel = ratingAvg && ratingAvg > 0 ? ratingAvg.toFixed(1) : "Baru";

  const partnerPhone = collector.user?.phone || "";
  const waNumber = partnerPhone.replace(/[^0-9]/g, "");
  const waLink = waNumber
    ? `https://wa.me/${waNumber.startsWith("0") ? "62" + waNumber.slice(1) : waNumber}`
    : "";

  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Tautan profil lapak disalin!");
    }
  };

  return (
    <div className="min-h-screen bg-surface pb-28 md:pb-8 flex flex-col">
      <DesktopNav />

      <main className="flex-1 max-w-3xl w-full mx-auto md:px-8 md:pt-6">
        {/* MOBILE HEADER */}
        <header className="sticky top-0 z-50 bg-surface-raised border-b border-ink-faint px-4 py-3 flex items-center justify-between md:hidden">
          <button
            onClick={() => router.back()}
            className="p-2 -ml-2 text-ink-muted hover:bg-surface rounded-full transition-colors"
          >
            <ArrowLeft size={22} />
          </button>
          <h1 className="font-display font-extrabold text-sm uppercase tracking-widest text-ink">
            Detail Lapak
          </h1>
          <button
            onClick={handleShare}
            className="p-2 -mr-2 text-ink-muted hover:bg-surface rounded-full transition-colors"
          >
            <Share2 size={22} />
          </button>
        </header>

        {/* PROFILE CARD */}
        <section className="bg-surface-raised md:rounded-2xl overflow-hidden">
          <div className="h-28 md:h-40 bg-brand-100 relative">
            <button
              onClick={handleShare}
              className="hidden md:flex absolute top-4 right-4 bg-surface-raised hover:bg-surface text-ink p-2.5 rounded-2xl gap-1.5 items-center text-xs font-bold transition-colors"
            >
              <Share2 size={16} /> Bagikan
            </button>
            <div className="absolute -bottom-9 left-4 md:left-6 w-20 h-20 bg-surface-raised rounded-2xl border-4 border-surface-raised flex items-center justify-center text-ink">
              <Archive size={32} />
            </div>
          </div>
          <div className="px-4 md:px-6 pt-12 pb-5">
            <div className="flex justify-between items-start gap-3">
              <div className="space-y-1.5">
                <h2 className="text-xl md:text-2xl font-display font-extrabold text-ink flex flex-wrap items-center gap-2">
                  {collector.shopName}
                  {collector.isPremium && (
                    <span className="text-[10px] font-bold bg-brand-500 text-ink px-2 py-0.5 rounded-full uppercase tracking-wider">
                      Premium
                    </span>
                  )}
                </h2>
                <p className="text-xs md:text-sm text-ink-muted max-w-xl leading-relaxed">
                  {collector.description || "Mitra Pengepul Terpercaya Rongsok.in Yogyakarta."}
                </p>
              </div>

              <div className="hidden md:flex gap-3 shrink-0">
                {waLink && (
                  <a href={waLink} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" className="px-5">
                      <MessageSquare size={18} /> WhatsApp
                    </Button>
                  </a>
                )}
                {partnerPhone && (
                  <a href={`tel:${partnerPhone}`}>
                    <Button className="px-5">
                      <Phone size={18} /> Telepon
                    </Button>
                  </a>
                )}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mt-5">
              {[
                {
                  icon: Star,
                  label: ratingCount > 0 ? `Rating (${ratingCount})` : "Rating",
                  value: ratingLabel,
                  cls: "text-ink",
                },
                {
                  icon: Clock,
                  label: "Status",
                  value: collector.isOpen ? "BUKA" : "TUTUP",
                  cls: collector.isOpen ? "text-status-success" : "text-status-error",
                },
                {
                  icon: MapPin,
                  label: "Jangkauan",
                  value: `${collector.radiusKm} km`,
                  cls: "text-ink",
                },
              ].map((s) => (
                <div key={s.label} className="bg-surface rounded-2xl p-3">
                  <span className="text-[10px] text-mute font-bold uppercase tracking-wider flex items-center gap-1">
                    <s.icon size={11} /> {s.label}
                  </span>
                  <span className={`font-extrabold text-sm font-mono mt-1 block ${s.cls}`}>
                    {s.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* TABS */}
        <section className="bg-surface-raised mt-4 md:rounded-2xl">
          <div className="flex px-4 md:px-6 gap-6 border-b border-ink-faint">
            {[
              { id: "harga", label: "Daftar Harga" },
              { id: "ulasan", label: "Ulasan" },
              { id: "info", label: "Informasi" },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`py-4 text-sm font-bold border-b-2 transition-colors ${
                  activeTab === t.id
                    ? "border-ink text-ink"
                    : "border-transparent text-mute hover:text-ink"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="p-4 md:p-6">
            {activeTab === "harga" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {categories?.map((cat) => {
                  const IconComponent = categoryIcons[cat.name] || Sparkles;
                  const catalogItem = collector.catalogs?.find(
                    (c) => c.categoryId === cat.id && c.isActive
                  );
                  return (
                    <div
                      key={cat.id}
                      className="bg-surface rounded-2xl p-4 flex items-center gap-4"
                    >
                      <div className="w-12 h-12 bg-surface-raised text-ink rounded-2xl flex items-center justify-center shrink-0">
                        <IconComponent size={22} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-sm text-ink truncate">{cat.name}</h4>
                        {catalogItem ? (
                          <p className="text-ink font-extrabold font-mono mt-0.5 text-sm">
                            {formatRupiah(catalogItem.minPrice)} –{" "}
                            {formatRupiah(catalogItem.maxPrice)}
                            <span className="text-mute font-normal text-[10px] ml-1">/kg</span>
                          </p>
                        ) : (
                          <p className="text-mute text-[11px] font-semibold mt-0.5">
                            Harga belum diatur pengepul.
                          </p>
                        )}
                      </div>
                      {catalogItem && (
                        <Link href={`/orders/new?category=${cat.id}`}>
                          <Button className="px-4 py-2 h-auto text-xs">Jual</Button>
                        </Link>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {activeTab === "ulasan" && (
              <div className="space-y-3">
                {/* Ringkasan rating */}
                <div className="bg-surface rounded-2xl p-4 flex items-center gap-4">
                  <div className="text-center shrink-0">
                    <div className="font-display font-extrabold text-3xl text-ink font-mono">
                      {ratingLabel}
                    </div>
                    <div className="flex items-center gap-0.5 justify-center mt-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          size={11}
                          className={
                            ratingAvg && s <= Math.round(ratingAvg)
                              ? "fill-status-warning text-status-warning"
                              : "text-ink-faint"
                          }
                        />
                      ))}
                    </div>
                  </div>
                  <div className="text-xs text-ink-muted leading-relaxed">
                    {ratingCount > 0
                      ? `Berdasarkan ${ratingCount} ulasan dari customer yang pernah bertransaksi.`
                      : "Lapak ini belum menerima ulasan. Jadilah yang pertama setelah bertransaksi!"}
                  </div>
                </div>

                {/* Daftar ulasan */}
                {isRatingsLoading ? (
                  <div className="space-y-3">
                    {[1, 2].map((i) => (
                      <div key={i} className="bg-surface rounded-2xl h-20 animate-pulse" />
                    ))}
                  </div>
                ) : ratings && ratings.length > 0 ? (
                  ratings.map((r) => (
                    <div key={r.id} className="bg-surface rounded-2xl p-4">
                      <div className="flex justify-between items-start gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-full bg-brand-100 flex items-center justify-center text-brand-800 font-bold text-sm shrink-0">
                            {(r.rater?.name || "P").charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <h5 className="font-bold text-sm text-ink truncate">
                              {r.rater?.name || "Pengguna"}
                            </h5>
                            <span className="text-[10px] text-mute font-mono">
                              {formatDate(r.createdAt)}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-0.5 shrink-0">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              size={12}
                              className={
                                s <= r.score
                                  ? "fill-status-warning text-status-warning"
                                  : "text-ink-faint"
                              }
                            />
                          ))}
                        </div>
                      </div>
                      {r.reviewText && (
                        <p className="text-xs text-ink-muted leading-relaxed mt-2.5">
                          {r.reviewText}
                        </p>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-10">
                    <MessageSquare size={36} className="mx-auto text-ink-faint mb-3" />
                    <p className="text-xs text-ink-muted max-w-xs mx-auto">
                      Belum ada ulasan untuk lapak ini.
                    </p>
                  </div>
                )}
              </div>
            )}

            {activeTab === "info" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="bg-surface p-4 rounded-2xl">
                    <span className="text-mute font-bold uppercase tracking-wider text-[10px] block">
                      Pemilik Lapak
                    </span>
                    <span className="font-extrabold text-ink text-sm">
                      {collector.user?.name || "Mitra Pengepul"}
                    </span>
                  </div>
                  <div className="bg-surface p-4 rounded-2xl">
                    <span className="text-mute font-bold uppercase tracking-wider text-[10px] block">
                      Radius Layanan
                    </span>
                    <span className="font-extrabold text-ink text-sm font-mono">
                      {collector.radiusKm} Kilometer
                    </span>
                  </div>
                </div>
                <p className="text-xs text-ink-muted leading-relaxed">
                  Lokasi presisi lapak dibagikan setelah transaksi dibuat.
                </p>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* STICKY ACTION BAR (MOBILE) */}
      <div className="fixed bottom-20 left-0 right-0 z-40 px-4 md:hidden">
        <div className="max-w-3xl mx-auto bg-surface-raised rounded-2xl border border-ink-faint p-2 flex gap-2 shadow-lg">
          {waLink && (
            <a href={waLink} target="_blank" rel="noopener noreferrer" className="flex-1 block">
              <Button variant="outline" className="w-full gap-2">
                <MessageSquare size={18} /> Chat WA
              </Button>
            </a>
          )}
          {partnerPhone && (
            <a href={`tel:${partnerPhone}`} className="flex-[2] block">
              <Button className="w-full gap-2">
                <Phone size={18} /> Hubungi
              </Button>
            </a>
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
