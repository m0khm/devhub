import { create } from 'zustand';
import type { User } from '../shared/types';
import { safeStorage } from '../shared/utils/storage';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, token: string) => void;
  updateUser: (user: User) => void;
  logout: () => void;
  loadFromStorage: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,

  setAuth: (user, token) => {
    safeStorage.set('auth_token', token);
    safeStorage.set('auth_user', JSON.stringify(user));
    set({ user, token, isAuthenticated: true });
  },

  updateUser: (user) => {
    safeStorage.set('auth_user', JSON.stringify(user));
    set((state) => ({
      user,
      token: state.token,
      isAuthenticated: state.isAuthenticated,
    }));
  },

  logout: () => {
    safeStorage.remove('auth_token');
    safeStorage.remove('auth_user');
    set({ user: null, token: null, isAuthenticated: false });
  },

  loadFromStorage: () => {
    const token = safeStorage.get('auth_token');
    const userStr = safeStorage.get('auth_user');

    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        set({ user, token, isAuthenticated: true });
      } catch (error) {
        console.error('Failed to parse stored user:', error);
        safeStorage.remove('auth_token');
        safeStorage.remove('auth_user');
      }
    }
  },
}));
