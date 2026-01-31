import { motion, AnimatePresence } from 'motion/react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  ArrowLeft,
  Users,
  Briefcase,
  Globe,
  Plus,
  Radio,
  Hash,
  X,
  Lock,
  Eye,
  Megaphone,
} from 'lucide-react';
import { toast } from 'sonner';
import { apiClient } from '../../../api/client';

interface Channel {
  id: string;
  name: string;
  description: string;
  type: 'public' | 'private';
  members_count: number;
  created_at: string;
}

export function HubPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'people' | 'groups' | 'channels' | 'communities'>('people');
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [channelName, setChannelName] = useState('');
  const [channelDescription, setChannelDescription] = useState('');
  const [channelType, setChannelType] = useState<'public' | 'private'>('public');
  const [creatingChannel, setCreatingChannel] = useState(false);
  const [channels, setChannels] = useState<Channel[]>([]);

  const handleCreateChannel = async () => {
    if (!channelName.trim()) {
      toast.error('Введите название канала');
      return;
    }

    setCreatingChannel(true);
    try {
      const response = await apiClient.post<Channel>('/channels', {
        name: channelName.trim(),
        description: channelDescription.trim(),
        type: channelType,
      });
      setChannels((prev) => [response.data, ...prev]);
      setChannelName('');
      setChannelDescription('');
      setShowCreateChannel(false);
      toast.success('Канал создан!');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Не удалось создать канал');
    } finally {
      setCreatingChannel(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900">
      {/* Header */}
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sticky top-0 z-50 backdrop-blur-2xl bg-slate-950/50 border-b border-white/10"
      >
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center gap-6 mb-6">
            <motion.button
              whileHover={{ x: -5 }}
              onClick={() => navigate('/workspace')}
              className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Вернуться в рабочее пространство</span>
            </motion.button>
          </div>

          <div className="max-w-4xl">
            <div className="flex items-center gap-4 mb-6">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl blur-xl opacity-60"></div>
                <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <Globe className="w-8 h-8 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white mb-1">HUB</h1>
                <p className="text-lg text-slate-300">
                  Люди, каналы, группы и сообщества
                </p>
              </div>
            </div>

            {/* Search bar */}
            <div className="relative">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Например, дизайнеры, fintech, @anna"
                className="w-full pl-16 pr-6 py-5 bg-white/5 border border-white/10 rounded-2xl text-white text-lg placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all backdrop-blur-sm"
              />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Content */}
      <div className="container mx-auto px-6 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Tabs */}
          <div className="flex items-center gap-2 mb-8 border-b border-white/10">
            {[
              { id: 'people', label: 'Люди', icon: Users },
              { id: 'channels', label: 'Каналы', icon: Radio },
              { id: 'groups', label: 'Группы', icon: Briefcase },
              { id: 'communities', label: 'Сообщества', icon: Globe },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex items-center gap-2 px-6 py-3 font-medium transition-all relative ${
                  activeTab === tab.id
                    ? 'text-white'
                    : 'text-slate-400 hover:text-slate-300'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-600"
                  />
                )}
              </button>
            ))}
          </div>

          {/* People Section */}
          {activeTab === 'people' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="p-12 rounded-3xl bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm border border-white/10 text-center">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center mx-auto mb-6">
                  <Users className="w-10 h-10 text-blue-400" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">Люди</h3>
                <p className="text-slate-300 mb-6 max-w-md mx-auto">
                  Введите запрос, чтобы найти участников
                </p>
                <p className="text-sm text-slate-500">
                  Пока нет подходящих пользователей.
                </p>
              </div>
            </motion.div>
          )}

          {/* Channels Section */}
          {activeTab === 'channels' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {/* Create channel button */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-white">Каналы</h3>
                  <p className="text-sm text-slate-400">
                    Создавайте каналы для общения и публикаций, как в Telegram
                  </p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowCreateChannel(true)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm font-semibold hover:from-blue-600 hover:to-purple-700 transition-all shadow-lg shadow-blue-500/25"
                >
                  <Plus className="w-4 h-4" />
                  Создать канал
                </motion.button>
              </div>

              {channels.length === 0 ? (
                <div className="p-12 rounded-3xl bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm border border-white/10 text-center">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 flex items-center justify-center mx-auto mb-6">
                    <Radio className="w-10 h-10 text-emerald-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-3">Каналы</h3>
                  <p className="text-slate-300 mb-6 max-w-md mx-auto">
                    Создайте первый канал для общения команды, публикаций и новостей
                  </p>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowCreateChannel(true)}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold hover:from-blue-600 hover:to-purple-700 transition-all"
                  >
                    <Plus className="w-5 h-5" />
                    Создать первый канал
                  </motion.button>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {channels.map((channel) => (
                    <motion.div
                      key={channel.id}
                      whileHover={{ y: -3 }}
                      className="p-5 rounded-2xl border border-white/10 bg-slate-900/60 hover:border-white/20 transition-all cursor-pointer"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 flex items-center justify-center flex-shrink-0">
                          {channel.type === 'private' ? (
                            <Lock className="w-5 h-5 text-emerald-400" />
                          ) : (
                            <Hash className="w-5 h-5 text-emerald-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-white truncate">{channel.name}</h4>
                            {channel.type === 'private' && (
                              <Lock className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                            )}
                          </div>
                          <p className="text-sm text-slate-400 truncate mt-1">{channel.description}</p>
                          <p className="text-xs text-slate-500 mt-2">
                            {channel.members_count} участников
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* Groups Section */}
          {activeTab === 'groups' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="p-12 rounded-3xl bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm border border-white/10 text-center">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center mx-auto mb-6">
                  <Briefcase className="w-10 h-10 text-purple-400" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">Группы</h3>
                <p className="text-slate-300 mb-6 max-w-md mx-auto">
                  Команды внутри компании и проектные кружки
                </p>
                <p className="text-sm text-slate-500">
                  Пока нет подходящих групп.
                </p>
              </div>
            </motion.div>
          )}

          {/* Communities Section */}
          {activeTab === 'communities' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="p-12 rounded-3xl bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm border border-white/10 text-center">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center mx-auto mb-6">
                  <Globe className="w-10 h-10 text-cyan-400" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">Сообщества</h3>
                <p className="text-slate-300 mb-6 max-w-md mx-auto">
                  Экосистемы, партнерские сети и внешние сообщества
                </p>
                <p className="text-sm text-slate-500">
                  Пока нет подходящих сообществ.
                </p>
              </div>
            </motion.div>
          )}

          {/* Action cards */}
          <div className="grid md:grid-cols-2 gap-6 mt-8">
            <motion.div
              whileHover={{ scale: 1.02, y: -5 }}
              onClick={() => navigate('/workspace')}
              className="p-8 rounded-2xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20 cursor-pointer group"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Plus className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                Перейти в Workspace
              </h3>
              <p className="text-slate-300">
                Быстрый переход в рабочее пространство проектов
              </p>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02, y: -5 }}
              onClick={() => setShowCreateChannel(true)}
              className="p-8 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 border border-emerald-500/20 cursor-pointer group"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Megaphone className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                Создать канал
              </h3>
              <p className="text-slate-300">
                Публичный или приватный канал для общения и публикаций
              </p>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Create Channel Modal */}
      <AnimatePresence>
        {showCreateChannel && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6"
            onClick={() => setShowCreateChannel(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg bg-slate-900 border border-white/10 rounded-2xl p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-600 flex items-center justify-center">
                    <Radio className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white">Создать канал</h3>
                </div>
                <button
                  onClick={() => setShowCreateChannel(false)}
                  className="p-2 rounded-lg hover:bg-white/5 transition-colors"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Название канала
                  </label>
                  <input
                    type="text"
                    value={channelName}
                    onChange={(e) => setChannelName(e.target.value)}
                    placeholder="Например: Новости продукта"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Описание
                  </label>
                  <textarea
                    value={channelDescription}
                    onChange={(e) => setChannelDescription(e.target.value)}
                    placeholder="О чем этот канал?"
                    rows={3}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-3">
                    Тип канала
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setChannelType('public')}
                      className={`flex items-center gap-3 p-4 rounded-xl border transition-all ${
                        channelType === 'public'
                          ? 'border-blue-500/40 bg-blue-500/10'
                          : 'border-white/10 bg-white/5 hover:border-white/20'
                      }`}
                    >
                      <Eye className="w-5 h-5 text-blue-400" />
                      <div className="text-left">
                        <p className="text-sm font-medium text-white">Публичный</p>
                        <p className="text-xs text-slate-400">Виден всем</p>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setChannelType('private')}
                      className={`flex items-center gap-3 p-4 rounded-xl border transition-all ${
                        channelType === 'private'
                          ? 'border-purple-500/40 bg-purple-500/10'
                          : 'border-white/10 bg-white/5 hover:border-white/20'
                      }`}
                    >
                      <Lock className="w-5 h-5 text-purple-400" />
                      <div className="text-left">
                        <p className="text-sm font-medium text-white">Приватный</p>
                        <p className="text-xs text-slate-400">По приглашению</p>
                      </div>
                    </button>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleCreateChannel}
                    disabled={creatingChannel}
                    className="flex-1 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold hover:from-blue-600 hover:to-purple-700 transition-all disabled:opacity-50"
                  >
                    {creatingChannel ? 'Создаем...' : 'Создать канал'}
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowCreateChannel(false)}
                    className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-semibold hover:bg-white/10 transition-all"
                  >
                    Отмена
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
