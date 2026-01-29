import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useMemo, useState } from 'react';
import type { ComponentType } from 'react';
import { Search } from 'lucide-react';

export interface CommandPaletteAction {
  id: string;
  label: string;
  description?: string;
  shortcut?: string;
  onSelect: () => void;
  icon?: ComponentType<{ className?: string }>;
}

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  actions: CommandPaletteAction[];
}

export function CommandPalette({ open, onClose, actions }: CommandPaletteProps) {
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (!open) {
      setQuery('');
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  const filteredActions = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return actions;
    return actions.filter((action) => {
      return (
        action.label.toLowerCase().includes(trimmed) ||
        action.description?.toLowerCase().includes(trimmed)
      );
    });
  }, [actions, query]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-6"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 20 }}
            onClick={(event) => event.stopPropagation()}
            className="w-full max-w-2xl rounded-2xl border border-white/10 bg-slate-900/90 p-6 shadow-2xl backdrop-blur"
          >
            <div className="mb-4 flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
              <Search className="h-5 w-5 text-slate-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Command Palette"
                className="w-full bg-transparent text-white placeholder:text-slate-500 focus:outline-none"
              />
              <span className="rounded-md border border-white/10 px-2 py-1 text-xs text-slate-400">ESC</span>
            </div>

            <div className="max-h-[360px] space-y-2 overflow-y-auto pr-1">
              {filteredActions.length === 0 ? (
                <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-6 text-center text-sm text-slate-400">
                  Ничего не найдено. Попробуйте другое название.
                </div>
              ) : (
                filteredActions.map((action) => (
                  <button
                    key={action.id}
                    type="button"
                    onClick={() => {
                      action.onSelect();
                      onClose();
                    }}
                    className="flex w-full items-center gap-4 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left text-white transition hover:border-blue-500/40 hover:bg-blue-500/10"
                  >
                    {action.icon ? (
                      <action.icon className="h-5 w-5 text-slate-300" />
                    ) : (
                      <div className="h-5 w-5 rounded-full bg-blue-500/30" />
                    )}
                    <div className="flex-1">
                      <div className="font-medium">{action.label}</div>
                      {action.description && (
                        <div className="text-xs text-slate-400">{action.description}</div>
                      )}
                    </div>
                    {action.shortcut && (
                      <span className="rounded border border-white/10 px-2 py-1 text-xs text-slate-400">
                        {action.shortcut}
                      </span>
                    )}
                  </button>
                ))
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
