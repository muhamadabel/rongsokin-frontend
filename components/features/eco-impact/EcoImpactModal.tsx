"use client";

import { useState, useRef } from "react";
import { toPng } from "html-to-image";
import { Sparkles, Download, ArrowRight, ShieldCheck } from "lucide-react";
import toast from "react-hot-toast";

interface EcoImpactModalProps {
  customerName: string;
  actualWeight: number;
  orderId: string;
  onClose: () => void;
}

export default function EcoImpactModal({
  customerName,
  actualWeight,
  orderId,
  onClose,
}: EcoImpactModalProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Perhitungan dampak: 1 kg sampah daur ulang ~ mengurangi emisi berkendara motor ~5 km
  const carbonKm = actualWeight * 5;

  const handleDownload = async () => {
    if (!cardRef.current) return;
    setIsDownloading(true);
    const toastId = toast.loading("Sedang membuat kartu dampak ekologi...");

    try {
      // Delay singkat agar aset gambar (badge) dimuat penuh sebelum dicapture
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Safety net: di sebagian browser, toPng bisa menggantung (onload SVG tak ter-fire).
      // Race dengan timeout supaya tombol tidak nyangkut "Mengunduh…" selamanya.
      const render = toPng(cardRef.current, {
        cacheBust: true,
        pixelRatio: 2, // 2x sudah tajam untuk sosmed & jauh lebih ringan dirasterisasi
        // skipFonts: html-to-image bisa menggantung saat mencoba meng-embed webfont
        // (fetch @font-face dari stylesheet). Kartu tetap ter-render rapi dengan
        // fallback sans-serif — layout, warna, & badge utuh.
        skipFonts: true,
        style: {
          transform: "scale(1)",
          borderRadius: "24px",
        },
      });
      const dataUrl = await Promise.race([
        render,
        new Promise<string>((_, reject) =>
          setTimeout(() => reject(new Error("Render gambar timeout")), 20000)
        ),
      ]);

      const link = document.createElement("a");
      link.download = `Rongsok_EcoImpact_${customerName}_${orderId.slice(0, 8)}.png`;
      link.href = dataUrl;
      link.click();

      toast.success("Kartu dampak ekologi berhasil diunduh!", { id: toastId });
    } catch (error) {
      console.error("Gagal membuat gambar:", error);
      toast.error("Gagal mengunduh gambar. Silakan coba lagi.", { id: toastId });
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-ink/70 backdrop-blur-md overflow-y-auto">
      <div className="w-full max-w-md bg-surface-raised rounded-2xl p-6 space-y-6 shadow-2xl relative my-8">
        {/* HEADER MODAL */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-brand-100 rounded-full flex items-center justify-center text-brand-800 mx-auto">
            <Sparkles className="text-brand-800 animate-pulse" size={24} />
          </div>
          <h3 className="font-display font-extrabold text-lg text-ink tracking-tight">
            Kontribusi Ekologismu! 🌿
          </h3>
          <p className="text-xs text-ink-muted leading-relaxed max-w-sm mx-auto">
            Unduh kartu dampak ekologis ini untuk dibagikan di media sosial dan ajak
            teman-temanmu hidup berkelanjutan!
          </p>
        </div>

        {/* PREVIEW KARTU YANG BISA DIUNDUH */}
        <div className="border border-ink-faint/30 rounded-2xl overflow-hidden bg-surface-sunken p-2">
          <div
            ref={cardRef}
            id="eco-impact-card"
            className="w-full bg-[#0d2200] text-[#f0fbe8] rounded-[24px] p-6 space-y-5 flex flex-col items-center text-center relative overflow-hidden"
            style={{ fontFamily: "var(--font-inter), sans-serif" }}
          >
            {/* Dekorasi Background Glow — pakai radial-gradient (BUKAN filter blur),
                karena CSS filter sering bikin html-to-image menggantung saat capture. */}
            <div
              className="absolute -top-20 -left-20 w-44 h-44 rounded-full"
              style={{ background: "radial-gradient(circle, rgba(159,232,112,0.18), transparent 70%)" }}
            />
            <div
              className="absolute -bottom-20 -right-20 w-44 h-44 rounded-full"
              style={{ background: "radial-gradient(circle, rgba(159,232,112,0.22), transparent 70%)" }}
            />

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

            {/* BADGE ICON */}
            <div className="w-28 h-28 relative flex items-center justify-center bg-[#163300] rounded-full border-2 border-brand-400/30 p-2 z-10 shadow-lg shadow-[#0d2200]/50">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/eco_impact_badge.png"
                alt="Badge"
                className="w-full h-full object-contain"
              />
            </div>

            {/* DETAIL DAMPAK EKOLOGIS */}
            <div className="space-y-3 z-10 w-full">
              <div>
                <h4 className="font-display font-black text-2xl tracking-tight text-brand-400 leading-tight">
                  {customerName}
                </h4>
                <p className="text-[10px] text-brand-200 mt-0.5 uppercase tracking-widest font-mono flex items-center justify-center gap-1">
                  <ShieldCheck size={11} className="text-brand-400" /> Pahlawan Lingkungan
                </p>
              </div>

              <div className="h-px bg-brand-500/10 w-full" />

              <p className="text-xs text-[#d2e2c4] leading-relaxed px-1 font-body">
                berhasil turut serta dalam mendaur ulang{" "}
                <span className="font-mono text-white font-extrabold text-sm border-b border-brand-400 pb-0.5">
                  {actualWeight.toFixed(1)} kg
                </span>{" "}
                sampah hari ini. Dampaknya setara dengan mengurangi emisi karbon dari
                perjalanan motor sejauh{" "}
                <span className="font-mono text-brand-400 font-extrabold text-sm border-b border-brand-400 pb-0.5">
                  {carbonKm.toFixed(1)} km
                </span>
                .
              </p>
            </div>

            {/* FOOTER KARTU */}
            <div className="pt-2 w-full flex justify-between items-center text-[8px] text-brand-300/60 font-mono z-10">
              <span>📍 Yogyakarta, Indonesia</span>
              <span>rongsok.in/eco</span>
            </div>
          </div>
        </div>

        {/* BUTTON ACTIONS */}
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
            Lanjut Beri Rating
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
