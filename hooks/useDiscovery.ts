import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import { WasteCategory, CollectorProfile } from '@/types';

export interface SearchQueryParams {
  lat: number;
  lng: number;
  categoryId?: string;
  category?: string; // name to match
  radius?: number;
}

export const useWasteCategories = () => {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await api.get<{ status: string; data: WasteCategory[] }>('/discovery/categories');
      return res.data.data;
    },
  });
};

export const useSearchCollectors = (params: SearchQueryParams) => {
  const { data: categories } = useWasteCategories();

  return useQuery({
    queryKey: ['collectors', params, categories],
    queryFn: async () => {
      let activeCategoryId = params.categoryId;

      // Map category name (e.g. 'kardus') to categoryId if needed
      if (!activeCategoryId && params.category && categories) {
        const found = categories.find(
          (c) => c.name.toLowerCase() === params.category!.toLowerCase()
        );
        if (found) activeCategoryId = found.id;
      }

      if (!activeCategoryId) {
        // Fallback: use first category if none matched, or return empty list
        if (categories && categories.length > 0) {
          activeCategoryId = categories[0].id;
        } else {
          return [];
        }
      }

      const res = await api.get<{ status: string; data: any[] }>('/discovery/search', {
        params: {
          lat: params.lat,
          lng: params.lng,
          categoryId: activeCategoryId,
          radius: params.radius || 5,
        },
      });

      // Map result database fields into front-end models
      return res.data.data.map((c) => ({
        id: c.id,
        shopName: c.shopName,
        description: c.description,
        priorityScore: c.priorityScore,
        ownerName: c.ownerName,
        distance: c.distance, // in meters
        isOpen: true,
      }));
    },
    enabled: !!params.categoryId || !!params.category || !!categories,
  });
};

export const useCollectorDetails = (id: string) => {
  return useQuery({
    queryKey: ['collectorDetails', id],
    queryFn: async () => {
      const res = await api.get<{ status: string; data: CollectorProfile }>(`/discovery/collectors/${id}`);
      return res.data.data;
    },
    enabled: !!id,
  });
};

