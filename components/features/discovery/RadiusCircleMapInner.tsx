"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Circle, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface LatLng {
  lat: number;
  lng: number;
}

interface Props {
  center: LatLng;
  /** Radius jangkauan dalam kilometer */
  radiusKm: number;
  height?: number;
}

// Pin lokasi customer — divIcon supaya tak bergantung aset ikon default Leaflet.
const centerIcon = () =>
  L.divIcon({
    className: "",
    html: `<div style="display:flex;flex-direction:column;align-items:center;transform:translateY(-4px)">
      <div style="width:26px;height:26px;border-radius:9999px;background:#9fe870;border:3px solid #0e0f0c;box-shadow:0 2px 6px rgba(13,34,0,.35)"></div>
      <div style="width:2px;height:7px;background:#0e0f0c"></div>
    </div>`,
    iconSize: [26, 33],
    iconAnchor: [13, 33],
  });

// Selalu pas-kan viewport ke lingkaran tiap radius/lokasi berubah, biar lingkaran
// jangkauan utuh terlihat (mirip radius picker Marketplace).
function FitCircle({ center, radiusKm }: { center: LatLng; radiusKm: number }) {
  const map = useMap();
  useEffect(() => {
    // Kotak sisi ~2.4x diameter → lingkaran tak mepet tepi peta
    const bounds = L.latLng(center.lat, center.lng).toBounds(radiusKm * 1000 * 2.4);
    map.fitBounds(bounds, { padding: [10, 10] });
  }, [center.lat, center.lng, radiusKm, map]);
  return null;
}

export default function RadiusCircleMapInner({ center, radiusKm, height = 180 }: Props) {
  return (
    <div
      className="relative isolate rounded-2xl overflow-hidden border border-ink-faint"
      style={{ height }}
    >
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={13}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={false}
        zoomControl={false}
        attributionControl={false}
        dragging={false}
        doubleClickZoom={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          subdomains={["a", "b", "c", "d"]}
        />
        <Circle
          center={[center.lat, center.lng]}
          radius={radiusKm * 1000}
          pathOptions={{
            color: "#0e0f0c",
            weight: 2,
            dashArray: "6 6",
            fillColor: "#9fe870",
            fillOpacity: 0.18,
          }}
        />
        <Marker position={[center.lat, center.lng]} icon={centerIcon()} />
        <FitCircle center={center} radiusKm={radiusKm} />
      </MapContainer>
    </div>
  );
}
