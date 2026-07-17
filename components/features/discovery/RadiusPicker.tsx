"use client";

import dynamic from "next/dynamic";
import { MapPin, RefreshCw } from "lucide-react";

// Leaflet butuh window → dynamic import ssr:false
const RadiusCircleMapInner = dynamic(() => import("./RadiusCircleMapInner"), {
  ssr: false,
  loading: () => (
    <div className="rounded-2xl bg-surface h-[180px] flex items-center justify-center border border-ink-faint">
      <RefreshCw className="w-5 h-5 text-brand-700 animate-spin" />
    </div>
  ),
});

export const RADIUS_MIN_KM = 1;
export const RADIUS_MAX_KM = 50;
const PRESETS = [1, 3, 5, 10, 25, 50];

interface Props {
  /** Radius terpilih (km) */
  value: number;
  onChange: (km: number) => void;
  center: { lat: number; lng: number };
  /** Keterangan kecil di bawah slider, mis. "2 pengepul dalam jangkauan" */
  hint?: string;
}

/**
 * Pemilih radius pencarian pengepul + pratinjau lingkaran jangkauan di peta.
 * Customer bebas menentukan seberapa jauh ia mau mencari.
 */
export default function RadiusPicker({ value, onChange, center, hint }: Props) {
  return (
    <div className="bg-surface-raised rounded-2xl p-4 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <span className="text-[10px] font-bold text-mute uppercase tracking-widest flex items-center gap-1.5">
          <MapPin size={12} className="text-brand-700" /> Jangkauan Pencarian
        </span>
        <span className="font-mono font-extrabold text-sm text-ink bg-brand-100 rounded-full px-2.5 py-0.5">
          {value} km
        </span>
      </div>

      {/* Slider */}
      <input
        type="range"
        min={RADIUS_MIN_KM}
        max={RADIUS_MAX_KM}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label="Radius pencarian pengepul (km)"
        className="w-full h-2 rounded-full appearance-none cursor-pointer bg-surface-sunken accent-brand-500"
      />

      {/* Preset cepat */}
      <div className="flex gap-1.5 flex-wrap">
        {PRESETS.map((km) => (
          <button
            key={km}
            type="button"
            onClick={() => onChange(km)}
            className={`px-2.5 py-1 rounded-full text-[11px] font-bold border transition-colors ${
              value === km
                ? "bg-brand-500 text-ink border-brand-500"
                : "bg-surface text-ink-muted border-ink-faint hover:border-ink"
            }`}
          >
            {km} km
          </button>
        ))}
      </div>

      <RadiusCircleMapInner center={center} radiusKm={value} />

      {hint && <p className="text-[11px] text-ink-muted">{hint}</p>}
    </div>
  );
}
