import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import {
  AdminStats,
  AdminOrdersResponse,
  AdminWeeklyPoint,
  Order,
  WasteCategory,
} from '@/types';
import { useAuthStore } from '@/store/authStore';

/**
 * Endpoint yang harus disediakan BE (semua butuh authorize('ADMIN')):
 *   GET    /admin/stats
 *   GET    /admin/orders?status=&page=&limit=
 *   POST   /admin/categories      body: { name, iconUrl? }
 *   PATCH  /admin/categories/:id  body: { name?, iconUrl? }
 *   DELETE /admin/categories/:id
 *
 * Selama belum ada di BE, hook di bawah otomatis pakai mock saat dapat 404.
 * Begitu BE jadi, hook tidak perlu diubah sama sekali.
 */

const isMissingRoute = (err: unknown): boolean => {
  const e = err as { response?: { status?: number } };
  const s = e?.response?.status;
  return s === 404 || s === 405 || s === 501;
};

// ── Mock data (deterministik, tidak random — biar UI stabil saat demo) ──
const MOCK_STATS: AdminStats = {
  totalWeightKg: 6_120,
  totalPayout: 17_840_000,
  activeOrders: 12,
  totalCustomers: 248,
  totalCollectors: 36,
  weeklyTransactions: (() => {
    const days = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
    const weights = [320, 450, 290, 580, 410, 620, 210];
    const amounts = [960_000, 1_350_000, 870_000, 1_740_000, 1_230_000, 1_860_000, 630_000];
    const counts = [8, 11, 7, 14, 10, 15, 5];
    const now = new Date();
    return days.map((day, i): AdminWeeklyPoint => {
      const d = new Date(now);
      d.setDate(now.getDate() - (6 - i));
      return {
        day,
        date: d.toISOString().slice(0, 10),
        weight: weights[i],
        amount: amounts[i],
        count: counts[i],
      };
    });
  })(),
};

const MOCK_ORDERS: Order[] = [];

// ── Stats ───────────────────────────────────────────────────────────────
export const useAdminStats = () => {
  const token = useAuthStore((s) => s.token);
  return useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: async (): Promise<AdminStats & { _mocked?: boolean }> => {
      try {
        const res = await api.get<{ status: string; data: AdminStats }>('/admin/stats');
        return res.data.data;
      } catch (err) {
        if (isMissingRoute(err)) {
          return { ...MOCK_STATS, _mocked: true };
        }
        throw err;
      }
    },
    enabled: !!token,
    staleTime: 60_000,
  });
};

// ── Orders monitoring ───────────────────────────────────────────────────
export interface AdminOrdersParams {
  status?: string;
  page?: number;
  limit?: number;
}

export const useAdminOrders = (params: AdminOrdersParams = {}) => {
  const token = useAuthStore((s) => s.token);
  const { status, page = 1, limit = 20 } = params;
  return useQuery({
    queryKey: ['admin', 'orders', { status, page, limit }],
    queryFn: async (): Promise<AdminOrdersResponse & { _mocked?: boolean }> => {
      try {
        const res = await api.get<{ status: string; data: AdminOrdersResponse }>(
          '/admin/orders',
          { params: { status, page, limit } }
        );
        return res.data.data;
      } catch (err) {
        if (isMissingRoute(err)) {
          return { data: MOCK_ORDERS, total: 0, page, limit, _mocked: true };
        }
        throw err;
      }
    },
    enabled: !!token,
  });
};

// ── Category CRUD ───────────────────────────────────────────────────────
export interface CategoryPayload {
  name: string;
  iconUrl?: string;
  description?: string;
  parentId?: string | null;
  unit?: 'kg' | 'liter' | 'pcs';
  sortOrder?: number;
}

export const useCreateCategory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CategoryPayload): Promise<WasteCategory> => {
      try {
        const res = await api.post<{ status: string; data: WasteCategory }>(
          '/admin/categories',
          payload
        );
        return res.data.data;
      } catch (err) {
        if (isMissingRoute(err)) {
          // Optimistic local-only fallback
          return {
            id: `mock-${Date.now()}`,
            name: payload.name,
            iconUrl: payload.iconUrl,
          };
        }
        throw err;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories'] });
    },
  });
};

export const useUpdateCategory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: string;
      payload: Partial<CategoryPayload>;
    }): Promise<WasteCategory> => {
      try {
        const res = await api.patch<{ status: string; data: WasteCategory }>(
          `/admin/categories/${id}`,
          payload
        );
        return res.data.data;
      } catch (err) {
        if (isMissingRoute(err)) {
          return { id, name: payload.name ?? '', iconUrl: payload.iconUrl };
        }
        throw err;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories'] });
    },
  });
};

export const useDeleteCategory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string): Promise<{ id: string }> => {
      try {
        await api.delete(`/admin/categories/${id}`);
        return { id };
      } catch (err) {
        if (isMissingRoute(err)) {
          return { id };
        }
        throw err;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories'] });
    },
  });
};
