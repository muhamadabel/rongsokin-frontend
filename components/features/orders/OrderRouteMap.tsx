"use client";

import dynamic from "next/dynamic";
import { RefreshCw } from "lucide-react";

// Leaflet butuh window → dynamic import ssr:false
const Inner = dynamic(() => import("./OrderRouteMapInner"), {
  ssr: false,
  loading: () => (
    <div className="rounded-2xl bg-surface h-[240px] flex items-center justify-center border border-ink-faint">
      <RefreshCw className="w-6 h-6 text-brand-700 animate-spin" />
    </div>
  ),
});

interface LatLng {
  lat: number;
  lng: number;
}

export default function OrderRouteMap(props: {
  customer?: LatLng | null;
  collector: LatLng;
  live?: LatLng | null;
  height?: number;
}) {
  return <Inner {...props} />;
}
