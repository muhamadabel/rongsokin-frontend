"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Archive,
  RefreshCw,
  Wrench,
  FileText,
  Monitor,
  ArrowLeft,
  Camera,
  MapPin,
  CheckCircle2,
  Truck,
  Sparkles,
  X,
  ChevronRight,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import DesktopNav from "@/components/ui/DesktopNav";
import BottomNav from "@/components/ui/BottomNav";
import { DEFAULT_COORDS } from "@/lib/utils";
import { useWasteCategories } from "@/hooks/useDiscovery";
import { useCreateOrder } from "@/hooks/useOrders";
import { useAuthStore } from "@/store/authStore";
import toast from "react-hot-toast";

const categoryIcons: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  Kardus: Archive,
  Plastik: RefreshCw,
  Logam: Wrench,
  Kertas: FileText,
  Elektronik: Monitor,
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
    <Suspense
      fallback={
        <div className="min-h-screen bg-surface flex items-center justify-center">
          <RefreshCw className="w-10 h-10 text-brand-700 animate-spin" />
        </div>
      }
    >
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

  const { data: dbCategories, isLoading: isCategoriesLoading } = useWasteCategories();
  const createOrder = useCreateOrder();

  const [step, setStep] = useState(1);

  /** Items yang dipilih customer (1..N kategori) */
  const [items, setItems] = useState<ItemDraft[]>([]);
  const [photoUrl, setPhotoUrl] = useState("");
  const [method, setMethod] = useState<"PICKUP" | "DROPOFF" | "">("");
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);

  const [isUploading, setIsUploading] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  // Pre-select kategori dari URL (?category=<id>)
  useEffect(() => {
    if (initCat && dbCategories && items.length === 0) {
      const cat = dbCategories.find((c) => c.id === initCat || c.name.toLowerCase() === initCat.toLowerCase());
      if (cat) {
        setItems([{ categoryId: cat.id, weight: "", notes: "" }]);
        setStep(2);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initCat, dbCategories]);

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

  // ── Upload foto ──────────────────────────────────────────────────────────
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Foto terlalu besar. Maksimal 5MB.");
      return;
    }

    setIsUploading(true);
    try {
      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
      const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

      if (!cloudName || !uploadPreset) {
        const localUrl = URL.createObjectURL(file);
        setPhotoUrl(localUrl);
        toast.success("Foto berhasil dipilih! (Mode demo)");
        return;
      }

      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", uploadPreset);

      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (data.secure_url) {
        setPhotoUrl(data.secure_url);
        toast.success("Foto berhasil diunggah!");
      } else {
        throw new Error(data.error?.message || "Upload failed");
      }
    } catch {
      toast.error("Gagal upload foto. Coba lagi.");
    } finally {
      setIsUploading(false);
    }
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
  const totalWeight = items.reduce((s, it) => s + (Number(it.weight) || 0), 0);
  const canGoStep2 = items.length > 0;
  const canGoStep3 = items.length > 0 && items.every((it) => Number(it.weight) > 0);
  const canGoStep4 = !!method && !!lat && !!lng;
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
          {/* STEP 1: PILIH KATEGORI (MULTI) */}
          {step === 1 && (
            <div className="space-y-6">
              <h2 className="font-display text-2xl font-extrabold text-ink tracking-tight">
                Apa yang ingin kamu jual?
              </h2>
              <p className="text-sm text-ink-muted -mt-3">
                Bisa pilih lebih dari satu kategori sekaligus.
              </p>

              {isCategoriesLoading ? (
                <div className="grid grid-cols-2 gap-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="rounded-2xl p-6 animate-pulse bg-surface h-28" />
                  ))}
                </div>
              ) : dbCategories && dbCategories.length > 0 ? (
                <div className="grid grid-cols-2 gap-3">
                  {dbCategories.map((cat) => {
                    const Icon = categoryIcons[cat.name] || Sparkles;
                    const isSelected = items.some((it) => it.categoryId === cat.id);
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => toggleCategory(cat.id)}
                        className={`relative border rounded-2xl p-5 flex flex-col items-center gap-3 cursor-pointer transition-all ${
                          isSelected
                            ? "border-ink bg-brand-100"
                            : "border-ink-faint hover:border-ink bg-surface-raised"
                        }`}
                      >
                        {/* Checkmark indikator multi-select */}
                        <div
                          className={`absolute top-3 right-3 w-5 h-5 rounded-md flex items-center justify-center border-2 transition-colors ${
                            isSelected ? "bg-brand-500 border-ink" : "border-ink-faint bg-surface-raised"
                          }`}
                        >
                          {isSelected && <Check size={12} strokeWidth={3} className="text-ink" />}
                        </div>
                        <div
                          className={`w-12 h-12 rounded-full flex items-center justify-center ${
                            isSelected ? "bg-brand-500 text-ink" : "bg-surface text-ink-muted"
                          }`}
                        >
                          <Icon size={24} />
                        </div>
                        <span className="text-sm font-bold text-ink">{cat.name}</span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-2xl p-8 text-center text-sm text-ink-muted bg-surface">
                  Tidak bisa memuat kategori. Pastikan backend berjalan.
                </div>
              )}

              {/* Summary bar saat ada pilihan */}
              {items.length > 0 && (
                <div className="bg-surface rounded-2xl p-3 flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2 flex-wrap">
                    {items.map((it) => {
                      const cat = dbCategories?.find((c) => c.id === it.categoryId);
                      return (
                        <span
                          key={it.categoryId}
                          className="bg-brand-500 text-ink text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5"
                        >
                          {cat?.name || "?"}
                          <button
                            onClick={() => toggleCategory(it.categoryId)}
                            className="hover:opacity-70"
                            aria-label="Hapus kategori"
                          >
                            <X size={12} strokeWidth={3} />
                          </button>
                        </span>
                      );
                    })}
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

              {/* Weight per kategori */}
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-mute uppercase tracking-widest block">
                  Estimasi Berat per Kategori <span className="text-status-error">*</span>
                </label>
                {items.map((it) => {
                  const cat = dbCategories?.find((c) => c.id === it.categoryId);
                  const Icon = (cat && categoryIcons[cat.name]) || Sparkles;
                  return (
                    <div
                      key={it.categoryId}
                      className="bg-surface rounded-2xl p-3 space-y-2.5"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 bg-brand-500 rounded-2xl flex items-center justify-center text-ink shrink-0">
                          <Icon size={18} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-bold text-sm text-ink truncate">
                              {cat?.name || "?"}
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
                              step="0.1"
                            />
                            <div className="bg-surface-raised flex items-center justify-center px-3 rounded-md font-bold text-ink-muted text-xs">
                              KG
                            </div>
                          </div>
                        </div>
                      </div>
                      <Input
                        type="text"
                        placeholder={`Catatan ${cat?.name || ""} (opsional) — mis. "sudah dilipat"`}
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
                  + Tambah / hapus kategori
                </button>

                {totalWeight > 0 && (
                  <div className="bg-brand-100 rounded-2xl px-4 py-2.5 flex items-center justify-between">
                    <span className="text-xs font-bold text-brand-800">Total berat estimasi</span>
                    <span className="font-mono font-extrabold text-ink">
                      {totalWeight.toFixed(1)} kg
                    </span>
                  </div>
                )}
              </div>

              {/* Foto */}
              <div>
                <label className="text-[10px] font-bold text-mute uppercase tracking-widest mb-2 block">
                  Foto Barang{" "}
                  <span className="text-ink-faint normal-case font-medium">
                    (opsional, maks 5MB)
                  </span>
                </label>
                {!photoUrl ? (
                  <label
                    className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center gap-3 cursor-pointer transition-colors ${
                      isUploading
                        ? "border-brand-500 bg-brand-100"
                        : "border-ink-faint hover:border-ink hover:bg-surface"
                    }`}
                  >
                    {isUploading ? (
                      <RefreshCw size={36} className="animate-spin text-brand-700" />
                    ) : (
                      <Camera size={36} className="text-ink-faint" />
                    )}
                    <span className="text-xs font-bold text-ink-muted text-center">
                      {isUploading ? "Mengunggah foto…" : "Klik untuk ambil atau pilih foto"}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileUpload}
                      disabled={isUploading}
                    />
                  </label>
                ) : (
                  <div className="relative rounded-2xl overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={photoUrl} alt="Preview" className="w-full max-h-48 object-cover" />
                    <button
                      onClick={() => setPhotoUrl("")}
                      className="absolute top-2 right-2 bg-surface-raised text-status-error px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1"
                    >
                      <X size={12} /> Hapus
                    </button>
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
                ).map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setMethod(opt.value)}
                    className={`w-full border rounded-2xl p-4 flex items-start gap-4 text-left transition-all ${
                      method === opt.value
                        ? "border-ink bg-brand-100"
                        : "border-ink-faint hover:border-ink"
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full border-2 mt-0.5 flex shrink-0 items-center justify-center ${
                        method === opt.value ? "border-ink" : "border-ink-faint"
                      }`}
                    >
                      {method === opt.value && <div className="w-2.5 h-2.5 bg-brand-500 rounded-full" />}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-ink mb-1">
                        {opt.emoji} {opt.title}
                      </h3>
                      <p className="text-xs text-ink-muted">{opt.desc}</p>
                    </div>
                  </button>
                ))}
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
                {photoUrl && (
                  <div className="relative h-36 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={photoUrl} alt="Foto barang" className="w-full h-full object-cover" />
                  </div>
                )}

                <div className="divide-y divide-ink-faint">
                  {/* Item list */}
                  <div className="px-5 py-4 space-y-2">
                    <span className="text-xs font-bold text-mute uppercase tracking-wider">
                      Item Setoran
                    </span>
                    {items.map((it) => {
                      const cat = dbCategories?.find((c) => c.id === it.categoryId);
                      const Icon = (cat && categoryIcons[cat.name]) || Sparkles;
                      return (
                        <div key={it.categoryId} className="space-y-0.5">
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 bg-brand-500 rounded-lg flex items-center justify-center text-ink">
                                <Icon size={14} />
                              </div>
                              <span className="text-sm font-bold text-ink">
                                {cat?.name || "?"}
                              </span>
                            </div>
                            <span className="text-sm font-bold text-ink font-mono">
                              {it.weight} kg
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
                        Total Berat
                      </span>
                      <span className="text-sm font-extrabold text-ink font-mono">
                        {totalWeight.toFixed(1)} kg
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
                      Foto
                    </span>
                    <span className="text-xs font-bold text-ink">
                      {photoUrl ? "✓ Terlampir" : "Tidak ada (opsional)"}
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
