"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useLogin } from "@/hooks/useAuth";
import toast from "react-hot-toast";

export default function LoginPage() {
  const router = useRouter();
  const { mutate: login, isPending } = useLogin();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    login(
      { email, password },
      {
        onSuccess: (data) => {
          toast.success(`Selamat datang kembali, ${data.data.user.name}!`);
          const role = data.data.user.role;
          const target = role === "ADMIN" ? "/admin" : (role === "COLLECTOR" ? "/collector" : "/dashboard");
          router.push(target);
        },
        onError: (err: any) => {
          const errMsg = err.response?.data?.message || "Login gagal. Silakan coba lagi.";
          setError(errMsg);
          toast.error(errMsg);
        },
      }
    );
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-surface">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-ink-faint p-8 mx-auto">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-brand-500 rounded-xl flex items-center justify-center text-white font-black text-2xl mb-4">R</div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight">Masuk Akun</h1>
          <p className="text-sm text-ink-muted mt-1">Lanjutkan perjalanan cuanmu!</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-status-error/10 border border-status-error/20 rounded-xl text-status-error text-xs font-bold text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
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
            <label className="text-xs font-bold text-ink-muted uppercase tracking-wider mb-2 block">Kata Sandi</label>
            <Input 
              type="password" 
              placeholder="Masukkan kata sandi" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
            />
          </div>
          
          <div className="flex justify-end">
            <Link href="#" className="text-xs font-bold text-brand-500">Lupa sandi?</Link>
          </div>

          <div className="pt-2">
            <Button type="submit" variant="primary" className="w-full py-3 shadow-lg" disabled={isPending}>
              {isPending ? "Memproses..." : "Masuk"}
            </Button>
          </div>
        </form>

        <div className="relative flex items-center my-6">
          <div className="flex-grow border-t border-ink-faint"></div>
          <span className="flex-shrink mx-4 text-ink-muted text-xs font-bold uppercase">Atau masuk dengan</span>
          <div className="flex-grow border-t border-ink-faint"></div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-8">
          <Button variant="outline" className="py-2.5" onClick={() => toast.success("Segera hadir!")}>Google</Button>
          <Button variant="outline" className="py-2.5" onClick={() => toast.success("Segera hadir!")}>Facebook</Button>
        </div>

        <p className="text-center text-sm text-ink-muted">
          Belum punya akun? <Link href="/register" className="text-brand-500 font-bold">Daftar di sini</Link>
        </p>
      </div>

      <p className="mt-8 text-[10px] text-ink-muted text-center uppercase tracking-widest font-bold">
        &copy; 2026 RONGSOK.IN MARKETPLACE
      </p>
    </div>
  );
}
