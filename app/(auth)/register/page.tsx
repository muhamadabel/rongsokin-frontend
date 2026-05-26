"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { User, Store, ArrowLeft, ArrowRight, CheckCircle } from "flowbite-react-icons/outline";
import { useRegister } from "@/hooks/useAuth";
import { useUpdateCollectorProfile } from "@/hooks/useCollector";
import toast from "react-hot-toast";

export default function RegisterPage() {
  const router = useRouter();
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
  const [collectorLat, setCollectorLat] = useState(-7.7956); // default Yogyakarta
  const [collectorLng, setCollectorLng] = useState(110.3695);
  const [gpsDetected, setGpsDetected] = useState(false);

  const { mutate: register, isPending: isRegistering } = useRegister();
  const { mutate: setupProfile, isPending: isSettingProfile } = useUpdateCollectorProfile();

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
            // Coba ambil GPS sebelum step 3
            if (navigator.geolocation) {
              navigator.geolocation.getCurrentPosition(
                (pos) => {
                  setCollectorLat(pos.coords.latitude);
                  setCollectorLng(pos.coords.longitude);
                  setGpsDetected(true);
                },
                () => {
                  // GPS ditolak — pakai default Yogyakarta
                  setGpsDetected(false);
                }
              );
            }
            setStep(3);
          } else {
            router.push("/dashboard");
          }
        },
        onError: (err: any) => {
          const errMsg = err.response?.data?.message || "Registrasi gagal. Coba email lain.";
          toast.error(errMsg);
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
      {
        shopName,
        description,
        radiusKm,
        isOpen: true,
        lat: collectorLat,
        lng: collectorLng,
      },
      {
        onSuccess: () => {
          toast.success("Profil lapak berhasil dikonfigurasi!");
          router.push("/collector");
        },
        onError: (err: any) => {
          const errMsg = err.response?.data?.message || "Gagal mengatur profil lapak.";
          toast.error(errMsg);
        },
      }
    );
  };


  return (
    <div className="min-h-screen flex flex-col p-6 bg-surface justify-center">
      <div className="max-w-md w-full mx-auto">
        {step > 1 && step < 3 && (
          <button 
            onClick={() => setStep(step - 1)} 
            className="self-start p-2 mb-4 -ml-2 text-ink-muted hover:bg-surface-raised rounded-full transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
        )}

        <div className="w-full bg-white rounded-2xl shadow-sm border border-ink-faint p-8 mt-4">
          <div className="flex flex-col items-center mb-8">
            <div className="w-12 h-12 bg-brand-500 rounded-xl flex items-center justify-center text-white font-black text-2xl mb-4">R</div>
            <h1 className="font-display text-2xl font-extrabold tracking-tight">Daftar Akun</h1>
            <p className="text-sm text-ink-muted mt-1 text-center">
              {step === 1 ? "Pilih peranmu di ekosistem ini" : step === 2 ? "Lengkapi data dirimu" : "Lengkapi profil lapakmu"}
            </p>
          </div>

          {/* STEP 1: PILIH ROLE */}
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
              <div 
                onClick={() => setRole("CUSTOMER")}
                className={`border-2 rounded-xl p-4 flex items-center gap-4 cursor-pointer transition-colors ${role === 'CUSTOMER' ? 'border-brand-500 bg-brand-50' : 'border-ink-faint hover:border-brand-200'}`}
              >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${role === 'CUSTOMER' ? 'bg-brand-500 text-white' : 'bg-surface-raised text-ink-muted'}`}>
                   <User size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-ink">Pelanggan (Customer)</h3>
                  <p className="text-xs text-ink-muted">Jual sampah dan jadikan uang.</p>
                </div>
              </div>

              <div 
                onClick={() => setRole("COLLECTOR")}
                className={`border-2 rounded-xl p-4 flex items-center gap-4 cursor-pointer transition-colors ${role === 'COLLECTOR' ? 'border-brand-500 bg-brand-50' : 'border-ink-faint hover:border-brand-200'}`}
              >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${role === 'COLLECTOR' ? 'bg-brand-500 text-white' : 'bg-surface-raised text-ink-muted'}`}>
                   <Store size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-ink">Pengepul (Collector)</h3>
                  <p className="text-xs text-ink-muted">Beli rongsokan dan kelola lapak.</p>
                </div>
              </div>

              <div className="pt-6">
                <Button onClick={() => setStep(2)} disabled={!role} className="w-full py-3 shadow-lg flex items-center justify-center">
                  Lanjut <ArrowRight size={18} className="ml-2" />
                </Button>
              </div>
              
              <p className="text-center text-sm text-ink-muted mt-6">
                Sudah punya akun? <Link href="/login" className="text-brand-500 font-bold">Masuk di sini</Link>
              </p>
            </div>
          )}

          {/* STEP 2: FORM BIODATA */}
          {step === 2 && (
            <form onSubmit={handleStep2Submit} className="space-y-4 animate-in fade-in slide-in-from-right-4">
              <div>
                <label className="text-xs font-bold text-ink-muted uppercase tracking-wider mb-2 block">Nama Lengkap</label>
                <Input 
                  type="text" 
                  placeholder="Sesuai KTP" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  required 
                />
              </div>
              <div>
                <label className="text-xs font-bold text-ink-muted uppercase tracking-wider mb-2 block">Email</label>
                <Input 
                  type="email" 
                  placeholder="Contoh: budi@gmail.com" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  required 
                />
              </div>
              <div>
                <label className="text-xs font-bold text-ink-muted uppercase tracking-wider mb-2 block">Nomor WhatsApp</label>
                <Input 
                  type="tel" 
                  placeholder="08123456789" 
                  value={phone} 
                  onChange={(e) => setPhone(e.target.value)} 
                  required 
                />
              </div>
              <div>
                <label className="text-xs font-bold text-ink-muted uppercase tracking-wider mb-2 block">Kata Sandi</label>
                <Input 
                  type="password" 
                  placeholder="Minimal 8 karakter" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  required 
                />
              </div>

              <div className="pt-6">
                <Button type="submit" className="w-full py-3 shadow-lg" disabled={isRegistering}>
                  {isRegistering ? "Memproses..." : role === "COLLECTOR" ? "Lanjut Profil Lapak" : "Selesai Mendaftar"}
                </Button>
              </div>
            </form>
          )}

          {/* STEP 3: PROFIL LAPAK (COLLECTOR ONLY) */}
          {step === 3 && (
            <form onSubmit={handleStep3Submit} className="space-y-4 animate-in fade-in slide-in-from-right-4">
              <div>
                <label className="text-xs font-bold text-ink-muted uppercase tracking-wider mb-2 block">Nama Lapak</label>
                <Input 
                  type="text" 
                  placeholder="Contoh: UD Jaya Abadi" 
                  value={shopName} 
                  onChange={(e) => setShopName(e.target.value)} 
                  required 
                />
              </div>
              <div>
                <label className="text-xs font-bold text-ink-muted uppercase tracking-wider mb-2 block">Deskripsi Lapak</label>
                <textarea 
                  className="w-full border border-ink-faint rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 min-h-[80px]"
                  placeholder="Deskripsi singkat lapak Anda..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                ></textarea>
              </div>
              <div>
                <label className="text-xs font-bold text-ink-muted uppercase tracking-wider mb-2 block">Radius Operasional (km)</label>
                <Input 
                  type="number" 
                  min="1" 
                  max="50" 
                  value={radiusKm} 
                  onChange={(e) => setRadiusKm(Number(e.target.value))} 
                  required 
                />
              </div>
              <div className={`border rounded-xl p-4 flex items-start gap-3 ${gpsDetected ? 'bg-green-50 border-green-200 text-green-900' : 'bg-brand-50 border-brand-200 text-brand-900'}`}>
                 <CheckCircle size={20} className={`shrink-0 mt-0.5 ${gpsDetected ? 'text-green-500' : 'text-brand-500'}`} />
                <p className="text-xs leading-relaxed">
                  {gpsDetected 
                    ? `✅ Lokasi GPS terdeteksi. Lapakmu akan muncul di hasil pencarian terdekat.`
                    : `📍 Menggunakan lokasi default Yogyakarta. Detail harga dan jam operasional bisa diatur di Dashboard.`
                  }
                </p>
              </div>

              <div className="pt-6">
                <Button type="submit" className="w-full py-3 shadow-lg" disabled={isSettingProfile}>
                  {isSettingProfile ? "Menyimpan..." : "Selesai Mendaftar"}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
