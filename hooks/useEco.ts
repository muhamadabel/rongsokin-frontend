import { useQuery } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/authStore';

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  name: string;
  avatarUrl: string | null;
  totalKg: number;
  orderCount: number;
}

export interface EcoMe {
  userId: string;
  totalKg: number;
  orderCount: number;
  /** null kalau belum punya kontribusi (belum masuk peringkat) */
  rank: number | null;
}

export interface LeaderboardData {
  leaderboard: LeaderboardEntry[];
  me: EcoMe | null;
}

const isMissingRoute = (err: unknown): boolean => {
  const s = (err as AxiosError | undefined)?.response?.status;
  return s === 404 || s === 405 || s === 501;
};

/**
 * Papan peringkat dampak ekologis (total kg terdaur ulang per customer).
 * Mengembalikan null kalau endpoint BE belum tersedia (graceful sampai BE deploy).
 */
export const useEcoLeaderboard = () => {
  const user = useAuthStore((s) => s.user);

  return useQuery({
    queryKey: ['ecoLeaderboard', user?.id],
    queryFn: async (): Promise<LeaderboardData | null> => {
      try {
        const res = await api.get<{ status: string; data: LeaderboardData }>(
          '/discovery/leaderboard',
          { params: user?.id ? { userId: user.id } : {} }
        );
        return res.data.data;
      } catch (err) {
        if (isMissingRoute(err)) return null;
        throw err;
      }
    },
    retry: false,
    staleTime: 60_000,
  });
};
