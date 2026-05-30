"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Archive,
  Refresh,
  Tools,
  FileLines,
  DesktopPc,
  ArrowLeft,
  CameraPhoto,
  MapPinAlt,
  CheckCircle,
  Truck,
  WandMagicSparkles,
  Close,
  ChevronRight,
} from "flowbite-react-icons/outline";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import DesktopNav from "@/components/ui/DesktopNav";
import BottomNav from "@/components/ui/BottomNav";
import { DEFAULT_COORDS, formatRupiah } from "@/lib/utils";
import { useWasteCategories } from "@/hooks/useDiscovery";
import { useCreateOrder } from "@/hooks/useOrders";
import { useAuthStore } from "@/store/authStore";
import toast from "react-hot-toast";

const categoryIcons: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  Kardus: Archive,
  Plastik: Refresh,
  Logam: Tools,
  Kertas: FileLines,
  Elektronik: DesktopPc,
};

const STEPS = [
  { num: 1, label: "Kategori" },
  { num: 2, label: "Detail" },
  { num: 3, label: "Kurir" },
  { num: 4, label: "Konfirmasi" },
];

export default function NewOrderPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-surface flex items-center justify-center">
          <Refresh className="w-10 h-10 text-brand-500 animate-spin" />
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

  // Form state
  const [categoryId, setCategoryId] = useState(initCat || "");
  const [weight, setWeight] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [method, setMethod] = useState<"PICKUP" | "DROPOFF" | "">("");
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);

  // UI state
  const [isUploading, setIsUploading] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  // Pre-select category from URL
  useEffect(() => {
    if (initCat && dbCategories) {
      const timer = setTimeout(() => {
        setCategoryId(initCat);
        setStep(2);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [initCat, dbCategories]);

  // ─── Handlers ────────────────────────────────────────────────────────────

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Foto terlalu besar. Maksimal 5MB.");
      return;
    }

    setIsUploading(true);
    try {
      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
      const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

      if (!cloudName || !uploadPreset) {
        // Fallback: use local object URL for demo purposes
        const localUrl = URL.createObjectURL(file);
        setPhotoUrl(localUrl);
        toast.success("Foto berhasil dipilih! (Mode demo)");
        return;
      }

      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", uploadPreset);

      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        { method: "POST", body: formData }
      );
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
          toast("Gagal GPS, menggunakan lokasi default Yogyakarta.", { icon: "📍" });
        },
        { timeout: 10000 }
      );
    } else {
      setLat(DEFAULT_COORDS.lat);
      setLng(DEFAULT_COORDS.lng);
      setIsLocating(false);
      toast("GPS tidak didukung, menggunakan lokasi default.", { icon: "📍" });
    }
  };

  const handleSubmit = () => {
    if (!categoryId || !weight || !method || !lat || !lng) {
      toast.error("Mohon lengkapi semua data setoran.");
      return;
    }

    createOrder.mutate(
      {
        categoryId,
        estimatedWeight: Number(weight),
        photoUrl: photoUrl || undefined,
        lat,
        lng,
        method: method as "PICKUP" | "DROPOFF",
      },
      {
        onSuccess: (res) => {
          toast.success("Setoran berhasil dibuat! Mencari pengepul...");
          // Handle different response structures
          const orderId = (res as any)?.data?.id || (res as any)?.id;
          if (orderId) {
            router.push(`/orders/${orderId}`);
          } else {
            router.push("/orders");
          }
        },
        onError: (err: any) => {
          const msg =
            err.response?.data?.message ||
            "Gagal membuat setoran. Silakan coba kembali.";
          toast.error(msg);
        },
      }
    );
  };

  // ─── Derived ─────────────────────────────────────────────────────────────

  const selectedCategory = dbCategories?.find((c) => c.id === categoryId);
  const SelectedIcon = selectedCategory
    ? (categoryIcons[selectedCategory.name] || WandMagicSparkles)
    : WandMagicSparkles;

  const canGoStep2 = !!categoryId;
  const canGoStep3 = !!weight && Number(weight) > 0;
  const canGoStep4 = !!method && !!lat && !!lng;
  const canSubmit = canGoStep2 && canGoStep3 && canGoStep4;

  // ─── Loading ──────────────────────────────────────────────────────────────

  if (!token) {
    router.push("/login");
    return null;
  }

  return (
    <div className="min-h-screen bg-surface pb-20 md:pb-0">
      <DesktopNav />

      <div className="max-w-lg mx-auto bg-white min-h-screen shadow-sm md:border-x border-ink-faint">

        {/* MOBILE HEADER */}
        <header className="sticky top-0 z-50 bg-white border-b border-ink-faint px-4 py-3 flex items-center gap-3 md:hidden shadow-sm">
          <button
            onClick={() => (step > 1 ? setStep(step - 1) : router.back())}
            className="p-2 -ml-2 text-ink-muted hover:bg-surface-raised rounded-full transition-colors"
          >
            <ArrowLeft size={22} />
          </button>
          <div className="flex-1">
            <h1 className="font-display font-extrabold text-base tracking-tight">
              Jual Rongsok
            </h1>
            <p className="text-[10px] text-ink-muted font-bold">
              Langkah {step} dari {STEPS.length}
            </p>
          </div>
          <Link href="/dashboard" className="text-ink-muted p-2 hover:bg-surface-raised rounded-full">
            <Close size={18} />
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
        <div className="px-6 py-4 border-b border-surface-raised sticky top-[57px] md:top-0 z-40 bg-white">
          <div className="flex items-center justify-between">
            {STEPS.map((s, idx) => (
              <React.Fragment key={s.num}>
                <div className="flex flex-col items-center gap-1.5">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-extrabold border-2 transition-all ${
                      step === s.num
                        ? "border-brand-500 text-brand-500 bg-brand-50"
                        : step > s.num
                        ? "bg-brand-500 border-brand-500 text-white"
                        : "border-ink-faint text-ink-faint bg-white"
                    }`}
                  >
                    {step > s.num ? <CheckCircle size={14} /> : s.num}
                  </div>
                  <span
                    className={`text-[9px] font-bold uppercase tracking-widest ${
                      step >= s.num ? "text-brand-500" : "text-ink-faint"
                    }`}
                  >
                    {s.label}
                  </span>
                </div>
                {idx < STEPS.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-1 mb-5 transition-colors ${
                      step > s.num ? "bg-brand-500" : "bg-surface-raised"
                    }`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        <main className="p-6 md:p-8">

          {/* ── STEP 1: KATEGORI ──────────────────────────── */}
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-200">
              <div>
                <h2 className="font-display text-xl font-extrabold text-ink">
                  Apa yang ingin kamu jual?
                </h2>
                <p className="text-sm text-ink-muted mt-1">
                  Pilih kategori sampah yang sesuai.
                </p>
              </div>

              {isCategoriesLoading ? (
                <div className="grid grid-cols-2 gap-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="border-2 border-surface-raised rounded-xl p-6 animate-pulse bg-surface-raised"
                    />
                  ))}
                </div>
              ) : dbCategories && dbCategories.length > 0 ? (
                <div className="grid grid-cols-2 gap-3">
                  {dbCategories.map((cat) => {
                    const Icon = categoryIcons[cat.name] || WandMagicSparkles;
                    const isSelected = categoryId === cat.id;
                    return (
                      <button
                        key={cat.id}
                        onClick={() => setCategoryId(cat.id)}
                        className={`border-2 rounded-xl p-5 flex flex-col items-center gap-3 cursor-pointer transition-all text-left ${
                          isSelected
                            ? "border-brand-500 bg-brand-50 shadow-md"
                            : "border-surface-raised hover:border-brand-200 hover:bg-surface-raised"
                        }`}
                      >
                        <div
                          className={`w-12 h-12 rounded-full flex items-center justify-center ${
                            isSelected
                              ? "bg-brand-500 text-white"
                              : "bg-surface-raised text-ink-muted"
                          }`}
                        >
                          <Icon size={24} />
                        </div>
                        <span
                          className={`text-sm font-bold ${
                            isSelected ? "text-brand-700" : "text-ink"
                          }`}
                        >
                          {cat.name}
                        </span>
                        {isSelected && (
                          <CheckCircle size={16} className="text-brand-500 -mt-1" />
                        )}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="border border-ink-faint rounded-xl p-8 text-center text-sm text-ink-muted">
                  Tidak bisa memuat kategori. Pastikan backend berjalan.
                </div>
              )}

              <Button
                className="w-full py-4 text-base shadow-md font-bold flex items-center justify-center gap-2"
                disabled={!canGoStep2}
                onClick={() => setStep(2)}
              >
                Lanjut ke Detail <ChevronRight size={18} />
              </Button>
            </div>
          )}

          {/* ── STEP 2: DETAIL & FOTO ─────────────────────── */}
          {step === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-200">
              <div>
                <h2 className="font-display text-xl font-extrabold text-ink">
                  Detail Barang
                </h2>
                <p className="text-sm text-ink-muted mt-1">
                  Isi estimasi berat dan foto barang.
                </p>
              </div>

              {/* Kategori terpilih */}
              {selectedCategory && (
                <div className="flex items-center gap-3 bg-brand-50 border border-brand-100 rounded-xl px-4 py-3">
                  <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center text-white shrink-0">
                    <SelectedIcon size={16} />
                  </div>
                  <span className="text-sm font-bold text-brand-700">
                    {selectedCategory.name}
                  </span>
                  <button
                    onClick={() => { setCategoryId(""); setStep(1); }}
                    className="ml-auto text-xs text-brand-500 font-bold hover:underline"
                  >
                    Ganti
                  </button>
                </div>
              )}

              {/* Estimasi berat */}
              <div>
                <label className="text-[10px] font-bold text-ink-muted uppercase tracking-widest mb-2 block">
                  Estimasi Berat (kg) <span className="text-status-error">*</span>
                </label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="0"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    className="flex-1 text-center font-bold text-xl rounded-xl h-14"
                    min="0.1"
                    step="0.1"
                  />
                  <div className="bg-surface-raised border border-ink-faint flex items-center justify-center px-6 rounded-xl font-bold text-ink-muted">
                    KG
                  </div>
                </div>
                {/* Quick select buttons */}
                <div className="flex gap-2 mt-2">
                  {[1, 5, 10, 20].map((w) => (
                    <button
                      key={w}
                      onClick={() => setWeight(String(w))}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-lg border transition-colors ${
                        weight === String(w)
                          ? "border-brand-500 bg-brand-50 text-brand-600"
                          : "border-ink-faint text-ink-muted hover:border-brand-300"
                      }`}
                    >
                      {w} kg
                    </button>
                  ))}
                </div>
              </div>

              {/* Upload foto */}
              <div>
                <label className="text-[10px] font-bold text-ink-muted uppercase tracking-widest mb-2 block">
                  Foto Barang{" "}
                  <span className="text-ink-faint normal-case font-medium">
                    (opsional, maks 5MB)
                  </span>
                </label>
                {!photoUrl ? (
                  <label
                    className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center gap-3 cursor-pointer transition-colors ${
                      isUploading
                        ? "border-brand-500 bg-brand-50"
                        : "border-ink-faint hover:border-brand-300 hover:bg-surface-raised"
                    }`}
                  >
                    {isUploading ? (
                      <Refresh size={36} className="animate-spin text-brand-500" />
                    ) : (
                      <CameraPhoto size={36} className="text-ink-faint" />
                    )}
                    <span className="text-xs font-bold text-ink-muted text-center">
                      {isUploading
                        ? "Mengunggah foto..."
                        : "Klik untuk ambil atau pilih foto"}
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
                  <div className="relative border border-ink-faint rounded-xl overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photoUrl}
                      alt="Preview"
                      className="w-full max-h-48 object-cover"
                    />
                    <button
                      onClick={() => setPhotoUrl("")}
                      className="absolute top-2 right-2 bg-white text-status-error px-3 py-1 rounded-full text-xs font-bold shadow-md hover:bg-red-50 border border-red-100 flex items-center gap-1"
                    >
                      <Close size={12} /> Hapus
                    </button>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  className="flex-1 py-4 font-bold"
                  onClick={() => setStep(1)}
                >
                  Kembali
                </Button>
                <Button
                  className="flex-[2] py-4 text-base shadow-md font-bold flex items-center justify-center gap-2"
                  disabled={!canGoStep3}
                  onClick={() => setStep(3)}
                >
                  Lanjut ke Kurir <ChevronRight size={18} />
                </Button>
              </div>
            </div>
          )}

          {/* ── STEP 3: METODE & LOKASI ───────────────────── */}
          {step === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-200">
              <div>
                <h2 className="font-display text-xl font-extrabold text-ink">
                  Opsi Pengiriman
                </h2>
                <p className="text-sm text-ink-muted mt-1">
                  Pilih cara penyerahan barang.
                </p>
              </div>

              {/* Metode */}
              <div className="space-y-3">
                {(
                  [
                    {
                      value: "PICKUP",
                      title: "Minta Dijemput (Pick-up)",
                      desc: "Pengepul akan datang langsung ke lokasi kamu untuk mengambil barang.",
                      emoji: "📦",
                    },
                    {
                      value: "DROPOFF",
                      title: "Antar Sendiri (Drop-off)",
                      desc: "Kamu membawa barang langsung ke gudang atau lapak pengepul.",
                      emoji: "🚶",
                    },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setMethod(opt.value)}
                    className={`w-full border-2 rounded-xl p-4 flex items-start gap-4 text-left transition-all ${
                      method === opt.value
                        ? "border-brand-500 bg-brand-50"
                        : "border-surface-raised hover:border-brand-200"
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full border-2 mt-0.5 flex shrink-0 items-center justify-center ${
                        method === opt.value
                          ? "border-brand-500"
                          : "border-ink-faint"
                      }`}
                    >
                      {method === opt.value && (
                        <div className="w-2.5 h-2.5 bg-brand-500 rounded-full" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-ink font-display mb-1">
                        {opt.emoji} {opt.title}
                      </h3>
                      <p className="text-xs text-ink-muted">{opt.desc}</p>
                    </div>
                  </button>
                ))}
              </div>

              {/* Lokasi */}
              <div>
                <label className="text-[10px] font-bold text-ink-muted uppercase tracking-widest mb-2 block">
                  Lokasi Setoran <span className="text-status-error">*</span>
                </label>

                {lat && lng ? (
                  <div className="bg-brand-50 border border-brand-200 rounded-xl p-4 flex items-start gap-3">
                    <MapPinAlt className="text-brand-500 shrink-0 mt-0.5" size={20} />
                    <div className="flex-1">
                      <h4 className="font-bold text-sm text-brand-900 font-display">
                        Lokasi Terkunci ✓
                      </h4>
                      <p className="text-[11px] text-brand-700 font-mono mt-0.5">
                        {lat.toFixed(5)}, {lng.toFixed(5)}
                      </p>
                      <button
                        onClick={handleGetLocation}
                        className="text-[11px] font-bold text-brand-600 underline mt-1"
                        disabled={isLocating}
                      >
                        {isLocating ? "Memperbarui..." : "Perbarui Lokasi GPS"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={handleGetLocation}
                    disabled={isLocating}
                    className="w-full border-2 border-dashed border-ink-faint hover:border-brand-300 rounded-xl py-6 flex flex-col items-center gap-2 transition-colors disabled:opacity-60"
                  >
                    {isLocating ? (
                      <Refresh size={24} className="animate-spin text-brand-500" />
                    ) : (
                      <MapPinAlt size={24} className="text-ink-muted" />
                    )}
                    <span className="text-sm font-bold text-ink-muted">
                      {isLocating
                        ? "Mendeteksi GPS..."
                        : "Klik untuk deteksi lokasi GPS"}
                    </span>
                    <span className="text-xs text-ink-faint">
                      Atau gunakan lokasi default Yogyakarta
                    </span>
                  </button>
                )}

                {/* Gunakan lokasi default */}
                {!lat && !lng && !isLocating && (
                  <button
                    onClick={() => {
                      setLat(DEFAULT_COORDS.lat);
                      setLng(DEFAULT_COORDS.lng);
                      toast("Menggunakan lokasi default Yogyakarta.", { icon: "📍" });
                    }}
                    className="w-full mt-2 text-xs font-bold text-brand-500 underline"
                  >
                    Gunakan lokasi default Yogyakarta
                  </button>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  className="flex-1 py-4 font-bold"
                  onClick={() => setStep(2)}
                >
                  Kembali
                </Button>
                <Button
                  className="flex-[2] py-4 text-base shadow-md font-bold flex items-center justify-center gap-2"
                  disabled={!canGoStep4}
                  onClick={() => setStep(4)}
                >
                  Review Pesanan <ChevronRight size={18} />
                </Button>
              </div>
            </div>
          )}

          {/* ── STEP 4: KONFIRMASI ────────────────────────── */}
          {step === 4 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-200">
              <div>
                <h2 className="font-display text-xl font-extrabold text-ink">
                  Konfirmasi Pesanan
                </h2>
                <p className="text-sm text-ink-muted mt-1">
                  Pastikan semua data sudah benar sebelum dikirim.
                </p>
              </div>

              {/* Summary card */}
              <div className="bg-white border border-ink-faint rounded-2xl overflow-hidden shadow-sm">
                {/* Foto preview */}
                {photoUrl && (
                  <div className="relative h-36 bg-surface-raised overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photoUrl}
                      alt="Foto barang"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <div className="divide-y divide-ink-faint">
                  <div className="px-5 py-4 flex items-center justify-between">
                    <span className="text-xs font-bold text-ink-muted uppercase tracking-wider">
                      Kategori
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-brand-500 rounded flex items-center justify-center text-white">
                        <SelectedIcon size={14} />
                      </div>
                      <span className="text-sm font-bold text-ink">
                        {selectedCategory?.name || "-"}
                      </span>
                    </div>
                  </div>

                  <div className="px-5 py-4 flex items-center justify-between">
                    <span className="text-xs font-bold text-ink-muted uppercase tracking-wider">
                      Estimasi Berat
                    </span>
                    <span className="text-sm font-bold text-ink font-mono">
                      {weight} kg
                    </span>
                  </div>

                  <div className="px-5 py-4 flex items-center justify-between">
                    <span className="text-xs font-bold text-ink-muted uppercase tracking-wider">
                      Metode
                    </span>
                    <span className="text-sm font-bold text-ink flex items-center gap-1.5">
                      <Truck size={14} className="text-brand-500" />
                      {method === "PICKUP" ? "Dijemput" : "Antar Sendiri"}
                    </span>
                  </div>

                  <div className="px-5 py-4 flex items-center justify-between">
                    <span className="text-xs font-bold text-ink-muted uppercase tracking-wider">
                      Lokasi
                    </span>
                    <span className="text-xs font-mono text-ink-muted">
                      {lat?.toFixed(4)}, {lng?.toFixed(4)}
                    </span>
                  </div>

                  <div className="px-5 py-4 flex items-center justify-between">
                    <span className="text-xs font-bold text-ink-muted uppercase tracking-wider">
                      Foto
                    </span>
                    <span className="text-xs font-bold text-ink">
                      {photoUrl ? "✓ Terlampir" : "Tidak ada (opsional)"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Info note */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-800 font-medium leading-relaxed">
                💡 Setelah dikirim, pengepul terdekat akan mendapat notifikasi dan
                dapat menerima atau menolak pesanan ini dalam waktu 15 menit.
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1 py-4 font-bold"
                  onClick={() => setStep(3)}
                >
                  Kembali
                </Button>
                <Button
                  className="flex-[2] py-4 text-base shadow-md font-bold flex items-center justify-center gap-2 bg-brand-700 hover:bg-brand-800"
                  disabled={!canSubmit || createOrder.isPending}
                  onClick={handleSubmit}
                >
                  {createOrder.isPending ? (
                    <>
                      <Refresh size={18} className="animate-spin" />
                      Memproses...
                    </>
                  ) : (
                    <>
                      <CheckCircle size={18} />
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
