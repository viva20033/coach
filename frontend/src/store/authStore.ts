import { create } from 'zustand';
import { api } from '../api/client';
import type { User } from '../types';

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (name: string, role?: string) => Promise<void>;
  logout: () => void;
  refresh: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  error: null,

  login: async (name, role = 'manager') => {
    set({ loading: true, error: null });
    try {
      const user = await api.devLogin({ name, role });
      localStorage.setItem('izo_user_id', String(user.id));
      const full = await api.getMe();
      set({ user: full, loading: false });
    } catch (e) {
      set({ error: (e as Error).message, loading: false });
    }
  },

  logout: () => {
    localStorage.removeItem('izo_user_id');
    set({ user: null });
  },

  refresh: async () => {
    const userId = localStorage.getItem('izo_user_id');
    if (!userId) {
      set({ loading: false });
      return;
    }
    try {
      const user = await api.getMe();
      set({ user, loading: false });
    } catch {
      localStorage.removeItem('izo_user_id');
      set({ user: null, loading: false });
    }
  },
}));
