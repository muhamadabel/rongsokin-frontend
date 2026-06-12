import { useMemo } from 'react';
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

/**
 * Bangun tree kategori dari list flat: induk (parentId null) + children.
 * Mengembalikan { mains, byId, childrenOf, isLoading }.
 * Backward-compat: kalau BE lama (kategori flat tanpa parentId), semua dianggap induk.
 */
export const useCategoryTree = () => {
  const { data: flat, isLoading, error } = useWasteCategories();

  const tree = useMemo(() => {
    const list = flat || [];
    const byId: Record<string, WasteCategory> = {};
    list.forEach((c) => (byId[c.id] = c));

    const mains = list
      .filter((c) => !c.parentId)
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

    const childrenOf: Record<string, WasteCategory[]> = {};
    list.forEach((c) => {
      if (c.parentId) {
        (childrenOf[c.parentId] ||= []).push(c);
      }
    });
    Object.values(childrenOf).forEach((arr) =>
      arr.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
    );

    // Semua "leaf" (item yang bisa dipesan): kalau punya children, leaf = children;
    // kalau induk tanpa children (BE lama), induk itu sendiri jadi leaf.
    const leaves = list.filter((c) => c.parentId || !childrenOf[c.id]);

    return { mains, byId, childrenOf, leaves };
  }, [flat]);

  return { ...tree, isLoading, error };
};

export const useSearchCollectors = (
  params: SearchQueryParams,
  options?: { enabled?: boolean }
) => {
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

      const queryParams: Record<string, any> = {
        lat: params.lat,
        lng: params.lng,
        radius: params.radius || 5,
      };

      if (activeCategoryId) {
        queryParams.categoryId = activeCategoryId;
      }

      try {
        const res = await api.get<{ status: string; data: any[] }>('/discovery/search', {
          params: queryParams,
        });

        // Map result database fields into front-end models
        return res.data.data.map((c) => ({
          id: c.id,
          shopName: c.shopName,
          description: c.description,
          priorityScore: c.priorityScore,
          avgRating: c.avgRating != null ? Number(c.avgRating) : 0,
          ownerName: c.ownerName,
          distance: c.distance, // in meters
          // Harga ambil tertinggi (utk sort "termahal"). undefined kalau BE belum kirim.
          maxPrice: c.maxPrice != null ? Number(c.maxPrice) : undefined,
          isOpen: true,
          isVerified: Boolean(c.ownerVerified ?? c.isVerified),
        }));
      } catch (err) {
        // BE lama: search butuh auth + categoryId → kalau gagal, anggap kosong
        // (begitu BE baru deploy: publik + opsional categoryId, otomatis jalan)
        const status = (err as { response?: { status?: number } })?.response?.status;
        if (status === 400 || status === 401 || status === 404) return [];
        throw err;
      }
    },
    enabled: (!params.category || !!categories) && (options?.enabled ?? true),
    retry: false,
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

export interface DiscoveryStats {
  totalTransactions: number;
  totalCollectors: number;
  totalCustomers: number;
  totalCategories: number;
  totalWeightKg: number;
}

// Statistik publik untuk landing. Null kalau endpoint belum tersedia (BE belum deploy).
export const useDiscoveryStats = () => {
  return useQuery({
    queryKey: ['discoveryStats'],
    queryFn: async (): Promise<DiscoveryStats | null> => {
      try {
        const res = await api.get<{ status: string; data: DiscoveryStats }>('/discovery/stats');
        return res.data.data;
      } catch (err) {
        const status = (err as { response?: { status?: number } })?.response?.status;
        if (status === 404 || status === 405 || status === 501) return null;
        throw err;
      }
    },
    retry: false,
    staleTime: 60_000,
  });
};

