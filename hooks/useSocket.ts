import { useEffect } from 'react';
import { getSocket, disconnectSocket } from '@/lib/socket';
import { useAuthStore } from '@/store/authStore';
import { useOrderStore } from '@/store/orderStore';
import { useNotificationStore } from '@/store/notificationStore';
import { Order, OrderItem } from '@/types';
import { toast } from 'react-hot-toast';

const STATUS_LABEL_ID: Record<string, string> = {
  CONFIRMED: 'diterima pengepul',
  ON_THE_WAY: 'dalam perjalanan',
  IN_PROGRESS: 'sudah sampai — sedang ditimbang',
  AWAITING_CONFIRMATION: 'menunggu konfirmasimu',
  COMPLETED: 'selesai',
  CANCELLED: 'dibatalkan',
};

export const useSocket = () => {
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const addIncomingOrder = useOrderStore((state) => state.addIncomingOrder);
  const updateOrderStatus = useOrderStore((state) => state.updateOrderStatus);
  const addNotification = useNotificationStore((state) => state.add);

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
        // War (broadcast) = null/undefined; Forward (private, dipilih langsung
        // dari lapak) = userId pengepul. Dulu field ini tak dikirim BE sama sekali
        // → order forward sempat tampil sbg War sampai polling REST membetulkan.
        collectorId: payload.collectorId || undefined,
        method: payload.method,
        status: 'PENDING',
        // Pakai createdAt ASLI dari BE supaya countdown 15 menit akurat sejak awal.
        // Fallback ke waktu event tiba hanya kalau BE lama belum mengirimnya.
        createdAt: payload.createdAt || new Date().toISOString(),
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
      if (user) {
        addNotification({
          id: `new_order:${payload.orderId}`,
          userId: user.id,
          type: 'new_order',
          title: 'Pesanan baru masuk',
          body: `Estimasi ${totalWeight.toFixed(1)} kg — cek antreanmu.`,
          href: '/collector',
          createdAt: new Date().toISOString(),
        });
      }
    });

    // Handle order status update
    const handleStatusUpdate = (payload: { orderId: string; status: any }) => {
      updateOrderStatus(payload.orderId, payload.status);
      const label = STATUS_LABEL_ID[payload.status] || payload.status;
      toast(`Status pesanan ${payload.orderId.slice(0, 5)}... berubah menjadi ${payload.status}`, {
        icon: "♻️",
      });
      if (user) {
        addNotification({
          id: `status:${payload.orderId}:${payload.status}`,
          userId: user.id,
          type: 'status',
          title: 'Status pesanan diperbarui',
          body: `Pesanan #${payload.orderId.slice(-5).toUpperCase()} kini ${label}.`,
          href: `/orders/${payload.orderId}`,
          createdAt: new Date().toISOString(),
        });
      }
    };

    socket.on('order_status_update', handleStatusUpdate);
    socket.on('order_status_updated', handleStatusUpdate); // double-handle for compatibility

    return () => {
      socket.off('new_order');
      socket.off('order_status_update');
      socket.off('order_status_updated');
    };
  }, [token, user, addIncomingOrder, updateOrderStatus, addNotification]);
};
