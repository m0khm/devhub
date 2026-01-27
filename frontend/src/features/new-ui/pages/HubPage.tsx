import { motion } from 'motion/react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ArrowLeft, Users, Briefcase, Globe, Plus } from 'lucide-react';

export function HubPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'people' | 'groups' | 'communities'>('people');

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
                  Поиск людей, групп и сообществ
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
              { id: 'people', label: 'Люди', count: 0 },
              { id: 'groups', label: 'Группы', count: 0 },
              { id: 'communities', label: 'Сообщества', count: 0 },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`px-6 py-3 font-medium transition-all relative ${
                  activeTab === tab.id
                    ? 'text-white'
                    : 'text-slate-400 hover:text-slate-300'
                }`}
              >
                {tab.label}: {tab.count}
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
              className="p-8 rounded-2xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 cursor-pointer group"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Users className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                Обновить профиль
              </h3>
              <p className="text-slate-300">
                Создайте групп и сообщества, чтобы расширить сеть вашей команды и подключить новые проекты
              </p>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
