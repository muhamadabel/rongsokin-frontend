"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Logo } from "@/components/ui/Logo";
import toast from "react-hot-toast";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Silakan masukkan email Anda.");
      return;
    }

    setIsPending(true);
    // Simulasikan pengiriman link atur ulang sandi
    setTimeout(() => {
      setIsPending(false);
      setIsSubmitted(true);
      toast.success("Tautan atur ulang kata sandi berhasil dikirim!");
    }, 1500);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-surface">
      <Link href="/" className="flex items-center gap-2 mb-8">
        <Logo className="w-10 h-10" />
        <span className="font-display font-black text-xl tracking-tight text-ink uppercase">
          Rongsok<span className="text-brand-500">.in</span>
        </span>
      </Link>

      <div className="w-full max-w-sm bg-surface-raised rounded-3xl border border-ink-faint p-6 md:p-8">
        {!isSubmitted ? (
          <>
            <h2 className="font-display font-extrabold text-2xl text-ink tracking-tight mb-1.5">
              Lupa Kata Sandi?
            </h2>
            <p className="text-xs text-ink-muted leading-relaxed mb-6">
              Masukkan email terdaftar Anda di bawah ini, kami akan mengirimkan tautan untuk mengatur ulang kata sandi Anda.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-mute uppercase tracking-widest block">
                  Alamat Email
                </label>
                <Input
                  type="email"
                  placeholder="name@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isPending}
                  required
                />
              </div>

              <Button type="submit" variant="primary" className="w-full py-2.5 font-bold" disabled={isPending}>
                {isPending ? "Mengirim Tautan…" : "Kirim Tautan Atur Ulang"}
              </Button>
            </form>
          </>
        ) : (
          <div className="text-center py-4 space-y-4">
            <div className="mx-auto w-12 h-12 bg-brand-100 text-brand-700 rounded-full flex items-center justify-center">
              <CheckCircle2 size={28} />
            </div>
            <div className="space-y-1.5">
              <h2 className="font-display font-extrabold text-xl text-ink tracking-tight">
                Email Terkirim!
              </h2>
              <p className="text-xs text-ink-muted leading-relaxed px-2">
                Kami telah mengirimkan tautan instruksi pemulihan kata sandi ke email <strong className="text-ink">{email}</strong>. Silakan periksa kotak masuk atau folder spam Anda.
              </p>
            </div>
            <div className="pt-2">
              <Button
                variant="outline"
                onClick={() => setIsSubmitted(false)}
                className="w-full py-2.5 text-xs font-bold"
              >
                Gunakan Email Lain
              </Button>
            </div>
          </div>
        )}

        <div className="mt-6 pt-5 border-t border-ink-faint text-center">
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-ink-muted hover:text-ink transition-colors"
          >
            <ArrowLeft size={14} /> Kembali ke Halaman Masuk
          </Link>
        </div>
      </div>

      <p className="mt-8 text-[10px] text-mute text-center uppercase tracking-widest font-bold">
        &copy; 2026 RONGSOK.IN MARKETPLACE
      </p>
    </div>
  );
}
