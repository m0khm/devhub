import { toast } from "sonner";
import {
  Send,
  Smile,
  Paperclip,
  ThumbsUp,
  Heart,
  Laugh,
  Zap,
  ClipboardList,
  Code2,
  Rocket,
  Bug,
  CheckCircle2,
  Hash,
  ChevronRight,
  PanelTopOpen,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";

import type { Message } from "../../../../shared/types";
import { apiClient } from "../../../../api/client";
import { wsClient } from "../../../../api/websocket";
import { useAuthStore } from "../../../../store/authStore";

type ReactionButton = {
  emoji: string;
  icon: React.ComponentType<{ className?: string }>;
};

const topicRelatedConfig: Record<string, { icon: React.ElementType; label: string; path: string }> = {
  planning: { icon: ClipboardList, label: 'Планирование', path: '/workspace/kanban' },
  code: { icon: Code2, label: 'Код', path: '/workspace/code' },
  deploy: { icon: Rocket, label: 'Деплой', path: '/workspace/deploy' },
  bugs: { icon: Bug, label: 'Баг-трекер', path: '/workspace/tests' },
  tests: { icon: CheckCircle2, label: 'Тесты', path: '/workspace/tests' },
  custom: { icon: Hash, label: 'Подробнее', path: '' },
};

export function ChatView() {
  const navigate = useNavigate();
  const { currentTopic, currentProject } =
    useOutletContext<WorkspaceOutletContext>() ?? ({} as any);
  const topicId = currentTopic?.id ? String(currentTopic.id) : undefined;
  const { token, user: currentUser } = useAuthStore();

  const [message, setMessage] = useState("");
  const [hoveredMessage, setHoveredMessage] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRelated, setShowRelated] = useState(false);

  const relatedConfig = currentTopic?.type ? topicRelatedConfig[currentTopic.type] : null;
  const projectSuffix = currentProject?.id ? `/${currentProject.id}` : '';

  const reactions = [
    { icon: ThumbsUp, emoji: '👍' },
    { icon: Heart, emoji: '❤️' },
    { icon: Laugh, emoji: '😂' },
    { icon: Zap, emoji: '⚡' },
  ];

  const messageMap = useMemo(
    () => new Map(messages.map((item) => [item.id, item])),
    [messages]
  );

  const formatTime = (timestamp: string) =>
    new Date(timestamp).toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
    });

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const mergeMessage = (item: Message) => {
    setMessages((prev) => {
      const existing = prev.find((msg) => msg.id === item.id);
      if (existing) {
        return prev.map((msg) => (msg.id === item.id ? { ...msg, ...item } : msg));
      }
      return [...prev, item];
    });
  };

  useEffect(() => {
    const fetchMessages = async () => {
      if (!topicId) {
        setMessages([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await apiClient.get<Message[]>(
          `/topics/${topicId}/messages?limit=50`
        );
        const list = Array.isArray(response.data) ? response.data : [];
        setMessages(list.reverse());
      } catch {
        toast.error('Не удалось загрузить сообщения');
      } finally {
        setLoading(false);
      }
    };

    void fetchMessages();

    try {
      wsClient.connect(String(topicId), String(token), {});
      wsClient.subscribe(`topic:${topicId}`, (payload: any) => {
        if (payload?.type === "message_created" && payload?.message) {
          mergeMessage(payload.message as Message);
}
        if (
          payload?.type === "message_reactions_updated" &&
          payload?.message_id
        ) {
          setMessages((prev) =>
            prev.map((m: any) =>
              m.id === payload.message_id
                ? ({ ...m, reactions: payload.reactions } as any)
                : m,
            ),
          );
        }
      });
    } catch {
      // ignore ws failures
    }

    return () => {
      try {
        wsClient.disconnect();
      } catch {
        // ignore
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topicId, token]);

  const handleSend = async () => {
    if (!topicId || !message.trim()) return;

    try {
      await apiClient.post(`/topics/${topicId}/messages`, {
        content: message,
        type: "text",
      });
      setMessage("");
    } catch {
      toast.error("Не удалось отправить сообщение");
    }
  };

  const addReaction = async (messageId: string, emoji: string) => {
    if (!messageId) return;
    try {
      await apiClient.post(`/messages/${messageId}/reactions`, { emoji });
    } catch {
      toast.error("Не удалось добавить реакцию");
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Topic header with related content button */}
      {currentTopic && (
        <div className="flex items-center justify-between px-6 py-3 border-b border-white/5 bg-slate-900/30 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-white">{currentTopic.name}</span>
            {currentTopic.description && (
              <span className="text-xs text-slate-500 hidden sm:inline">
                {currentTopic.description}
              </span>
            )}
          </div>
          {relatedConfig && relatedConfig.path && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate(`${relatedConfig.path}${projectSuffix}`)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs font-medium text-slate-300 hover:bg-white/10 hover:text-white transition-all"
            >
              <relatedConfig.icon className="w-3.5 h-3.5" />
              {relatedConfig.label}
              <ChevronRight className="w-3 h-3" />
            </motion.button>
          )}
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="text-slate-400">Загрузка...</div>
        ) : messages.length === 0 ? (
          <div className="text-slate-400">Сообщений пока нет</div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {messages.map((msg: any) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="group"
                  onMouseEnter={() => setHoveredMessage(String(msg.id))}
                  onMouseLeave={() => setHoveredMessage(null)}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-sm font-semibold">
                      {(msg.user?.name || currentUser?.name || "?")
                        .trim()
                        .charAt(0)
                        .toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white">
                          {msg.user?.name ||
                            currentUser?.name ||
                            "Пользователь"}
                        </span>
                        <span className="text-xs text-slate-500">
                          {msg.created_at
                            ? new Date(msg.created_at).toLocaleTimeString(
                                "ru-RU",
                                {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                },
                              )
                            : ""}
                        </span>
                      </div>
                      <div className="text-slate-200 whitespace-pre-wrap">
                        {msg.content || msg.text || ""}
                      </div>

                      {hoveredMessage === String(msg.id) && (
                        <div className="mt-2 flex items-center gap-2">
                          {reactions.map((r, idx) => (
                            <button
                              key={idx}
                              onClick={() =>
                                addReaction(String(msg.id), r.emoji)
                              }
                              className="p-1.5 bg-slate-800/80 backdrop-blur-sm border border-white/10 rounded-lg hover:bg-slate-700/80 transition-all"
                              type="button"
                            >
                              <r.icon className="w-4 h-4 text-slate-400" />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="p-6 border-t border-white/5 bg-slate-900/50 backdrop-blur-xl"
      >
        <div className="relative">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Введите сообщение... (Shift+Enter для новой строки)"
            rows={1}
            className="w-full px-4 py-3 pr-32 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all resize-none"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void handleSend();
              }
            }}
          />
          <div className="absolute right-2 bottom-2 flex items-center gap-1">
            <button
              type="button"
              onClick={() => toast("😊 Эмодзи picker coming soon!")}
              className="p-2 rounded-lg hover:bg-white/10 transition-all"
            >
              <Smile className="w-5 h-5 text-slate-400" />
            </button>
            <button
              type="button"
              onClick={() => toast.info("📎 Прикрепление файлов")}
              className="p-2 rounded-lg hover:bg-white/10 transition-all"
            >
              <Paperclip className="w-5 h-5 text-slate-400" />
            </button>
            <button
              type="button"
              onClick={() => void handleSend()}
              className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 transition-all shadow-lg"
            >
              <Send className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
        <p className="text-xs text-slate-500 mt-2">
          Shift+Enter для новой строки • Enter для отправки
        </p>
      </motion.div>
    </div>
  );
}
