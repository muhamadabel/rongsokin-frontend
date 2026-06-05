import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import api from '@/lib/axios';
import { Order } from '@/types';
import { useAuthStore } from '@/store/authStore';

// Endpoint yang belum di-deploy → jangan bikin UI error, anggap data kosong dulu
const isMissingRoute = (err: unknown): boolean => {
  const s = (err as AxiosError | undefined)?.response?.status;
  return s === 404 || s === 405 || s === 501;
};

// ── Create Order ─────────────────────────────────────────────────────────
export interface CreateOrderItemInput {
  categoryId: string;
  estimatedWeight: number;
  /** Catatan opsional per kategori — didukung BE */
  notes?: string;
}

export interface CreateOrderPayload {
  items: CreateOrderItemInput[];
  photoUrl?: string;
  lat: number;
  lng: number;
  method: 'PICKUP' | 'DROPOFF';
  /** Khusus DROPOFF: bisa pilih lapak langsung — BE akan langsung notify hanya collector ini */
  collectorId?: string;
}

export const useCreateOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateOrderPayload) => {
      const body: Record<string, unknown> = {
        items: payload.items,
        photoUrl: payload.photoUrl,
        lat: payload.lat,
        lng: payload.lng,
        method: payload.method,
      };

      if (payload.collectorId) {
        body.collectorId = payload.collectorId;
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
    queryFn: async (): Promise<Order[]> => {
      try {
        const res = await api.get<{ status: string; data: Order[] }>('/orders', {
          params: {
            status: params.status,
            role: params.role,
            limit: params.limit || 10,
          },
        });
        return res.data.data;
      } catch (err) {
        // BE belum deploy GET /orders → tampilkan empty state, bukan error
        if (isMissingRoute(err)) return [];
        throw err;
      }
    },
    enabled: !!token,
    retry: (count, err) => !isMissingRoute(err) && count < 2,
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
  /** OrderItem.id — wajib di BE baru */
  id: string;
  actualWeight: number;
  agreedPrice: number;
}

export interface UpdateOrderPayload {
  action: 'accept' | 'reject' | 'validate' | 'confirm' | 'cancel';
  /** Items wajib untuk validate */
  items?: ValidateItemInput[];
  /** Bukti timbangan opsional (URL Cloudinary) */
  transactionProofUrl?: string;
}

export const useUpdateOrderStatus = (id: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: UpdateOrderPayload) => {
      const body: Record<string, unknown> = { action: payload.action };

      if (payload.action === 'validate') {
        body.items = payload.items;
        if (payload.transactionProofUrl) {
          body.transactionProofUrl = payload.transactionProofUrl;
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
