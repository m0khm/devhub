import { motion, AnimatePresence } from 'motion/react';
import { useEffect, useMemo, useState } from 'react';
import { Send, Smile, Paperclip, Hash, ThumbsUp, Heart, Laugh, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { useOutletContext } from 'react-router-dom';
import { apiClient } from '../../../../api/client';
import type { Message, ReactionGroup } from '../../../../shared/types';
import type { WorkspaceOutletContext } from '../../pages/WorkspaceLayout';

const formatTime = (value?: string) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
};

const getInitials = (name?: string) => {
  if (!name) return 'U';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? 'U';
  return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase();
};

const parseFileMetadata = (metadata: Message['metadata']): FileMetadata => {
  if (!metadata) return {};
  if (typeof metadata === 'string') {
    try {
      return JSON.parse(metadata) as FileMetadata;
    } catch {
      return {};
    }
  }
  return metadata as FileMetadata;
};

const getInitials = (name: string) =>
  name
    .split(' ')
    .map((part) => part.charAt(0))
    .join('')
    .slice(0, 2)
    .toUpperCase();

export function ChatView() {
  const { currentTopic, topicsLoading, user } = useOutletContext<WorkspaceOutletContext>();
  const [message, setMessage] = useState('');
  const [hoveredMessage, setHoveredMessage] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);

  const reactions = useMemo(
    () => [
      { icon: ThumbsUp, emoji: '👍' },
      { icon: Heart, emoji: '❤️' },
      { icon: Laugh, emoji: '😂' },
      { icon: Zap, emoji: '⚡' },
    ],
    []
  );

  useEffect(() => {
    if (!currentTopic) {
      setMessages([]);
      return;
    }

    const loadMessages = async () => {
      setMessagesLoading(true);
      try {
        const response = await apiClient.get<Message[]>(
          `/topics/${currentTopic.id}/messages`,
          { params: { limit: 50 } }
        );
        const data = Array.isArray(response.data) ? response.data : [];
        const sorted = [...data].sort(
          (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
        setMessages(sorted);
      } catch (error) {
        toast.error('Не удалось загрузить сообщения');
      } finally {
        setMessagesLoading(false);
      }
    };

    void loadMessages();
  }, [currentTopic?.id]);

  const handleSend = async () => {
    if (!message.trim() || !currentTopic) {
      return;
    }

    try {
      const response = await apiClient.post<Message>(
        `/topics/${currentTopic.id}/messages`,
        { content: message.trim(), type: 'text' }
      );
      setMessages((prev) => [...prev, response.data]);
      setMessage('');
    } catch (error) {
      toast.error('Не удалось отправить сообщение');
    }
  };

  const addReaction = async (messageId: string, emoji: string) => {
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.id !== messageId) return msg;
        const reactionsList = msg.reactions ?? [];
        const existing = reactionsList.find((reaction) => reaction.emoji === emoji);
        const updated: ReactionGroup[] = existing
          ? reactionsList.map((reaction) =>
              reaction.emoji === emoji
                ? {
                    ...reaction,
                    count: reaction.count + 1,
                    has_self: true,
                    users: reaction.users ?? [],
                  }
                : reaction
            )
          : [
              ...reactionsList,
              { emoji, count: 1, users: user?.id ? [user.id] : [], has_self: true },
            ];
        return { ...msg, reactions: updated };
      })
    );

    try {
      await apiClient.post(`/messages/${messageId}/reactions`, { emoji });
    } catch (error) {
      toast.error('Не удалось добавить реакцию');
    }
  };

  if (topicsLoading) {
    return (
      <div className="h-full flex items-center justify-center text-slate-400">
        Загрузка чатов...
      </div>
    );
  }

  if (!currentTopic) {
    return (
      <div className="h-full flex items-center justify-center text-slate-500">
        Выберите тему, чтобы начать общение.
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Chat Header */}
      <div className="px-6 py-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <motion.div
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg"
          >
            <Hash className="w-5 h-5 text-white" />
          </motion.div>
          <div>
            <div className="font-semibold text-white text-lg">{currentTopic.name}</div>
            <div className="text-sm text-slate-400">
              {currentTopic.description || 'Обсуждение команды'}
            </div>
          </div>
          {currentTopic && <VideoCallButton topicId={currentTopic.id} />}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6">
        {loading && (
          <div className="text-slate-400 text-sm">Загрузка сообщений...</div>
        )}
        {!loading && messages.length === 0 && (
          <div className="text-slate-400 text-sm">Сообщений пока нет</div>
        )}
        <div className="space-y-6 max-w-4xl">
          {messagesLoading ? (
            <div className="text-slate-400">Загрузка сообщений...</div>
          ) : messages.length === 0 ? (
            <div className="text-slate-500">Пока нет сообщений. Напишите первым!</div>
          ) : (
            <AnimatePresence>
              {messages.map((msg, index) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex gap-4 group relative"
                  onMouseEnter={() => setHoveredMessage(msg.id)}
                  onMouseLeave={() => setHoveredMessage(null)}
                >
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center font-semibold text-sm flex-shrink-0 shadow-lg"
                  >
                    {getInitials(msg.user?.name)}
                  </motion.div>
                  <div className="flex-1">
                    <div className="flex items-baseline gap-3 mb-1">
                      <span className="font-semibold text-white">{msg.user?.name ?? 'Участник'}</span>
                      <span className="text-xs text-slate-500">{formatTime(msg.created_at)}</span>
                    </div>
                    <p className="text-slate-300 leading-relaxed mb-2">{msg.content}</p>
                    
                    {/* Reactions */}
                    {(msg.reactions?.length ?? 0) > 0 && (
                      <div className="flex gap-2 mb-2">
                        {msg.reactions?.map((reaction, idx) => (
                          <motion.button
                            key={`${reaction.emoji}-${idx}`}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => addReaction(msg.id, reaction.emoji)}
                            className="px-2 py-1 bg-white/5 border border-white/10 rounded-full text-xs flex items-center gap-1 hover:bg-white/10 transition-all"
                          >
                            <span>{reaction.emoji}</span>
                            <span className="text-slate-400">{reaction.count}</span>
                          </motion.button>
                        ))}
                      </div>
                    )}

                    {/* Quick reactions on hover */}
                    <AnimatePresence>
                      {hoveredMessage === msg.id && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="flex gap-1 mt-2"
                        >
                          {reactions.map((reaction, idx) => (
                            <motion.button
                              key={idx}
                              whileHover={{ scale: 1.2 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => addReaction(msg.id, reaction.emoji)}
                              className="p-1.5 bg-slate-800/80 backdrop-blur-sm border border-white/10 rounded-lg hover:bg-slate-700/80 transition-all"
                            >
                              <reaction.icon className="w-4 h-4 text-slate-400" />
                            </motion.button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </div>

      {/* Input */}
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="p-6 border-t border-white/5 bg-slate-900/50 backdrop-blur-xl"
      >
        <div className="max-w-4xl">
          <div className="relative">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Введите сообщение... (Shift+Enter для новой строки)"
              rows={1}
              className="w-full px-4 py-3 pr-32 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all resize-none"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  void handleSend();
                }
              }}
            />
            <div className="absolute right-2 bottom-2 flex items-center gap-1">
              <motion.button
                whileHover={{ scale: 1.1, rotate: 15 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => toast('😊 Эмодзи picker coming soon!')}
                className="p-2 rounded-lg hover:bg-white/10 transition-all"
              >
                <Smile className="w-5 h-5 text-slate-400" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.1, rotate: -15 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => fileInputRef.current?.click()}
                className="p-2 rounded-lg hover:bg-white/10 transition-all"
              >
                <Paperclip className="w-5 h-5 text-slate-400" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: '0 0 20px rgba(59, 130, 246, 0.6)' }}
                whileTap={{ scale: 0.95 }}
                onClick={() => void handleSend()}
                className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 transition-all shadow-lg"
              >
                <Send className="w-5 h-5 text-white" />
              </motion.button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) {
                  handleFileUpload(file);
                }
                event.currentTarget.value = '';
              }}
            />
          </div>
        </div>
      </motion.div>
    </div>
  );
}
