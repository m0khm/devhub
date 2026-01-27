import { motion, AnimatePresence } from 'motion/react';
import { useState } from 'react';
import { Send, Smile, Paperclip, Hash, ThumbsUp, Heart, Laugh, Zap } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

const messages = [
  {
    id: 1,
    user: 'Алексей К.',
    avatar: 'AK',
    time: '14:23',
    text: 'Привет! Кто-нибудь проверял последний коммит?',
    reactions: [{ emoji: '👍', count: 2 }],
  },
  {
    id: 2,
    user: 'Мария С.',
    avatar: 'MC',
    time: '14:25',
    text: 'Да, я посмотрела. Всё работает отлично! 🚀',
    reactions: [{ emoji: '❤️', count: 3 }, { emoji: '🔥', count: 1 }],
  },
  {
    id: 3,
    user: 'Дмитрий В.',
    avatar: 'ДВ',
    time: '14:27',
    text: 'Отлично! Можем двигаться дальше с новым спринтом.',
    reactions: [{ emoji: '⚡', count: 1 }],
  },
];

export function ChatView() {
  const [message, setMessage] = useState('');
  const [hoveredMessage, setHoveredMessage] = useState<number | null>(null);
  const [localMessages, setLocalMessages] = useState(messages);

  const reactions = [
    { icon: ThumbsUp, emoji: '👍' },
    { icon: Heart, emoji: '❤️' },
    { icon: Laugh, emoji: '😂' },
    { icon: Zap, emoji: '⚡' },
  ];

  const handleSend = () => {
    if (message.trim()) {
      const newMessage = {
        id: localMessages.length + 1,
        user: 'Максим',
        avatar: 'М',
        time: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
        text: message,
        reactions: [],
      };
      setLocalMessages([...localMessages, newMessage]);
      setMessage('');
      toast.success('Сообщение отправлено!');
    }
  };

  const addReaction = (messageId: number, emoji: string) => {
    setLocalMessages(prev => prev.map(msg => {
      if (msg.id === messageId) {
        const existingReaction = msg.reactions.find(r => r.emoji === emoji);
        if (existingReaction) {
          return {
            ...msg,
            reactions: msg.reactions.map(r =>
              r.emoji === emoji ? { ...r, count: r.count + 1 } : r
            ),
          };
        }
        return {
          ...msg,
          reactions: [...msg.reactions, { emoji, count: 1 }],
        };
      }
      return msg;
    }));
    toast.success(`Реакция ${emoji} добавлена!`);
  };

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
            <div className="font-semibold text-white text-lg">custom</div>
            <div className="text-sm text-slate-400">Кастомный топик • 3 участника онлайн</div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="space-y-6 max-w-4xl">
          <AnimatePresence>
            {localMessages.map((msg, index) => (
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
                  {msg.avatar}
                </motion.div>
                <div className="flex-1">
                  <div className="flex items-baseline gap-3 mb-1">
                    <span className="font-semibold text-white">{msg.user}</span>
                    <span className="text-xs text-slate-500">{msg.time}</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed mb-2">{msg.text}</p>
                  
                  {/* Reactions */}
                  {msg.reactions.length > 0 && (
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
            ))}
          </AnimatePresence>
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
                onClick={() => toast.info('📎 Прикрепление файлов')}
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
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Shift+Enter для новой строки • Enter для отправки
          </p>
        </div>
      </motion.div>
    </div>
  );
}
