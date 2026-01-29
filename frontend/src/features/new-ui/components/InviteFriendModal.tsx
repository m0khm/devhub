import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { apiClient } from '../../../api/client';
import type { User } from '../../../shared/types';

interface InviteFriendModalProps {
  open: boolean;
  onClose: () => void;
  projectId: string;
}

export function InviteFriendModal({ open, onClose, projectId }: InviteFriendModalProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      setQuery('');
      setResults([]);
      setSelectedUser(null);
      return;
    }

    if (!query.trim() || selectedUser) {
      setResults([]);
      return;
    }

    const handle = window.setTimeout(async () => {
      const trimmed = query.trim();
      if (!trimmed) return;

      setLoading(true);
      try {
        const response = await apiClient.get<User[]>('/users', {
          params: { query: trimmed },
        });
        setResults(Array.isArray(response.data) ? response.data : []);
      } catch (error: any) {
        toast.error(error.response?.data?.error || 'Не удалось найти пользователя');
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => window.clearTimeout(handle);
  }, [open, query, selectedUser]);

  const submitInvite = async () => {
    if (!selectedUser) {
      toast.error('Выберите пользователя для приглашения');
      return;
    }

    setSubmitting(true);
    try {
      await apiClient.post(`/projects/${projectId}/members`, {
        user_id: selectedUser.id,
      });
      toast.success('Приглашение отправлено');
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Не удалось отправить приглашение');
    } finally {
      setSubmitting(false);
    }
  };

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
            className="w-full max-w-lg rounded-2xl border border-white/10 bg-slate-900/90 p-6 shadow-2xl backdrop-blur"
          >
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5">
                <UserPlus className="h-5 w-5 text-slate-200" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white">Пригласить друга</h3>
                <p className="text-sm text-slate-400">Найдите пользователя по имени или email.</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Поиск пользователя
                </label>
                <input
                  value={query}
                  onChange={(event) => {
                    setQuery(event.target.value);
                    setSelectedUser(null);
                  }}
                  placeholder="@devhub или email"
                  className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
                {loading && <p className="mt-2 text-xs text-slate-400">Поиск...</p>}
                {!loading && query.trim() && results.length === 0 && !selectedUser && (
                  <p className="mt-2 text-xs text-slate-400">Совпадений не найдено.</p>
                )}
              </div>

              {results.length > 0 && (
                <div className="space-y-2">
                  {results.map((user) => (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => {
                        setSelectedUser(user);
                        setQuery(`${user.name} (${user.email})`);
                        setResults([]);
                      }}
                      className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left text-sm text-white transition hover:border-blue-500/40 hover:bg-blue-500/10"
                    >
                      <div>
                        <div className="font-medium">{user.name}</div>
                        <div className="text-xs text-slate-400">{user.email}</div>
                      </div>
                      <span className="text-xs text-slate-400">Выбрать</span>
                    </button>
                  ))}
                </div>
              )}

              {selectedUser && (
                <div className="rounded-xl border border-blue-500/40 bg-blue-500/10 px-4 py-3 text-sm text-blue-100">
                  Выбран пользователь: <span className="font-semibold">{selectedUser.name}</span>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-white/10 px-4 py-2 text-sm text-slate-200 transition hover:bg-white/5"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={submitInvite}
                disabled={!selectedUser || submitting}
                className="rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 px-4 py-2 text-sm font-semibold text-white transition hover:from-blue-600 hover:to-purple-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? 'Отправляем...' : 'Отправить приглашение'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
