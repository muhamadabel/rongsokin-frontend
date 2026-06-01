"use client";

import { useEffect, useMemo, useRef } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
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

/** Marker hijau lime (Wise palette) lewat divIcon — tidak butuh asset image. */
const lapakIcon = L.divIcon({
  className: "rongsok-marker",
  html: `<div style="
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: #9fe870;
    border: 3px solid #0e0f0c;
    box-shadow: 0 4px 10px rgba(14,15,12,.25);
    display:flex; align-items:center; justify-content:center;
    font-family: sans-serif; font-weight: 900; color: #0e0f0c; font-size: 13px;
  ">📍</div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

/** Subkomponen pendengar klik peta. */
function ClickHandler({ onPick }: { onPick: (ll: LatLng) => void }) {
  useMapEvents({
    click(e) {
      onPick({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

export default function LocationPickerMap({ value, onChange, height = 300 }: Props) {
  const center = useMemo<[number, number]>(() => [value.lat, value.lng], [value.lat, value.lng]);
  const markerRef = useRef<L.Marker | null>(null);

  // Saat lat/lng eksternal berubah (mis. GPS button), pan map ke sana
  // (akan otomatis lewat key prop di MapContainer)
  useEffect(() => {
    if (markerRef.current) {
      markerRef.current.setLatLng([value.lat, value.lng]);
    }
  }, [value.lat, value.lng]);

  return (
    <div className="rounded-2xl overflow-hidden border border-ink-faint" style={{ height }}>
      <MapContainer
        center={center}
        zoom={15}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={true}
        key={`${value.lat}-${value.lng}-init`}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ClickHandler onPick={onChange} />
        <Marker
          position={center}
          icon={lapakIcon}
          draggable={true}
          ref={(m) => {
            markerRef.current = m;
          }}
          eventHandlers={{
            dragend(e) {
              const target = e.target as L.Marker;
              const ll = target.getLatLng();
              onChange({ lat: ll.lat, lng: ll.lng });
            },
          }}
        />
      </MapContainer>
    </div>
  );
}
