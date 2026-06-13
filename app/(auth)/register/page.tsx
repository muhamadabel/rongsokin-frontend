"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Logo } from "@/components/ui/Logo";
import { CameraCapture } from "@/components/ui/CameraCapture";
import {
  User,
  Store,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  Loader2,
  AlertTriangle,
  Pencil,
  ScanLine,
  Camera,
} from "lucide-react";
import { useRegister, useUpdateMe } from "@/hooks/useAuth";
import { useUpdateCollectorProfile } from "@/hooks/useCollector";
import LocationPicker from "@/components/features/profile/LocationPicker";
import { recognizeKtp } from "@/lib/ktpOcr";
import { uploadToCloudinary } from "@/lib/upload";
import toast from "react-hot-toast";

type OcrStatus = "idle" | "scanning" | "done" | "failed";

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-surface" />}>
      <RegisterForm />
    </Suspense>
  );
}

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState(1);
  const [role, setRole] = useState<"CUSTOMER" | "COLLECTOR" | "">("");

  // Step 2 — Biodata
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  // Step 3 — KYC (KTP)
  const [showCamera, setShowCamera] = useState(true);
  const [ktpPreview, setKtpPreview] = useState("");
  const [ktpUrl, setKtpUrl] = useState("");
  const [uploadingKtp, setUploadingKtp] = useState(false);
  const [nik, setNik] = useState("");
  const [ktpName, setKtpName] = useState("");
  const [ocrStatus, setOcrStatus] = useState<OcrStatus>("idle");
  const [fieldsLocked, setFieldsLocked] = useState(false);

  // Step 4 — Profil lapak (collector)
  const [shopName, setShopName] = useState("");
  const [description, setDescription] = useState("");
  const [radiusKm, setRadiusKm] = useState(5);
  const [collectorLat, setCollectorLat] = useState(-7.7956);
  const [collectorLng, setCollectorLng] = useState(110.3695);

  // Step 4 — Lokasi (customer). null = belum dipilih; LocationPicker auto-GPS saat muncul.
  const [customerCoords, setCustomerCoords] = useState<{ lat: number; lng: number } | null>(null);

  const { mutate: register, isPending: isRegistering } = useRegister();
  const { mutate: setupProfile, isPending: isSettingProfile } = useUpdateCollectorProfile();
  const { mutate: updateMe, isPending: isSavingLocation } = useUpdateMe();

  // Preselect role dari URL (?role=COLLECTOR)
  useEffect(() => {
    const r = searchParams.get("role");
    if (r === "COLLECTOR" || r === "CUSTOMER") setRole(r);
  }, [searchParams]);

  // 4 langkah untuk semua role: step 4 = profil lapak (collector) atau pilih lokasi (customer)
  const totalSteps = 4;
  const stepList = [1, 2, 3, 4];

  // ── Step 2: biodata → lanjut ke KYC ──────────────────────────────────────
  const handleBiodataNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      toast.error("Kata sandi minimal 8 karakter!");
      return;
    }
    setStep(3);
  };

  // ── Step 3: hasil foto KTP → OCR + upload ────────────────────────────────
  const handleKtpCapture = async (blob: Blob, dataUrl: string) => {
    setKtpPreview(dataUrl);
    setShowCamera(false);
    setOcrStatus("scanning");
    setNik("");
    setKtpName("");

    // Upload foto KTP ke server (paralel dengan OCR)
    setUploadingKtp(true);
    uploadToCloudinary(blob)
      .then((r) => {
        if (!r.remote) {
          // Upload tidak sampai ke server (mis. jaringan) → jangan pakai blob lokal
          // sebagai ktpUrl, supaya tidak ada akun "verified" dengan foto yang hilang.
          setKtpUrl("");
          toast.error("Gagal mengunggah foto KTP ke server. Foto ulang.");
          return;
        }
        setKtpUrl(r.url);
      })
      .catch(() => toast.error("Gagal mengunggah foto KTP. Ulangi foto."))
      .finally(() => setUploadingKtp(false));

    // OCR NIK + Nama. NIK = kunci utama → status sukses kalau NIK terbaca.
    try {
      const res = await recognizeKtp(blob);
      setNik(res.nik || "");
      setKtpName(res.name || "");
      setOcrStatus(res.nik ? "done" : "failed");
      setFieldsLocked(!!res.name); // nama dikunci kalau terbaca, bisa dikoreksi manual
    } catch {
      setOcrStatus("failed");
      setFieldsLocked(false);
    }
  };

  const retakeKtp = () => {
    setShowCamera(true);
    setKtpPreview("");
    setKtpUrl("");
    setNik("");
    setKtpName("");
    setOcrStatus("idle");
    setFieldsLocked(false);
  };

  // ── Step 3 submit: register dengan data KYC ──────────────────────────────
  const handleKycSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ktpPreview) {
      toast.error("Ambil foto KTP terlebih dahulu.");
      return;
    }
    if (uploadingKtp) {
      toast.error("Tunggu, foto KTP sedang diunggah…");
      return;
    }
    if (!ktpUrl) {
      toast.error("Foto KTP belum berhasil diunggah ke server. Foto ulang.");
      return;
    }
    if (!/^\d{16}$/.test(nik)) {
      toast.error("NIK harus 16 digit angka.");
      return;
    }
    if (ktpName.trim().length < 3) {
      toast.error("Nama sesuai KTP tidak valid.");
      return;
    }

    register(
      {
        name: ktpName.trim(),
        email,
        phone,
        password,
        role: role as "CUSTOMER" | "COLLECTOR",
        nik,
        ktpName: ktpName.trim(),
        ktpUrl: ktpUrl || undefined,
      },
      {
        onSuccess: () => {
          toast.success("Verifikasi & registrasi berhasil!");
          // Step 4: collector → profil lapak (+peta), customer → pilih lokasi.
          // LocationPicker (autoLocate) yang menangani deteksi GPS awal di kedua kasus.
          setStep(4);
        },
        onError: (err: unknown) => {
          const msg =
            (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
            "Registrasi gagal. Coba lagi.";
          toast.error(msg);
        },
      }
    );
  };

  // ── Step 4: profil lapak ─────────────────────────────────────────────────
  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (shopName.length < 3) {
      toast.error("Nama lapak minimal 3 karakter!");
      return;
    }
    setupProfile(
      { shopName, description, radiusKm, isOpen: true, lat: collectorLat, lng: collectorLng },
      {
        onSuccess: () => {
          toast.success("Profil lapak berhasil dikonfigurasi!");
          router.push("/collector");
        },
        onError: (err: unknown) => {
          const msg =
            (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
            "Gagal mengatur profil lapak.";
          toast.error(msg);
        },
      }
    );
  };

  // ── Step 4 (customer): simpan lokasi → dashboard ─────────────────────────
  const handleCustomerLocationSubmit = () => {
    if (!customerCoords) {
      toast.error("Pilih titik lokasimu dulu di peta.");
      return;
    }
    updateMe(
      { lat: customerCoords.lat, lng: customerCoords.lng },
      {
        onSuccess: () => {
          toast.success("Lokasi tersimpan!");
          router.push("/dashboard");
        },
        onError: (err: unknown) => {
          const msg =
            (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
            "Gagal menyimpan lokasi. Coba lagi.";
          toast.error(msg);
        },
      }
    );
  };

  const headerSub =
    step === 1
      ? "Pilih peranmu di ekosistem ini"
      : step === 2
      ? "Lengkapi data akunmu"
      : step === 3
      ? "Verifikasi identitas dengan KTP"
      : role === "COLLECTOR"
      ? "Lengkapi profil lapakmu"
      : "Tentukan lokasimu";

  return (
    <div className="min-h-screen flex flex-col p-6 bg-surface justify-center">
      <div className="max-w-md w-full mx-auto">
        <Link href="/" className="flex items-center gap-2 mb-6 justify-center">
          <Logo size={40} />
          <span className="font-display font-extrabold text-xl tracking-tight text-ink">
            Rongsok.in
          </span>
        </Link>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-5 justify-center">
          {stepList.map((s, i, arr) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold font-mono transition-colors ${
                  step >= s
                    ? "bg-brand-500 text-ink"
                    : "bg-surface-raised text-ink-muted border border-ink-faint"
                }`}
              >
                {s}
              </div>
              {i < arr.length - 1 && (
                <div
                  className={`w-7 h-0.5 rounded-full ${step > s ? "bg-brand-500" : "bg-ink-faint"}`}
                />
              )}
            </div>
          ))}
        </div>

        {(step === 2 || step === 3) && (
          <button
            onClick={() => setStep(step - 1)}
            className="flex items-center gap-1 text-sm font-semibold text-ink-muted hover:text-ink mb-3 transition-colors"
          >
            <ArrowLeft size={16} /> Kembali
          </button>
        )}

        <div className="w-full bg-surface-raised rounded-2xl p-8">
          <div className="mb-7">
            <h1 className="font-display text-2xl font-extrabold tracking-tight text-ink">
              {step === 3 ? "Verifikasi identitas" : "Daftar akun"}
            </h1>
            <p className="text-sm text-ink-muted mt-1">{headerSub}</p>
          </div>

          {/* STEP 1: PILIH ROLE */}
          {step === 1 && (
            <div className="space-y-4">
              <button
                type="button"
                onClick={() => setRole("CUSTOMER")}
                className={`w-full border rounded-2xl p-4 flex items-center gap-4 cursor-pointer transition-colors text-left ${
                  role === "CUSTOMER" ? "border-ink bg-brand-100" : "border-ink-faint hover:border-ink"
                }`}
              >
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                    role === "CUSTOMER" ? "bg-brand-500 text-ink" : "bg-surface text-ink-muted"
                  }`}
                >
                  <User size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-ink">Pelanggan (Customer)</h3>
                  <p className="text-xs text-ink-muted">Jual sampah dan jadikan uang.</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setRole("COLLECTOR")}
                className={`w-full border rounded-2xl p-4 flex items-center gap-4 cursor-pointer transition-colors text-left ${
                  role === "COLLECTOR" ? "border-ink bg-brand-100" : "border-ink-faint hover:border-ink"
                }`}
              >
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                    role === "COLLECTOR" ? "bg-brand-500 text-ink" : "bg-surface text-ink-muted"
                  }`}
                >
                  <Store size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-ink">Pengepul (Collector)</h3>
                  <p className="text-xs text-ink-muted">Beli rongsokan dan kelola lapak.</p>
                </div>
              </button>

              <div className="pt-4">
                <Button
                  onClick={() => setStep(2)}
                  disabled={!role}
                  className="w-full flex items-center justify-center"
                >
                  Lanjut <ArrowRight size={18} />
                </Button>
              </div>

              <p className="text-center text-sm text-ink-muted pt-2">
                Sudah punya akun?{" "}
                <Link href="/login" className="text-ink font-bold hover:underline">
                  Masuk di sini
                </Link>
              </p>
            </div>
          )}

          {/* STEP 2: BIODATA */}
          {step === 2 && (
            <form onSubmit={handleBiodataNext} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-ink uppercase tracking-wider mb-2 block">
                  Email
                </label>
                <Input
                  type="email"
                  placeholder="budi@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="text-xs font-bold text-ink uppercase tracking-wider mb-2 block">
                  Nomor WhatsApp
                </label>
                <Input
                  type="tel"
                  inputMode="numeric"
                  placeholder="08123456789"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                  maxLength={15}
                  required
                />
              </div>
              <div>
                <label className="text-xs font-bold text-ink uppercase tracking-wider mb-2 block">
                  Kata Sandi
                </label>
                <Input
                  type="password"
                  placeholder="Minimal 8 karakter"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <p className="text-xs text-ink-muted flex items-start gap-2">
                <ShieldCheck size={14} className="shrink-0 mt-0.5 text-brand-700" />
                Nama lengkap akan otomatis terisi dari KTP di langkah verifikasi.
              </p>

              <div className="pt-3">
                <Button type="submit" className="w-full flex items-center justify-center gap-1">
                  Lanjut Verifikasi KTP <ArrowRight size={18} />
                </Button>
              </div>
            </form>
          )}

          {/* STEP 3: KYC / VERIFIKASI KTP */}
          {step === 3 && (
            <form onSubmit={handleKycSubmit} className="space-y-4">
              {showCamera ? (
                <>
                  <CameraCapture
                    onCapture={handleKtpCapture}
                    facingMode="environment"
                    guide="card"
                    watermark="Rongsok.in · KTP"
                    hint="Posisikan KTP di dalam bingkai. Pastikan tulisan jelas & tidak silau."
                  />
                  <p className="text-xs text-ink-muted flex items-start gap-2">
                    <ShieldCheck size={14} className="shrink-0 mt-0.5 text-brand-700" />
                    Foto wajib diambil langsung dari kamera. Data KTP hanya dipakai untuk verifikasi
                    identitas (1 KTP = 1 akun) dan tidak dibagikan ke pihak lain.
                  </p>
                </>
              ) : (
                <>
                  {/* Preview KTP */}
                  <div className="relative overflow-hidden rounded-2xl border border-ink-faint">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={ktpPreview} alt="Foto KTP" className="w-full object-cover" />
                    <button
                      type="button"
                      onClick={retakeKtp}
                      className="absolute top-2 right-2 rounded-full bg-ink/70 text-white text-xs font-semibold px-3 py-1.5"
                    >
                      Ganti Foto
                    </button>
                  </div>

                  {/* Status OCR */}
                  {ocrStatus === "scanning" && (
                    <div className="flex items-center gap-2 text-sm text-ink-muted">
                      <Loader2 size={16} className="animate-spin text-brand-700" />
                      <ScanLine size={16} className="text-brand-700" />
                      Membaca data KTP…
                    </div>
                  )}
                  {ocrStatus === "done" && (
                    <div className="flex items-center gap-2 text-sm text-brand-800 bg-brand-100 border border-brand-200 rounded-xl px-3 py-2">
                      <CheckCircle2 size={16} className="text-brand-700 shrink-0" />
                      NIK terbaca otomatis. Periksa nama, lalu lanjut.
                    </div>
                  )}
                  {ocrStatus === "failed" && (
                    <div className="text-sm text-status-error bg-status-error/10 border border-status-error/30 rounded-xl px-3 py-2.5 space-y-2">
                      <div className="flex items-start gap-2">
                        <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                        <span>
                          NIK belum terbaca otomatis. <b>Ketik NIK manual</b> di bawah, atau foto
                          ulang KTP (terang, tidak buram, memenuhi bingkai).
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={retakeKtp}
                        className="flex items-center gap-1.5 text-xs font-bold text-ink bg-surface-raised border border-ink-faint rounded-full px-3 py-1.5"
                      >
                        <Camera size={13} /> Foto Ulang KTP
                      </button>
                    </div>
                  )}

                  {/* NIK — terisi otomatis dari OCR, BISA dikoreksi manual (OCR sering meleset) */}
                  <div>
                    <label className="text-xs font-bold text-ink uppercase tracking-wider mb-2 block">
                      NIK
                    </label>
                    <Input
                      type="text"
                      inputMode="numeric"
                      placeholder="16 digit NIK (otomatis / ketik manual)"
                      value={nik}
                      onChange={(e) => setNik(e.target.value.replace(/\D/g, "").slice(0, 16))}
                      maxLength={16}
                      className="font-mono tracking-wide"
                      required
                    />
                    <p className="text-[11px] text-ink-muted mt-1">
                      Terisi otomatis dari pindai KTP. Kalau salah atau kosong, ketik 16 digit NIK
                      manual.
                    </p>
                  </div>

                  {/* Nama — boleh dikoreksi manual kalau OCR keliru */}
                  <div>
                    <label className="text-xs font-bold text-ink uppercase tracking-wider mb-2 block">
                      Nama Lengkap (sesuai KTP)
                    </label>
                    <Input
                      type="text"
                      placeholder="Nama sesuai KTP"
                      value={ktpName}
                      onChange={(e) => setKtpName(e.target.value.toUpperCase())}
                      readOnly={fieldsLocked}
                      className={fieldsLocked ? "bg-surface cursor-not-allowed" : ""}
                      required
                    />
                    {fieldsLocked && (
                      <button
                        type="button"
                        onClick={() => setFieldsLocked(false)}
                        className="flex items-center gap-1.5 text-xs font-semibold text-ink-muted hover:text-ink mt-1.5"
                      >
                        <Pencil size={13} /> Nama tidak sesuai? Koreksi manual
                      </button>
                    )}
                  </div>

                  <div className="pt-2">
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={
                        isRegistering ||
                        uploadingKtp ||
                        ocrStatus === "scanning" ||
                        !/^\d{16}$/.test(nik)
                      }
                    >
                      {isRegistering
                        ? "Memproses…"
                        : uploadingKtp
                        ? "Mengunggah foto…"
                        : ocrStatus === "scanning"
                        ? "Membaca KTP…"
                        : !/^\d{16}$/.test(nik)
                        ? "Lengkapi NIK (16 digit)"
                        : "Verifikasi & Lanjut"}
                    </Button>
                  </div>
                </>
              )}
            </form>
          )}

          {/* STEP 4 (COLLECTOR): PROFIL LAPAK */}
          {step === 4 && role === "COLLECTOR" && (
            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-ink uppercase tracking-wider mb-2 block">
                  Nama Lapak
                </label>
                <Input
                  type="text"
                  placeholder="Contoh: UD Jaya Abadi"
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="text-xs font-bold text-ink uppercase tracking-wider mb-2 block">
                  Deskripsi Lapak
                </label>
                <textarea
                  className="w-full border border-ink rounded-md bg-surface-raised p-3 text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-brand-500 min-h-[80px]"
                  placeholder="Deskripsi singkat lapak Anda…"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-ink uppercase tracking-wider mb-2 block">
                  Radius Operasional (km)
                </label>
                <Input
                  type="number"
                  inputMode="numeric"
                  min="1"
                  max="50"
                  placeholder="5"
                  value={radiusKm || ""}
                  onChange={(e) => setRadiusKm(e.target.value === "" ? 0 : Number(e.target.value))}
                  required
                />
              </div>
              <div>
                <LocationPicker
                  value={{ lat: collectorLat, lng: collectorLng }}
                  onChange={(c) => {
                    setCollectorLat(c.lat);
                    setCollectorLng(c.lng);
                  }}
                  autoLocate
                  label="Lokasi Lapak"
                  helperText="Geser peta tepat ke lokasi lapakmu — ini yang dipakai customer mencari pengepul terdekat. Tombol GPS butuh koneksi HTTPS."
                />
              </div>

              <div className="pt-3">
                <Button type="submit" className="w-full" disabled={isSettingProfile}>
                  {isSettingProfile ? "Menyimpan…" : "Selesai Mendaftar"}
                </Button>
              </div>
            </form>
          )}

          {/* STEP 4 (CUSTOMER): PILIH LOKASI */}
          {step === 4 && role === "CUSTOMER" && (
            <div className="space-y-4">
              <p className="text-sm text-ink-muted -mt-3">
                Geser peta untuk menandai lokasimu. Ini jadi titik pencarian pengepul
                terdekat & lokasi default setoranmu (bisa diubah nanti).
              </p>
              <LocationPicker
                value={customerCoords}
                onChange={setCustomerCoords}
                label="Pilih Titik Lokasi"
                autoLocate
                helperText="Lokasi tersimpan dipakai untuk mencari pengepul terdekat di sekitarmu."
              />
              <div className="pt-1">
                <Button
                  type="button"
                  onClick={handleCustomerLocationSubmit}
                  className="w-full"
                  disabled={isSavingLocation || !customerCoords}
                >
                  {isSavingLocation ? "Menyimpan…" : "Selesai Mendaftar"}
                </Button>
              </div>
            </div>
          )}
        </div>

        {step === 1 && (
          <p className="text-center text-xs text-ink-muted mt-4">
            Dengan mendaftar kamu menyetujui verifikasi identitas via KTP.
          </p>
        )}
      </div>
    </div>
  );
}
