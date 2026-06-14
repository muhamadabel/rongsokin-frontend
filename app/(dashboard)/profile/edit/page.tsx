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
  AlertTriangle,
  Image as ImageIcon,
  MapPin,
  Clock,
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
import type { AreaInfo } from "@/lib/geocode";
import { uploadToCloudinary, downscaleImage, downscaleToDataUrl } from "@/lib/upload";
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
  // true bila avatar saat ini hanya preview lokal (blob, upload gagal) → JANGAN disimpan ke BE
  const [avatarIsLocal, setAvatarIsLocal] = useState(false);
  const [shopName, setShopName] = useState("");
  const [description, setDescription] = useState("");
  const [shopImageUrl, setShopImageUrl] = useState(""); // foto sampul/latar lapak
  const [radiusKm, setRadiusKm] = useState(5);
  const [isOpen, setIsOpen] = useState(true);
  const [operatingHours, setOperatingHours] = useState(""); // jam buka lapak (collector)
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [addressText, setAddressText] = useState(""); // deskripsi alamat tertulis
  const [mapArea, setMapArea] = useState<AreaInfo | null>(null); // hasil reverse-geocode terbaru
  // Teks alamat hasil auto-isi terakhir → untuk tahu apakah user sudah mengubahnya manual
  const autoBaseRef = useRef("");

  const [isUploading, setIsUploading] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Guard "perubahan belum disimpan": tujuan navigasi yg tertunda (null = tak ada popup)
  const [leaveTo, setLeaveTo] = useState<string | null>(null);

  // Hydrate SEKALI saja — biar refetch /auth/me (mis. pindah tab) tidak menimpa
  // perubahan yang sedang diketik/digeser user.
  const hydratedMe = useRef(false);
  const hydratedProfile = useRef(false);
  // Nilai awal form (baseline) untuk deteksi perubahan (dirty)
  const baseline = useRef<{
    name: string;
    phone: string;
    avatarUrl: string;
    addressText: string;
    lat: number;
    lng: number;
  } | null>(null);
  const baselineProfile = useRef<{
    shopName: string;
    description: string;
    shopImageUrl: string;
    radiusKm: number;
    isOpen: boolean;
    operatingHours: string;
  } | null>(null);

  useEffect(() => {
    if (me && !hydratedMe.current) {
      hydratedMe.current = true;
      const lat = me.lat != null ? me.lat : DEFAULT_COORDS.lat;
      const lng = me.lng != null ? me.lng : DEFAULT_COORDS.lng;
      setName(me.name || "");
      setPhone(me.phone || "");
      setAvatarUrl(me.avatarUrl || "");
      setAddressText(me.addressText || "");
      // autoBase sengaja dikosongkan: alamat tersimpan dianggap "manual" → tak ditimpa
      // hasil reverse-geocode pertama saat halaman dibuka. (Geocode awal hanya mengisi
      // bila field memang masih kosong.)
      autoBaseRef.current = "";
      // Fallback default HARUS di efek yang sama — kalau dipisah jadi efek sendiri,
      // dua setCoords balapan di commit yang sama dan default menimpa lokasi tersimpan.
      setCoords({ lat, lng });
      baseline.current = {
        name: me.name || "",
        phone: me.phone || "",
        avatarUrl: me.avatarUrl || "",
        addressText: me.addressText || "",
        lat,
        lng,
      };
    }
  }, [me]);

  useEffect(() => {
    if (profile && !hydratedProfile.current) {
      hydratedProfile.current = true;
      setShopName(profile.shopName || "");
      setDescription(profile.description || "");
      setShopImageUrl(profile.shopImageUrl || "");
      setRadiusKm(profile.radiusKm || 5);
      setIsOpen(profile.isOpen ?? true);
      setOperatingHours(profile.operatingHours || "");
      baselineProfile.current = {
        shopName: profile.shopName || "",
        description: profile.description || "",
        shopImageUrl: profile.shopImageUrl || "",
        radiusKm: profile.radiusKm || 5,
        isOpen: profile.isOpen ?? true,
        operatingHours: profile.operatingHours || "",
      };
    }
  }, [profile]);

  // ── Upload avatar ────────────────────────────────────────────────────────
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validasi: harus gambar & maksimal 5MB (cek file ASLI sebelum dikompres)
    if (!file.type.startsWith("image/")) {
      toast.error("File harus berupa gambar (JPG/PNG).");
      e.target.value = "";
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Foto terlalu besar. Maksimal 5MB.");
      e.target.value = "";
      return;
    }

    setIsUploading(true);
    try {
      // Perkecil dulu (avatar kecil) → coba upload ke server (Cloudinary).
      const small = await downscaleImage(file, 512);
      const { url, remote } = await uploadToCloudinary(small);
      if (remote) {
        setAvatarUrl(url);
        toast.success("Foto profil diunggah!");
      } else {
        // Upload server gagal → simpan versi kecil sebagai data URL.
        // Tetap PERSIST ke BE (tersimpan langsung di kolom avatarUrl), bukan blob mati.
        const dataUrl = await downscaleToDataUrl(file, 256, 0.72);
        setAvatarUrl(dataUrl);
        toast.success("Foto profil disimpan.");
      }
      setAvatarIsLocal(false); // dua-duanya bisa disimpan permanen
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal memproses foto. Coba lagi.");
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  // ── Upload foto sampul / latar lapak (collector) ───────────────────────────
  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("File harus berupa gambar (JPG/PNG).");
      e.target.value = "";
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Foto terlalu besar. Maksimal 5MB.");
      e.target.value = "";
      return;
    }

    setIsUploadingCover(true);
    try {
      // Sampul = banner lebar → maxDim lebih besar dari avatar (1280px)
      const wide = await downscaleImage(file, 1280);
      const { url, remote } = await uploadToCloudinary(wide);
      if (remote) {
        setShopImageUrl(url);
        toast.success("Foto sampul lapak diunggah!");
      } else {
        // Upload server gagal → simpan versi kecil sebagai data URL (tetap persist).
        const dataUrl = await downscaleToDataUrl(file, 720, 0.62);
        setShopImageUrl(dataUrl);
        toast.success("Foto sampul lapak disimpan.");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal memproses foto. Coba lagi.");
    } finally {
      setIsUploadingCover(false);
      e.target.value = "";
    }
  };

  // ── Auto-isi deskripsi alamat dari reverse-geocode ─────────────────────────
  // Saat titik dipindah, isi otomatis alamat (jalan/daerah) SELAMA user belum
  // mengetik manual. Begitu user mengubah teksnya, biarkan (tak ditimpa lagi).
  const handleAreaResolved = (info: AreaInfo) => {
    setMapArea(info);
    setAddressText((prev) => {
      if (prev && prev !== autoBaseRef.current) return prev; // sudah diubah manual
      autoBaseRef.current = info.full;
      return info.full;
    });
  };

  // Tombol "Pakai alamat dari peta" — paksa isi ulang dari hasil geocode terbaru
  const handleUseMapAddress = () => {
    if (!mapArea) return;
    autoBaseRef.current = mapArea.full;
    setAddressText(mapArea.full);
  };

  // ── Deteksi perubahan (dirty) ──────────────────────────────────────────────
  const b = baseline.current;
  const bp = baselineProfile.current;
  const isDirty =
    !!b &&
    (name !== b.name ||
      phone !== b.phone ||
      avatarUrl !== b.avatarUrl ||
      addressText !== b.addressText ||
      (!!coords &&
        (Math.abs(coords.lat - b.lat) > 1e-7 ||
          Math.abs(coords.lng - b.lng) > 1e-7)) ||
      (isCollector &&
        !!bp &&
        (shopName !== bp.shopName ||
          description !== bp.description ||
          shopImageUrl !== bp.shopImageUrl ||
          Number(radiusKm) !== Number(bp.radiusKm) ||
          isOpen !== bp.isOpen ||
          operatingHours !== bp.operatingHours)));

  // ── Simpan ─────────────────────────────────────────────────────────────────
  const doSave = async (): Promise<boolean> => {
    if (!coords) {
      toast.error("Lokasi belum diatur.");
      return false;
    }
    if (name.trim().length < 2) {
      toast.error("Nama minimal 2 karakter.");
      return false;
    }
    if (isCollector && shopName.trim().length < 3) {
      toast.error("Nama lapak minimal 3 karakter.");
      return false;
    }

    setIsSaving(true);
    try {
      // Lokasi SELALU disimpan ke User.location (discovery pengepul membaca dari sini).
      await new Promise<void>((resolve, reject) => {
        updateMe.mutate(
          {
            name,
            phone,
            // Jangan kirim URL blob lokal (upload gagal) — biar avatar lama tidak tertimpa data mati
            avatarUrl: avatarIsLocal ? undefined : avatarUrl || undefined,
            addressText: addressText.trim(),
            lat: coords.lat,
            lng: coords.lng,
          },
          { onSuccess: () => resolve(), onError: (err) => reject(err) }
        );
      });

      if (isCollector) {
        await new Promise<void>((resolve, reject) => {
          updateCollector.mutate(
            { shopName, description, shopImageUrl, radiusKm, isOpen, operatingHours: operatingHours.trim() },
            { onSuccess: () => resolve(), onError: (err) => reject(err) }
          );
        });
      }

      // Baseline = nilai tersimpan → form tidak lagi "dirty"
      baseline.current = {
        name,
        phone,
        avatarUrl,
        addressText: addressText.trim(),
        lat: coords.lat,
        lng: coords.lng,
      };
      if (isCollector) {
        baselineProfile.current = {
          shopName,
          description,
          shopImageUrl,
          radiusKm,
          isOpen,
          operatingHours: operatingHours.trim(),
        };
      }
      toast.success("Profil berhasil diperbarui!");
      return true;
    } catch (err) {
      const e = err as { response?: { data?: { message?: string } } };
      toast.error(e?.response?.data?.message || "Gagal menyimpan perubahan.");
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (await doSave()) router.push("/profile");
  };

  // ── Guard "perubahan belum disimpan" ───────────────────────────────────────
  // (1) Cegat klik link apa pun (Batal, back, tab nav) di fase CAPTURE — sebelum
  // handler Next/Link jalan — lalu tampilkan popup. Hanya aktif saat ada perubahan.
  useEffect(() => {
    if (!isDirty) return;
    const onCapture = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return; // izinkan buka tab baru
      const anchor = (e.target as HTMLElement)?.closest?.("a");
      if (!anchor) return;
      const href = anchor.getAttribute("href");
      if (!href || anchor.target === "_blank") return;
      if (
        href.startsWith("http") ||
        href.startsWith("#") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:") ||
        href === "/profile/edit"
      )
        return;
      e.preventDefault();
      e.stopPropagation();
      setLeaveTo(href);
    };
    document.addEventListener("click", onCapture, true);
    return () => document.removeEventListener("click", onCapture, true);
  }, [isDirty]);

  // (2) Refresh / tutup tab → dialog bawaan browser
  useEffect(() => {
    if (!isDirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [isDirty]);

  // ── Aksi popup ─────────────────────────────────────────────────────────────
  const handleStay = () => setLeaveTo(null);
  const handleDiscardLeave = () => {
    const to = leaveTo;
    setLeaveTo(null);
    if (to) router.push(to); // router.push (bukan klik <a>) → tidak ikut tercegat
  };
  const handleSaveLeave = async () => {
    const to = leaveTo;
    if (await doSave()) {
      setLeaveTo(null);
      router.push(to || "/profile");
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

              {/* FOTO SAMPUL / LATAR LAPAK */}
              <div>
                <label className="text-[10px] font-bold text-mute uppercase tracking-widest mb-1.5 block">
                  Foto Sampul Lapak
                </label>
                <div className="relative w-full aspect-[3/1] rounded-2xl overflow-hidden bg-brand-100 border border-ink-faint">
                  {shopImageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={shopImageUrl}
                      alt="Sampul lapak"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-ink-muted gap-1">
                      <ImageIcon size={26} />
                      <span className="text-[11px] font-semibold">Belum ada foto sampul</span>
                    </div>
                  )}
                  <label className="absolute bottom-2 right-2 bg-brand-500 hover:bg-brand-600 text-ink rounded-full px-3 py-2 flex items-center gap-1.5 text-xs font-bold cursor-pointer border-2 border-surface-raised transition-colors">
                    {isUploadingCover ? (
                      <RefreshCw size={14} className="animate-spin" />
                    ) : (
                      <Camera size={14} />
                    )}
                    {shopImageUrl ? "Ganti" : "Tambah"}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleCoverUpload}
                      disabled={isUploadingCover}
                    />
                  </label>
                </div>
                <p className="text-[10px] text-ink-muted mt-1">
                  Tampil sebagai latar di profil lapakmu. Pakai gambar lebar (mis. 1200×400). Maks 5MB.
                </p>
              </div>

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
                    inputMode="numeric"
                    min={1}
                    max={50}
                    placeholder="5"
                    value={radiusKm || ""}
                    onChange={(e) => setRadiusKm(e.target.value === "" ? 0 : Number(e.target.value))}
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

              {/* JAM BUKA LAPAK (informatif saja) */}
              <div>
                <label className="text-[10px] font-bold text-mute uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                  <Clock size={12} className="text-brand-700" /> Jam Buka Lapak
                </label>
                <Input
                  type="text"
                  value={operatingHours}
                  onChange={(e) => setOperatingHours(e.target.value)}
                  placeholder="Senin–Sabtu, 08.00–17.00"
                  maxLength={120}
                />
                <p className="text-[10px] text-ink-muted mt-1">
                  Tampil di profil lapak sebagai info untuk customer. Buka/tutup lapak tetap
                  kamu atur manual lewat tombol status — tidak otomatis ikut jam ini.
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
              onAreaResolved={handleAreaResolved}
              helperText={
                isCollector
                  ? "Customer akan melihat lokasi ini saat mencari pengepul terdekat."
                  : "Lokasi default untuk pesananmu — bisa diubah saat membuat order."
              }
            />

            {/* DESKRIPSI ALAMAT — auto dari titik + bisa ditambah manual */}
            <div>
              <div className="flex items-center justify-between gap-3 mb-1.5">
                <label className="text-[10px] font-bold text-mute uppercase tracking-widest flex items-center gap-1.5">
                  <MapPin size={12} className="text-brand-700" /> Deskripsi Alamat
                </label>
                {mapArea && (
                  <button
                    type="button"
                    onClick={handleUseMapAddress}
                    className="text-[10px] font-bold text-brand-700 hover:text-ink underline underline-offset-2"
                  >
                    Pakai alamat dari peta
                  </button>
                )}
              </div>
              <textarea
                value={addressText}
                onChange={(e) => setAddressText(e.target.value)}
                placeholder="Jalan, kelurahan, kecamatan… + patokan (mis. rumah pagar hijau, sebelah warung)"
                className="w-full rounded-md border border-ink bg-surface-raised px-4 py-3 text-sm font-body text-ink placeholder:text-mute focus:outline-none focus:ring-2 focus:ring-brand-500 min-h-[80px]"
                maxLength={500}
              />
              <p className="text-[10px] text-ink-muted mt-1">
                {isCollector
                  ? "Terisi otomatis dari titik di peta. Tambahkan patokan lapak biar customer gampang menemukan."
                  : "Terisi otomatis dari titik di peta. Tambahkan patokan rumah (warna, ciri, dekat apa) supaya pengepul mudah menemukan."}
              </p>
            </div>
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
              disabled={
                isSaving ||
                updateMe.isPending ||
                updateCollector.isPending ||
                isUploading ||
                isUploadingCover
              }
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

      {/* POPUP: perubahan belum disimpan */}
      {leaveTo && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-ink/70 backdrop-blur-md">
          <div className="w-full max-w-sm bg-surface-raised rounded-2xl p-6 shadow-2xl space-y-5">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center text-brand-800 shrink-0">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h3 className="font-display font-extrabold text-base text-ink">
                  Simpan perubahan?
                </h3>
                <p className="text-xs text-ink-muted leading-relaxed mt-1">
                  Ada perubahan yang belum disimpan. Simpan dulu sebelum keluar?
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Button
                onClick={handleSaveLeave}
                disabled={isSaving}
                className="w-full flex items-center justify-center gap-2"
              >
                {isSaving ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" /> Menyimpan…
                  </>
                ) : (
                  <>
                    <Save size={16} /> Simpan &amp; Keluar
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={handleDiscardLeave}
                disabled={isSaving}
                className="w-full"
              >
                Keluar Tanpa Simpan
              </Button>
              <Button
                variant="ghost"
                onClick={handleStay}
                disabled={isSaving}
                className="w-full"
              >
                Batal
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
