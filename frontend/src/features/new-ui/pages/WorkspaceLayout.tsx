import { motion, AnimatePresence } from 'motion/react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  MessageSquare,
  Hash,
  Code,
  Settings,
  Plus,
  Search,
  Bell,
  Moon,
  LogOut,
  ChevronDown,
  Users,
  Sparkles,
  LayoutDashboard,
  Calendar,
  FolderOpen,
  Zap,
  Crown,
  Gift,
  Sun,
} from 'lucide-react';
import { Toaster, toast } from 'sonner';
import { apiClient } from '../../../api/client';
import { useProjectStore } from '../../../store/projectStore';
import type { Project } from '../../../shared/types';

const topics = [
  { id: 1, name: 'General', subtitle: 'Обсуждение', icon: MessageSquare, path: '/workspace/chat' },
  { id: 2, name: 'planning', subtitle: 'Планирование', icon: Hash, path: '/workspace/chat' },
  { id: 3, name: 'Code', subtitle: 'Код', icon: Code, path: '/workspace/chat' },
  { id: 4, name: 'custom', subtitle: 'Кастомный', icon: Hash, path: '/workspace/chat' },
];

export function WorkspaceLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [showProfile, setShowProfile] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { projects, currentProject, setProjects, setCurrentProject } = useProjectStore();

  const loadProjects = useCallback(async () => {
    try {
      const response = await apiClient.get<Project[]>('/projects');
      const fetchedProjects = Array.isArray(response.data) ? response.data : [];
      setProjects(fetchedProjects);
      if (fetchedProjects.length === 0) {
        navigate('/onboarding');
        return;
      }
      if (!currentProject) {
        setCurrentProject(fetchedProjects[0]);
      }
    } catch (error) {
      toast.error('Не удалось загрузить проекты');
    }
  }, [currentProject, navigate, setCurrentProject, setProjects]);

  useEffect(() => {
    if (projects.length === 0) {
      void loadProjects();
    }
  }, [loadProjects, projects.length]);

  const workspaceName = currentProject?.name ?? 'My Workspace';
  const workspaceInitial = useMemo(() => workspaceName.charAt(0).toUpperCase(), [workspaceName]);

  const navItems = [
    { icon: MessageSquare, label: 'Чаты', path: '/workspace/chat', badge: 3 },
    { icon: LayoutDashboard, label: 'Дашборд', path: '/workspace/dashboard', gradient: 'from-purple-500 to-pink-500' },
    { icon: Users, label: 'Канбан', path: '/workspace/kanban', gradient: 'from-blue-500 to-cyan-500' },
    { icon: Calendar, label: 'Календарь', path: '/workspace/calendar', gradient: 'from-orange-500 to-red-500' },
    { icon: FolderOpen, label: 'Файлы', path: '/workspace/files', gradient: 'from-green-500 to-emerald-500' },
  ];

  return (
    <div className="h-screen flex bg-[#0a0e1a] text-white overflow-hidden">
      <Toaster theme="dark" position="bottom-right" />

      {/* Sidebar */}
      <motion.div
        initial={{ x: -300, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="w-72 bg-gradient-to-b from-slate-900/80 to-slate-950/80 backdrop-blur-xl border-r border-white/5 flex flex-col relative overflow-hidden"
      >
        {/* Animated background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
          <div className="absolute top-0 left-0 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>

        <div className="relative z-10 flex flex-col h-full">
          {/* Workspace Header */}
          <div className="p-4 border-b border-white/5">
            <button className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-all group">
              <div className="flex items-center gap-3">
                <motion.div 
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.6 }}
                  className="relative"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg blur-md opacity-70"></div>
                  <div className="relative w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center font-bold shadow-lg">
                    {workspaceInitial}
                  </div>
                </motion.div>
                <div className="text-left">
                  <div className="font-semibold text-white flex items-center gap-2">
                    {workspaceName}
                    <Crown className="w-3 h-3 text-yellow-400" />
                  </div>
                  <div className="text-xs text-slate-400">Premium plan</div>
                </div>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" />
            </button>
          </div>

          {/* Main Navigation */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-1 mb-6">
              {navItems.map((item, index) => {
                const isActive = location.pathname === item.path;
                return (
                  <motion.button
                    key={item.path}
                    onClick={() => {
                      navigate(item.path);
                      toast.success(`Переход в ${item.label}`);
                    }}
                    whileHover={{ x: 5, scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group relative overflow-hidden ${
                      isActive
                        ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-white border border-blue-500/30'
                        : 'text-slate-300 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    {item.gradient && !isActive && (
                      <div className={`absolute inset-0 bg-gradient-to-r ${item.gradient} opacity-0 group-hover:opacity-10 transition-opacity`}></div>
                    )}
                    <item.icon className="w-5 h-5 relative z-10" />
                    <span className="font-medium relative z-10">{item.label}</span>
                    {item.badge && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="ml-auto px-2 py-0.5 bg-red-500 text-white text-xs rounded-full font-semibold relative z-10"
                      >
                        {item.badge}
                      </motion.span>
                    )}
                    <Sparkles className="w-4 h-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity relative z-10" />
                  </motion.button>
                );
              })}

              <motion.button
                onClick={() => navigate('/hub')}
                whileHover={{ x: 5, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-300 hover:bg-gradient-to-r hover:from-cyan-500/10 hover:to-blue-500/10 hover:text-cyan-400 transition-all group relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-500 opacity-0 group-hover:opacity-10 transition-opacity"></div>
                <Users className="w-5 h-5 relative z-10" />
                <span className="font-medium relative z-10">Hub</span>
                <Zap className="w-4 h-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity relative z-10 text-cyan-400" />
              </motion.button>
            </div>

            {/* Topics */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3 px-2">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Темы
                </span>
                <motion.button
                  whileHover={{ rotate: 90, scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => {
                    setShowCreateModal(true);
                    toast.info('Создание новой темы');
                  }}
                  className="p-1 rounded hover:bg-white/5 transition-colors"
                >
                  <Plus className="w-4 h-4 text-slate-400" />
                </motion.button>
              </div>
              <div className="space-y-1">
                {topics.map((topic, index) => (
                  <motion.button
                    key={topic.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ x: 5 }}
                    onClick={() => navigate(topic.path)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-300 hover:bg-white/5 hover:text-white transition-all group"
                  >
                    <topic.icon className="w-5 h-5" />
                    <div className="text-left flex-1">
                      <div className="font-medium text-sm">{topic.name}</div>
                      <div className="text-xs text-slate-500">{topic.subtitle}</div>
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="space-y-2 mb-4">
              <div className="px-2 mb-2">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Быстрые действия
                </span>
              </div>
              <motion.button
                whileHover={{ scale: 1.02, boxShadow: '0 0 20px rgba(59, 130, 246, 0.3)' }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  toast.success('Новый проект создан! 🎉', {
                    description: 'Пригласите участников команды',
                  });
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 transition-all shadow-lg shadow-blue-500/20"
              >
                <Plus className="w-5 h-5" />
                <span className="font-medium">Создать проект</span>
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => toast('🎁 Пригласи друга и получи бонусы!')}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/30 text-orange-400 hover:bg-gradient-to-r hover:from-orange-500/20 hover:to-red-500/20 transition-all"
              >
                <Gift className="w-5 h-5" />
                <span className="font-medium">Пригласить друга</span>
              </motion.button>
            </div>
          </div>

          {/* Bottom actions */}
          <div className="p-4 border-t border-white/5 space-y-2">
            <motion.button
              whileHover={{ x: 5 }}
              onClick={() => navigate('/workspace/chat')}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/5 text-slate-300 hover:text-white transition-all"
            >
              <MessageSquare className="w-5 h-5" />
              <span className="font-medium">Сообщения</span>
            </motion.button>
            <motion.button
              whileHover={{ x: 5 }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/5 text-slate-300 hover:text-white transition-all"
            >
              <Settings className="w-5 h-5" />
              <span className="font-medium">Настройки</span>
            </motion.button>
          </div>

          {/* User profile */}
          <div className="p-4 border-t border-white/5">
            <div className="relative">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowProfile(!showProfile)}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-all"
              >
                <div className="relative">
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute inset-0 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full blur-md opacity-50"
                  ></motion.div>
                  <div className="relative w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center font-bold">
                    М
                  </div>
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-slate-900 rounded-full"></div>
                </div>
                <div className="text-left flex-1">
                  <div className="font-semibold text-white">Максим</div>
                  <div className="text-xs text-green-400">● В сети</div>
                </div>
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </motion.button>

              <AnimatePresence>
                {showProfile && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute bottom-full left-0 right-0 mb-2 bg-slate-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden"
                  >
                    <button
                      onClick={() => setDarkMode(!darkMode)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-all text-left"
                    >
                      {darkMode ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                      <span>Переключить тему</span>
                    </button>
                    <button className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-all text-left">
                      <Settings className="w-4 h-4" />
                      <span>Настройки</span>
                    </button>
                    <button
                      onClick={() => {
                        navigate('/');
                        toast.success('Вы вышли из аккаунта');
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-500/10 text-red-400 transition-all text-left border-t border-white/5"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Выйти</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Header */}
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="h-16 border-b border-white/5 flex items-center justify-between px-6 bg-slate-900/50 backdrop-blur-xl relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-pink-500/5"></div>
          
          <div className="flex items-center gap-4 relative z-10">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Поиск..."
                className="w-64 pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 relative z-10">
            <motion.button
              whileHover={{ scale: 1.1, rotate: 15 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => toast.info('🔔 У вас новое уведомление!')}
              className="p-2 rounded-lg hover:bg-white/5 transition-all relative"
            >
              <Bell className="w-5 h-5 text-slate-400" />
              <motion.span
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
                className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"
              ></motion.span>
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9, rotate: -180 }}
              onClick={() => {
                setDarkMode(!darkMode);
                toast.success(darkMode ? '☀️ Светлая тема' : '🌙 Темная тема');
              }}
              className="p-2 rounded-lg hover:bg-white/5 transition-all"
            >
              <Moon className="w-5 h-5 text-slate-400" />
            </motion.button>
          </div>
        </motion.div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden">
          <Outlet />
        </div>
      </div>

      {/* Create Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6"
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-slate-900 border border-white/10 rounded-2xl p-6 shadow-2xl"
            >
              <h3 className="text-2xl font-bold text-white mb-4">Создать новую тему</h3>
              <input
                type="text"
                placeholder="Название темы"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 mb-4"
              />
              <textarea
                placeholder="Описание (опционально)"
                rows={3}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 mb-4 resize-none"
              ></textarea>
              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setShowCreateModal(false);
                    toast.success('Тема создана! 🎉');
                  }}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-600 hover:to-purple-700 transition-all"
                >
                  Создать
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowCreateModal(false)}
                  className="px-6 py-3 bg-white/5 border border-white/10 text-white rounded-lg font-semibold hover:bg-white/10 transition-all"
                >
                  Отмена
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
