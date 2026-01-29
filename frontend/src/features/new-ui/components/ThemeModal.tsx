import { AnimatePresence, motion } from 'motion/react';
import { Moon, Sun } from 'lucide-react';
import { useThemeStore } from '../../../store/themeStore';

interface ThemeModalProps {
  open: boolean;
  onClose: () => void;
}

const themes = [
  {
    id: 'dark',
    title: 'Темная тема',
    description: 'Темный интерфейс с мягкими акцентами.',
    icon: Moon,
  },
  {
    id: 'light',
    title: 'Светлая тема',
    description: 'Светлый интерфейс для дневной работы.',
    icon: Sun,
  },
] as const;

export function ThemeModal({ open, onClose }: ThemeModalProps) {
  const theme = useThemeStore((state) => state.theme);
  const setTheme = useThemeStore((state) => state.setTheme);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-6"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 20 }}
            onClick={(event) => event.stopPropagation()}
            className="w-full max-w-xl rounded-2xl border border-white/10 bg-slate-900/90 p-6 shadow-2xl backdrop-blur"
          >
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-white">Настроить тему</h3>
              <p className="text-sm text-slate-400">
                Выберите оформление, которое подходит вашему стилю работы.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {themes.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setTheme(item.id);
                    onClose();
                  }}
                  className={`rounded-2xl border px-5 py-4 text-left transition-all ${
                    theme === item.id
                      ? 'border-blue-500/60 bg-blue-500/10'
                      : 'border-white/10 bg-white/5 hover:border-blue-500/40 hover:bg-blue-500/10'
                  }`}
                >
                  <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/5">
                    <item.icon className="h-5 w-5 text-slate-200" />
                  </div>
                  <div className="text-lg font-semibold text-white">{item.title}</div>
                  <div className="text-sm text-slate-400">{item.description}</div>
                </button>
              ))}
            </div>
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-white/10 px-4 py-2 text-sm text-slate-200 transition hover:bg-white/5"
              >
                Закрыть
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
