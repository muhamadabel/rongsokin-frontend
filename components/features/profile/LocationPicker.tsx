"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { MapPin, Crosshair, RefreshCw } from "lucide-react";
import { DEFAULT_COORDS } from "@/lib/utils";
import toast from "react-hot-toast";

// Map butuh window → dynamic import dengan ssr:false
const LocationPickerMap = dynamic(() => import("./LocationPickerMap"), {
  ssr: false,
  loading: () => (
    <div className="rounded-2xl bg-surface h-[300px] flex items-center justify-center">
      <RefreshCw className="w-6 h-6 text-brand-700 animate-spin" />
    </div>
  ),
});

interface LatLng {
  lat: number;
  lng: number;
}

interface Props {
  value: LatLng | null;
  onChange: (next: LatLng) => void;
  label?: string;
  helperText?: string;
  height?: number;
}

export default function LocationPicker({
  value,
  onChange,
  label = "Lokasi",
  helperText,
  height = 300,
}: Props) {
  const [isLocating, setIsLocating] = useState(false);

  const handleUseGPS = () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      toast.error("GPS tidak didukung di perangkat ini.");
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onChange({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setIsLocating(false);
        toast.success("Lokasi GPS terkunci.");
      },
      () => {
        setIsLocating(false);
        toast.error("Gagal akses GPS. Cek izin lokasi browser.");
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const current = value || DEFAULT_COORDS;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <label className="text-[10px] font-bold text-mute uppercase tracking-widest">
          {label}
        </label>
        <button
          type="button"
          onClick={handleUseGPS}
          disabled={isLocating}
          className="text-[11px] font-bold text-ink bg-surface-raised hover:bg-brand-100 border border-ink-faint hover:border-ink rounded-full px-3 py-1.5 transition-colors flex items-center gap-1.5 disabled:opacity-60"
        >
          {isLocating ? (
            <RefreshCw size={12} className="animate-spin" />
          ) : (
            <Crosshair size={12} />
          )}
          {isLocating ? "Mendeteksi…" : "Pakai GPS"}
        </button>
      </div>

      <LocationPickerMap value={current} onChange={onChange} height={height} />

      <div className="flex items-center justify-between gap-2 text-[11px] flex-wrap">
        <div className="flex items-center gap-1.5 text-ink">
          <MapPin size={13} className="text-brand-700" />
          <span className="font-mono font-bold">
            {current.lat.toFixed(5)}, {current.lng.toFixed(5)}
          </span>
        </div>
        <span className="text-mute">
          {helperText || "Geser peta untuk menempatkan titik di lokasimu."}
        </span>
      </div>
    </div>
  );
}
