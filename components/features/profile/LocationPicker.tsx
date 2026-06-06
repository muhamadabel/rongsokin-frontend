"use client";

import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { MapPin, Crosshair, RefreshCw, Loader2 } from "lucide-react";
import { DEFAULT_COORDS } from "@/lib/utils";
import { reverseGeocode } from "@/lib/geocode";
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
  /** Otomatis minta izin GPS saat komponen muncul (mis. user belum punya lokasi tersimpan) */
  autoLocate?: boolean;
}

export default function LocationPicker({
  value,
  onChange,
  label = "Lokasi",
  helperText,
  height = 300,
  autoLocate = false,
}: Props) {
  const [isLocating, setIsLocating] = useState(false);
  const [areaName, setAreaName] = useState<string>("");
  const [areaLoading, setAreaLoading] = useState(false);
  const didAutoLocate = useRef(false);

  const handleUseGPS = (silent = false) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      if (!silent) toast.error("GPS tidak didukung di perangkat ini.");
      return;
    }
    setIsLocating(true);

    const onSuccess = (pos: GeolocationPosition) => {
      onChange({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      setIsLocating(false);
      if (!silent) toast.success("Lokasi terkunci.");
    };

    const onFail = (err: GeolocationPositionError) => {
      setIsLocating(false);
      if (silent) return; // auto-locate: jangan ganggu
      let msg = "Gagal mendeteksi lokasi. Coba lagi.";
      if (err.code === 1) msg = "Izin lokasi ditolak. Aktifkan di Safari/pengaturan sistem.";
      else if (err.code === 2)
        msg = "Lokasi tidak tersedia. Pastikan Location Services aktif (Pengaturan › Privasi).";
      else if (err.code === 3) msg = "Deteksi lokasi timeout. Coba lagi atau geser titik manual.";
      toast.error(msg);
    };

    // Tahap 1: akurasi tinggi (GPS). Kalau gagal/timeout → tahap 2: cepat (wifi/seluler).
    navigator.geolocation.getCurrentPosition(onSuccess, () => {
      navigator.geolocation.getCurrentPosition(onSuccess, onFail, {
        enableHighAccuracy: false,
        timeout: 15000,
        maximumAge: 120000,
      });
    }, { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 });
  };

  // Auto minta GPS sekali saat muncul (kalau diminta)
  useEffect(() => {
    if (autoLocate && !didAutoLocate.current) {
      didAutoLocate.current = true;
      handleUseGPS(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoLocate]);

  const current = value || DEFAULT_COORDS;

  // Reverse-geocode (debounce) → nama daerah s.d. kecamatan tiap kali titik berubah
  const geocodeReq = useRef(0);
  useEffect(() => {
    const lat = current.lat;
    const lng = current.lng;
    setAreaLoading(true);
    const reqId = ++geocodeReq.current;
    const t = setTimeout(async () => {
      const info = await reverseGeocode(lat, lng);
      if (reqId !== geocodeReq.current) return; // hasil basi → abaikan
      setAreaName(info?.label || "");
      setAreaLoading(false);
    }, 700);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current.lat, current.lng]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <label className="text-[10px] font-bold text-mute uppercase tracking-widest">
          {label}
        </label>
        <button
          type="button"
          onClick={() => handleUseGPS()}
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

      {/* Nama daerah hasil reverse-geocode (s.d. kecamatan) */}
      <div className="rounded-2xl bg-surface px-3.5 py-2.5 flex items-start gap-2.5">
        <MapPin size={16} className="text-brand-700 shrink-0 mt-0.5" />
        <div className="min-w-0 flex-1">
          {areaLoading ? (
            <span className="text-xs text-ink-muted flex items-center gap-1.5">
              <Loader2 size={12} className="animate-spin" />
              Mencari nama daerah…
            </span>
          ) : areaName ? (
            <span className="text-sm font-bold text-ink leading-snug block">{areaName}</span>
          ) : (
            <span className="text-xs text-ink-muted">Nama daerah tidak ditemukan.</span>
          )}
          <span className="text-[10px] font-mono text-mute block mt-0.5">
            {current.lat.toFixed(5)}, {current.lng.toFixed(5)}
          </span>
        </div>
      </div>

      <p className="text-[11px] text-mute">
        {helperText || "Geser peta untuk menempatkan titik di lokasimu."}
      </p>
    </div>
  );
}
