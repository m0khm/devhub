import { motion, AnimatePresence } from 'motion/react';
import { useEffect, useMemo, useState } from 'react';
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
  Calendar,
  FolderOpen,
  Zap,
  Crown,
  Gift,
  Sun,
  MoreVertical,
  CheckCircle2,
} from 'lucide-react';
import { Toaster, toast } from 'sonner';
import { apiClient } from '../../../api/client';
import { useProjectStore } from '../../../store/projectStore';
import type { DirectMessageThread, Project, Topic } from '../../../shared/types';

type TopicTypeOption = 'chat' | 'planning' | 'tests' | 'deploy' | 'custom';

export interface WorkspaceOutletContext {
  currentProject: Project | null;
  topics: Topic[];
  currentTopic: Topic | null;
  directThreads: DirectMessageThread[];
  setSelectedTopicId: (topicId: string) => void;
}

export function WorkspaceLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentProject, setCurrentTopics } = useProjectStore();
  const [showProfile, setShowProfile] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedTopicId, setSelectedTopicId] = useState('');
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [topicName, setTopicName] = useState('');
  const [topicDescription, setTopicDescription] = useState('');
  const [topicType, setTopicType] = useState<TopicTypeOption>('chat');
  const [renameValue, setRenameValue] = useState('');
  const [topicToRename, setTopicToRename] = useState<Topic | null>(null);
  const [directThreads] = useState<DirectMessageThread[]>([]);

  const navItems = [
    { icon: MessageSquare, label: 'Чаты', path: '/workspace/chat', badge: 3 },
    { icon: Zap, label: 'Deploy', path: '/workspace/deploy', gradient: 'from-orange-500 to-red-500' },
    { icon: Calendar, label: 'Planning', path: '/workspace/planning', gradient: 'from-blue-500 to-cyan-500' },
    { icon: Code, label: 'Code', path: '/workspace/code', gradient: 'from-purple-500 to-pink-500' },
    { icon: FolderOpen, label: 'Файлы', path: '/workspace/files', gradient: 'from-green-500 to-emerald-500' },
  ];

  useEffect(() => {
    const loadTopics = async () => {
      if (!currentProject?.id) {
        setTopics([]);
        setCurrentTopics([]);
        return;
      }
      try {
        const response = await apiClient.get<Topic[]>(
          `/projects/${currentProject.id}/topics`
        );
        const data = Array.isArray(response.data) ? response.data : [];
        setTopics(data);
        setCurrentTopics(data);
        setSelectedTopicId((prev) => {
          if (data.length === 0) {
            return '';
          }
          if (data.some((topic) => topic.id === prev)) {
            return prev;
          }
          return data[0].id;
        });
      } catch (error) {
        toast.error('Не удалось загрузить темы проекта');
      }
    };

    void loadTopics();
  }, [currentProject?.id, setCurrentTopics]);

  useEffect(() => {
    if (!activeMenuId) {
      return;
    }
    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest('[data-topic-menu]')) {
        return;
      }
      setActiveMenuId(null);
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [activeMenuId]);

  const currentTopic = useMemo(
    () => topics.find((topic) => topic.id === selectedTopicId) ?? null,
    [selectedTopicId, topics]
  );

  const getTopicIcon = (type: Topic['type']) => {
    switch (type) {
      case 'planning':
        return Calendar;
      case 'deploy':
        return Zap;
      case 'code':
        return Code;
      case 'custom':
        return Hash;
      case 'tests':
        return CheckCircle2;
      default:
        return MessageSquare;
    }
  };

  const getTopicSubtitle = (topic: Topic) =>
    topic.description ??
    {
      chat: 'Обсуждение',
      planning: 'Планирование',
      tests: 'Тестирование',
      deploy: 'Деплой',
      custom: 'Кастомный',
      code: 'Код',
      bugs: 'Баги',
      direct: 'Личные',
    }[topic.type] ??
    'Тема';

  const buildTopicPath = (topic: Topic) => {
    const base = {
      chat: '/workspace/chat',
      planning: '/workspace/planning',
      tests: '/workspace/tests',
      deploy: '/workspace/deploy',
      custom: '/workspace/custom',
      code: '/workspace/code',
      bugs: '/workspace/chat',
      direct: '/workspace/chat',
    }[topic.type] ?? '/workspace/chat';

    return currentProject?.id ? `${base}/${currentProject.id}` : base;
  };

  const handleCreateTopic = async () => {
    if (!currentProject?.id) {
      toast.error('Сначала выберите проект');
      return;
    }
    if (!topicName.trim()) {
      toast.error('Введите название темы');
      return;
    }
    try {
      const response = await apiClient.post<Topic>(
        `/projects/${currentProject.id}/topics`,
        {
          name: topicName.trim(),
          description: topicDescription.trim() || undefined,
          type: topicType,
        }
      );
      const newTopic = response.data;
      setTopics((prev) => {
        const updated = [...prev, newTopic];
        setCurrentTopics(updated);
        return updated;
      });
      setSelectedTopicId(newTopic.id);
      setShowCreateModal(false);
      setTopicName('');
      setTopicDescription('');
      setTopicType('chat');
      toast.success('Тема создана! 🎉');
    } catch (error) {
      toast.error('Не удалось создать тему');
    }
  };

  const handleRenameTopic = async () => {
    if (!topicToRename) {
      return;
    }
    if (!renameValue.trim()) {
      toast.error('Введите новое название');
      return;
    }
    try {
      const response = await apiClient.put<Topic>(
        `/topics/${topicToRename.id}`,
        { name: renameValue.trim() }
      );
      const updated = response.data;
      setTopics((prev) => {
        const updatedTopics = prev.map((topic) =>
          topic.id === updated.id ? { ...topic, ...updated } : topic
        );
        setCurrentTopics(updatedTopics);
        return updatedTopics;
      });
      setShowRenameModal(false);
      setActiveMenuId(null);
      toast.success('Тема обновлена');
    } catch (error) {
      toast.error('Не удалось переименовать тему');
    }
  };

  const handleDeleteTopic = async (topic: Topic) => {
    if (topic.name.trim().toLowerCase() === 'general') {
      toast.error('Тему General нельзя удалить');
      return;
    }
    const confirmed = window.confirm(`Удалить тему "${topic.name}"?`);
    if (!confirmed) {
      return;
    }
    try {
      await apiClient.delete(`/topics/${topic.id}`);
      setTopics((prev) => {
        const updatedTopics = prev.filter((item) => item.id !== topic.id);
        setCurrentTopics(updatedTopics);
        return updatedTopics;
      });
      if (selectedTopicId === topic.id) {
        setSelectedTopicId('');
      }
      setActiveMenuId(null);
      toast.success('Тема удалена');
    } catch (error) {
      toast.error('Не удалось удалить тему');
    }
  };

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
                    M
                  </div>
                </motion.div>
                <div className="text-left">
                  <div className="font-semibold text-white flex items-center gap-2">
                    My Workspace
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
                const isActive =
                  location.pathname === item.path ||
                  location.pathname.startsWith(`${item.path}/`);
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
                onClick={() => navigate('/workspace/hub')}
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
                {topics.map((topic, index) => {
                  const TopicIcon = getTopicIcon(topic.type);
                  return (
                  <motion.button
                    key={topic.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ x: 5 }}
                    onClick={() => {
                      setSelectedTopicId(topic.id);
                      navigate(buildTopicPath(topic));
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-300 hover:bg-white/5 hover:text-white transition-all group relative"
                  >
                    <TopicIcon className="w-5 h-5" />
                    <div className="text-left flex-1">
                      <div className="font-medium text-sm">{topic.name}</div>
                      <div className="text-xs text-slate-500">{getTopicSubtitle(topic)}</div>
                    </div>
                    <button
                      type="button"
                      data-topic-menu
                      onClick={(event) => {
                        event.stopPropagation();
                        setActiveMenuId(activeMenuId === topic.id ? null : topic.id);
                      }}
                      className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                    <AnimatePresence>
                      {activeMenuId === topic.id && (
                        <motion.div
                          data-topic-menu
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 6 }}
                          className="absolute right-3 top-full mt-2 w-40 rounded-lg border border-white/10 bg-slate-900 shadow-xl z-20 overflow-hidden"
                        >
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              setTopicToRename(topic);
                              setRenameValue(topic.name);
                              setShowRenameModal(true);
                            }}
                            className="w-full px-3 py-2 text-left text-sm text-slate-200 hover:bg-white/5"
                          >
                            Переименовать
                          </button>
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              void handleDeleteTopic(topic);
                            }}
                            disabled={topic.name.trim().toLowerCase() === 'general'}
                            className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-red-500/10 disabled:cursor-not-allowed disabled:text-slate-500"
                          >
                            Удалить
                          </button>
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              setActiveMenuId(null);
                              navigate(
                                currentProject?.id
                                  ? `/workspace/custom/${currentProject.id}`
                                  : '/workspace/custom'
                              );
                            }}
                            className="w-full px-3 py-2 text-left text-sm text-slate-200 hover:bg-white/5"
                          >
                            Настройки
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.button>
                  );
                })}
                {topics.length === 0 && (
                  <div className="px-3 py-2 text-xs text-slate-500">
                    Темы пока не созданы
                  </div>
                )}
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
              onClick={() => navigate('/workspace/profile')}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/5 text-slate-300 hover:text-white transition-all"
            >
              <Settings className="w-5 h-5" />
              <span className="font-medium">Профиль</span>
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
                    <button
                      onClick={() => {
                        navigate('/workspace/profile');
                        setShowProfile(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-all text-left"
                    >
                      <Settings className="w-4 h-4" />
                      <span>Профиль</span>
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
          <Outlet
            context={{
              currentProject,
              topics,
              currentTopic,
              directThreads,
              setSelectedTopicId,
            }}
          />
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
                value={topicName}
                onChange={(event) => setTopicName(event.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 mb-4"
              />
              <select
                value={topicType}
                onChange={(event) => setTopicType(event.target.value as TopicTypeOption)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 mb-4"
              >
                <option value="chat">Чат</option>
                <option value="planning">Planning</option>
                <option value="tests">Tests</option>
                <option value="deploy">Deploy</option>
                <option value="custom">Custom</option>
              </select>
              <textarea
                placeholder="Описание (опционально)"
                rows={3}
                value={topicDescription}
                onChange={(event) => setTopicDescription(event.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 mb-4 resize-none"
              ></textarea>
              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => void handleCreateTopic()}
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

      {/* Rename Modal */}
      <AnimatePresence>
        {showRenameModal && topicToRename && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6"
            onClick={() => setShowRenameModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(event) => event.stopPropagation()}
              className="w-full max-w-md bg-slate-900 border border-white/10 rounded-2xl p-6 shadow-2xl"
            >
              <h3 className="text-2xl font-bold text-white mb-4">Переименовать тему</h3>
              <input
                type="text"
                value={renameValue}
                onChange={(event) => setRenameValue(event.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 mb-4"
              />
              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => void handleRenameTopic()}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-600 hover:to-purple-700 transition-all"
                >
                  Сохранить
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowRenameModal(false)}
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
