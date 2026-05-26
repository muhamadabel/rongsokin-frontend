import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { Order, OrderStatus } from '@/types';
import { useAuthStore } from '@/store/authStore';

export interface CreateOrderPayload {
  categoryId: string;
  category_id?: string; // mapping fallback
  estimatedWeight: number;
  estimated_weight?: number; // mapping fallback
  photoUrl?: string;
  photo_url?: string; // mapping fallback
  lat: number;
  lng: number;
  method: 'PICKUP' | 'DROPOFF';
}

export const useCreateOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateOrderPayload) => {
      // Map frontend keys to backend camelCase keys
      const formatted = {
        categoryId: payload.categoryId || payload.category_id,
        estimatedWeight: payload.estimatedWeight || payload.estimated_weight,
        photoUrl: payload.photoUrl || payload.photo_url,
        lat: payload.lat,
        lng: payload.lng,
        method: payload.method,
      };
      const res = await api.post<{ status: string; data: Order }>('/orders', formatted);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
};

export const useOrdersList = (params: { status?: string; role?: string; limit?: number }) => {
  const token = useAuthStore((state) => state.token);

  return useQuery({
    queryKey: ['orders', params],
    queryFn: async () => {
      const res = await api.get<{ status: string; data: Order[] }>('/orders', {
        params: {
          status: params.status,
          role: params.role,
          limit: params.limit || 10,
        },
      });
      return res.data.data;
    },
    enabled: !!token,
  });
};

export const useOrderDetails = (id: string) => {
  const token = useAuthStore((state) => state.token);

  return useQuery({
    queryKey: ['order', id],
    queryFn: async () => {
      const res = await api.get<{ status: string; data: Order }>(`/orders/${id}`);
      return res.data.data;
    },
    enabled: !!token && !!id,
  });
};

export interface UpdateOrderPayload {
  action: 'accept' | 'validate' | 'confirm' | 'cancel';
  actualWeight?: number;
  actual_weight?: number; // fallback
  agreedPrice?: number;
  final_price?: number; // fallback
}

export const useUpdateOrderStatus = (id: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: UpdateOrderPayload) => {
      const formatted = {
        action: payload.action,
        actualWeight: payload.actualWeight || payload.actual_weight,
        agreedPrice: payload.agreedPrice || payload.final_price,
      };
      const res = await api.patch<{ status: string; data: any }>(`/orders/${id}`, formatted);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order', id] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
};
