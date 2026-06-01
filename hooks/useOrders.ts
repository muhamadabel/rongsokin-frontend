import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { Order } from '@/types';
import { useAuthStore } from '@/store/authStore';

// ── Create Order ─────────────────────────────────────────────────────────
export interface CreateOrderItemInput {
  categoryId: string;
  estimatedWeight: number;
}

export interface CreateOrderPayload {
  items: CreateOrderItemInput[];
  photoUrl?: string;
  lat: number;
  lng: number;
  method: 'PICKUP' | 'DROPOFF';
}

export const useCreateOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateOrderPayload) => {
      // Backward-compat: kalau cuma 1 item dan BE belum support items[], BE legacy
      // bisa parse top-level categoryId+estimatedWeight. Kita kirim KEDUANYA biar
      // BE baru (pakai items) maupun BE lama (pakai single field) sama-sama jalan.
      const body: Record<string, unknown> = {
        items: payload.items,
        photoUrl: payload.photoUrl,
        lat: payload.lat,
        lng: payload.lng,
        method: payload.method,
      };

      if (payload.items.length === 1) {
        body.categoryId = payload.items[0].categoryId;
        body.estimatedWeight = payload.items[0].estimatedWeight;
      }

      const res = await api.post<{ status: string; data: Order }>('/orders', body);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
};

// ── List & Detail ────────────────────────────────────────────────────────
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

// ── Update Status (accept / validate / confirm / reject / cancel) ────────
export interface ValidateItemInput {
  id?: string;           // OrderItem.id (kalau pakai schema baru)
  categoryId?: string;   // alternatif kalau BE accept by categoryId
  actualWeight: number;
  agreedPrice: number;
}

export interface UpdateOrderPayload {
  action: 'accept' | 'reject' | 'validate' | 'confirm' | 'cancel';
  /** Multi-item validate (schema baru) */
  items?: ValidateItemInput[];
  /** Legacy single-item validate (schema lama) — auto-derived dari items kalau cuma 1 */
  actualWeight?: number;
  agreedPrice?: number;
}

export const useUpdateOrderStatus = (id: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: UpdateOrderPayload) => {
      const body: Record<string, unknown> = { action: payload.action };

      if (payload.action === 'validate') {
        if (payload.items && payload.items.length > 0) {
          body.items = payload.items;
          // Legacy single-item fallback
          if (payload.items.length === 1) {
            body.actualWeight = payload.items[0].actualWeight;
            body.agreedPrice = payload.items[0].agreedPrice;
          }
        } else {
          body.actualWeight = payload.actualWeight;
          body.agreedPrice = payload.agreedPrice;
        }
      }

      const res = await api.patch<{ status: string; data: unknown }>(`/orders/${id}`, body);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order', id] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
};
