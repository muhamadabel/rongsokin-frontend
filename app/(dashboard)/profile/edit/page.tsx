"use client";

import { useEffect, useState } from "react";
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
import { useMe, useUpdateMe } from "@/hooks/useAuth";
import {
  useCollectorProfile,
  useUpdateCollectorProfile,
} from "@/hooks/useCollector";
import { useAuthStore } from "@/store/authStore";
import { DEFAULT_COORDS } from "@/lib/utils";
import toast from "react-hot-toast";

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
  const [radiusKm, setRadiusKm] = useState(5);
  const [isOpen, setIsOpen] = useState(true);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Hydrate dari /auth/me + /collector/profile
  useEffect(() => {
    if (me) {
      setName(me.name || "");
      setPhone(me.phone || "");
      setAvatarUrl(me.avatarUrl || "");
      if (me.lat != null && me.lng != null) {
        setCoords({ lat: me.lat, lng: me.lng });
      }
    }
  }, [me]);

  useEffect(() => {
    if (profile) {
      setShopName(profile.shopName || "");
      setDescription(profile.description || "");
      setRadiusKm(profile.radiusKm || 5);
      setIsOpen(profile.isOpen ?? true);
    }
  }, [profile]);

  // Default coords kalau belum ada
  useEffect(() => {
    if (!coords && me && !isMeLoading) {
      setCoords(DEFAULT_COORDS);
    }
  }, [coords, me, isMeLoading]);

  // ── Upload avatar ────────────────────────────────────────────────────────
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
        setAvatarUrl(localUrl);
        toast.success("Foto profil dipilih (Mode demo).");
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
        setAvatarUrl(data.secure_url);
        toast.success("Foto profil diunggah!");
      } else {
        throw new Error(data.error?.message || "Upload failed");
      }
    } catch {
      toast.error("Gagal unggah foto. Coba lagi.");
    } finally {
      setIsUploading(false);
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
      // 1) Update user umum (nama, phone, avatar, lokasi customer)
      await new Promise<void>((resolve, reject) => {
        updateMe.mutate(
          {
            name,
            phone,
            avatarUrl: avatarUrl || undefined,
            // Untuk customer, lokasi disimpan langsung di User.location
            // Untuk collector, lokasi customer-side dilewati (sumber kebenaran di collector profile)
            ...(isCollector ? {} : { lat: coords.lat, lng: coords.lng }),
          },
          {
            onSuccess: () => resolve(),
            onError: (err) => reject(err),
          }
        );
      });

      // 2) Kalau collector, update collector profile (termasuk shop location)
      if (isCollector) {
        await new Promise<void>((resolve, reject) => {
          updateCollector.mutate(
            {
              shopName,
              description,
              radiusKm,
              isOpen,
              lat: coords.lat,
              lng: coords.lng,
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
    return (
      <div className="min-h-screen bg-surface flex flex-col">
        <DesktopNav />
        <div className="flex-1 flex items-center justify-center">
          <RefreshCw className="w-10 h-10 text-brand-700 animate-spin" />
        </div>
        <BottomNav />
      </div>
    );
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
        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/profile"
            className="flex items-center gap-1.5 text-sm font-semibold text-ink-muted hover:text-ink transition-colors"
          >
            <ArrowLeft size={16} /> Kembali
          </Link>
          <span className="text-ink-faint">·</span>
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-ink">
            Edit Profil
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* AVATAR */}
          <section className="bg-surface-raised rounded-2xl p-6 flex items-center gap-5">
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
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="08123456789"
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-mute uppercase tracking-widest mb-1.5 block">
                    Radius (km)
                  </label>
                  <Input
                    type="number"
                    min={1}
                    max={50}
                    value={radiusKm}
                    onChange={(e) => setRadiusKm(Number(e.target.value))}
                    required
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
                </div>
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
              helperText={
                isCollector
                  ? "Customer akan melihat lokasi ini saat mencari pengepul terdekat."
                  : "Lokasi default untuk pesananmu — bisa diubah saat membuat order."
              }
            />
          </section>

          {/* ACTIONS */}
          <div className="flex gap-3 sticky bottom-20 md:static z-30">
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
