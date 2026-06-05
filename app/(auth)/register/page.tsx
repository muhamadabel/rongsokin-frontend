"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Logo } from "@/components/ui/Logo";
import { User, Store, ArrowLeft, ArrowRight, CheckCircle2, MapPin } from "lucide-react";
import { useRegister } from "@/hooks/useAuth";
import { useUpdateCollectorProfile } from "@/hooks/useCollector";
import toast from "react-hot-toast";

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

  // Step 2 Form States
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  // Step 3 Form States (Collector Only)
  const [shopName, setShopName] = useState("");
  const [description, setDescription] = useState("");
  const [radiusKm, setRadiusKm] = useState(5);
  const [collectorLat, setCollectorLat] = useState(-7.7956);
  const [collectorLng, setCollectorLng] = useState(110.3695);
  const [gpsDetected, setGpsDetected] = useState(false);

  const { mutate: register, isPending: isRegistering } = useRegister();
  const { mutate: setupProfile, isPending: isSettingProfile } = useUpdateCollectorProfile();

  // Preselect role from URL (?role=COLLECTOR)
  useEffect(() => {
    const r = searchParams.get("role");
    if (r === "COLLECTOR" || r === "CUSTOMER") setRole(r);
  }, [searchParams]);

  const handleStep2Submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      toast.error("Kata sandi minimal 8 karakter!");
      return;
    }

    register(
      { name, email, phone, password, role },
      {
        onSuccess: () => {
          toast.success("Registrasi akun berhasil!");
          if (role === "COLLECTOR") {
            if (navigator.geolocation) {
              navigator.geolocation.getCurrentPosition(
                (pos) => {
                  setCollectorLat(pos.coords.latitude);
                  setCollectorLng(pos.coords.longitude);
                  setGpsDetected(true);
                },
                () => setGpsDetected(false)
              );
            }
            setStep(3);
          } else {
            router.push("/dashboard");
          }
        },
        onError: (err: any) => {
          toast.error(err.response?.data?.message || "Registrasi gagal. Coba email lain.");
        },
      }
    );
  };

  const handleStep3Submit = (e: React.FormEvent) => {
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
        onError: (err: any) => {
          toast.error(err.response?.data?.message || "Gagal mengatur profil lapak.");
        },
      }
    );
  };

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
          {[1, 2, role === "COLLECTOR" ? 3 : null].filter(Boolean).map((s, i, arr) => (
            <div key={i} className="flex items-center gap-2">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold font-mono transition-colors ${
                  step >= (s as number)
                    ? "bg-brand-500 text-ink"
                    : "bg-surface-raised text-mute border border-ink-faint"
                }`}
              >
                {s}
              </div>
              {i < arr.length - 1 && (
                <div
                  className={`w-8 h-0.5 rounded-full ${
                    step > (s as number) ? "bg-brand-500" : "bg-ink-faint"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {step > 1 && step < 3 && (
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
              Daftar akun
            </h1>
            <p className="text-sm text-ink-muted mt-1">
              {step === 1
                ? "Pilih peranmu di ekosistem ini"
                : step === 2
                ? "Lengkapi data dirimu"
                : "Lengkapi profil lapakmu"}
            </p>
          </div>

          {/* STEP 1: PILIH ROLE */}
          {step === 1 && (
            <div className="space-y-4">
              <button
                type="button"
                onClick={() => setRole("CUSTOMER")}
                className={`w-full border rounded-2xl p-4 flex items-center gap-4 cursor-pointer transition-colors text-left ${
                  role === "CUSTOMER"
                    ? "border-ink bg-brand-100"
                    : "border-ink-faint hover:border-ink"
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
                  role === "COLLECTOR"
                    ? "border-ink bg-brand-100"
                    : "border-ink-faint hover:border-ink"
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
            <form onSubmit={handleStep2Submit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-ink uppercase tracking-wider mb-2 block">
                  Nama Lengkap
                </label>
                <Input
                  type="text"
                  placeholder="Sesuai KTP"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
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

              <div className="pt-3">
                <Button type="submit" className="w-full" disabled={isRegistering}>
                  {isRegistering
                    ? "Memproses…"
                    : role === "COLLECTOR"
                    ? "Lanjut Profil Lapak"
                    : "Selesai Mendaftar"}
                </Button>
              </div>
            </form>
          )}

          {/* STEP 3: PROFIL LAPAK */}
          {step === 3 && (
            <form onSubmit={handleStep3Submit} className="space-y-4">
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
                  className="w-full border border-ink rounded-md bg-surface-raised p-3 text-sm text-ink placeholder:text-mute focus:outline-none focus:ring-2 focus:ring-brand-500 min-h-[80px]"
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
                  min="1"
                  max="50"
                  value={radiusKm}
                  onChange={(e) => setRadiusKm(Number(e.target.value))}
                  required
                />
              </div>
              <div
                className={`border rounded-2xl p-4 flex items-start gap-3 ${
                  gpsDetected
                    ? "bg-brand-100 border-brand-200 text-brand-800"
                    : "bg-surface border-ink-faint text-ink-muted"
                }`}
              >
                {gpsDetected ? (
                  <CheckCircle2 size={20} className="shrink-0 mt-0.5 text-brand-700" />
                ) : (
                  <MapPin size={20} className="shrink-0 mt-0.5 text-ink-muted" />
                )}
                <p className="text-xs leading-relaxed">
                  {gpsDetected
                    ? "Lokasi GPS terdeteksi. Lapakmu akan muncul di hasil pencarian terdekat."
                    : "Menggunakan lokasi default Yogyakarta. Detail harga & jam operasional bisa diatur di Dashboard."}
                </p>
              </div>

              <div className="pt-3">
                <Button type="submit" className="w-full" disabled={isSettingProfile}>
                  {isSettingProfile ? "Menyimpan…" : "Selesai Mendaftar"}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
