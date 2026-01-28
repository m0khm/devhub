import { motion, AnimatePresence } from 'motion/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Send, Smile, Paperclip, Hash, ThumbsUp, Heart, Laugh, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { apiClient } from '../../../../api/client';
import { wsClient } from '../../../../api/websocket';
import { useAuthStore } from '../../../../store/authStore';
import { useProjectStore } from '../../../../store/projectStore';
import type { FileMetadata, Message } from '../../../../shared/types';
import { VideoCallButton } from '../../../video/components/VideoCallButton';

const reactions = [
  { icon: ThumbsUp, emoji: '👍' },
  { icon: Heart, emoji: '❤️' },
  { icon: Laugh, emoji: '😂' },
  { icon: Zap, emoji: '⚡' },
];

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
  const { topicId } = useParams();
  const navigate = useNavigate();
  const { token } = useAuthStore();
  const { currentTopics } = useProjectStore();
  const [message, setMessage] = useState('');
  const [hoveredMessage, setHoveredMessage] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currentTopic = useMemo(() => {
    if (topicId) {
      return currentTopics.find((topic) => topic.id === topicId) ?? null;
    }
    return currentTopics[0] ?? null;
  }, [currentTopics, topicId]);

  useEffect(() => {
    if (!topicId && currentTopic) {
      navigate(`/workspace/chat/${currentTopic.id}`, { replace: true });
    }
  }, [currentTopic, navigate, topicId]);

  useEffect(() => {
    const loadMessages = async () => {
      if (!currentTopic) return;
      try {
        setLoading(true);
        const response = await apiClient.get<Message[]>(
          `/topics/${currentTopic.id}/messages?limit=50`
        );
        const list = Array.isArray(response.data) ? response.data : [];
        setMessages(list.reverse());
      } catch (error) {
        toast.error('Не удалось загрузить сообщения');
      } finally {
        setLoading(false);
      }
    };

    loadMessages();
  }, [currentTopic]);

  useEffect(() => {
    if (!currentTopic || !token) return;

    wsClient.connect(currentTopic.id, token, {
      onNewMessage: (payload) => {
        setMessages((prev) => [...prev, payload.message]);
      },
      onMessageUpdated: (payload) => {
        setMessages((prev) =>
          prev.map((msg) => (msg.id === payload.message.id ? payload.message : msg))
        );
      },
      onMessageDeleted: (payload) => {
        setMessages((prev) => prev.filter((msg) => msg.id !== payload.message_id));
      },
      onReactionUpdated: (payload) => {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === payload.message_id ? { ...msg, reactions: payload.reactions } : msg
          )
        );
      },
    });

    return () => {
      wsClient.disconnect();
    };
  }, [currentTopic, token]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!message.trim() || !currentTopic) return;
    try {
      await apiClient.post(`/topics/${currentTopic.id}/messages`, {
        content: message.trim(),
        type: 'text',
      });
      setMessage('');
    } catch (error) {
      toast.error('Не удалось отправить сообщение');
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!currentTopic) return;
    const formData = new FormData();
    formData.append('file', file);
    try {
      await apiClient.post(`/topics/${currentTopic.id}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Файл загружен');
    } catch (error) {
      toast.error('Не удалось загрузить файл');
    }
  };

  const addReaction = async (messageId: string, emoji: string) => {
    try {
      await apiClient.post(`/messages/${messageId}/reactions`, { emoji });
    } catch (error) {
      toast.error('Не удалось добавить реакцию');
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Chat Header */}
      <div className="px-6 py-4 border-b border-white/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
              className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg"
            >
              <Hash className="w-5 h-5 text-white" />
            </motion.div>
            <div>
              <div className="font-semibold text-white text-lg">{currentTopic?.name ?? 'Чат'}</div>
              <div className="text-sm text-slate-400">
                {currentTopic ? `Тема • ${currentTopic.type}` : 'Выберите тему'}
              </div>
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
          <AnimatePresence>
            {messages.map((msg, index) => {
              const authorName = msg.user?.name || 'Unknown';
              const fileMeta = msg.type === 'file' ? parseFileMetadata(msg.metadata) : null;
              return (
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
                    {getInitials(authorName)}
                  </motion.div>
                  <div className="flex-1">
                    <div className="flex items-baseline gap-3 mb-1">
                      <span className="font-semibold text-white">{authorName}</span>
                      <span className="text-xs text-slate-500">
                        {new Date(msg.created_at).toLocaleTimeString('ru-RU', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    {msg.type === 'file' && fileMeta ? (
                      <div className="rounded-xl border border-white/10 bg-slate-900/50 p-3 text-sm text-slate-200">
                        <div className="font-medium">{fileMeta.filename ?? 'Файл'}</div>
                        {fileMeta.size && (
                          <div className="text-xs text-slate-400">
                            {(fileMeta.size / 1024 / 1024).toFixed(2)} MB
                          </div>
                        )}
                        <button
                          className="mt-2 text-xs text-blue-400 hover:text-blue-300"
                          onClick={() => {
                            const url = fileMeta.url || `/api/files/${msg.id}/download`;
                            window.open(url, '_blank');
                          }}
                        >
                          Скачать
                        </button>
                      </div>
                    ) : (
                      <p className="text-slate-300 leading-relaxed mb-2">{msg.content}</p>
                    )}

                    {/* Reactions */}
                    {msg.reactions && msg.reactions.length > 0 && (
                      <div className="flex gap-2 mb-2">
                        {msg.reactions.map((reaction, idx) => (
                          <motion.button
                            key={idx}
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
              );
            })}
          </AnimatePresence>
          <div ref={messagesEndRef} />
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
                  handleSend();
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
                onClick={handleSend}
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
