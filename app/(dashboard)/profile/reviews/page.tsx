"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Star, MessageSquare, User as UserIcon } from "lucide-react";
import DesktopNav from "@/components/ui/DesktopNav";
import BottomNav from "@/components/ui/BottomNav";
import { ProfileEditSkeleton } from "@/components/ui/Skeleton";
import { useMe } from "@/hooks/useAuth";
import { useUserRatings } from "@/hooks/useRatings";
import { useAuthStore } from "@/store/authStore";
import { formatDate } from "@/lib/utils";

export default function MyReviewsPage() {
  const router = useRouter();
  const token = useAuthStore((s) => s.token);
  const initFromStorage = useAuthStore((s) => s.initFromStorage);

  useEffect(() => {
    initFromStorage();
  }, [initFromStorage]);

  const { data: me, isLoading: isMeLoading } = useMe();
  const { data: ratings, isLoading: isRatingsLoading } = useUserRatings(me?.id);

  if (!token) {
    router.push("/login");
    return null;
  }

  if (isMeLoading) {
    return <ProfileEditSkeleton />;
  }

  const ratingCount = ratings?.length ?? 0;
  const ratingAvg =
    ratingCount > 0
      ? ratings!.reduce((s, r) => s + r.score, 0) / ratingCount
      : me?.avgRating ?? 0;
  const ratingLabel = ratingAvg > 0 ? ratingAvg.toFixed(1) : "Baru";

  const isCollector = me?.role === "COLLECTOR";
  const fromLabel = isCollector ? "customer" : "pengepul";

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
          Ulasan & Rating Saya
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
            Ulasan & Rating Saya
          </h1>
        </div>

        {/* Ringkasan rating */}
        <section className="bg-surface-raised rounded-2xl p-5 flex items-center gap-4">
          <div className="text-center shrink-0">
            <div className="font-display font-extrabold text-3xl text-ink font-mono">
              {ratingLabel}
            </div>
            <div className="flex items-center gap-0.5 justify-center mt-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  size={13}
                  className={
                    ratingAvg && s <= Math.round(ratingAvg)
                      ? "fill-status-warning text-status-warning"
                      : "text-ink-faint"
                  }
                />
              ))}
            </div>
          </div>
          <div className="text-xs text-ink-muted leading-relaxed">
            {ratingCount > 0
              ? `Berdasarkan ${ratingCount} ulasan dari ${fromLabel} yang pernah bertransaksi denganmu.`
              : `Kamu belum menerima ulasan dari ${fromLabel}. Ulasan muncul otomatis setelah transaksi selesai.`}
          </div>
        </section>

        {/* Daftar ulasan */}
        <section className="space-y-3">
          {isRatingsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-surface-raised rounded-2xl h-20 animate-pulse" />
              ))}
            </div>
          ) : ratings && ratings.length > 0 ? (
            ratings.map((r) => (
              <div key={r.id} className="bg-surface-raised rounded-2xl p-4">
                <div className="flex justify-between items-start gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-brand-100 overflow-hidden flex items-center justify-center text-brand-800 font-bold text-sm shrink-0">
                      {r.rater?.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={r.rater.avatarUrl}
                          alt={r.rater.name || "Pengguna"}
                          className="w-full h-full object-cover"
                        />
                      ) : r.rater?.name ? (
                        r.rater.name.charAt(0).toUpperCase()
                      ) : (
                        <UserIcon size={16} />
                      )}
                    </div>
                    <div className="min-w-0">
                      <h5 className="font-bold text-sm text-ink truncate">
                        {r.rater?.name || "Pengguna"}
                      </h5>
                      <span className="text-[10px] text-mute font-mono">
                        {formatDate(r.createdAt)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5 shrink-0">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        size={12}
                        className={
                          s <= r.score
                            ? "fill-status-warning text-status-warning"
                            : "text-ink-faint"
                        }
                      />
                    ))}
                  </div>
                </div>
                {r.reviewText && (
                  <p className="text-xs text-ink-muted leading-relaxed mt-2.5">{r.reviewText}</p>
                )}
              </div>
            ))
          ) : (
            <div className="bg-surface-raised rounded-2xl text-center py-14 px-6">
              <MessageSquare size={36} className="mx-auto text-ink-faint mb-3" />
              <p className="font-bold text-sm text-ink">Belum ada ulasan</p>
              <p className="text-xs text-ink-muted mt-1 max-w-xs mx-auto leading-relaxed">
                Ulasan dari {fromLabel} akan muncul di sini setelah transaksi selesai.
              </p>
            </div>
          )}
        </section>
      </main>

      <BottomNav />
    </div>
  );
}
