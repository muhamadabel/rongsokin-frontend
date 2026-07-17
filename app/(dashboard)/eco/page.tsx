"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Leaf,
  Share2,
  Trophy,
  Route,
  Sparkles,
  Crown,
} from "lucide-react";
import DesktopNav from "@/components/ui/DesktopNav";
import BottomNav from "@/components/ui/BottomNav";
import EcoImpactModal from "@/components/features/eco-impact/EcoImpactModal";
import { useMe } from "@/hooks/useAuth";
import { useOrdersList } from "@/hooks/useOrders";
import { useEcoLeaderboard } from "@/hooks/useEco";
import { useAuthStore } from "@/store/authStore";
import { co2KmFromKg, ecoTier, rankMedal } from "@/lib/eco";
import { getOrderTotalActualWeight } from "@/lib/utils";

export default function EcoPage() {
  const router = useRouter();
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const initFromStorage = useAuthStore((s) => s.initFromStorage);

  useEffect(() => {
    initFromStorage();
  }, [initFromStorage]);

  const { data: me } = useMe();
  const { data: completed } = useOrdersList({ status: "COMPLETED", limit: 100 });
  const { data: lb, isLoading: lbLoading } = useEcoLeaderboard();

  const [showShare, setShowShare] = useState(false);

  if (!token) {
    router.push("/login");
    return null;
  }

  // Dampak sendiri: dihitung dari order COMPLETED (jalan tanpa BE leaderboard),
  // pakai angka BE kalau tersedia (lebih akurat lintas perangkat).
  const myKgFromOrders = (completed || []).reduce(
    (sum, o) => sum + getOrderTotalActualWeight(o),
    0
  );
  const myKg = lb?.me?.totalKg ?? myKgFromOrders;
  const myKm = co2KmFromKg(myKg);
  const tier = ecoTier(myKg);
  const myRank = lb?.me?.rank ?? null;
  const name = me?.name || user?.name || "Kawan Rongsok";

  const leaderboard = lb?.leaderboard || [];
  const beAvailable = lb !== null; // null = endpoint BE belum deploy
  const toNext = tier.next != null ? Math.max(0, tier.next - myKg) : 0;

  return (
    <div className="min-h-screen bg-surface pb-24 md:pb-8">
      <DesktopNav />

      {/* MOBILE HEADER */}
      <header className="sticky top-0 z-40 bg-surface-raised border-b border-ink-faint px-4 py-3 flex items-center gap-3 md:hidden">
        <Link
          href="/dashboard"
          className="p-2 -ml-2 text-ink-muted hover:bg-surface rounded-full transition-colors"
        >
          <ArrowLeft size={22} />
        </Link>
        <h1 className="font-display font-extrabold text-lg tracking-tight text-ink flex items-center gap-2">
          <Leaf size={18} className="text-brand-700" /> Dampak Ekologis
        </h1>
      </header>

      <main className="max-w-2xl mx-auto px-4 md:px-0 py-5 md:py-8 space-y-6">
        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 text-sm font-semibold text-ink-muted hover:text-ink transition-colors"
          >
            <ArrowLeft size={16} /> Kembali
          </Link>
          <span className="text-ink-faint">·</span>
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-ink">
            Dampak Ekologis
          </h1>
        </div>

        {/* HERO — dampak kumulatif kamu (kartu polaritas gelap) */}
        <section className="bg-ink rounded-2xl p-6 text-forest-ink relative overflow-hidden">
          {/* Background Glows */}
          <div
            className="absolute -top-16 -right-16 w-56 h-56 rounded-full opacity-40 pointer-events-none"
            style={{ background: "radial-gradient(circle, rgba(159,232,112,0.25), transparent 70%)" }}
          />
          <div
            className="absolute -bottom-16 -left-16 w-56 h-56 rounded-full opacity-30 pointer-events-none"
            style={{ background: "radial-gradient(circle, rgba(159,232,112,0.15), transparent 70%)" }}
          />
          <div className="relative z-10 flex flex-col sm:flex-row gap-6 items-center sm:items-start justify-between">
            <div className="flex-1 w-full space-y-4">
              <div className="flex items-center justify-between sm:justify-start gap-3">
                <span className="inline-flex items-center gap-1.5 bg-brand-500/15 text-brand-500 rounded-full px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider">
                  {tier.label}
                </span>
                {myRank != null && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-forest-muted font-mono">
                    <Trophy size={13} className="text-brand-500" /> Peringkat #{myRank}
                  </span>
                )}
              </div>

              <div>
                <span className="text-[11px] font-bold text-forest-muted uppercase tracking-widest font-mono">
                  Total kamu daur ulang
                </span>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="font-display font-black text-5xl text-brand-500 tracking-tight font-mono">
                    {myKg.toFixed(1)}
                  </span>
                  <span className="text-lg font-bold text-forest-ink">kg</span>
                </div>
              </div>

              <div className="flex items-start gap-2.5 bg-surface-raised/5 border border-brand-500/15 rounded-2xl p-3">
                <Route size={16} className="text-brand-500 shrink-0 mt-0.5" />
                <p className="text-xs text-forest-muted leading-relaxed">
                  Setara mencegah emisi karbon dari perjalanan motor sejauh{" "}
                  <span className="font-mono font-extrabold text-forest-ink">
                    {myKm.toFixed(0)} km
                  </span>
                  . Terima kasih sudah menjaga bumi! 🌏
                </p>
              </div>

              {/* Progress ke tier berikutnya */}
              {tier.next != null && (
                <div>
                  <div className="flex justify-between text-[10px] font-bold text-forest-muted uppercase tracking-wider mb-1.5">
                    <span>Menuju tier berikutnya</span>
                    <span className="font-mono">{toNext.toFixed(1)} kg lagi</span>
                  </div>
                  <div className="h-2 rounded-full bg-surface-raised/10 overflow-hidden">
                    <div
                      className="h-full bg-brand-500 rounded-full transition-all"
                      style={{ width: `${Math.min(100, (myKg / tier.next) * 100)}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Large Tier Badge Emblem */}
            <div className="flex flex-col items-center justify-center shrink-0">
              <div className="relative group w-28 h-28 rounded-full bg-brand-500/10 border border-brand-500/30 flex items-center justify-center p-3 shadow-lg shadow-brand-500/10">
                <div className="absolute inset-0 rounded-full bg-brand-500/20 blur-md opacity-70 group-hover:opacity-100 transition-opacity" />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={tier.badge}
                  alt={tier.label}
                  className="w-full h-full object-contain relative z-10 drop-shadow-[0_4px_12px_rgba(159,232,112,0.3)] transition-transform duration-300 group-hover:scale-110"
                />
              </div>
              <span className="text-[10px] font-bold text-brand-400 mt-2 font-mono uppercase tracking-widest">
                Tier Badge
              </span>
            </div>
          </div>

          <button
            onClick={() => setShowShare(true)}
            disabled={myKg <= 0}
            className="relative z-10 mt-5 w-full bg-brand-500 hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed text-ink font-bold py-3 rounded-2xl flex items-center justify-center gap-2 transition-colors text-sm cursor-pointer"
          >
            <Share2 size={16} /> Bagikan Pencapaianmu
          </button>
        </section>

        {/* LEADERBOARD */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-extrabold text-base text-ink tracking-tight flex items-center gap-2">
              <Crown size={18} className="text-brand-700" /> Papan Peringkat
            </h2>
            <span className="text-[10px] font-bold text-mute uppercase tracking-widest font-mono">
              Pahlawan Daur Ulang
            </span>
          </div>

          {lbLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="bg-surface-raised rounded-2xl h-16 animate-pulse" />
              ))}
            </div>
          ) : !beAvailable ? (
            <div className="bg-surface-raised rounded-2xl p-8 text-center space-y-2">
              <Sparkles size={28} className="text-ink-faint mx-auto" />
              <p className="text-sm font-bold text-ink">Papan peringkat segera hadir</p>
              <p className="text-xs text-ink-muted leading-relaxed max-w-xs mx-auto">
                Dampak ekologismu sudah dihitung di atas. Peringkat antar-pengguna akan
                tampil di sini sebentar lagi.
              </p>
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="bg-surface-raised rounded-2xl p-8 text-center space-y-2">
              <Trophy size={28} className="text-ink-faint mx-auto" />
              <p className="text-sm font-bold text-ink">Belum ada peringkat</p>
              <p className="text-xs text-ink-muted">
                Jadilah yang pertama! Selesaikan transaksi daur ulang untuk masuk papan
                peringkat.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {leaderboard.map((entry) => {
                const medal = rankMedal(entry.rank);
                const isMe = entry.userId === (me?.id || user?.id);
                return (
                  <div
                    key={entry.userId}
                    className={`rounded-2xl p-3.5 flex items-center gap-3 transition-colors ${
                      isMe
                        ? "bg-brand-100 ring-2 ring-brand-500"
                        : "bg-surface-raised"
                    }`}
                  >
                    <div
                      className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 font-mono font-extrabold text-sm ${
                        entry.rank <= 3 ? "bg-brand-500 text-ink" : "bg-surface text-ink-muted"
                      }`}
                    >
                      {medal || entry.rank}
                    </div>
                    <div className="w-9 h-9 rounded-full bg-brand-100 overflow-hidden flex items-center justify-center text-ink font-bold text-xs shrink-0">
                      {entry.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={entry.avatarUrl} alt={entry.name} className="w-full h-full object-cover" />
                      ) : (
                        entry.name.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-bold text-sm text-ink truncate">
                          {entry.name}
                        </h3>
                        {isMe && (
                          <span className="text-[9px] font-extrabold text-brand-800 bg-brand-500 rounded-full px-1.5 py-0.5 shrink-0">
                            KAMU
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-ink-muted font-mono">
                        {entry.orderCount} transaksi
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-display font-extrabold text-base text-ink font-mono">
                        {entry.totalKg.toFixed(1)}
                      </div>
                      <div className="text-[10px] text-mute font-bold uppercase">kg</div>
                    </div>
                  </div>
                );
              })}

              {/* Baris "kamu" kalau di luar Top-N */}
              {myRank != null &&
                !leaderboard.some((e) => e.userId === (me?.id || user?.id)) && (
                  <div className="rounded-2xl p-3.5 flex items-center gap-3 bg-brand-100 ring-2 ring-brand-500 mt-1">
                    <div className="w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 font-mono font-extrabold text-sm bg-surface text-ink-muted">
                      {myRank}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-bold text-sm text-ink truncate">{name}</h3>
                        <span className="text-[9px] font-extrabold text-brand-800 bg-brand-500 rounded-full px-1.5 py-0.5 shrink-0">
                          KAMU
                        </span>
                      </div>
                      <p className="text-[11px] text-ink-muted font-mono">
                        {lb?.me?.orderCount ?? 0} transaksi
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-display font-extrabold text-base text-ink font-mono">
                        {myKg.toFixed(1)}
                      </div>
                      <div className="text-[10px] text-mute font-bold uppercase">kg</div>
                    </div>
                  </div>
                )}
            </div>
          )}
        </section>
      </main>

      {/* SHARE CARD */}
      {showShare && (
        <EcoImpactModal
          customerName={name}
          actualWeight={myKg}
          orderId={me?.id || user?.id || "eco"}
          avatarUrl={me?.avatarUrl || user?.avatarUrl}
          variant="lifetime"
          titleLabel={tier.label}
          closeLabel="Tutup"
          onClose={() => setShowShare(false)}
        />
      )}

      <BottomNav />
    </div>
  );
}
