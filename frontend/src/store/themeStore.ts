import { create } from 'zustand';
import { safeStorage } from '../shared/utils/storage';

type Theme = 'light' | 'dark';

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  loadFromStorage: () => void;
}

const THEME_STORAGE_KEY = 'theme';

const getInitialTheme = (): Theme => {
  if (typeof window === 'undefined') {
    return 'dark';
  }

  const stored = safeStorage.get(THEME_STORAGE_KEY);
  if (stored === 'light' || stored === 'dark') {
    return stored;
  }

  return 'dark';
};

export const useThemeStore = create<ThemeState>((set) => ({
  theme: getInitialTheme(),

  setTheme: (theme) => {
    safeStorage.set(THEME_STORAGE_KEY, theme);
    set({ theme });
  },

  toggleTheme: () => {
    set((state) => {
      const nextTheme: Theme = state.theme === 'dark' ? 'light' : 'dark';
      safeStorage.set(THEME_STORAGE_KEY, nextTheme);
      return { theme: nextTheme };
    });
  },

  loadFromStorage: () => {
    const stored = safeStorage.get(THEME_STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') {
      set({ theme: stored });
    }
  },
}));
