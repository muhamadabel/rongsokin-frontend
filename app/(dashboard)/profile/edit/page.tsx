"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Camera,
  RefreshCw,
  User as UserIcon,
  Store,
  Save,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import DesktopNav from "@/components/ui/DesktopNav";
import BottomNav from "@/components/ui/BottomNav";
import LocationPicker from "@/components/features/profile/LocationPicker";
import { ProfileEditSkeleton } from "@/components/ui/Skeleton";
import { useMe, useUpdateMe } from "@/hooks/useAuth";
import {
  useCollectorProfile,
  useUpdateCollectorProfile,
} from "@/hooks/useCollector";
import { useAuthStore } from "@/store/authStore";
import { DEFAULT_COORDS } from "@/lib/utils";
import toast from "react-hot-toast";
import { uploadToCloudinary } from "@/lib/upload";

export default function EditProfilePage() {
  const router = useRouter();
  const initFromStorage = useAuthStore((s) => s.initFromStorage);
  const token = useAuthStore((s) => s.token);

  useEffect(() => {
    initFromStorage();
  }, [initFromStorage]);

  const { data: me, isLoading: isMeLoading } = useMe();
  const isCollector = me?.role === "COLLECTOR";

  const { data: profile, isLoading: isProfileLoading } = useCollectorProfile();
  const updateMe = useUpdateMe();
  const updateCollector = useUpdateCollectorProfile();

  // ── Form state ───────────────────────────────────────────────────────────
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [shopName, setShopName] = useState("");
  const [description, setDescription] = useState("");
  const [isOpen, setIsOpen] = useState(true);
  const [shopImageUrl, setShopImageUrl] = useState("");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  const [isUploading, setIsUploading] = useState(false);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Hydrate SEKALI saja — biar refetch /auth/me (mis. pindah tab) tidak menimpa
  // perubahan yang sedang diketik/digeser user.
  const hydratedMe = useRef(false);
  const hydratedProfile = useRef(false);

  useEffect(() => {
    if (me && !hydratedMe.current) {
      hydratedMe.current = true;
      setName(me.name || "");
      setPhone(me.phone || "");
      setAvatarUrl(me.avatarUrl || "");
      // Fallback default WAJIB di efek yang SAMA. Kalau dipisah jadi efek sendiri,
      // efek itu masih melihat coords === null pada commit yang sama, lalu menimpa
      // lokasi tersimpan dengan Jogja → pin selalu balik ke default tiap dibuka.
      setCoords({
        lat: me.lat ?? DEFAULT_COORDS.lat,
        lng: me.lng ?? DEFAULT_COORDS.lng,
      });
    }
  }, [me]);

  useEffect(() => {
    if (profile && !hydratedProfile.current) {
      hydratedProfile.current = true;
      setShopName(profile.shopName || "");
      setDescription(profile.description || "");
      setIsOpen(profile.isOpen ?? true);
      setShopImageUrl(profile.shopImageUrl || "");
    }
  }, [profile]);

  // ── Upload avatar ────────────────────────────────────────────────────────
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const { url, remote } = await uploadToCloudinary(file);
      setAvatarUrl(url);
      if (remote) {
        toast.success("Foto profil diunggah!");
      } else {
        toast.success("Foto profil dipilih (Mode demo).");
      }
    } catch (err: any) {
      toast.error(err.message || "Gagal unggah foto. Coba lagi.");
    } finally {
      setIsUploading(false);
    }
  };

  // ── Upload banner ────────────────────────────────────────────────────────
  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingBanner(true);
    try {
      const { url, remote } = await uploadToCloudinary(file);
      setShopImageUrl(url);
      if (remote) {
        toast.success("Foto sampul diunggah!");
      } else {
        toast.success("Foto sampul dipilih (Mode demo).");
      }
    } catch (err: any) {
      toast.error(err.message || "Gagal unggah foto sampul. Coba lagi.");
    } finally {
      setIsUploadingBanner(false);
    }
  };

  // ── Submit ───────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!coords) {
      toast.error("Lokasi belum diatur.");
      return;
    }
    if (name.trim().length < 2) {
      toast.error("Nama minimal 2 karakter.");
      return;
    }
    if (isCollector && shopName.trim().length < 3) {
      toast.error("Nama lapak minimal 3 karakter.");
      return;
    }

    setIsSaving(true);
    try {
      // 1) Update user umum (nama, phone, avatar) + LOKASI.
      // Lokasi SELALU disimpan ke User.location untuk customer & collector —
      // karena pencarian pengepul (discovery) membaca dari User.location.
      await new Promise<void>((resolve, reject) => {
        updateMe.mutate(
          {
            name,
            phone,
            avatarUrl: avatarUrl || undefined,
            lat: coords.lat,
            lng: coords.lng,
          },
          {
            onSuccess: () => resolve(),
            onError: (err) => reject(err),
          }
        );
      });

      // 2) Kalau collector, update data lapak (lokasi sudah tersimpan di User.location di atas)
      if (isCollector) {
        await new Promise<void>((resolve, reject) => {
          updateCollector.mutate(
            {
              shopName,
              description,
              isOpen,
              shopImageUrl,
            },
            {
              onSuccess: () => resolve(),
              onError: (err) => reject(err),
            }
          );
        });
      }

      toast.success("Profil berhasil diperbarui!");
      router.push("/profile");
    } catch (err) {
      const e = err as { response?: { data?: { message?: string } } };
      toast.error(e?.response?.data?.message || "Gagal menyimpan perubahan.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!token) {
    router.push("/login");
    return null;
  }

  const isPageLoading = isMeLoading || (isCollector && isProfileLoading);

  if (isPageLoading) {
    return <ProfileEditSkeleton />;
  }

  return (
    <div className="min-h-screen bg-surface pb-24 md:pb-8">
      <DesktopNav />

      {/* MOBILE HEADER */}
      <header className="sticky top-0 z-40 bg-surface-raised border-b border-ink-faint px-4 py-3 flex items-center gap-3 md:hidden">
        <Link
          href="/profile"
          className="p-2 -ml-2 text-ink-muted hover:bg-surface rounded-full transition-colors"
        >
          <ArrowLeft size={22} />
        </Link>
        <h1 className="font-display font-extrabold text-lg tracking-tight text-ink">
          Edit Profil
        </h1>
      </header>

      <main className="max-w-2xl mx-auto px-4 md:px-0 py-5 md:py-8 space-y-5">
        {/* Desktop heading + back */}
        <div className="hidden md:flex flex-col mb-6">
          <Link
            href="/profile"
            className="flex items-center gap-1.5 text-sm font-semibold text-ink-muted hover:text-ink transition-colors w-fit mb-6"
          >
            <ArrowLeft size={16} /> Kembali
          </Link>
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-ink">
            Edit Profil
          </h1>
          <p className="text-sm text-ink-muted mt-1.5">
            Perbarui foto, informasi pribadi, dan detail operasional lapakmu di sini.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* AVATAR & BANNER */}
          <section className="bg-surface-raised rounded-2xl p-6 space-y-6">
            <div className="flex items-center gap-5">
              <div className="relative shrink-0">
                <div className="w-20 h-20 rounded-full bg-brand-100 overflow-hidden flex items-center justify-center text-ink">
                  {avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <UserIcon size={36} />
                  )}
                </div>
                <label className="absolute -bottom-1 -right-1 w-8 h-8 bg-brand-500 hover:bg-brand-600 rounded-full flex items-center justify-center cursor-pointer border-4 border-surface-raised">
                  {isUploading ? (
                    <RefreshCw size={14} className="text-ink animate-spin" />
                  ) : (
                    <Camera size={14} className="text-ink" />
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarUpload}
                    disabled={isUploading}
                  />
                </label>
              </div>
              <div className="min-w-0">
                <h3 className="font-display font-extrabold text-base text-ink truncate">
                  {name || "Profilmu"}
                </h3>
                <p className="text-xs text-mute mt-0.5">
                  {isCollector ? "Akun Pengepul" : "Akun Customer"}
                </p>
                <p className="text-[10px] text-ink-muted mt-1">
                  Klik kamera untuk ganti foto. Maks 5MB.
                </p>
              </div>
            </div>

            {isCollector && (
              <div className="border-t border-ink-faint pt-5 space-y-3">
                <label className="text-[10px] font-bold text-mute uppercase tracking-widest block">
                  Foto Sampul / Banner Lapak
                </label>
                <div className="relative w-full h-32 md:h-40 rounded-xl border-2 border-dashed border-ink-faint bg-brand-100 overflow-hidden transition-all hover:bg-brand-100/80">
                  <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleBannerUpload}
                      disabled={isUploadingBanner}
                    />
                    {isUploadingBanner ? (
                      <RefreshCw size={24} className="animate-spin text-ink-muted" />
                    ) : shopImageUrl ? (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={shopImageUrl} alt="Sampul" className="w-full h-full object-cover" />
                        <span className="absolute bottom-3 right-3 bg-surface-raised/90 hover:bg-surface-raised text-ink px-3 py-1.5 rounded-xl border border-ink-faint flex items-center gap-1 text-xs font-bold cursor-pointer transition-colors shadow-sm">
                          Upload banner baru
                        </span>
                      </>
                    ) : (
                      <div className="flex flex-col items-center gap-1.5 text-ink-muted">
                        <Camera size={24} />
                        <span className="text-xs font-bold">Unggah gambar banner</span>
                      </div>
                    )}
                  </label>
                  
                  {shopImageUrl && !isUploadingBanner && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setShopImageUrl("");
                      }}
                      className="absolute bottom-3 left-3 bg-status-error hover:brightness-95 text-white border border-transparent px-3 py-1.5 rounded-xl flex items-center gap-1 text-xs font-bold cursor-pointer transition-colors z-10"
                    >
                      Hapus
                    </button>
                  )}
                </div>
                <p className="text-[10px] text-ink-muted mt-1">
                  Maksimal 5MB. Jika tidak diunggah, akan menggunakan warna default.
                </p>
              </div>
            )}
          </section>

          {/* DATA PRIBADI */}
          <section className="bg-surface-raised rounded-2xl p-6 space-y-4">
            <h3 className="font-display font-extrabold text-base text-ink tracking-tight">
              Data Pribadi
            </h3>

            <div>
              <label className="text-[10px] font-bold text-mute uppercase tracking-widest mb-1.5 block">
                Nama Lengkap
              </label>
              <Input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nama sesuai KTP"
                required
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-mute uppercase tracking-widest mb-1.5 block">
                Email
              </label>
              <Input
                type="email"
                value={me?.email || ""}
                disabled
                className="bg-surface text-mute cursor-not-allowed"
              />
              <p className="text-[10px] text-mute mt-1">Email tidak bisa diubah.</p>
            </div>

            <div>
              <label className="text-[10px] font-bold text-mute uppercase tracking-widest mb-1.5 block">
                Nomor WhatsApp
              </label>
              <Input
                type="tel"
                inputMode="numeric"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                placeholder="08123456789"
                maxLength={15}
              />
            </div>
          </section>

          {/* COLLECTOR — DATA LAPAK */}
          {isCollector && (
            <section className="bg-surface-raised rounded-2xl p-6 space-y-4">
              <h3 className="font-display font-extrabold text-base text-ink tracking-tight flex items-center gap-2">
                <Store size={18} className="text-brand-700" />
                Data Lapak
              </h3>

              <div>
                <label className="text-[10px] font-bold text-mute uppercase tracking-widest mb-1.5 block">
                  Nama Lapak
                </label>
                <Input
                  type="text"
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  placeholder="UD Jaya Abadi"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-mute uppercase tracking-widest mb-1.5 block">
                  Deskripsi Lapak
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ceritakan singkat soal lapakmu…"
                  className="w-full rounded-md border border-ink bg-surface-raised px-4 py-3 text-sm font-body text-ink placeholder:text-mute focus:outline-none focus:ring-2 focus:ring-brand-500 min-h-[88px]"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-mute uppercase tracking-widest mb-1.5 block">
                  Status Lapak
                </label>
                <button
                  type="button"
                  onClick={() => setIsOpen(!isOpen)}
                  className={`w-full h-12 rounded-md border font-bold text-sm transition-colors ${
                    isOpen
                      ? "bg-brand-500 text-ink border-brand-500"
                      : "bg-surface text-ink-muted border-ink-faint"
                  }`}
                >
                  {isOpen ? "BUKA" : "TUTUP"}
                </button>
                <p className="text-[10px] text-ink-muted mt-1">
                  Jangkauanmu tanpa batas — semua pesanan masuk ke antrean, dan kamu bisa
                  tolak yang kejauhan.
                </p>
              </div>
            </section>
          )}

          {/* LOKASI */}
          <section className="bg-surface-raised rounded-2xl p-6 space-y-4">
            <h3 className="font-display font-extrabold text-base text-ink tracking-tight">
              {isCollector ? "Alamat Lapak" : "Alamat Rumah"}
            </h3>
            <LocationPicker
              value={coords}
              onChange={setCoords}
              label="Pilih Titik Lokasi"
              autoLocate={me?.lat == null || me?.lng == null}
              helperText={
                isCollector
                  ? "Customer akan melihat lokasi ini saat mencari pengepul terdekat."
                  : "Lokasi default untuk pesananmu — bisa diubah saat membuat order."
              }
            />
          </section>

          {/* ACTIONS */}
          <div className="flex gap-3 sticky bottom-20 md:static z-40">
            <Link href="/profile" className="flex-1">
              <Button variant="outline" className="w-full" type="button">
                Batal
              </Button>
            </Link>
            <Button
              type="submit"
              disabled={isSaving || updateMe.isPending || updateCollector.isPending}
              className="flex-[2] flex items-center justify-center gap-2"
            >
              {isSaving ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  Menyimpan…
                </>
              ) : (
                <>
                  <Save size={16} />
                  Simpan Perubahan
                </>
              )}
            </Button>
          </div>
        </form>
      </main>

      <BottomNav />
    </div>
  );
}
