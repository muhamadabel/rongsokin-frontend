import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/authStore';
import { User, RegisterPayload } from '@/types';

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
    mutationFn: async (payload: RegisterPayload) => {
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

// ── Update profil user + KYC ───────────────────────────────────────────────
/**
 * PATCH /auth/me
 *   body: { name?, phone?, avatarUrl?, lat?, lng?, nik?, ktpName?, ktpUrl? }
 *   response: { status, data: User }  — isVerified asli dari server.
 *
 * BE menyimpan field KYC & menyetel isVerified bila nik + ktpUrl lengkap,
 * jadi klien TIDAK lagi memalsukan status verifikasi.
 */
export interface UpdateMePayload {
  name?: string;
  phone?: string;
  avatarUrl?: string;
  lat?: number;
  lng?: number;
  /** KYC menyusul (akun belum terverifikasi) */
  nik?: string;
  ktpName?: string;
  ktpUrl?: string;
}

export const useUpdateMe = () => {
  const qc = useQueryClient();
  const token = useAuthStore((s) => s.token);
  const setAuth = useAuthStore((s) => s.setAuth);

  return useMutation({
    mutationFn: async (payload: UpdateMePayload): Promise<User> => {
      // Pakai apa adanya dari server (termasuk isVerified). 409 "Identitas sudah
      // terdaftar." dari BE diteruskan sebagai error → ditangani pemanggil.
      const res = await api.patch<{ status: string; data: User }>('/auth/me', payload);
      return res.data.data;
    },
    onSuccess: (updated) => {
      if (token) setAuth(updated, token);
      qc.setQueryData(['me'], updated);
      qc.invalidateQueries({ queryKey: ['me'] });
    },
  });
};
