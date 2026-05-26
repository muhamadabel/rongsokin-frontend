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
      // Avoid duplicates
      if (state.incomingOrders.some((o) => o.id === order.id)) {
        return state;
      }
      return { incomingOrders: [order, ...state.incomingOrders] };
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
