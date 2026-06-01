"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight } from "lucide-react";
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
          const target =
            role === "ADMIN" ? "/admin" : role === "COLLECTOR" ? "/collector" : "/dashboard";
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
      <Link href="/" className="flex items-center gap-2 mb-8">
        <div className="w-10 h-10 bg-brand-500 rounded-2xl flex items-center justify-center text-ink font-display font-extrabold text-2xl">
          R
        </div>
        <span className="font-display font-extrabold text-xl tracking-tight text-ink">
          Rongsok.in
        </span>
      </Link>

      <div className="w-full max-w-md bg-surface-raised rounded-2xl p-8 mx-auto">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-ink">
            Masuk akun
          </h1>
          <p className="text-sm text-ink-muted mt-1.5">Lanjutkan perjalanan cuanmu.</p>
        </div>

        {error && (
          <div className="mb-5 p-3 bg-status-error/10 rounded-xl text-status-error text-xs font-semibold text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
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
              Kata Sandi
            </label>
            <Input
              type="password"
              placeholder="Masukkan kata sandi"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="flex justify-end">
            <Link href="#" className="text-xs font-semibold text-ink-muted hover:text-ink">
              Lupa sandi?
            </Link>
          </div>

          <Button type="submit" variant="primary" className="w-full" disabled={isPending}>
            {isPending ? "Memproses…" : "Masuk"} {!isPending && <ArrowRight size={16} />}
          </Button>
        </form>

        <div className="relative flex items-center my-6">
          <div className="flex-grow border-t border-ink-faint"></div>
          <span className="flex-shrink mx-4 text-mute text-[11px] font-bold uppercase tracking-wider">
            Atau
          </span>
          <div className="flex-grow border-t border-ink-faint"></div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-7">
          <Button variant="outline" onClick={() => toast.success("Segera hadir!")}>
            Google
          </Button>
          <Button variant="outline" onClick={() => toast.success("Segera hadir!")}>
            Facebook
          </Button>
        </div>

        <p className="text-center text-sm text-ink-muted">
          Belum punya akun?{" "}
          <Link href="/register" className="text-ink font-bold hover:underline">
            Daftar di sini
          </Link>
        </p>
      </div>

      <p className="mt-8 text-[10px] text-mute text-center uppercase tracking-widest font-bold">
        &copy; 2026 RONGSOK.IN MARKETPLACE
      </p>
    </div>
  );
}
