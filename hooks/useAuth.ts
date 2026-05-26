import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/authStore';
import { User } from '@/types';

interface AuthResponse {
  status: string;
  data: {
    access_token: string;
    user: User;
  };
}

export const useLogin = () => {
  const setAuth = useAuthStore((state) => state.setAuth);
  
  return useMutation({
    mutationFn: async (payload: any) => {
      const res = await api.post<AuthResponse>('/auth/login', payload);
      return res.data;
    },
    onSuccess: (res) => {
      setAuth(res.data.user, res.data.access_token);
    },
  });
};

export const useRegister = () => {
  const setAuth = useAuthStore((state) => state.setAuth);

  return useMutation({
    mutationFn: async (payload: any) => {
      const res = await api.post<AuthResponse>('/auth/register', payload);
      return res.data;
    },
    onSuccess: (res) => {
      setAuth(res.data.user, res.data.access_token);
    },
  });
};

export const useMe = () => {
  const token = useAuthStore((state) => state.token);

  return useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const res = await api.get<{ status: string; data: User }>('/auth/me');
      return res.data.data;
    },
    enabled: !!token,
  });
};
