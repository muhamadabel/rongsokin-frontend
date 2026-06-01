import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import { Rating } from '@/types';
import { useAuthStore } from '@/store/authStore';

/**
 * GET /ratings/user/:userId  (requires auth — sudah ada di BE)
 * Mengembalikan daftar ulasan yang DITERIMA user tersebut.
 */
export const useUserRatings = (userId?: string) => {
  const token = useAuthStore((s) => s.token);

  return useQuery({
    queryKey: ['ratings', 'user', userId],
    queryFn: async () => {
      const res = await api.get<{ status: string; data: Rating[] }>(`/ratings/user/${userId}`);
      return res.data.data;
    },
    enabled: !!userId && !!token,
  });
};
