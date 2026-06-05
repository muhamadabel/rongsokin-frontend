"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, useMap, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";

interface LatLng {
  lat: number;
  lng: number;
}

interface Props {
  value: LatLng;
  onChange: (next: LatLng) => void;
  height?: number;
}

/** Pindahkan view kalau value berubah dari luar (mis. tombol GPS). */
function RecenterOnValue({ value }: { value: LatLng }) {
  const map = useMap();
  useEffect(() => {
    const c = map.getCenter();
    if (Math.abs(c.lat - value.lat) > 1e-5 || Math.abs(c.lng - value.lng) > 1e-5) {
      map.setView([value.lat, value.lng], map.getZoom(), { animate: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value.lat, value.lng]);
  return null;
}

/** Titik = TENGAH peta. Saat user selesai geser peta, lapor center baru. */
function CenterReporter({ onChange }: { onChange: (ll: LatLng) => void }) {
  useMapEvents({
    moveend(e) {
      const c = e.target.getCenter();
      onChange({ lat: c.lat, lng: c.lng });
    },
  });
  return null;
}

export default function LocationPickerMap({ value, onChange, height = 300 }: Props) {
  return (
    <div
      className="relative rounded-2xl overflow-hidden border border-ink-faint"
      style={{ height }}
    >
      <MapContainer
        center={[value.lat, value.lng]}
        zoom={16}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={true}
        zoomControl={false}
        attributionControl={false}
      >
        {/* Tile terang minimalis — jalan saja, tanpa satelit/rumah (CARTO Positron) */}
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          subdomains={["a", "b", "c", "d"]}
        />
        <RecenterOnValue value={value} />
        <CenterReporter onChange={onChange} />
      </MapContainer>

      {/* Pin tetap di tengah — geser peta di bawahnya */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center z-[500]">
        <div className="flex flex-col items-center -translate-y-3">
          <div className="w-7 h-7 rounded-full bg-brand-500 border-[3px] border-ink shadow-lg flex items-center justify-center text-ink text-sm font-black">
            📍
          </div>
          {/* tangkai + bayangan titik pusat */}
          <div className="w-0.5 h-3 bg-ink/70 -mt-0.5" />
          <div className="w-2.5 h-1 rounded-full bg-ink/30 blur-[1px]" />
        </div>
      </div>
    </div>
  );
}
