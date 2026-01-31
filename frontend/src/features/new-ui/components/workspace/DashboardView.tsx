import { motion } from 'motion/react';
import { useEffect, useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { TrendingUp, Users, CheckCircle, Clock, Target, Zap, Award, BarChart3 } from 'lucide-react';
import { apiClient } from '../../../../api/client';
import type { TopicWithStats, ProjectMemberWithUser, Notification } from '../../../../shared/types';
import type { WorkspaceOutletContext } from '../../pages/WorkspaceLayout';

interface DeployServer {
  id: string;
  name: string;
  host: string;
  port: number;
  created_at: string;
}

interface KanbanColumn {
  id: string;
  title: string;
  tasks?: Array<{ id: string }>;
}

const formatTimeAgo = (value?: string) => {
  if (!value) return 'только что';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'только что';
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 60) return `${minutes} мин назад`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ч назад`;
  const days = Math.floor(hours / 24);
  return `${days} дн назад`;
};

export function DashboardView() {
  const { currentProject, directThreads = [] } = useOutletContext<WorkspaceOutletContext>() ?? ({} as any);
  const [topics, setTopics] = useState<TopicWithStats[]>([]);
  const [members, setMembers] = useState<ProjectMemberWithUser[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [deployServers, setDeployServers] = useState<DeployServer[]>([]);
  const [kanbanColumns, setKanbanColumns] = useState<KanbanColumn[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentProject?.id) {
      setLoading(false);
      return;
    }

    const loadDashboard = async () => {
      setLoading(true);
      try {
        const [topicsRes, membersRes, notificationsRes, serversRes, columnsRes] = await Promise.all([
          apiClient.get<TopicWithStats[]>(`/projects/${currentProject.id}/topics`, {
            params: { withStats: true },
          }),
          apiClient.get<ProjectMemberWithUser[]>(`/projects/${currentProject.id}/members`),
          apiClient.get<Notification[]>('/notifications', { params: { limit: 8 } }),
          apiClient.get<DeployServer[]>(`/projects/${currentProject.id}/deploy/servers`).catch(() => ({ data: [] })),
          apiClient.get<KanbanColumn[]>(`/projects/${currentProject.id}/kanban/columns`).catch(() => ({ data: [] })),
        ]);
        setTopics(Array.isArray(topicsRes.data) ? topicsRes.data : []);
        setMembers(Array.isArray(membersRes.data) ? membersRes.data : []);
        setNotifications(Array.isArray(notificationsRes.data) ? notificationsRes.data : []);
        setDeployServers(Array.isArray(serversRes.data) ? serversRes.data : []);
        setKanbanColumns(Array.isArray(columnsRes.data) ? columnsRes.data : []);
      } catch (error) {
        console.error('Failed to load dashboard data', error);
      } finally {
        setLoading(false);
      }
    };

    void loadDashboard();
  }, [currentProject?.id]);

  const totalTasks = useMemo(
    () => kanbanColumns.reduce((sum, column) => sum + (column.tasks?.length ?? 0), 0),
    [kanbanColumns]
  );

  const stats = [
    {
      label: 'Задач в работе',
      value: totalTasks.toString(),
      change: totalTasks > 0 ? 'на доске' : 'нет',
      icon: CheckCircle,
      color: 'from-blue-500 to-cyan-500',
    },
    {
      label: 'Участников',
      value: members.length.toString(),
      change: members.length > 0 ? `${members.length} в команде` : 'нет',
      icon: Users,
      color: 'from-purple-500 to-pink-500',
    },
    {
      label: 'Активность',
      value: notifications.length.toString(),
      change: notifications.length > 0 ? 'новые события' : 'тишина',
      icon: Zap,
      color: 'from-orange-500 to-red-500',
    },
    {
      label: 'Активных тем',
      value: topics.length.toString(),
      change: directThreads.length > 0 ? `+${directThreads.length} DM` : '--',
      icon: Target,
      color: 'from-green-500 to-emerald-500',
    },
  ];

  const recentActivity = notifications.slice(0, 4).map((item) => ({
    user: item.title,
    action: item.body,
    item: item.type,
    time: formatTimeAgo(item.created_at),
  }));

  return (
    <div className="h-full overflow-y-auto p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto"
      >
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-2">Дашборд команды</h2>
          <p className="text-slate-400">Обзор активности и метрик проекта</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-white/20 border-t-blue-500" />
          </div>
        ) : (
          <>
            {/* Stats Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {stats.map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -5, scale: 1.02 }}
                  className="relative p-6 bg-slate-900/50 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden group cursor-pointer"
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-10 transition-opacity`} />
                  <div className="relative z-10">
                    <div className="flex items-start justify-between mb-4">
                      <motion.div
                        whileHover={{ rotate: 360 }}
                        transition={{ duration: 0.6 }}
                        className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg`}
                      >
                        <stat.icon className="w-6 h-6 text-white" />
                      </motion.div>
                      <span className="px-2 py-1 bg-green-500/10 border border-green-500/20 rounded-full text-xs text-green-400 font-semibold">
                        {stat.change}
                      </span>
                    </div>
                    <p className="text-sm text-slate-400 mb-1">{stat.label}</p>
                    <p className="text-3xl font-bold text-white">{stat.value}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
              {/* Team Members */}
              <div className="lg:col-span-2">
                <div className="bg-slate-900/50 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-semibold text-white">Команда</h3>
                    <span className="text-sm text-slate-400">{members.length} участников</span>
                  </div>

                  <div className="space-y-3">
                    {members.length === 0 ? (
                      <p className="text-sm text-slate-500 py-4 text-center">Участники не найдены</p>
                    ) : (
                      members.map((member, index) => {
                        const initial = (member.user?.name || member.user?.email || '?').charAt(0).toUpperCase();
                        return (
                          <motion.div
                            key={member.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            whileHover={{ x: 5 }}
                            className="flex items-center justify-between p-4 bg-slate-800/50 border border-white/10 rounded-xl hover:border-white/20 transition-all cursor-pointer"
                          >
                            <div className="flex items-center gap-4">
                              <div className="relative">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center font-semibold overflow-hidden">
                                  {member.user?.avatar_url ? (
                                    <img src={member.user.avatar_url} alt={member.user.name} className="h-full w-full object-cover" />
                                  ) : (
                                    initial
                                  )}
                                </div>
                                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-slate-900 rounded-full" />
                              </div>
                              <div>
                                <h4 className="font-medium text-white">{member.user?.name || 'Unnamed'}</h4>
                                <p className="text-sm text-slate-400">{member.role}</p>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="space-y-6">
                <div className="bg-slate-900/50 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
                  <h3 className="text-xl font-semibold text-white mb-6">Активность</h3>
                  <div className="space-y-4">
                    {recentActivity.length === 0 ? (
                      <p className="text-sm text-slate-500 text-center py-4">Нет активности</p>
                    ) : (
                      recentActivity.map((activity, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="relative pl-6 border-l-2 border-white/10 pb-4 last:pb-0"
                        >
                          <div className="absolute left-[-5px] top-1 w-2 h-2 bg-blue-500 rounded-full" />
                          <p className="text-sm text-white mb-1">
                            <span className="font-semibold">{activity.user}</span>{' '}
                            <span className="text-slate-400">{activity.action}</span>
                          </p>
                          <p className="text-sm text-blue-400 mb-1">{activity.item}</p>
                          <p className="text-xs text-slate-500">{activity.time}</p>
                        </motion.div>
                      ))
                    )}
                  </div>
                </div>

                {/* Achievement */}
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-2xl p-6 cursor-pointer"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <motion.div
                      animate={{ rotate: [0, 10, -10, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center shadow-lg"
                    >
                      <Award className="w-6 h-6 text-white" />
                    </motion.div>
                    <div>
                      <h4 className="font-semibold text-white">Достижение!</h4>
                      <p className="text-sm text-yellow-400">Новый уровень</p>
                    </div>
                  </div>
                  <p className="text-sm text-slate-300">
                    Ваша команда завершила {totalTasks}+ задач! Продолжайте в том же духе!
                  </p>
                </motion.div>
              </div>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
