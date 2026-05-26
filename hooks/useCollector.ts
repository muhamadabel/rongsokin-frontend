import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { CollectorProfile, CollectorCatalog } from '@/types';
import { useAuthStore } from '@/store/authStore';

export interface SetupProfilePayload {
  shopName?: string;
  lapak_name?: string; // fallback
  description?: string;
  radiusKm?: number;
  radius_km?: number; // fallback
  isOpen?: boolean;
  is_open?: boolean; // fallback
  lat?: number;
  lng?: number;
}

export interface CatalogItemPayload {
  categoryId: string;
  category_id?: string; // fallback
  minPrice: number;
  price_min?: number; // fallback
  maxPrice: number;
  price_max?: number; // fallback
  isActive?: boolean;
  is_active?: boolean; // fallback
}

export const useCollectorProfile = () => {
  const token = useAuthStore((state) => state.token);

  return useQuery({
    queryKey: ['collectorProfile'],
    queryFn: async () => {
      const res = await api.get<{ status: string; data: CollectorProfile }>('/collector/profile');
      return res.data.data;
    },
    enabled: !!token,
  });
};

export const useUpdateCollectorProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: SetupProfilePayload) => {
      const formatted: Record<string, unknown> = {
        shopName: payload.shopName || payload.lapak_name,
        description: payload.description,
        radiusKm: payload.radiusKm || payload.radius_km,
        isOpen: payload.isOpen !== undefined ? payload.isOpen : payload.is_open,
      };
      if (payload.lat !== undefined) formatted.lat = payload.lat;
      if (payload.lng !== undefined) formatted.lng = payload.lng;

      // Gunakan POST untuk create, PATCH untuk update
      const res = await api.post<{ status: string; data: CollectorProfile }>('/collector/profile', formatted)
        .catch(() => api.patch<{ status: string; data: CollectorProfile }>('/collector/profile', formatted));
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collectorProfile'] });
    },
  });
};

export const useUpdateCatalogs = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (catalogs: CatalogItemPayload[]) => {
      const formatted = catalogs.map((c) => ({
        categoryId: c.categoryId || c.category_id!,
        minPrice: c.minPrice || c.price_min!,
        maxPrice: c.maxPrice || c.price_max!,
        isActive: c.isActive !== undefined ? c.isActive : c.is_active,
      }));
      const res = await api.patch<{ status: string; data: CollectorCatalog[] }>('/collector/catalogs', formatted);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collectorProfile'] });
    },
  });
};
