"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface LatLng {
  lat: number;
  lng: number;
}

interface Props {
  customer: LatLng;
  collector: LatLng;
  height?: number;
}

// Pin pakai divIcon (HTML) supaya tidak bergantung aset ikon default Leaflet
// yang sering rusak di bundler. Warna brand inline (kasus khusus di luar Tailwind).
const makeIcon = (bg: string, label: string) =>
  L.divIcon({
    className: "",
    html: `<div style="display:flex;flex-direction:column;align-items:center;transform:translateY(-4px)">
      <div style="width:30px;height:30px;border-radius:9999px;background:${bg};border:3px solid #0e0f0c;box-shadow:0 2px 6px rgba(13,34,0,.35);display:flex;align-items:center;justify-content:center;color:#0e0f0c;font-weight:800;font-size:13px;font-family:ui-monospace,monospace">${label}</div>
      <div style="width:2px;height:8px;background:#0e0f0c"></div>
    </div>`,
    iconSize: [30, 40],
    iconAnchor: [15, 40],
  });

function FitBounds({ a, b }: { a: LatLng; b: LatLng }) {
  const map = useMap();
  useEffect(() => {
    map.fitBounds(
      [
        [a.lat, a.lng],
        [b.lat, b.lng],
      ],
      { padding: [50, 50], maxZoom: 16 }
    );
  }, [a.lat, a.lng, b.lat, b.lng, map]);
  return null;
}

export default function OrderRouteMapInner({ customer, collector, height = 240 }: Props) {
  return (
    <div
      className="relative isolate rounded-2xl overflow-hidden border border-ink-faint"
      style={{ height }}
    >
      <MapContainer
        center={[customer.lat, customer.lng]}
        zoom={14}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={false}
        zoomControl={false}
        attributionControl={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          subdomains={["a", "b", "c", "d"]}
        />
        <Polyline
          positions={[
            [customer.lat, customer.lng],
            [collector.lat, collector.lng],
          ]}
          pathOptions={{ color: "#0e0f0c", weight: 3, dashArray: "6 8", opacity: 0.85 }}
        />
        <Marker position={[customer.lat, customer.lng]} icon={makeIcon("#9fe870", "C")} />
        <Marker position={[collector.lat, collector.lng]} icon={makeIcon("#ffffff", "P")} />
        <FitBounds a={customer} b={collector} />
      </MapContainer>
    </div>
  );
}
