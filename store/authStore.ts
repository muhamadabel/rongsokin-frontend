import { create } from 'zustand';
import { User } from '@/types';
import { useNotificationStore } from '@/store/notificationStore';

interface AuthStore {
  user: User | null;
  token: string | null;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
  initFromStorage: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  token: null,
  setAuth: (user, token) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
    }
    set({ user, token });
  },
  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    // Bersihkan notifikasi supaya tidak terbawa ke akun lain di device yang sama
    useNotificationStore.getState().clearAll();
    set({ user: null, token: null });
  },
  initFromStorage: () => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      if (token && userStr) {
        try {
          const user = JSON.parse(userStr);
          set({ user, token });
        } catch {
          // Clear if invalid
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      }
    }
  },
}));
