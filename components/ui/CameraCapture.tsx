"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, RefreshCw, Check, CameraOff, SwitchCamera } from "lucide-react";

type Phase = "idle" | "starting" | "streaming" | "captured" | "error";

export interface CameraCaptureProps {
  /** Dipanggil saat user menekan "Gunakan Foto". blob = hasil capture + watermark. */
  onCapture: (blob: Blob, dataUrl: string) => void;
  /** Kamera default. 'environment' = belakang (KTP/sampah), 'user' = depan (selfie). */
  facingMode?: "environment" | "user";
  /** Overlay bingkai panduan. 'card' = bingkai KTP (rasio 1.586), 'free' = tanpa bingkai. */
  guide?: "card" | "free";
  /** Teks panduan singkat di atas kamera. */
  hint?: string;
  /** Label watermark, mis. "Rongsok.in · KTP". Default "Rongsok.in". */
  watermark?: string;
  className?: string;
}

const isSecure = () =>
  typeof window !== "undefined" &&
  (window.isSecureContext || window.location.hostname === "localhost");

export function CameraCapture({
  onCapture,
  facingMode = "environment",
  guide = "free",
  hint,
  watermark = "Rongsok.in",
  className = "",
}: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [preview, setPreview] = useState<string>("");
  const [activeFacing, setActiveFacing] = useState<"environment" | "user">(facingMode);
  const blobRef = useRef<Blob | null>(null);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const startCamera = useCallback(
    async (facing: "environment" | "user") => {
      setErrorMsg("");
      if (!isSecure() || !navigator.mediaDevices?.getUserMedia) {
        setPhase("error");
        setErrorMsg(
          "Kamera tidak bisa diakses. Buka halaman ini lewat HTTPS (atau localhost) dan izinkan kamera."
        );
        return;
      }
      setPhase("starting");
      try {
        stopStream();
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: facing }, width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
        streamRef.current = stream;
        setActiveFacing(facing);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }
        setPhase("streaming");
      } catch (err) {
        const e = err as DOMException;
        setPhase("error");
        if (e.name === "NotAllowedError" || e.name === "SecurityError") {
          setErrorMsg("Izin kamera ditolak. Aktifkan izin kamera di pengaturan browser lalu coba lagi.");
        } else if (e.name === "NotFoundError" || e.name === "OverconstrainedError") {
          setErrorMsg("Kamera tidak ditemukan di perangkat ini.");
        } else if (e.name === "NotReadableError") {
          setErrorMsg("Kamera sedang dipakai aplikasi lain. Tutup dulu lalu coba lagi.");
        } else {
          setErrorMsg("Gagal membuka kamera. Coba lagi.");
        }
      }
    },
    [stopStream]
  );

  // Cleanup saat unmount
  useEffect(() => {
    return () => stopStream();
  }, [stopStream]);

  const capture = useCallback(() => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;

    const w = video.videoWidth;
    const h = video.videoHeight;
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Selfie di-mirror agar natural; KTP/sampah tidak.
    if (activeFacing === "user") {
      ctx.translate(w, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, w, h);
    if (activeFacing === "user") ctx.setTransform(1, 0, 0, 1, 0, 0);

    // Watermark anti-reuse: strip gelap + label + timestamp (deterrence)
    const stamp = new Intl.DateTimeFormat("id-ID", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).format(new Date());
    const barH = Math.max(28, Math.round(h * 0.06));
    const fontPx = Math.max(13, Math.round(h * 0.028));
    ctx.fillStyle = "rgba(14,15,12,0.62)";
    ctx.fillRect(0, h - barH, w, barH);
    ctx.fillStyle = "#9fe870";
    ctx.font = `600 ${fontPx}px sans-serif`;
    ctx.textBaseline = "middle";
    ctx.fillText(`${watermark}`, 12, h - barH / 2);
    ctx.fillStyle = "#ffffff";
    ctx.font = `400 ${fontPx}px sans-serif`;
    ctx.textAlign = "right";
    ctx.fillText(stamp, w - 12, h - barH / 2);
    ctx.textAlign = "left";

    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        blobRef.current = blob;
        setPreview(dataUrl);
        setPhase("captured");
        stopStream();
      },
      "image/jpeg",
      0.85
    );
  }, [activeFacing, watermark, stopStream]);

  const retake = useCallback(() => {
    setPreview("");
    blobRef.current = null;
    startCamera(activeFacing);
  }, [startCamera, activeFacing]);

  const confirm = useCallback(() => {
    if (blobRef.current && preview) onCapture(blobRef.current, preview);
  }, [onCapture, preview]);

  const cardFrame = guide === "card";

  return (
    <div className={`w-full ${className}`}>
      {hint && <p className="mb-2 text-sm text-ink-muted">{hint}</p>}

      <div className="relative overflow-hidden rounded-2xl bg-ink isolate" style={{ aspectRatio: cardFrame ? "1.586 / 1" : "4 / 3" }}>
        {/* IDLE */}
        {phase === "idle" && (
          <button
            type="button"
            onClick={() => startCamera(activeFacing)}
            className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white/90"
          >
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-500/15 ring-1 ring-brand-500/40">
              <Camera className="h-7 w-7 text-brand-500" />
            </span>
            <span className="text-sm font-medium">Buka Kamera</span>
            <span className="text-xs text-white/50">Wajib foto langsung — galeri tidak diizinkan</span>
          </button>
        )}

        {/* STARTING */}
        {phase === "starting" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white/80">
            <RefreshCw className="h-6 w-6 animate-spin text-brand-500" />
            <span className="text-sm">Membuka kamera…</span>
          </div>
        )}

        {/* ERROR */}
        {phase === "error" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center text-white/85">
            <CameraOff className="h-8 w-8 text-status-error" />
            <span className="text-sm">{errorMsg}</span>
            <button
              type="button"
              onClick={() => startCamera(activeFacing)}
              className="mt-1 rounded-full bg-brand-500 px-4 py-2 text-sm font-semibold text-ink"
            >
              Coba Lagi
            </button>
          </div>
        )}

        {/* LIVE VIDEO */}
        <video
          ref={videoRef}
          playsInline
          muted
          className={`h-full w-full object-cover ${phase === "streaming" ? "block" : "hidden"} ${
            activeFacing === "user" ? "-scale-x-100" : ""
          }`}
        />

        {/* CARD GUIDE OVERLAY */}
        {cardFrame && phase === "streaming" && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="m-5 flex-1 rounded-xl border-2 border-dashed border-brand-500/80" style={{ aspectRatio: "1.586 / 1" }} />
          </div>
        )}

        {/* CAPTURED PREVIEW */}
        {phase === "captured" && preview && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="Hasil foto" className="h-full w-full object-cover" />
        )}
      </div>

      {/* CONTROLS */}
      {phase === "streaming" && (
        <div className="mt-3 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => startCamera(activeFacing === "environment" ? "user" : "environment")}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-ink-faint bg-surface-raised text-ink-muted active:scale-95"
            aria-label="Ganti kamera"
          >
            <SwitchCamera className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={capture}
            className="flex h-14 items-center gap-2 rounded-full bg-brand-500 px-7 font-semibold text-ink shadow-sm active:scale-95"
          >
            <Camera className="h-5 w-5" />
            Ambil Foto
          </button>
          <span className="h-11 w-11" />
        </div>
      )}

      {phase === "captured" && (
        <div className="mt-3 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={retake}
            className="flex h-12 items-center gap-2 rounded-full border border-ink-faint bg-surface-raised px-5 font-medium text-ink active:scale-95"
          >
            <RefreshCw className="h-4 w-4" />
            Ulangi
          </button>
          <button
            type="button"
            onClick={confirm}
            className="flex h-12 items-center gap-2 rounded-full bg-brand-500 px-6 font-semibold text-ink active:scale-95"
          >
            <Check className="h-5 w-5" />
            Gunakan Foto
          </button>
        </div>
      )}
    </div>
  );
}
