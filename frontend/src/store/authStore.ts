import { create } from 'zustand';
import type { User } from '../shared/types';
import { apiClient } from '../api/client';
import { safeStorage } from '../shared/utils/storage';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isHydrated: boolean;
  setAuth: (user: User, token: string) => void;
  updateUser: (user: User) => void;
  refreshMe: () => Promise<void>;
  logout: () => void;
  loadFromStorage: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isHydrated: false,

  setAuth: (user, token) => {
    safeStorage.set('auth_token', token);
    safeStorage.set('auth_user', JSON.stringify(user));
    set({ user, token, isAuthenticated: true, isHydrated: true });
  },

  updateUser: (user) => {
    safeStorage.set('auth_user', JSON.stringify(user));
    set((state) => ({
      user,
      token: state.token,
      isAuthenticated: state.isAuthenticated,
      isHydrated: state.isHydrated,
    }));
  },

  refreshMe: async () => {
    const token = safeStorage.get('auth_token');
    if (!token) {
      set({ user: null, token: null, isAuthenticated: false, isHydrated: true });
      return;
    }

    try {
      const response = await apiClient.get<User>('/auth/me');
      const user = response.data;
      safeStorage.set('auth_user', JSON.stringify(user));
      set({ user, token, isAuthenticated: true, isHydrated: true });
    } catch (error: any) {
      if (error?.response?.status === 401) {
        get().logout();
        return;
      }
      console.error('Failed to refresh user:', error);
    }
  },

  logout: () => {
    safeStorage.remove('auth_token');
    safeStorage.remove('auth_user');
    set({ user: null, token: null, isAuthenticated: false, isHydrated: true });
  },

  loadFromStorage: () => {
    const token = safeStorage.get('auth_token');
    const userStr = safeStorage.get('auth_user');

    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        set({ user, token, isAuthenticated: true, isHydrated: true });
        return;
      } catch (error) {
        console.error('Failed to parse stored user:', error);
        safeStorage.remove('auth_token');
        safeStorage.remove('auth_user');
      }
    }

    set({ user: null, token: null, isAuthenticated: false, isHydrated: true });
  },
}));
