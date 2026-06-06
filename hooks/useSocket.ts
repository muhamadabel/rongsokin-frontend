import { useEffect } from 'react';
import { getSocket, disconnectSocket } from '@/lib/socket';
import { useAuthStore } from '@/store/authStore';
import { useOrderStore } from '@/store/orderStore';
import { Order, OrderItem } from '@/types';
import { toast } from 'react-hot-toast';

export const useSocket = () => {
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const addIncomingOrder = useOrderStore((state) => state.addIncomingOrder);
  const updateOrderStatus = useOrderStore((state) => state.updateOrderStatus);

  useEffect(() => {
    if (!token || !user) {
      disconnectSocket();
      return;
    }

    const socket = getSocket(token);

    // Join appropriate room for notifications
    if (user.role === 'COLLECTOR') {
      socket.emit('join_room', `collector:${user.id}`);
    } else {
      socket.emit('join_room', `customer:${user.id}`);
    }

    // Handle new order received (Collector) — support BE legacy (single category)
    // dan BE baru (items array). Total weight di-aggregate dari items kalau ada.
    socket.on('new_order', (payload: any) => {
      // Items dari payload baru, atau derive dari legacy single field
      const items: OrderItem[] = Array.isArray(payload.items)
        ? payload.items.map((it: any) => ({
            id: it.id || it.categoryId,
            orderId: payload.orderId,
            categoryId: it.categoryId,
            estimatedWeight: Number(it.estimatedWeight || it.estWeight || 0),
            category: it.category,
          }))
        : payload.category
          ? [
              {
                id: payload.category,
                orderId: payload.orderId,
                categoryId: payload.category,
                estimatedWeight: Number(payload.estWeight || 0),
              },
            ]
          : [];

      const totalWeight = items.reduce((s, i) => s + i.estimatedWeight, 0);

      const mockOrder: Order = {
        id: payload.orderId,
        customerId: '',
        method: payload.method,
        status: 'PENDING',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        items,
        // Foto live tumpukan rongsok (anti pesanan fiktif) — pengepul wajib lihat
        photoUrl: payload.photo_url || payload.photoUrl,
        // Legacy fallback untuk komponen yang masih baca categoryId/estimatedWeight
        categoryId: items[0]?.categoryId,
        estimatedWeight: totalWeight,
      };

      addIncomingOrder(mockOrder);
      toast.success(`Pesanan Baru Masuk! ${totalWeight.toFixed(1)} kg`, {
        icon: '♻️',
        duration: 5000,
      });
    });

    // Handle order status update
    const handleStatusUpdate = (payload: { orderId: string; status: any }) => {
      updateOrderStatus(payload.orderId, payload.status);
      toast(`Status pesanan ${payload.orderId.slice(0, 5)}... berubah menjadi ${payload.status}`, {
        icon: "♻️",
      });
    };

    socket.on('order_status_update', handleStatusUpdate);
    socket.on('order_status_updated', handleStatusUpdate); // double-handle for compatibility

    return () => {
      socket.off('new_order');
      socket.off('order_status_update');
      socket.off('order_status_updated');
    };
  }, [token, user, addIncomingOrder, updateOrderStatus]);
};
