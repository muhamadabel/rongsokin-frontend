'use client';

import { useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore';
import { useOrdersList } from '@/hooks/useOrders';
import { useNotificationStore } from '@/store/notificationStore';
import { Order, OrderStatus } from '@/types';

const NOTIF_ICON = '/eco_impact_badge.png';

// Minta izin notifikasi OS sekali saja (tidak memaksa kalau user menolak)
function ensurePermission() {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission === 'default') {
    Notification.requestPermission().catch(() => {});
  }
}

function fireBrowserNotif(title: string, body: string, tag?: string) {
  try {
    if (
      typeof window !== 'undefined' &&
      'Notification' in window &&
      Notification.permission === 'granted' &&
      document.visibilityState !== 'visible' // hanya saat tab tidak aktif → tidak ganggu
    ) {
      new Notification(title, { body, icon: NOTIF_ICON, tag });
    }
  } catch {
    // abaikan — browser lama / izin dicabut
  }
}

function statusInfo(
  status: OrderStatus,
  isCollector: boolean
): { title: string; body: string } | null {
  switch (status) {
    case 'CONFIRMED':
      return isCollector
        ? { title: 'Pesanan masuk daftar aktif', body: 'Kamu menerima sebuah setoran. Siapkan penjemputan/penimbangan.' }
        : { title: 'Pesanan diterima! 🎉', body: 'Pengepul menerima setoranmu dan segera memprosesnya.' };
    case 'IN_PROGRESS':
      return isCollector
        ? { title: 'Transaksi berjalan', body: 'Lanjutkan ke proses penimbangan setoran.' }
        : { title: 'Setoran diproses', body: 'Pengepul sudah di lokasi / mulai menimbang rongsokmu.' };
    case 'AWAITING_CONFIRMATION':
      return isCollector
        ? { title: 'Menunggu konfirmasi customer', body: 'Customer akan menyetujui hasil timbang & harga.' }
        : { title: 'Tinjau hasil timbang', body: 'Cek berat aktual & harga akhir, lalu setujui transaksi.' };
    case 'COMPLETED':
      return { title: 'Transaksi selesai ✅', body: 'Setoran selesai. Jangan lupa beri rating untuk mitramu!' };
    case 'CANCELLED':
      return { title: 'Pesanan dibatalkan', body: 'Transaksi ini dibatalkan.' };
    default:
      return null;
  }
}

function newOrderInfo(order: Order): { title: string; body: string } {
  const weight =
    order.items?.reduce((s, i) => s + (i.estimatedWeight || 0), 0) ??
    order.estimatedWeight ??
    0;
  const cat = order.items?.[0]?.category?.name;
  const method = order.method === 'PICKUP' ? 'Jemput' : 'Antar';
  const bits = [cat, weight ? `${weight.toFixed(1)} kg` : null, method].filter(Boolean);
  return {
    title: 'Pesanan baru masuk! ♻️',
    body: bits.length ? bits.join(' • ') : 'Ada setoran baru di sekitarmu — cek antrean.',
  };
}

/**
 * Notifikasi yang BEKERJA tanpa WebSocket: mendeteksi perubahan dari data
 * yang di-poll react-query (status order milik sendiri + antrean PENDING untuk
 * pengepul), lalu memunculkan toast, notifikasi OS, dan menyimpan ke
 * notificationStore (untuk lonceng/riwayat). Dipasang SEKALI di layout dashboard.
 */
export function useNotifications() {
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);
  const add = useNotificationStore((s) => s.add);

  const role = user?.role;
  const isCollector = role === 'COLLECTOR';
  const enabled = !!token && (role === 'CUSTOMER' || role === 'COLLECTOR');

  // Order milik sendiri (untuk deteksi perubahan status). Background-polling ON
  // supaya notifikasi tetap muncul walau tab tidak aktif.
  const { data: myOrders } = useOrdersList(
    { limit: 50 },
    { refetchInterval: enabled ? 10000 : undefined, refetchIntervalInBackground: true }
  );
  // Antrean broadcast PENDING (hanya pengepul) — deteksi pesanan baru
  const { data: pending } = useOrdersList(
    { role: 'collector', status: 'PENDING', limit: 100 },
    {
      refetchInterval: enabled && isCollector ? 10000 : undefined,
      refetchIntervalInBackground: true,
    }
  );

  // Minta izin notifikasi OS saat login
  useEffect(() => {
    if (enabled) ensurePermission();
  }, [enabled]);

  // Baseline per query supaya muatan awal tidak memunculkan notifikasi palsu.
  // Di-keyed per userId → ganti akun mereset baseline.
  const lastStatus = useRef<Map<string, OrderStatus>>(new Map());
  const seenPending = useRef<Set<string>>(new Set());
  const seededStatus = useRef<string | null>(null);
  const seededPending = useRef<string | null>(null);

  // Deteksi perubahan status order sendiri
  useEffect(() => {
    if (!enabled || !user || !myOrders) return;

    // (Re)seed silent saat user berganti / pertama kali
    if (seededStatus.current !== user.id) {
      lastStatus.current = new Map(myOrders.map((o) => [o.id, o.status]));
      seededStatus.current = user.id;
      return;
    }

    for (const o of myOrders) {
      const prev = lastStatus.current.get(o.id);
      lastStatus.current.set(o.id, o.status);
      if (!prev || prev === o.status) continue;
      const info = statusInfo(o.status, isCollector);
      if (!info) continue;
      const added = add({
        id: `status:${o.id}:${o.status}`,
        userId: user.id,
        type: 'status',
        title: info.title,
        body: info.body,
        href: `/orders/${o.id}`,
        createdAt: new Date().toISOString(),
      });
      if (added) {
        toast(info.title, { icon: '🔔' });
        fireBrowserNotif(info.title, info.body, o.id);
      }
    }
  }, [myOrders, enabled, user, isCollector, add]);

  // Deteksi pesanan baru di antrean (pengepul)
  useEffect(() => {
    if (!enabled || !isCollector || !user || !pending) return;

    if (seededPending.current !== user.id) {
      seenPending.current = new Set(pending.map((o) => o.id));
      seededPending.current = user.id;
      return;
    }

    for (const o of pending) {
      if (seenPending.current.has(o.id)) continue;
      seenPending.current.add(o.id);
      const info = newOrderInfo(o);
      const added = add({
        id: `new_order:${o.id}`,
        userId: user.id,
        type: 'new_order',
        title: info.title,
        body: info.body,
        href: '/collector#antrean',
        createdAt: new Date().toISOString(),
      });
      if (added) {
        toast.success(info.title, { icon: '♻️' });
        fireBrowserNotif(info.title, info.body, o.id);
      }
    }
  }, [pending, enabled, isCollector, user, add]);
}
