import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type AppNotificationType = 'new_order' | 'status' | 'info';

export interface AppNotification {
  /** Kunci unik utk dedupe (mis. `status:<orderId>:<status>`) */
  id: string;
  /** Pemilik notifikasi — supaya tidak bocor antar akun di device yang sama */
  userId: string;
  type: AppNotificationType;
  title: string;
  body: string;
  /** Tujuan saat diklik (mis. /orders/<id>) */
  href?: string;
  createdAt: string;
  read: boolean;
}

interface NotificationState {
  items: AppNotification[];
  /** Tambah notifikasi. Return true kalau benar-benar baru (belum ada id sama). */
  add: (n: Omit<AppNotification, 'read'>) => boolean;
  markAllRead: (userId?: string) => void;
  markRead: (id: string) => void;
  remove: (id: string) => void;
  clearAll: () => void;
}

const MAX_ITEMS = 40;

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      items: [],
      add: (n) => {
        if (get().items.some((x) => x.id === n.id)) return false;
        set((s) => ({
          items: [{ ...n, read: false }, ...s.items].slice(0, MAX_ITEMS),
        }));
        return true;
      },
      markAllRead: (userId) =>
        set((s) => ({
          items: s.items.map((x) =>
            !userId || x.userId === userId ? { ...x, read: true } : x
          ),
        })),
      markRead: (id) =>
        set((s) => ({
          items: s.items.map((x) => (x.id === id ? { ...x, read: true } : x)),
        })),
      remove: (id) => set((s) => ({ items: s.items.filter((x) => x.id !== id) })),
      clearAll: () => set({ items: [] }),
    }),
    { name: 'rongsokin-notifications' }
  )
);
