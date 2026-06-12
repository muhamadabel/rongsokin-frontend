"use client";

import { Star, MessageSquare } from "lucide-react";
import { useUserRatings } from "@/hooks/useRatings";
import { formatDate } from "@/lib/utils";

interface RatingSectionProps {
  /** ID user yang ulasannya ingin ditampilkan (rating yang DITERIMA user ini) */
  userId?: string;
  /** Rata-rata cadangan dari /auth/me kalau daftar ulasan belum termuat */
  fallbackAvg?: number;
  /** Judul section, mis. "Penilaian dari Pengepul" */
  title?: string;
  /** Teks saat belum ada ulasan */
  emptyText?: string;
}

export function RatingSection({
  userId,
  fallbackAvg,
  title = "Penilaian Kamu",
  emptyText = "Belum ada ulasan. Ulasan muncul setelah transaksi pertamamu selesai dinilai.",
}: RatingSectionProps) {
  const { data: ratings, isLoading } = useUserRatings(userId);

  const count = ratings?.length ?? 0;
  const avg =
    count > 0
      ? ratings!.reduce((sum, r) => sum + r.score, 0) / count
      : fallbackAvg && fallbackAvg > 0
        ? fallbackAvg
        : 0;
  const label = avg > 0 ? avg.toFixed(1) : "Baru";

  return (
    <section className="bg-surface-raised rounded-2xl p-5 space-y-3">
      <h3 className="font-display font-extrabold text-sm text-ink tracking-tight flex items-center gap-2">
        <Star size={16} className="text-status-warning fill-status-warning" />
        {title}
      </h3>

      {/* Ringkasan rating */}
      <div className="bg-surface rounded-2xl p-4 flex items-center gap-4">
        <div className="text-center shrink-0">
          <div className="font-display font-extrabold text-3xl text-ink font-mono">
            {label}
          </div>
          <div className="flex items-center gap-0.5 justify-center mt-1">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star
                key={s}
                size={11}
                className={
                  avg && s <= Math.round(avg)
                    ? "fill-status-warning text-status-warning"
                    : "text-ink-faint"
                }
              />
            ))}
          </div>
        </div>
        <div className="text-xs text-ink-muted leading-relaxed">
          {count > 0
            ? `Berdasarkan ${count} ulasan dari mitra transaksimu.`
            : "Kumpulkan ulasan dengan menyelesaikan transaksi dan menjaga pelayanan."}
        </div>
      </div>

      {/* Daftar ulasan */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="bg-surface rounded-2xl h-20 animate-pulse" />
          ))}
        </div>
      ) : ratings && ratings.length > 0 ? (
        <div className="space-y-3">
          {ratings.map((r) => (
            <div key={r.id} className="bg-surface rounded-2xl p-4">
              <div className="flex justify-between items-start gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-brand-100 flex items-center justify-center text-brand-800 font-bold text-sm shrink-0">
                    {(r.rater?.name || "P").charAt(0).toUpperCase()}
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
                <p className="text-xs text-ink-muted leading-relaxed mt-2.5">
                  {r.reviewText}
                </p>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <MessageSquare size={32} className="mx-auto text-ink-faint mb-3" />
          <p className="text-xs text-ink-muted max-w-xs mx-auto leading-relaxed">
            {emptyText}
          </p>
        </div>
      )}
    </section>
  );
}
