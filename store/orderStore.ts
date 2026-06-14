import { create } from 'zustand';
import { Order, OrderStatus } from '@/types';

interface OrderStore {
  incomingOrders: Order[];
  activeOrders: Order[];
  setIncomingOrders: (orders: Order[]) => void;
  setActiveOrders: (orders: Order[]) => void;
  addIncomingOrder: (order: Order) => void;
  removeIncomingOrder: (id: string) => void;
  updateOrderStatus: (id: string, status: OrderStatus) => void;
}

export const useOrderStore = create<OrderStore>((set) => ({
  incomingOrders: [],
  activeOrders: [],
  setIncomingOrders: (orders) => set({ incomingOrders: orders }),
  setActiveOrders: (orders) => set({ activeOrders: orders }),
  addIncomingOrder: (order) =>
    set((state) => {
      const idx = state.incomingOrders.findIndex((o) => o.id === order.id);
      if (idx === -1) {
        return { incomingOrders: [order, ...state.incomingOrders] };
      }
      // Sudah ada (mis. dari socket) → GABUNG, bukan diabaikan. Data dari REST yang
      // diperkaya (customer, koordinat, jarak, addressText) melengkapi versi parsial
      // socket. Hanya field bermakna (non-kosong) yang menimpa, jadi event socket
      // susulan yang minim tidak menghapus data yang sudah lengkap.
      const existing = state.incomingOrders[idx];
      const merged: Order = { ...existing };
      (Object.keys(order) as (keyof Order)[]).forEach((k) => {
        const v = order[k];
        if (v === undefined || v === null || v === '') return;
        if (k === 'customer' || k === 'collector') {
          (merged as unknown as Record<string, unknown>)[k] = {
            ...((existing[k] as object) || {}),
            ...(v as object),
          };
        } else {
          (merged as unknown as Record<string, unknown>)[k] = v as unknown;
        }
      });
      const next = [...state.incomingOrders];
      next[idx] = merged;
      return { incomingOrders: next };
    }),
  removeIncomingOrder: (id) =>
    set((state) => ({
      incomingOrders: state.incomingOrders.filter((o) => o.id !== id),
    })),
  updateOrderStatus: (id, status) =>
    set((state) => {
      const update = (orders: Order[]) =>
        orders.map((o) => (o.id === id ? { ...o, status } : o));
      
      // Jika status bukan PENDING lagi (misal sudah CONFIRMED atau CANCELLED), 
      // hapus dari list incomingOrders pengepul lain secara real-time.
      const nextIncoming = status !== 'PENDING'
        ? state.incomingOrders.filter((o) => o.id !== id)
        : update(state.incomingOrders);

      return {
        incomingOrders: nextIncoming,
        activeOrders: update(state.activeOrders),
      };
    }),
}));
