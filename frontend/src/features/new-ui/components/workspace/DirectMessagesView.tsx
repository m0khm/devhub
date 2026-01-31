import { motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import {
  MessageSquare,
  Search,
  Plus,
  User as UserIcon,
  Clock,
} from 'lucide-react';
import { toast } from 'sonner';
import { apiClient } from '../../../../api/client';
import type { WorkspaceOutletContext } from '../../pages/WorkspaceLayout';

interface DMThread {
  id: string;
  name: string;
  type: string;
  user?: {
    id: string;
    name: string;
    handle?: string;
    avatar_url?: string;
  };
  last_message_at?: string;
  message_count?: number;
}

export function DirectMessagesView() {
  const { currentProject, setSelectedTopicId } =
    useOutletContext<WorkspaceOutletContext>() ?? ({} as any);
  const navigate = useNavigate();
  const [threads, setThreads] = useState<DMThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showNewDM, setShowNewDM] = useState(false);
  const [targetEmail, setTargetEmail] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const fetchThreads = async () => {
      if (!currentProject?.id) {
        setLoading(false);
        return;
      }
      try {
        const response = await apiClient.get<DMThread[]>(
          `/projects/${currentProject.id}/dm`
        );
        setThreads(Array.isArray(response.data) ? response.data : []);
      } catch {
        // No DMs yet
      } finally {
        setLoading(false);
      }
    };
    void fetchThreads();
  }, [currentProject?.id]);

  const handleOpenThread = (thread: DMThread) => {
    setSelectedTopicId(thread.id);
    navigate(`/workspace/chat/${currentProject?.id || ''}`);
  };

  const handleCreateDM = async () => {
    if (!targetEmail.trim() || !currentProject?.id) return;
    setCreating(true);
    try {
      const response = await apiClient.post<DMThread>(
        `/projects/${currentProject.id}/dm`,
        { target_email: targetEmail.trim() }
      );
      setThreads((prev) => [response.data, ...prev]);
      setTargetEmail('');
      setShowNewDM(false);
      handleOpenThread(response.data);
      toast.success('Чат создан');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Не удалось создать чат');
    } finally {
      setCreating(false);
    }
  };

  const filteredThreads = threads.filter((t) =>
    (t.user?.name || t.name || '').toLowerCase().includes(search.toLowerCase())
  );

  const formatTime = (ts?: string) => {
    if (!ts) return '';
    const date = new Date(ts);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    if (diff < 86400000) {
      return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
  };

  return (
    <div className="h-full flex flex-col">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Личные сообщения</h2>
              <p className="text-sm text-slate-400">
                {threads.length} {threads.length === 1 ? 'диалог' : 'диалогов'}
              </p>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowNewDM(!showNewDM)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm font-medium hover:from-blue-600 hover:to-purple-700 transition-all"
          >
            <Plus className="w-4 h-4" />
            Новый чат
          </motion.button>
        </div>

        {showNewDM && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mb-6 p-4 rounded-xl border border-white/10 bg-slate-900/60"
          >
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Email пользователя
            </label>
            <div className="flex gap-3">
              <input
                type="email"
                value={targetEmail}
                onChange={(e) => setTargetEmail(e.target.value)}
                placeholder="user@example.com"
                className="flex-1 px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleCreateDM}
                disabled={creating}
                className="px-5 py-2.5 rounded-lg bg-blue-500 text-white text-sm font-medium hover:bg-blue-600 transition-all disabled:opacity-50"
              >
                {creating ? 'Создаем...' : 'Создать'}
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск диалогов..."
            className="w-full pl-11 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
          />
        </div>
      </motion.div>

      {/* Thread list */}
      <div className="flex-1 overflow-y-auto px-6">
        {loading ? (
          <div className="text-sm text-slate-400">Загрузка...</div>
        ) : filteredThreads.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
              <MessageSquare className="w-8 h-8 text-slate-600" />
            </div>
            <p className="text-slate-400 mb-2">Нет диалогов</p>
            <p className="text-sm text-slate-500">
              Начните новый чат, нажав кнопку выше
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredThreads.map((thread) => (
              <motion.button
                key={thread.id}
                whileHover={{ x: 3 }}
                onClick={() => handleOpenThread(thread)}
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/3 border border-white/5 hover:border-white/10 hover:bg-white/5 transition-all text-left"
              >
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center text-sm font-semibold text-white flex-shrink-0">
                  {(thread.user?.name || thread.name || '?').charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {thread.user?.name || thread.name}
                  </p>
                  {thread.user?.handle && (
                    <p className="text-xs text-slate-500">@{thread.user.handle}</p>
                  )}
                </div>
                {thread.last_message_at && (
                  <div className="flex items-center gap-1 text-xs text-slate-500 flex-shrink-0">
                    <Clock className="w-3 h-3" />
                    {formatTime(thread.last_message_at)}
                  </div>
                )}
              </motion.button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
