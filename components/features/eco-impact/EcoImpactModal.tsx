"use client";

import { useState, useRef } from "react";
import { toPng } from "html-to-image";
import { Sparkles, Download, ArrowRight, CheckCircle2, ShieldCheck } from "lucide-react";
import toast from "react-hot-toast";

interface EcoImpactModalProps {
  customerName: string;
  actualWeight: number;
  orderId: string;
  onClose: () => void;
  /** Foto profil pemilik akun — tampil di kartu yang dibagikan */
  avatarUrl?: string;
  /** "order" = dampak 1 transaksi (default) · "lifetime" = akumulasi total */
  variant?: "order" | "lifetime";
  /** Label di bawah nama (default: "Pahlawan Lingkungan") */
  titleLabel?: string;
  /** Teks tombol tutup (default: "Lanjut Beri Rating") */
  closeLabel?: string;
}

export default function EcoImpactModal({
  customerName,
  actualWeight,
  orderId,
  onClose,
  avatarUrl,
  variant = "order",
  titleLabel,
  closeLabel,
}: EcoImpactModalProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // 1 kg of waste recycled = ~5 km of motorcycle ride emission reduction
  const carbonKm = actualWeight * 5;

  const handleDownload = async () => {
    if (!cardRef.current) return;
    setIsDownloading(true);
    const toastId = toast.loading("Sedang membuat kartu dampak ekologi...");

    try {
      // Small delay to ensure resources are loaded
      await new Promise((resolve) => setTimeout(resolve, 300));

      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        pixelRatio: 3, // Premium quality for social sharing
        style: {
          transform: "scale(1)",
          borderRadius: "24px",
        },
      });

      const link = document.createElement("a");
      link.download = `Rongsok_EcoImpact_${customerName}_${orderId.slice(0, 8)}.png`;
      link.href = dataUrl;
      link.click();

      toast.success("Kartu dampak ekologi berhasil diunduh!", { id: toastId });
    } catch (error) {
      console.error("Failed to generate image:", error);
      toast.error("Gagal mengunduh gambar. Silakan coba lagi.", { id: toastId });
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-ink/70 backdrop-blur-md overflow-y-auto">
      <div className="w-full max-w-md bg-surface-raised rounded-2xl p-6 space-y-6 shadow-2xl relative my-8">
        
        {/* HEADER SECTION */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-brand-100 rounded-full flex items-center justify-center text-brand-800 mx-auto">
            <Sparkles className="text-brand-800 animate-pulse" size={24} />
          </div>
          <h3 className="font-display font-extrabold text-lg text-ink tracking-tight">
            Kontribusi Ekologismu! 🌿
          </h3>
          <p className="text-xs text-ink-muted leading-relaxed max-w-sm mx-auto">
            Unduh kartu dampak ekologis ini untuk dibagikan di media sosial dan ajak teman-temanmu hidup berkelanjutan!
          </p>
        </div>

        {/* SHAREABLE CARD container with overflow hidden to fit nicely */}
        <div className="border border-ink-faint/30 rounded-2xl overflow-hidden bg-surface-sunken p-2">
          
          {/* THE CARD ELEM (Captured by html-to-image) */}
          <div
            ref={cardRef}
            id="eco-impact-card"
            className="w-full bg-[#0d2200] text-[#f0fbe8] rounded-[24px] p-6 space-y-5 flex flex-col items-center text-center relative overflow-hidden"
            style={{ fontFamily: "var(--font-inter), sans-serif" }}
          >
            {/* Background highlights */}
            <div className="absolute -top-16 -left-16 w-36 h-36 bg-brand-500/10 rounded-full blur-2xl" />
            <div className="absolute -bottom-16 -right-16 w-36 h-36 bg-brand-500/15 rounded-full blur-2xl" />

            {/* BRAND HEADER */}
            <div className="flex items-center gap-2 z-10">
              <div className="bg-[#0e0f0c] rounded-xl p-1.5 flex items-center justify-center border border-brand-500/30">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#9fe870"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M14.7 5.6 A 8 8 0 1 1 9.3 5.6" />
                  <path d="M12 3 L12 8" />
                  <path d="M8.4 11.4 H15.6" />
                  <path d="M10.4 11.4 V10.2 H13.6 V11.4" />
                  <path d="M9.1 11.4 L9.8 17.2 H14.2 L14.9 11.4" />
                  <path d="M10.9 13.2 V15.4 M12 13.2 V15.4 M13.1 13.2 V15.4" />
                </svg>
              </div>
              <span className="font-mono text-[10px] tracking-[0.25em] uppercase font-bold text-brand-400">
                Rongsok.in
              </span>
            </div>

            {/* ICON BADGE */}
            <div className="w-28 h-28 relative flex items-center justify-center bg-[#163300] rounded-full border-2 border-brand-400/30 p-2 z-10 shadow-lg shadow-[#0d2200]/50 overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                // Pakai foto profil pemilik akun kalau ada. crossOrigin wajib supaya
                // html-to-image tidak "tainted" saat merender gambar remote (Cloudinary).
                src={avatarUrl || "/eco_impact_badge.png"}
                crossOrigin={avatarUrl ? "anonymous" : undefined}
                alt={avatarUrl ? customerName : "Badge"}
                className={
                  avatarUrl
                    ? "w-full h-full object-cover rounded-full"
                    : "w-full h-full object-contain"
                }
              />
            </div>

            {/* MAIN METRIC & IMPACT */}
            <div className="space-y-3 z-10 w-full">
              <div>
                <h4 className="font-display font-black text-2xl tracking-tight text-brand-400 leading-tight">
                  {customerName}
                </h4>
                <p className="text-[10px] text-brand-200 mt-0.5 uppercase tracking-widest font-mono flex items-center justify-center gap-1">
                  <ShieldCheck size={11} className="text-brand-400" />{" "}
                  {titleLabel || "Pahlawan Lingkungan"}
                </p>
              </div>

              <div className="h-px bg-brand-500/10 w-full" />

              <p className="text-xs text-[#d2e2c4] leading-relaxed px-1 font-body">
                berhasil turut serta dalam mendaur ulang{" "}
                <span className="font-mono text-white font-extrabold text-sm border-b border-brand-400 pb-0.5">
                  {actualWeight.toFixed(1)} kg
                </span>{" "}
                {variant === "lifetime" ? "sampah sejauh ini" : "sampah hari ini"}. Dampaknya setara dengan mengurangi emisi karbon dari perjalanan motor sejauh{" "}
                <span className="font-mono text-brand-400 font-extrabold text-sm border-b border-brand-400 pb-0.5">
                  {carbonKm.toFixed(1)} km
                </span>
                .
              </p>
            </div>

            {/* FOOTER */}
            <div className="pt-2 w-full flex justify-between items-center text-[8px] text-brand-300/60 font-mono z-10">
              <span>📍 Yogyakarta, Indonesia</span>
              <span>rongsok.in/eco</span>
            </div>
          </div>
        </div>

        {/* BUTTON ACTION SECTION */}
        <div className="flex flex-col gap-2.5">
          <button
            onClick={handleDownload}
            disabled={isDownloading}
            className="w-full bg-brand-500 hover:bg-brand-600 text-ink font-bold py-3.5 px-6 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.98] disabled:opacity-50 cursor-pointer text-sm"
          >
            <Download size={18} />
            {isDownloading ? "Mengunduh..." : "Unduh Gambar"}
          </button>
          
          <button
            onClick={onClose}
            className="w-full border border-ink-faint hover:bg-surface-sunken text-ink-muted font-bold py-3.5 px-6 rounded-2xl flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] cursor-pointer text-sm"
          >
            {closeLabel || "Lanjut Beri Rating"}
            {!closeLabel && <ArrowRight size={16} />}
          </button>
        </div>
      </div>
    </div>
  );
}
