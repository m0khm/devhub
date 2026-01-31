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
  Calendar,
  FolderOpen,
  Crown,
  Gift,
  Sun,
  MoreVertical,
  CheckCircle2,
  LayoutDashboard,
  ClipboardList,
  Mic,
  Plug,
  Zap,
  Flame,
  Star,
} from 'lucide-react';
import { Toaster, toast } from 'sonner';
import { apiClient } from '../../../api/client';
import { useProjectStore } from '../../../store/projectStore';
import { useThemeStore } from '../../../store/themeStore';
import { useWorkspaceStore } from '../../../store/workspaceStore';
import { useAuthStore } from '../../../store/authStore';
import type { Project, Topic, Workspace } from '../../../shared/types';
import { CommandPalette } from '../components/CommandPalette';
import { ThemeModal } from '../components/ThemeModal';
import { InviteFriendModal } from '../components/InviteFriendModal';

type TopicTypeOption = 'chat' | 'planning' | 'tests' | 'deploy' | 'custom';

export interface WorkspaceOutletContext {
  currentProject: Project | null;
  topics: Topic[];
  currentTopic: Topic | null;
  directThreads: Topic[];
  setSelectedTopicId: (topicId: string) => void;
}

export function WorkspaceLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    projects,
    currentProject,
    setProjects,
    setCurrentProject,
    setCurrentTopics,
    currentTopics,
    addProject,
  } = useProjectStore();
  const {
    workspaces,
    currentWorkspace,
    setWorkspaces,
    setCurrentWorkspace,
  } = useWorkspaceStore();
  const theme = useThemeStore((state) => state.theme);
  const toggleTheme = useThemeStore((state) => state.toggleTheme);
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const userName = user?.name?.trim() || 'Пользователь';
  const userInitial = (user?.name || user?.email || '?').trim().charAt(0).toUpperCase();
  const userAvatarUrl = user?.avatar_url;
  const darkMode = theme === 'dark';

  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedTopicId, setSelectedTopicId] = useState('');
  const [directThreads, setDirectThreads] = useState<Topic[]>([]);
  const [showProfile, setShowProfile] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [topicName, setTopicName] = useState('');
  const [topicDescription, setTopicDescription] = useState('');
  const [topicType, setTopicType] = useState<TopicTypeOption>('chat');
  const [renameValue, setRenameValue] = useState('');
  const [topicToRename, setTopicToRename] = useState<Topic | null>(null);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [creatingProject, setCreatingProject] = useState(false);

  const projectPathSuffix = currentProject ? `/${currentProject.id}` : '';
  const topicPath = currentProject ? `/workspace/chat/${currentProject.id}` : '/workspace/chat';
  const workspaceInitials = currentWorkspace?.name?.trim().charAt(0).toUpperCase() || 'W';

  const currentTopic = useMemo(
    () => topics.find((topic) => topic.id === selectedTopicId) ?? null,
    [selectedTopicId, topics]
  );

  const navItems = useMemo(
    () => [
      { icon: MessageSquare, label: 'Чаты', path: `/workspace/chat${projectPathSuffix}`, badge: 3 },
      { icon: LayoutDashboard, label: 'Дашборд', path: '/workspace/dashboard' },
      { icon: ClipboardList, label: 'Канбан', path: `/workspace/kanban${projectPathSuffix}` },
      { icon: Calendar, label: 'Календарь', path: '/workspace/calendar' },
      { icon: FolderOpen, label: 'Файлы', path: '/workspace/files' },
      { icon: Mic, label: 'Voice Rooms', path: '/workspace/voice-rooms', isNew: true },
      { icon: Plug, label: 'Интеграции', path: '/workspace/integrations' },
      { icon: Users, label: 'Hub', path: '/workspace/hub' },
    ],
    [projectPathSuffix]
  );

  // --- Data loading ---

  const loadWorkspaces = useCallback(async () => {
    const response = await apiClient.get<Workspace[]>('/workspaces');
    const fetched = Array.isArray(response.data) ? response.data : [];
    setWorkspaces(fetched);
    return fetched;
  }, [setWorkspaces]);

  const loadProjectsForWorkspace = useCallback(
    async (workspaceId: string) => {
      const response = await apiClient.get<Project[]>(`/workspaces/${workspaceId}/projects`);
      const fetched = Array.isArray(response.data) ? response.data : [];
      setProjects(fetched);
      return fetched;
    },
    [setProjects]
  );

  const handleWorkspaceChange = useCallback(
    async (workspace: Workspace) => {
      setCurrentWorkspace(workspace);
      const fetched = await loadProjectsForWorkspace(workspace.id);
      if (fetched.length > 0) {
        setCurrentProject(fetched[0]);
        navigate(`/workspace/chat/${fetched[0].id}`);
      } else {
        setCurrentProject(null);
        navigate('/onboarding');
      }
    },
    [loadProjectsForWorkspace, navigate, setCurrentProject, setCurrentWorkspace]
  );

  const handleProjectChange = useCallback(
    (projectId: string) => {
      const nextProject = projects.find((p) => p.id === projectId);
      if (!nextProject) return;
      setCurrentProject(nextProject);
      const pathParts = location.pathname.split('/');
      const section = pathParts[2] || 'chat';
      const sectionNeedId = ['chat', 'deploy', 'planning', 'code', 'kanban', 'tests', 'custom'];
      const normalizedSection = sectionNeedId.includes(section) ? section : 'chat';
      navigate(`/workspace/${normalizedSection}/${nextProject.id}`);
    },
    [location.pathname, navigate, projects, setCurrentProject]
  );

  const handleCreateProject = useCallback(async () => {
    setCreatingProject(true);
    try {
      const response = await apiClient.post<Project>('/projects', {
        name: 'Новый проект',
        description: 'Проект создан из быстрого действия.',
      });
      const project = response.data;
      addProject(project);
      setCurrentProject(project);
      toast.success('Проект создан');
      navigate('/workspace/dashboard');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Не удалось создать проект');
    } finally {
      setCreatingProject(false);
    }
  }, [addProject, navigate, setCurrentProject]);

  // Bootstrap: load workspaces + projects
  useEffect(() => {
    const bootstrap = async () => {
      try {
        const fetchedWorkspaces = await loadWorkspaces();
        if (fetchedWorkspaces.length === 0) {
          navigate('/onboarding');
          return;
        }
        const nextWorkspace =
          currentWorkspace && fetchedWorkspaces.some((w) => w.id === currentWorkspace.id)
            ? currentWorkspace
            : fetchedWorkspaces[0];
        setCurrentWorkspace(nextWorkspace);
        const fetchedProjects = await loadProjectsForWorkspace(nextWorkspace.id);
        if (fetchedProjects.length > 0) {
          const nextProject =
            currentProject && fetchedProjects.some((p) => p.id === currentProject.id)
              ? currentProject
              : fetchedProjects[0];
          setCurrentProject(nextProject);
        }
      } catch {
        toast.error('Не удалось загрузить workspace');
      }
    };
    void bootstrap();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load topics when project changes
  useEffect(() => {
    const loadTopics = async () => {
      if (!currentProject?.id) {
        setTopics([]);
        setCurrentTopics([]);
        setDirectThreads([]);
        return;
      }
      try {
        const response = await apiClient.get<Topic[]>(`/projects/${currentProject.id}/topics`);
        const data = Array.isArray(response.data) ? response.data : [];
        const projectTopics = data.filter((t) => t.type !== 'direct');
        const direct = data.filter((t) => t.type === 'direct');
        setTopics(projectTopics);
        setCurrentTopics(projectTopics);
        setDirectThreads(direct);
        setSelectedTopicId((prev) => {
          if (projectTopics.length === 0) return '';
          if (projectTopics.some((t) => t.id === prev)) return prev;
          return projectTopics[0].id;
        });
      } catch {
        toast.error('Не удалось загрузить темы проекта');
      }
    };
    void loadTopics();
  }, [currentProject?.id, setCurrentTopics]);

  // Keyboard shortcut for command palette
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setShowCommandPalette(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close topic menu on outside click
  useEffect(() => {
    if (!activeMenuId) return;
    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest('[data-topic-menu]')) return;
      setActiveMenuId(null);
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [activeMenuId]);

  // --- Topic helpers ---

  const getTopicIcon = (type: Topic['type']) => {
    switch (type) {
      case 'planning': return Calendar;
      case 'deploy': return Zap;
      case 'code': return Code;
      case 'custom': return Hash;
      case 'tests': return CheckCircle2;
      default: return MessageSquare;
    }
  };

  const getTopicSubtitle = (topic: Topic) =>
    topic.description ??
    ({
      chat: 'Обсуждение',
      planning: 'Планирование',
      tests: 'Тестирование',
      deploy: 'Деплой',
      custom: 'Кастомный',
      code: 'Код',
      bugs: 'Баги',
      direct: 'Личные',
    }[topic.type] ?? 'Тема');

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

  // --- Topic CRUD ---

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
      const response = await apiClient.post<Topic>(`/projects/${currentProject.id}/topics`, {
        name: topicName.trim(),
        description: topicDescription.trim() || undefined,
        type: topicType,
      });
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
      toast.success('Тема создана!');
    } catch {
      toast.error('Не удалось создать тему');
    }
  };

  const handleRenameTopic = async () => {
    if (!topicToRename) return;
    if (!renameValue.trim()) {
      toast.error('Введите новое название');
      return;
    }
    try {
      const response = await apiClient.put<Topic>(`/topics/${topicToRename.id}`, {
        name: renameValue.trim(),
      });
      const updated = response.data;
      setTopics((prev) => {
        const updatedTopics = prev.map((t) => (t.id === updated.id ? { ...t, ...updated } : t));
        setCurrentTopics(updatedTopics);
        return updatedTopics;
      });
      setShowRenameModal(false);
      setActiveMenuId(null);
      toast.success('Тема обновлена');
    } catch {
      toast.error('Не удалось переименовать тему');
    }
  };

  const handleDeleteTopic = async (topic: Topic) => {
    if (topic.name.trim().toLowerCase() === 'general') {
      toast.error('Тему General нельзя удалить');
      return;
    }
    const confirmed = window.confirm(`Удалить тему "${topic.name}"?`);
    if (!confirmed) return;
    try {
      await apiClient.delete(`/topics/${topic.id}`);
      setTopics((prev) => {
        const updatedTopics = prev.filter((t) => t.id !== topic.id);
        setCurrentTopics(updatedTopics);
        return updatedTopics;
      });
      if (selectedTopicId === topic.id) setSelectedTopicId('');
      setActiveMenuId(null);
      toast.success('Тема удалена');
    } catch {
      toast.error('Не удалось удалить тему');
    }
  };

  // --- Command Palette ---

  const commandActions = useMemo(
    () => [
      { id: 'dashboard', label: 'Дашборд', description: 'Открыть обзор проекта', onSelect: () => navigate('/workspace/dashboard'), icon: LayoutDashboard, shortcut: '1' },
      { id: 'kanban', label: 'Канбан', description: 'Перейти к доске задач', onSelect: () => navigate(`/workspace/kanban${projectPathSuffix}`), icon: ClipboardList, shortcut: '2' },
      { id: 'calendar', label: 'Календарь', description: 'Открыть календарь команды', onSelect: () => navigate('/workspace/calendar'), icon: Calendar, shortcut: '3' },
      { id: 'files', label: 'Файлы', description: 'Посмотреть файлы проекта', onSelect: () => navigate('/workspace/files'), icon: FolderOpen, shortcut: '4' },
      { id: 'voice-rooms', label: 'Voice Rooms', description: 'Голосовые комнаты', onSelect: () => navigate('/workspace/voice-rooms'), icon: Mic },
      { id: 'integrations', label: 'Интеграции', description: 'Подключить сервисы', onSelect: () => navigate('/workspace/integrations'), icon: Plug },
      { id: 'hub', label: 'Hub', description: 'Открыть хаб', onSelect: () => navigate('/workspace/hub'), icon: Users },
      { id: 'create-project', label: 'Создать проект', description: 'Быстро создать новый проект', onSelect: () => void handleCreateProject(), icon: Plus },
      {
        id: 'invite-friend',
        label: 'Пригласить друга',
        description: 'Отправить приглашение',
        onSelect: () => {
          if (!currentProject) {
            toast.error('Сначала выберите проект');
            return;
          }
          setShowInviteModal(true);
        },
        icon: Gift,
      },
      { id: 'theme', label: 'Настроить тему', description: 'Выбрать светлую или темную тему', onSelect: () => setShowThemeModal(true), icon: Sun },
    ],
    [currentProject, handleCreateProject, navigate, projectPathSuffix]
  );

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
          <div className="absolute top-0 left-0 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>

        <div className="relative z-10 flex flex-col h-full">
          {/* Workspace Header */}
          <div className="p-4 border-b border-white/5">
            <div className="space-y-3">
              <button className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-all group">
                <div className="flex items-center gap-3">
                  <motion.div
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.6 }}
                    className="relative"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg blur-md opacity-70" />
                    <div className="relative w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center font-bold shadow-lg">
                      {userAvatarUrl ? (
                        <img src={userAvatarUrl} alt={userName} className="h-full w-full rounded-lg object-cover" />
                      ) : (
                        workspaceInitials
                      )}
                    </div>
                  </motion.div>
                  <div className="text-left">
                    <div className="font-semibold text-white flex items-center gap-2">
                      {currentWorkspace?.name || 'My Workspace'}
                      <Crown className="w-3 h-3 text-yellow-400" />
                    </div>
                    <div className="text-xs text-slate-400">
                      {currentWorkspace?.description || 'Premium plan'}
                    </div>
                  </div>
                </div>
                <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" />
              </button>
              {workspaces.length > 1 && (
                <select
                  value={currentWorkspace?.id ?? ''}
                  onChange={(event) => {
                    const next = workspaces.find((w) => w.id === event.target.value);
                    if (next) void handleWorkspaceChange(next);
                  }}
                  className="w-full rounded-xl border border-white/10 bg-slate-900/70 px-3 py-2 text-sm text-white"
                >
                  {workspaces.map((ws) => (
                    <option key={ws.id} value={ws.id}>{ws.name}</option>
                  ))}
                </select>
              )}
            </div>

            {/* XP / Gamification */}
            <div className="mt-3 p-3 rounded-xl bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-yellow-400" />
                  <span className="text-sm font-semibold text-white">Уровень 12</span>
                </div>
                <span className="text-xs font-bold text-purple-400">2450 XP</span>
              </div>
              <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden mb-1">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: '82%' }}
                  transition={{ duration: 1, delay: 0.3 }}
                  className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full"
                />
              </div>
              <div className="flex items-center gap-1 text-[10px] text-slate-400">
                <Flame className="w-3 h-3 text-orange-400" />
                <span>7 дней streak</span>
                <span className="ml-auto">450 XP до Lvl 13</span>
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="px-4 pt-3">
            <button
              onClick={() => setShowCommandPalette(true)}
              className="w-full flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-slate-400 hover:bg-white/10 transition-all"
            >
              <Search className="w-4 h-4" />
              <span>Поиск... (&#8984;K)</span>
            </button>
          </div>

          {/* Main Navigation */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-1 mb-6">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);
                return (
                  <motion.button
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    whileHover={{ x: 5, scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group relative overflow-hidden ${
                      isActive
                        ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-white border border-blue-500/30'
                        : 'text-slate-300 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <item.icon className="w-5 h-5 relative z-10" />
                    <span className="font-medium relative z-10">{item.label}</span>
                    {'isNew' in item && item.isNew && (
                      <span className="ml-auto px-2 py-0.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-[10px] rounded-full font-bold relative z-10">
                        NEW
                      </span>
                    )}
                    {'badge' in item && item.badge && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="ml-auto px-2 py-0.5 bg-red-500 text-white text-xs rounded-full font-semibold relative z-10"
                      >
                        {item.badge}
                      </motion.span>
                    )}
                  </motion.button>
                );
              })}
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
                  onClick={() => setShowCreateModal(true)}
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
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group relative ${
                        selectedTopicId === topic.id
                          ? 'bg-white/10 text-white'
                          : 'text-slate-300 hover:bg-white/5 hover:text-white'
                      }`}
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
                        className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-white/10 transition-colors opacity-0 group-hover:opacity-100"
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
                              onClick={(e) => {
                                e.stopPropagation();
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
                              onClick={(e) => {
                                e.stopPropagation();
                                void handleDeleteTopic(topic);
                              }}
                              disabled={topic.name.trim().toLowerCase() === 'general'}
                              className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-red-500/10 disabled:cursor-not-allowed disabled:text-slate-500"
                            >
                              Удалить
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
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowCommandPalette(true)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg bg-slate-800/50 border border-white/10 text-slate-300 hover:bg-slate-800 transition-all"
              >
                <Search className="w-5 h-5" />
                <span className="font-medium">Command Palette</span>
                <span className="ml-auto text-xs text-slate-500">&#8984;K</span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02, boxShadow: '0 0 20px rgba(59, 130, 246, 0.3)' }}
                whileTap={{ scale: 0.98 }}
                onClick={() => void handleCreateProject()}
                disabled={creatingProject}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 transition-all shadow-lg shadow-blue-500/20"
              >
                <Plus className="w-5 h-5" />
                <span className="font-medium">{creatingProject ? 'Создаем...' : 'Создать проект'}</span>
              </motion.button>
            </div>
          </div>

          {/* Bottom actions */}
          <div className="p-4 border-t border-white/5 space-y-2">
            <motion.button
              whileHover={{ x: 5 }}
              onClick={() => navigate(topicPath)}
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
                  />
                  <div className="relative w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center font-bold overflow-hidden">
                    {userAvatarUrl ? (
                      <img src={userAvatarUrl} alt={userName} className="h-full w-full object-cover" />
                    ) : (
                      userInitial
                    )}
                  </div>
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-slate-900 rounded-full" />
                </div>
                <div className="text-left flex-1">
                  <div className="font-semibold text-white">{userName}</div>
                  <div className="text-xs text-green-400">&#9679; В сети</div>
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
                      onClick={() => {
                        toggleTheme();
                        setShowProfile(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-all text-left"
                    >
                      {darkMode ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                      <span>Переключить тему</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowThemeModal(true);
                        setShowProfile(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-all text-left"
                    >
                      <Sun className="w-4 h-4" />
                      <span>Настроить тему</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowCommandPalette(true);
                        setShowProfile(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-all text-left"
                    >
                      <Search className="w-4 h-4" />
                      <span>Command Palette</span>
                    </button>
                    <button
                      onClick={() => {
                        navigate('/workspace/profile');
                        setShowProfile(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-all text-left"
                    >
                      <Settings className="w-4 h-4" />
                      <span>Настройки</span>
                    </button>
                    <button
                      onClick={() => {
                        logout();
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
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-pink-500/5" />

          <div className="flex items-center gap-4 relative z-10">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Проект
              </span>
              <select
                value={currentProject?.id ?? ''}
                onChange={(event) => handleProjectChange(event.target.value)}
                className="rounded-lg border border-white/10 bg-slate-900/70 px-3 py-2 text-sm text-white"
              >
                {projects.length === 0 ? (
                  <option value="">Нет проектов</option>
                ) : (
                  projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-3 relative z-10">
            <motion.button
              whileHover={{ scale: 1.1, rotate: 15 }}
              whileTap={{ scale: 0.9 }}
              className="p-2 rounded-lg hover:bg-white/5 transition-all relative"
            >
              <Bell className="w-5 h-5 text-slate-400" />
              <motion.span
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
                className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"
              />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9, rotate: -180 }}
              onClick={() => toggleTheme()}
              className="p-2 rounded-lg hover:bg-white/5 transition-all"
            >
              {darkMode ? <Moon className="w-5 h-5 text-slate-400" /> : <Sun className="w-5 h-5 text-slate-400" />}
            </motion.button>
          </div>
        </motion.div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden">
          <Outlet
            context={{
              currentProject,
              topics: currentTopics,
              currentTopic,
              directThreads,
              setSelectedTopicId,
            }}
          />
        </div>
      </div>

      {/* Create Topic Modal */}
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
                onChange={(e) => setTopicName(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 mb-4"
              />
              <select
                value={topicType}
                onChange={(e) => setTopicType(e.target.value as TopicTypeOption)}
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
                onChange={(e) => setTopicDescription(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 mb-4 resize-none"
              />
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

      {/* Rename Topic Modal */}
      <AnimatePresence>
        {showRenameModal && (
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
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-slate-900 border border-white/10 rounded-2xl p-6 shadow-2xl"
            >
              <h3 className="text-2xl font-bold text-white mb-4">Переименовать тему</h3>
              <input
                type="text"
                placeholder="Новое название"
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
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

      <CommandPalette
        open={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
        actions={commandActions}
      />
      <ThemeModal open={showThemeModal} onClose={() => setShowThemeModal(false)} />
      {currentProject && (
        <InviteFriendModal
          open={showInviteModal}
          onClose={() => setShowInviteModal(false)}
          projectId={currentProject.id}
        />
      )}
    </div>
  );
}
