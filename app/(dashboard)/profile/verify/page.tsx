"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ShieldCheck,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Camera,
  ScanLine,
  Lock,
  Pencil,
  BadgeCheck,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { CameraCapture } from "@/components/ui/CameraCapture";
import DesktopNav from "@/components/ui/DesktopNav";
import BottomNav from "@/components/ui/BottomNav";
import { ProfileEditSkeleton } from "@/components/ui/Skeleton";
import { useMe, useUpdateMe } from "@/hooks/useAuth";
import { useAuthStore } from "@/store/authStore";
import { recognizeKtp } from "@/lib/ktpOcr";
import { uploadToCloudinary } from "@/lib/upload";
import toast from "react-hot-toast";

type OcrStatus = "idle" | "scanning" | "done" | "failed";

export default function VerifyKtpPage() {
  const router = useRouter();
  const initFromStorage = useAuthStore((s) => s.initFromStorage);
  const token = useAuthStore((s) => s.token);

  useEffect(() => {
    initFromStorage();
  }, [initFromStorage]);

  const { data: me, isLoading } = useMe();
  const updateMe = useUpdateMe();

  const [showCamera, setShowCamera] = useState(true);
  const [ktpPreview, setKtpPreview] = useState("");
  const [ktpUrl, setKtpUrl] = useState("");
  const [uploadingKtp, setUploadingKtp] = useState(false);
  const [nik, setNik] = useState("");
  const [ktpName, setKtpName] = useState("");
  const [ocrStatus, setOcrStatus] = useState<OcrStatus>("idle");
  const [fieldsLocked, setFieldsLocked] = useState(false);

  if (!token) {
    router.push("/login");
    return null;
  }

  const handleKtpCapture = async (blob: Blob, dataUrl: string) => {
    setKtpPreview(dataUrl);
    setShowCamera(false);
    setOcrStatus("scanning");
    setNik("");
    setKtpName("");

    setUploadingKtp(true);
    uploadToCloudinary(blob)
      .then((r) => {
        if (!r.remote) {
          setKtpUrl("");
          toast.error("Gagal mengunggah foto KTP ke server. Foto ulang.");
          return;
        }
        setKtpUrl(r.url);
      })
      .catch(() => toast.error("Gagal mengunggah foto KTP. Ulangi foto."))
      .finally(() => setUploadingKtp(false));

    try {
      const res = await recognizeKtp(blob);
      setNik(res.nik || "");
      setKtpName(res.name || "");
      setOcrStatus(res.nik ? "done" : "failed");
      setFieldsLocked(!!res.name);
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ktpPreview) return toast.error("Ambil foto KTP terlebih dahulu.");
    if (uploadingKtp) return toast.error("Tunggu, foto KTP sedang diunggah…");
    if (!ktpUrl) return toast.error("Foto KTP belum berhasil diunggah ke server. Foto ulang.");
    if (!/^\d{16}$/.test(nik)) return toast.error("NIK harus 16 digit. Foto ulang KTP.");
    if (ktpName.trim().length < 3) return toast.error("Nama sesuai KTP tidak valid.");

    updateMe.mutate(
      { nik, ktpName: ktpName.trim(), ktpUrl },
      {
        onSuccess: () => {
          toast.success("Identitas berhasil diverifikasi!");
          router.push("/profile");
        },
        onError: (err: unknown) => {
          const msg =
            (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
            "Verifikasi gagal. Coba lagi.";
          toast.error(msg);
        },
      }
    );
  };

  if (isLoading) return <ProfileEditSkeleton />;

  return (
    <div className="min-h-screen bg-surface pb-24 md:pb-8">
      <DesktopNav />

      <header className="sticky top-0 z-40 bg-surface-raised border-b border-ink-faint px-4 py-3 flex items-center gap-3 md:hidden">
        <Link href="/profile" className="p-2 -ml-2 text-ink-muted hover:bg-surface rounded-full">
          <ArrowLeft size={22} />
        </Link>
        <h1 className="font-display font-extrabold text-lg tracking-tight text-ink">
          Verifikasi KTP
        </h1>
      </header>

      <main className="max-w-md mx-auto px-4 md:px-0 py-5 md:py-8">
        <div className="hidden md:flex items-center gap-3 mb-5">
          <Link
            href="/profile"
            className="flex items-center gap-1.5 text-sm font-semibold text-ink-muted hover:text-ink"
          >
            <ArrowLeft size={16} /> Kembali
          </Link>
        </div>

        {/* Sudah terverifikasi */}
        {me?.isVerified ? (
          <div className="bg-surface-raised rounded-2xl p-8 flex flex-col items-center text-center gap-3">
            <BadgeCheck size={48} className="text-brand-700" />
            <h2 className="font-display text-xl font-extrabold text-ink">Akun Terverifikasi</h2>
            <p className="text-sm text-ink-muted">
              Identitasmu sudah terverifikasi. Tidak ada yang perlu dilakukan.
            </p>
            <Link href="/profile" className="w-full mt-1">
              <Button className="w-full">Kembali ke Profil</Button>
            </Link>
          </div>
        ) : (
          <div className="bg-surface-raised rounded-2xl p-6 space-y-4">
            <div>
              <h2 className="font-display text-xl font-extrabold text-ink tracking-tight">
                Verifikasi identitas
              </h2>
              <p className="text-sm text-ink-muted mt-1">
                Pindai KTP untuk mengaktifkan akunmu (1 KTP = 1 akun).
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {showCamera ? (
                <>
                  <CameraCapture
                    onCapture={handleKtpCapture}
                    facingMode="environment"
                    guide="card"
                    watermark="Rongsok.in · KTP"
                    hint="Posisikan KTP di dalam bingkai. Pastikan terang & tidak silau."
                  />
                  <p className="text-xs text-ink-muted flex items-start gap-2">
                    <ShieldCheck size={14} className="shrink-0 mt-0.5 text-brand-700" />
                    Foto wajib dari kamera. Data KTP hanya untuk verifikasi identitas dan tidak
                    dibagikan.
                  </p>
                </>
              ) : (
                <>
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
                          NIK belum terbaca. Foto ulang KTP — pastikan terang, tidak buram, dan
                          memenuhi bingkai.
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

                  <div>
                    <label className="text-xs font-bold text-ink uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      NIK <Lock size={11} className="text-ink-muted" />
                    </label>
                    <Input
                      type="text"
                      inputMode="numeric"
                      placeholder="Otomatis dari KTP…"
                      value={nik}
                      readOnly
                      tabIndex={-1}
                      maxLength={16}
                      className="bg-surface cursor-not-allowed font-mono tracking-wide"
                      required
                    />
                    <p className="text-[11px] text-ink-muted mt-1">
                      NIK diisi otomatis hasil pindai & tidak bisa diketik manual.
                    </p>
                  </div>

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

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={
                      updateMe.isPending ||
                      uploadingKtp ||
                      ocrStatus === "scanning" ||
                      !/^\d{16}$/.test(nik)
                    }
                  >
                    {updateMe.isPending
                      ? "Memproses…"
                      : uploadingKtp
                      ? "Mengunggah foto…"
                      : ocrStatus === "scanning"
                      ? "Membaca KTP…"
                      : !/^\d{16}$/.test(nik)
                      ? "NIK belum terbaca"
                      : "Verifikasi Sekarang"}
                  </Button>
                </>
              )}
            </form>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
