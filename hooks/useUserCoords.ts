import { useEffect, useState } from 'react';
import { useMe } from './useAuth';
import { DEFAULT_COORDS } from '@/lib/utils';

export interface Coords {
  lat: number;
  lng: number;
}

export type CoordsSource = 'saved' | 'gps' | 'default';

/**
 * Koordinat untuk pencarian pengepul milik customer.
 *
 * Prioritas: lokasi TERSIMPAN (yang di-set di Edit Profil) > GPS perangkat > default Yogyakarta.
 *
 * Lokasi tersimpan sengaja menang atas GPS: kalau customer memindahkan alamatnya
 * (mis. ke Surabaya), hasil "pengepul terdekat" harus ikut pindah — bukan tetap
 * mengikuti posisi fisik perangkat. GPS hanya dipakai sebagai kenyamanan saat
 * customer belum punya lokasi tersimpan sama sekali.
 */
export function useUserCoords(): { coords: Coords; source: CoordsSource; ready: boolean } {
  const { data: me, isLoading: meLoading } = useMe();
  const [gps, setGps] = useState<Coords | null>(null);

  const hasSaved = me?.lat != null && me?.lng != null;

  useEffect(() => {
    if (meLoading || hasSaved) return; // tunggu me; lokasi tersimpan menang → tak perlu GPS
    if (typeof navigator === 'undefined' || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setGps({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {}
    );
  }, [meLoading, hasSaved]);

  // ready=false selama me masih loading → konsumen menahan pencarian supaya tidak
  // sempat query pakai default Jogja sebelum lokasi tersimpan diketahui.
  const ready = !meLoading;

  if (hasSaved) return { coords: { lat: me!.lat!, lng: me!.lng! }, source: 'saved', ready };
  if (gps) return { coords: gps, source: 'gps', ready };
  return { coords: DEFAULT_COORDS, source: 'default', ready };
}
