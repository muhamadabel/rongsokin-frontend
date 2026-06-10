"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import {
  RefreshCw,
  Wrench,
  Box,
  Wine,
  Tv,
  Droplets,
  ArrowLeft,
  MapPin,
  CheckCircle2,
  Truck,
  Sparkles,
  X,
  ChevronRight,
  Check,
  Lock,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { CameraCapture } from "@/components/ui/CameraCapture";
import DesktopNav from "@/components/ui/DesktopNav";
import BottomNav from "@/components/ui/BottomNav";
import { PageSkeleton } from "@/components/ui/Skeleton";
import { DEFAULT_COORDS, unitLabel } from "@/lib/utils";
import { uploadToCloudinary } from "@/lib/upload";
import { useCategoryTree } from "@/hooks/useDiscovery";
import { useCreateOrder, useOrdersList } from "@/hooks/useOrders";
import { useAuthStore } from "@/store/authStore";
import toast from "react-hot-toast";

// Ikon per kategori UTAMA (by name)
const mainIcon = (name: string): React.ComponentType<{ size?: number; className?: string }> => {
  if (name.includes("Plastik")) return RefreshCw;
  if (name.includes("Kertas") || name.includes("Kardus")) return Box;
  if (name.includes("Logam") || name.includes("Besi")) return Wrench;
  if (name.includes("Kaca") || name.includes("Botol")) return Wine;
  if (name.includes("Elektronik")) return Tv;
  return Droplets;
};

const STEPS = [
  { num: 1, label: "Kategori" },
  { num: 2, label: "Detail" },
  { num: 3, label: "Kurir" },
  { num: 4, label: "Konfirmasi" },
];

interface ItemDraft {
  categoryId: string;
  weight: string; // string biar input controlled
  notes: string;
}

export default function NewOrderPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <OrderForm />
    </Suspense>
  );
}

function OrderForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initCat = searchParams.get("category");
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (token && user?.role === "COLLECTOR") {
      router.replace("/collector");
    }
  }, [token, user, router]);

  const { mains, byId, isLoading: isCategoriesLoading } = useCategoryTree();
  const createOrder = useCreateOrder();

  // Anti-scam: PICKUP hanya untuk user yang sudah punya >=1 transaksi COMPLETED.
  // User baru wajib DROP-OFF dulu (antar sendiri) agar tidak ada pesanan jemput fiktif.
  // Saat loading, anggap BELUM punya (fail-safe ke DROPOFF).
  const { data: completedOrders, isLoading: isCompletedLoading } = useOrdersList({
    status: "COMPLETED",
    limit: 1,
  });
  const pickupUnlocked = (completedOrders?.length ?? 0) > 0;

  const [step, setStep] = useState(1);

  /** Kategori yang dipilih customer (1..N kategori) */
  const [items, setItems] = useState<ItemDraft[]>([]);
  const [photoUrl, setPhotoUrl] = useState(""); // URL final (Cloudinary) untuk submit
  const [photoPreview, setPhotoPreview] = useState(""); // dataUrl untuk preview
  const [method, setMethod] = useState<"PICKUP" | "DROPOFF" | "">("");
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);

  const [isUploading, setIsUploading] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  // Pre-select dari URL (?category=) — id atau nama kategori
  useEffect(() => {
    if (!initCat || mains.length === 0 || items.length > 0) return;
    const cat =
      mains.find((m) => m.id === initCat) ||
      mains.find((m) => m.name.toLowerCase() === initCat.toLowerCase()) ||
      byId[initCat];
    if (cat) {
      setItems([{ categoryId: cat.id, weight: "", notes: "" }]);
      setStep(2);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initCat, mains, byId]);

  // Kalau user memilih PICKUP lalu ternyata belum boleh (atau status berubah),
  // reset pilihan supaya tidak lolos ke langkah berikutnya.
  useEffect(() => {
    if (method === "PICKUP" && !pickupUnlocked) {
      setMethod("");
    }
  }, [method, pickupUnlocked]);

  // ── Toggle kategori (multi-select) ───────────────────────────────────────
  const toggleCategory = (catId: string) => {
    setItems((prev) => {
      const found = prev.find((it) => it.categoryId === catId);
      if (found) return prev.filter((it) => it.categoryId !== catId);
      return [...prev, { categoryId: catId, weight: "", notes: "" }];
    });
  };

  const setItemWeight = (catId: string, weight: string) => {
    setItems((prev) => prev.map((it) => (it.categoryId === catId ? { ...it, weight } : it)));
  };

  const setItemNotes = (catId: string, notes: string) => {
    setItems((prev) => prev.map((it) => (it.categoryId === catId ? { ...it, notes } : it)));
  };

  // ── Foto sampah (kamera live, anti fake-order) ───────────────────────────
  const handlePhotoCapture = async (blob: Blob, dataUrl: string) => {
    setPhotoPreview(dataUrl);
    setIsUploading(true);
    try {
      const { url } = await uploadToCloudinary(blob);
      setPhotoUrl(url);
    } catch {
      toast.error("Gagal mengunggah foto. Foto ulang ya.");
      setPhotoPreview("");
    } finally {
      setIsUploading(false);
    }
  };

  const clearPhoto = () => {
    setPhotoUrl("");
    setPhotoPreview("");
  };

  // ── Lokasi GPS ───────────────────────────────────────────────────────────
  const handleGetLocation = () => {
    setIsLocating(true);
    if (typeof window !== "undefined" && "geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLat(pos.coords.latitude);
          setLng(pos.coords.longitude);
          setIsLocating(false);
          toast.success("Lokasi GPS berhasil didapat!");
        },
        () => {
          setLat(DEFAULT_COORDS.lat);
          setLng(DEFAULT_COORDS.lng);
          setIsLocating(false);
          toast("Gagal GPS, memakai lokasi default Yogyakarta.", { icon: "📍" });
        },
        { timeout: 10000 }
      );
    } else {
      setLat(DEFAULT_COORDS.lat);
      setLng(DEFAULT_COORDS.lng);
      setIsLocating(false);
      toast("GPS tidak didukung, memakai lokasi default.", { icon: "📍" });
    }
  };

  // ── Submit ───────────────────────────────────────────────────────────────
  const handleSubmit = () => {
    if (items.length === 0 || !method || !lat || !lng) {
      toast.error("Mohon lengkapi semua data setoran.");
      return;
    }
    if (method === "PICKUP" && !pickupUnlocked) {
      toast.error("Transaksi pertama wajib antar sendiri (drop-off) untuk mencegah pesanan fiktif.");
      return;
    }
    if (!photoUrl) {
      toast.error("Foto tumpukan rongsok wajib diambil dari kamera.");
      return;
    }
    const invalidItem = items.find((it) => !it.weight || Number(it.weight) <= 0);
    if (invalidItem) {
      toast.error("Berat setiap kategori harus diisi & lebih dari 0.");
      return;
    }

    createOrder.mutate(
      {
        items: items.map((it) => ({
          categoryId: it.categoryId,
          estimatedWeight: Number(it.weight),
          notes: it.notes?.trim() || undefined,
        })),
        photoUrl: photoUrl || undefined,
        lat,
        lng,
        method: method as "PICKUP" | "DROPOFF",
      },
      {
        onSuccess: (res) => {
          toast.success("Setoran berhasil dibuat! Mencari pengepul…");
          const orderId = (res as any)?.data?.id || (res as any)?.id;
          router.push(orderId ? `/orders/${orderId}` : "/orders");
        },
        onError: (err: any) => {
          toast.error(err.response?.data?.message || "Gagal membuat setoran. Coba kembali.");
        },
      }
    );
  };

  // ── Derived ──────────────────────────────────────────────────────────────
  const canGoStep2 = items.length > 0;
  const canGoStep3 =
    items.length > 0 &&
    items.every((it) => Number(it.weight) > 0) &&
    !!photoUrl &&
    !isUploading;
  const canGoStep4 =
    !!method && (method === "DROPOFF" || pickupUnlocked) && !!lat && !!lng;
  const canSubmit = canGoStep2 && canGoStep3 && canGoStep4;

  if (!token) {
    router.push("/login");
    return null;
  }

  return (
    <div className="min-h-screen bg-surface pb-20 md:pb-0">
      <DesktopNav />

      <div className="max-w-lg mx-auto bg-surface-raised min-h-screen md:my-6 md:rounded-2xl md:min-h-0">
        {/* MOBILE HEADER */}
        <header className="sticky top-0 z-50 bg-surface-raised border-b border-ink-faint px-4 py-3 flex items-center gap-3 md:hidden md:rounded-t-2xl">
          <button
            onClick={() => (step > 1 ? setStep(step - 1) : router.back())}
            className="p-2 -ml-2 text-ink-muted hover:bg-surface rounded-full transition-colors"
          >
            <ArrowLeft size={22} />
          </button>
          <div className="flex-1">
            <h1 className="font-display font-extrabold text-base tracking-tight">Jual Rongsok</h1>
            <p className="text-[10px] text-mute font-bold">
              Langkah {step} dari {STEPS.length}
            </p>
          </div>
          <Link href="/dashboard" className="text-ink-muted p-2 hover:bg-surface rounded-full">
            <X size={18} />
          </Link>
        </header>

        {/* DESKTOP BACK */}
        <div className="hidden md:flex items-center gap-3 px-8 pt-6 pb-2">
          <button
            onClick={() => (step > 1 ? setStep(step - 1) : router.back())}
            className="flex items-center gap-2 text-sm font-bold text-ink-muted hover:text-ink transition-colors"
          >
            <ArrowLeft size={16} /> Kembali
          </button>
        </div>

        {/* STEP INDICATOR */}
        <div className="px-6 py-4 border-b border-ink-faint sticky top-[57px] md:static md:top-0 z-40 bg-surface-raised">
          <div className="flex items-center justify-between">
            {STEPS.map((s, idx) => (
              <React.Fragment key={s.num}>
                <div className="flex flex-col items-center gap-1.5">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-extrabold border-2 transition-all font-mono ${
                      step === s.num
                        ? "border-ink text-ink bg-brand-100"
                        : step > s.num
                        ? "bg-brand-500 border-brand-500 text-ink"
                        : "border-ink-faint text-ink-faint bg-surface-raised"
                    }`}
                  >
                    {step > s.num ? <CheckCircle2 size={14} /> : s.num}
                  </div>
                  <span
                    className={`text-[9px] font-bold uppercase tracking-widest ${
                      step >= s.num ? "text-ink" : "text-ink-faint"
                    }`}
                  >
                    {s.label}
                  </span>
                </div>
                {idx < STEPS.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-1 mb-5 transition-colors ${
                      step > s.num ? "bg-brand-500" : "bg-ink-faint"
                    }`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        <main className="p-6 md:p-8">
          {/* STEP 1: PILIH KATEGORI (multi-select) */}
          {step === 1 && (
            <div className="space-y-5">
              <h2 className="font-display text-2xl font-extrabold text-ink tracking-tight">
                Apa yang ingin kamu jual?
              </h2>
              <p className="text-sm text-ink-muted -mt-3">
                Pilih kategori yang sesuai. Bisa lebih dari satu.
              </p>

              {isCategoriesLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="rounded-2xl animate-pulse bg-surface h-16" />
                  ))}
                </div>
              ) : mains.length > 0 ? (
                <div className="space-y-2">
                  {mains.map((cat) => {
                    const Icon = mainIcon(cat.name);
                    const isSel = items.some((it) => it.categoryId === cat.id);
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => toggleCategory(cat.id)}
                        className={`w-full p-3.5 flex items-center gap-3 text-left rounded-2xl border transition-colors ${
                          isSel ? "border-ink bg-brand-100" : "border-ink-faint bg-surface-raised hover:border-ink"
                        }`}
                      >
                        <div
                          className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                            isSel ? "bg-brand-500 text-ink" : "bg-surface text-ink-muted"
                          }`}
                        >
                          <Icon size={20} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="font-bold text-sm text-ink block">
                            {cat.name}
                            {cat.unit && cat.unit !== "kg" && (
                              <span className="text-[10px] text-mute font-mono ml-1.5">/{cat.unit}</span>
                            )}
                          </span>
                          {cat.description && (
                            <span className="text-[11px] text-ink-muted leading-snug block mt-0.5">
                              {cat.description}
                            </span>
                          )}
                        </div>
                        <div
                          className={`w-5 h-5 rounded-md flex items-center justify-center border-2 shrink-0 ${
                            isSel ? "bg-brand-500 border-ink" : "border-ink-faint bg-surface-raised"
                          }`}
                        >
                          {isSel && <Check size={12} strokeWidth={3} className="text-ink" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-2xl p-8 text-center text-sm text-ink-muted bg-surface">
                  Belum ada kategori. Pastikan backend berjalan.
                </div>
              )}

              {/* Summary chips */}
              {items.length > 0 && (
                <div className="bg-surface rounded-2xl p-3 flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2 flex-wrap">
                    {items.map((it) => (
                      <span
                        key={it.categoryId}
                        className="bg-brand-500 text-ink text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5"
                      >
                        {byId[it.categoryId]?.name || "?"}
                        <button
                          onClick={() => toggleCategory(it.categoryId)}
                          className="hover:opacity-70"
                          aria-label="Hapus item"
                        >
                          <X size={12} strokeWidth={3} />
                        </button>
                      </span>
                    ))}
                  </div>
                  <span className="text-[11px] font-bold text-mute font-mono">
                    {items.length} dipilih
                  </span>
                </div>
              )}

              <Button
                className="w-full flex items-center justify-center gap-2"
                disabled={!canGoStep2}
                onClick={() => setStep(2)}
              >
                Lanjut ke Detail <ChevronRight size={18} />
              </Button>
            </div>
          )}

          {/* STEP 2: DETAIL & FOTO */}
          {step === 2 && (
            <div className="space-y-6">
              <h2 className="font-display text-2xl font-extrabold text-ink tracking-tight">
                Detail Barang
              </h2>

              {/* Estimasi per item */}
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-mute uppercase tracking-widest block">
                  Estimasi per Item <span className="text-status-error">*</span>
                </label>
                {items.map((it) => {
                  const leaf = byId[it.categoryId];
                  const parent = leaf?.parentId ? byId[leaf.parentId] : leaf;
                  const Icon = parent ? mainIcon(parent.name) : Sparkles;
                  const unit = unitLabel(leaf?.unit);
                  return (
                    <div key={it.categoryId} className="bg-surface rounded-2xl p-3 space-y-2.5">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 bg-brand-500 rounded-2xl flex items-center justify-center text-ink shrink-0">
                          <Icon size={18} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-bold text-sm text-ink truncate">
                              {leaf?.name || "?"}
                            </span>
                            <button
                              onClick={() => toggleCategory(it.categoryId)}
                              className="text-mute hover:text-status-error transition-colors text-[10px] font-bold"
                            >
                              Hapus
                            </button>
                          </div>
                          <div className="flex gap-2 mt-1.5">
                            <Input
                              type="number"
                              placeholder="0"
                              value={it.weight}
                              onChange={(e) => setItemWeight(it.categoryId, e.target.value)}
                              className="flex-1 font-bold font-mono py-2 text-center"
                              min="0.1"
                              step={unit === "pcs" ? "1" : "0.1"}
                            />
                            <div className="bg-surface-raised flex items-center justify-center px-3 rounded-md font-bold text-ink-muted text-xs uppercase">
                              {unit}
                            </div>
                          </div>
                        </div>
                      </div>
                      <Input
                        type="text"
                        placeholder={`Catatan (opsional) — mis. "sudah dilipat"`}
                        value={it.notes}
                        onChange={(e) => setItemNotes(it.categoryId, e.target.value)}
                        maxLength={120}
                        className="text-xs py-2"
                      />
                    </div>
                  );
                })}

                <button
                  onClick={() => setStep(1)}
                  className="w-full text-[11px] font-bold text-ink-muted hover:text-ink underline py-1 transition-colors"
                >
                  + Tambah / hapus item
                </button>
              </div>

              {/* Foto sampah — wajib, dari kamera (anti pesanan fiktif) */}
              <div>
                <label className="text-[10px] font-bold text-mute uppercase tracking-widest mb-2 block">
                  Foto Tumpukan Rongsok <span className="text-status-error">*</span>
                </label>
                {!photoPreview ? (
                  <>
                    <CameraCapture
                      onCapture={handlePhotoCapture}
                      facingMode="environment"
                      guide="free"
                      watermark="Rongsok.in"
                      hint="Foto langsung tumpukan sampah yang mau dijual. Galeri tidak diizinkan untuk mencegah pesanan fiktif."
                    />
                  </>
                ) : (
                  <div className="relative rounded-2xl overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={photoPreview} alt="Foto rongsok" className="w-full max-h-56 object-cover" />
                    {isUploading && (
                      <div className="absolute inset-0 bg-ink/50 flex flex-col items-center justify-center gap-2 text-white">
                        <RefreshCw size={28} className="animate-spin" />
                        <span className="text-xs font-bold">Mengunggah…</span>
                      </div>
                    )}
                    {!isUploading && (
                      <div className="absolute top-2 right-2 flex items-center gap-2">
                        <span className="bg-brand-500 text-ink px-2.5 py-1 rounded-full text-[11px] font-bold flex items-center gap-1">
                          <CheckCircle2 size={12} /> Foto siap
                        </span>
                        <button
                          onClick={clearPhoto}
                          className="bg-surface-raised text-status-error px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1"
                        >
                          <X size={12} /> Ulangi
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>
                  Kembali
                </Button>
                <Button
                  className="flex-[2] flex items-center justify-center gap-2"
                  disabled={!canGoStep3}
                  onClick={() => setStep(3)}
                >
                  Lanjut ke Kurir <ChevronRight size={18} />
                </Button>
              </div>
            </div>
          )}

          {/* STEP 3: METODE & LOKASI */}
          {step === 3 && (
            <div className="space-y-6">
              <h2 className="font-display text-2xl font-extrabold text-ink tracking-tight">
                Opsi Pengiriman
              </h2>

              {/* Anti-scam: transaksi pertama wajib drop-off */}
              {!pickupUnlocked && !isCompletedLoading && (
                <div className="bg-surface border border-ink-faint rounded-2xl p-3.5 flex items-start gap-3">
                  <ShieldCheck size={18} className="text-brand-700 shrink-0 mt-0.5" />
                  <p className="text-xs text-ink-muted leading-relaxed">
                    Transaksi pertamamu wajib <b className="text-ink">Antar Sendiri</b> ke lapak
                    pengepul. Opsi <b className="text-ink">dijemput</b> terbuka otomatis setelah 1×
                    transaksi selesai — ini mencegah pesanan jemput fiktif.
                  </p>
                </div>
              )}

              <div className="space-y-3">
                {(
                  [
                    {
                      value: "PICKUP",
                      title: "Minta Dijemput (Pick-up)",
                      desc: "Pengepul datang langsung ke lokasimu untuk mengambil barang.",
                      emoji: "📦",
                    },
                    {
                      value: "DROPOFF",
                      title: "Antar Sendiri (Drop-off)",
                      desc: "Kamu membawa barang langsung ke gudang/lapak pengepul.",
                      emoji: "🚶",
                    },
                  ] as const
                ).map((opt) => {
                  const locked = opt.value === "PICKUP" && !pickupUnlocked;
                  const selected = method === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      disabled={locked}
                      onClick={() => {
                        if (locked) return;
                        setMethod(opt.value);
                      }}
                      className={`w-full border rounded-2xl p-4 flex items-start gap-4 text-left transition-all ${
                        locked
                          ? "border-ink-faint bg-surface opacity-60 cursor-not-allowed"
                          : selected
                          ? "border-ink bg-brand-100"
                          : "border-ink-faint hover:border-ink"
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full border-2 mt-0.5 flex shrink-0 items-center justify-center ${
                          selected ? "border-ink" : "border-ink-faint"
                        }`}
                      >
                        {selected && <div className="w-2.5 h-2.5 bg-brand-500 rounded-full" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-sm text-ink mb-1 flex items-center gap-1.5 flex-wrap">
                          <span>
                            {opt.emoji} {opt.title}
                          </span>
                          {locked && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-ink-muted bg-surface-raised border border-ink-faint rounded-full px-2 py-0.5">
                              <Lock size={10} /> Terkunci
                            </span>
                          )}
                        </h3>
                        <p className="text-xs text-ink-muted">
                          {locked ? "Tersedia setelah 1× transaksi selesai." : opt.desc}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div>
                <label className="text-[10px] font-bold text-mute uppercase tracking-widest mb-2 block">
                  Lokasi Setoran <span className="text-status-error">*</span>
                </label>

                {lat && lng ? (
                  <div className="bg-brand-100 rounded-2xl p-4 flex items-start gap-3">
                    <MapPin className="text-brand-700 shrink-0 mt-0.5" size={20} />
                    <div className="flex-1">
                      <h4 className="font-bold text-sm text-brand-800">Lokasi Terkunci ✓</h4>
                      <p className="text-[11px] text-brand-700 font-mono mt-0.5">
                        {lat.toFixed(5)}, {lng.toFixed(5)}
                      </p>
                      <button
                        onClick={handleGetLocation}
                        className="text-[11px] font-bold text-ink underline mt-1"
                        disabled={isLocating}
                      >
                        {isLocating ? "Memperbarui…" : "Perbarui Lokasi GPS"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={handleGetLocation}
                    disabled={isLocating}
                    className="w-full border-2 border-dashed border-ink-faint hover:border-ink rounded-2xl py-6 flex flex-col items-center gap-2 transition-colors disabled:opacity-60"
                  >
                    {isLocating ? (
                      <RefreshCw size={24} className="animate-spin text-brand-700" />
                    ) : (
                      <MapPin size={24} className="text-ink-muted" />
                    )}
                    <span className="text-sm font-bold text-ink-muted">
                      {isLocating ? "Mendeteksi GPS…" : "Klik untuk deteksi lokasi GPS"}
                    </span>
                    <span className="text-xs text-ink-faint">
                      Atau gunakan lokasi default Yogyakarta
                    </span>
                  </button>
                )}

                {!lat && !lng && !isLocating && (
                  <button
                    onClick={() => {
                      setLat(DEFAULT_COORDS.lat);
                      setLng(DEFAULT_COORDS.lng);
                      toast("Memakai lokasi default Yogyakarta.", { icon: "📍" });
                    }}
                    className="w-full mt-2 text-xs font-bold text-ink underline"
                  >
                    Gunakan lokasi default Yogyakarta
                  </button>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <Button variant="outline" className="flex-1" onClick={() => setStep(2)}>
                  Kembali
                </Button>
                <Button
                  className="flex-[2] flex items-center justify-center gap-2"
                  disabled={!canGoStep4}
                  onClick={() => setStep(4)}
                >
                  Review Pesanan <ChevronRight size={18} />
                </Button>
              </div>
            </div>
          )}

          {/* STEP 4: KONFIRMASI */}
          {step === 4 && (
            <div className="space-y-6">
              <h2 className="font-display text-2xl font-extrabold text-ink tracking-tight">
                Konfirmasi Pesanan
              </h2>

              <div className="bg-surface rounded-2xl overflow-hidden">
                {photoPreview && (
                  <div className="relative h-36 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={photoPreview} alt="Foto rongsok" className="w-full h-full object-cover" />
                  </div>
                )}

                <div className="divide-y divide-ink-faint">
                  {/* Item list */}
                  <div className="px-5 py-4 space-y-2">
                    <span className="text-xs font-bold text-mute uppercase tracking-wider">
                      Item Setoran
                    </span>
                    {items.map((it) => {
                      const leaf = byId[it.categoryId];
                      const parent = leaf?.parentId ? byId[leaf.parentId] : leaf;
                      const Icon = parent ? mainIcon(parent.name) : Sparkles;
                      return (
                        <div key={it.categoryId} className="space-y-0.5">
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="w-6 h-6 bg-brand-500 rounded-lg flex items-center justify-center text-ink shrink-0">
                                <Icon size={14} />
                              </div>
                              <span className="text-sm font-bold text-ink truncate">
                                {leaf?.name || "?"}
                              </span>
                            </div>
                            <span className="text-sm font-bold text-ink font-mono shrink-0">
                              {it.weight} {unitLabel(leaf?.unit)}
                            </span>
                          </div>
                          {it.notes?.trim() && (
                            <p className="text-[11px] text-ink-muted italic pl-8 leading-snug">
                              “{it.notes.trim()}”
                            </p>
                          )}
                        </div>
                      );
                    })}
                    <div className="flex justify-between items-center pt-2 mt-2 border-t border-dashed border-ink-faint">
                      <span className="text-xs font-bold text-mute uppercase tracking-wider">
                        Jumlah Item
                      </span>
                      <span className="text-sm font-extrabold text-ink font-mono">
                        {items.length} item
                      </span>
                    </div>
                  </div>

                  <div className="px-5 py-4 flex items-center justify-between">
                    <span className="text-xs font-bold text-mute uppercase tracking-wider">
                      Metode
                    </span>
                    <span className="text-sm font-bold text-ink flex items-center gap-1.5">
                      <Truck size={14} className="text-brand-700" />
                      {method === "PICKUP" ? "Dijemput" : "Antar Sendiri"}
                    </span>
                  </div>

                  <div className="px-5 py-4 flex items-center justify-between">
                    <span className="text-xs font-bold text-mute uppercase tracking-wider">
                      Lokasi
                    </span>
                    <span className="text-xs font-mono text-ink-muted">
                      {lat?.toFixed(4)}, {lng?.toFixed(4)}
                    </span>
                  </div>

                  <div className="px-5 py-4 flex items-center justify-between">
                    <span className="text-xs font-bold text-mute uppercase tracking-wider">
                      Foto Live
                    </span>
                    <span className="text-xs font-bold text-ink">
                      {photoPreview ? "✓ Terlampir" : "—"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-brand-100 rounded-2xl p-4 text-xs text-brand-800 font-medium">
                💡 Pengepul yang menerima <b>semua</b> kategori di pesananmu akan dinotifikasi.
              </div>

              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setStep(3)}>
                  Kembali
                </Button>
                <Button
                  className="flex-[2] flex items-center justify-center gap-2"
                  disabled={!canSubmit || createOrder.isPending}
                  onClick={handleSubmit}
                >
                  {createOrder.isPending ? (
                    <>
                      <RefreshCw size={18} className="animate-spin" />
                      Memproses…
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={18} />
                      Kirim Pesanan
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </main>
      </div>

      <BottomNav />
    </div>
  );
}
