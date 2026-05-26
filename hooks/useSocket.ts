import { useEffect } from 'react';
import { getSocket, disconnectSocket } from '@/lib/socket';
import { useAuthStore } from '@/store/authStore';
import { useOrderStore } from '@/store/orderStore';
import { Order } from '@/types';
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

    // Handle new order received (Collector)
    socket.on('new_order', (payload: any) => {
      // Map Socket.IO payload to Order model format
      const mockOrder: Order = {
        id: payload.orderId,
        customerId: '',
        categoryId: payload.category,
        method: payload.method,
        estimatedWeight: payload.estWeight,
        status: 'PENDING',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      addIncomingOrder(mockOrder);
      toast.success(`Pesanan Baru Masuk! Estimasi: ${payload.estWeight} kg`, {
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
