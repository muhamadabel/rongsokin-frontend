import { useEffect, useRef, useState } from 'react';
import { getSocket } from '@/lib/socket';
import { useAuthStore } from '@/store/authStore';
import { haversineMeters } from '@/lib/utils';
import { Order } from '@/types';

/** Jarak (meter) dianggap "sudah sampai" untuk auto-arrival via GPS. */
export const ARRIVAL_THRESHOLD_M = 60;

interface LatLng {
  lat: number;
  lng: number;
}

/**
 * Live tracking transaksi saat OTW (status CONFIRMED).
 * - Pihak yang BERGERAK (PICKUP: pengepul; DROPOFF: customer) → watch GPS,
 *   pancarkan posisi via socket, dan panggil onAutoArrive saat dekat tujuan.
 * - Pihak yang MENUNGGU → dengarkan posisi lawan & tampilkan di peta.
 *
 * Mengembalikan posisi live pihak yang bergerak (atau null).
 */
export function useLiveTracking({
  order,
  orderId,
  role,
  onAutoArrive,
}: {
  order: Order | undefined;
  orderId: string;
  role?: string;
  onAutoArrive?: () => void;
}): LatLng | null {
  const token = useAuthStore((s) => s.token);
  const [livePos, setLivePos] = useState<LatLng | null>(null);
  const arrivedRef = useRef(false);
  const cbRef = useRef(onAutoArrive);
  cbRef.current = onAutoArrive;

  const enabled = !!order && order.status === 'CONFIRMED';
  const moverIsCollector = order?.method === 'PICKUP';
  const iAmMover = moverIsCollector ? role === 'COLLECTOR' : role === 'CUSTOMER';
  // Tujuan pihak yang bergerak: PICKUP → lokasi customer; DROPOFF → lokasi pengepul
  const destLat = moverIsCollector ? order?.customerLat : order?.collectorLat;
  const destLng = moverIsCollector ? order?.customerLng : order?.collectorLng;

  useEffect(() => {
    if (!enabled || !token) {
      setLivePos(null);
      arrivedRef.current = false;
      return;
    }
    const socket = getSocket(token);
    socket.emit('join_room', `order:${orderId}`);

    if (iAmMover) {
      if (typeof navigator === 'undefined' || !navigator.geolocation) return;
      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const p = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setLivePos(p);
          socket.emit('location_update', { orderId, lat: p.lat, lng: p.lng, role });
          if (destLat != null && destLng != null && !arrivedRef.current) {
            const dist = haversineMeters(p, { lat: destLat, lng: destLng });
            if (dist <= ARRIVAL_THRESHOLD_M) {
              arrivedRef.current = true;
              cbRef.current?.();
            }
          }
        },
        () => {
          /* GPS gagal → diam saja; tombol "Sudah Sampai" jadi fallback */
        },
        { enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 }
      );
      return () => navigator.geolocation.clearWatch(watchId);
    }

    // Pihak menunggu: terima posisi lawan
    const handler = (payload: { orderId?: string; lat?: number; lng?: number }) => {
      if (payload?.orderId === orderId && payload.lat != null && payload.lng != null) {
        setLivePos({ lat: payload.lat, lng: payload.lng });
      }
    };
    socket.on('location_update', handler);
    return () => {
      socket.off('location_update', handler);
    };
  }, [enabled, iAmMover, orderId, token, role, destLat, destLng]);

  return livePos;
}
