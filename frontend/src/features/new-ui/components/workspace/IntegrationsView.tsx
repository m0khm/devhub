import { motion, AnimatePresence } from 'motion/react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useOutletContext } from 'react-router-dom';
import {
  Plug,
  ShieldCheck,
  Workflow,
  Github,
  MessageSquare,
  Database,
  Cloud,
  Bell,
  BarChart3,
  Lock,
  Check,
  ExternalLink,
  RefreshCw,
  GitBranch,
  GitPullRequest,
  Star,
  X,
} from 'lucide-react';
import { apiClient } from '../../../../api/client';
import type { WorkspaceOutletContext } from '../../pages/WorkspaceLayout';

interface IntegrationService {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  color: string;
  category: 'vcs' | 'communication' | 'ci' | 'monitoring';
  implemented?: boolean;
}

interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  stargazers_count: number;
  language: string | null;
  updated_at: string;
  private: boolean;
}

interface GitHubConnection {
  connected: boolean;
  username?: string;
  avatar_url?: string;
  repos?: GitHubRepo[];
}

const services: IntegrationService[] = [
  { id: 'github', name: 'GitHub', description: 'Репозитории и pull requests', icon: Github, color: 'from-gray-600 to-gray-800', category: 'vcs', implemented: true },
  { id: 'gitlab', name: 'GitLab', description: 'CI/CD и управление кодом', icon: Database, color: 'from-orange-500 to-red-500', category: 'vcs' },
  { id: 'slack', name: 'Slack', description: 'Уведомления и сообщения', icon: MessageSquare, color: 'from-purple-500 to-pink-500', category: 'communication' },
  { id: 'discord', name: 'Discord', description: 'Командное общение', icon: MessageSquare, color: 'from-indigo-500 to-blue-500', category: 'communication' },
  { id: 'jenkins', name: 'Jenkins', description: 'Автоматизация сборок', icon: Workflow, color: 'from-red-500 to-orange-500', category: 'ci' },
  { id: 'docker', name: 'Docker Hub', description: 'Контейнеры и образы', icon: Cloud, color: 'from-blue-500 to-cyan-500', category: 'ci' },
  { id: 'sentry', name: 'Sentry', description: 'Мониторинг ошибок', icon: Bell, color: 'from-pink-500 to-red-500', category: 'monitoring' },
  { id: 'grafana', name: 'Grafana', description: 'Дашборды и метрики', icon: BarChart3, color: 'from-orange-500 to-yellow-500', category: 'monitoring' },
];

const categoryLabels: Record<string, string> = {
  vcs: 'Контроль версий',
  communication: 'Коммуникации',
  ci: 'CI/CD',
  monitoring: 'Мониторинг',
};

export function IntegrationsView() {
  const { currentProject } = useOutletContext<WorkspaceOutletContext>() ?? ({} as any);
  const [githubConnection, setGithubConnection] = useState<GitHubConnection>({ connected: false });
  const [githubToken, setGithubToken] = useState('');
  const [showGithubSetup, setShowGithubSetup] = useState(false);
  const [loadingGithub, setLoadingGithub] = useState(false);
  const [selectedRepos, setSelectedRepos] = useState<Set<number>>(new Set());

  // Check GitHub connection status on mount
  useEffect(() => {
    const checkGithubStatus = async () => {
      if (!currentProject?.id) return;
      try {
        const response = await apiClient.get<GitHubConnection>(
          `/projects/${currentProject.id}/integrations/github/status`
        );
        if (response.data?.connected) {
          setGithubConnection(response.data);
        }
      } catch {
        // Not connected yet, that's fine
      }
    };
    void checkGithubStatus();
  }, [currentProject?.id]);

  const handleConnectGithub = async () => {
    if (!githubToken.trim()) {
      toast.error('Введите GitHub Personal Access Token');
      return;
    }
    if (!currentProject?.id) {
      toast.error('Сначала выберите проект');
      return;
    }

    setLoadingGithub(true);
    try {
      const response = await apiClient.post<GitHubConnection>(
        `/projects/${currentProject.id}/integrations/github/connect`,
        { token: githubToken.trim() }
      );
      setGithubConnection(response.data);
      setGithubToken('');
      setShowGithubSetup(false);
      toast.success(`GitHub подключен! Пользователь: ${response.data.username}`);
    } catch (error: any) {
      const message = error.response?.data?.error || 'Не удалось подключить GitHub';
      toast.error(message);
    } finally {
      setLoadingGithub(false);
    }
  };

  const handleDisconnectGithub = async () => {
    if (!currentProject?.id) return;
    try {
      await apiClient.delete(`/projects/${currentProject.id}/integrations/github`);
      setGithubConnection({ connected: false });
      toast.success('GitHub отключен');
    } catch {
      toast.error('Не удалось отключить GitHub');
    }
  };

  const handleRefreshRepos = async () => {
    if (!currentProject?.id) return;
    setLoadingGithub(true);
    try {
      const response = await apiClient.get<GitHubConnection>(
        `/projects/${currentProject.id}/integrations/github/status`
      );
      if (response.data?.connected) {
        setGithubConnection(response.data);
      }
    } catch {
      toast.error('Не удалось обновить список репозиториев');
    } finally {
      setLoadingGithub(false);
    }
  };

  const handleConnect = (service: IntegrationService) => {
    if (service.id === 'github') {
      if (githubConnection.connected) {
        return; // Already connected
      }
      setShowGithubSetup(true);
      return;
    }
    toast.info(`${service.name}: интеграция скоро будет реализована`);
  };

  const groupedServices = services.reduce<Record<string, IntegrationService[]>>((acc, service) => {
    if (!acc[service.category]) acc[service.category] = [];
    acc[service.category].push(service);
    return acc;
  }, {});

  return (
    <div className="h-full overflow-y-auto p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto max-w-5xl"
      >
        <div className="mb-8 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-cyan-500">
            <Plug className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Интеграции</h2>
            <p className="text-slate-400">Подключайте сервисы и автоматизируйте процессы.</p>
          </div>
        </div>

        {/* Info banner */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-8 flex items-start gap-4 p-5 bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border border-emerald-500/20 rounded-2xl"
        >
          <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h4 className="font-semibold text-white mb-1">Безопасные подключения</h4>
            <p className="text-sm text-slate-300">
              Все интеграции используют токены с минимальными правами.
              Для GitHub используйте Personal Access Token с правами `repo` и `read:user`.
            </p>
          </div>
        </motion.div>

        {/* GitHub Connected Panel */}
        <AnimatePresence>
          {githubConnection.connected && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-8 rounded-2xl border border-green-500/20 bg-green-500/5 p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-600 to-gray-800 flex items-center justify-center">
                    <Github className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-white">GitHub</h3>
                      <span className="flex items-center gap-1 px-2 py-0.5 bg-green-500/20 border border-green-500/30 rounded-full text-xs text-green-400 font-semibold">
                        <Check className="w-3 h-3" />
                        Подключен
                      </span>
                    </div>
                    <p className="text-sm text-slate-400">@{githubConnection.username}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleRefreshRepos}
                    disabled={loadingGithub}
                    className="p-2 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-all"
                  >
                    <RefreshCw className={`w-4 h-4 ${loadingGithub ? 'animate-spin' : ''}`} />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleDisconnectGithub}
                    className="px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium hover:bg-red-500/20 transition-all"
                  >
                    Отключить
                  </motion.button>
                </div>
              </div>

              {/* Repos list */}
              {githubConnection.repos && githubConnection.repos.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-slate-400 mb-3">
                    Репозитории ({githubConnection.repos.length})
                  </h4>
                  <div className="grid gap-2 max-h-[300px] overflow-y-auto pr-2">
                    {githubConnection.repos.map((repo) => (
                      <motion.div
                        key={repo.id}
                        whileHover={{ x: 3 }}
                        className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-white/5 hover:border-white/10 transition-all"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <GitBranch className="w-4 h-4 text-slate-400 flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-white truncate">{repo.name}</p>
                            {repo.description && (
                              <p className="text-xs text-slate-500 truncate">{repo.description}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0 ml-3">
                          {repo.language && (
                            <span className="text-xs text-slate-500">{repo.language}</span>
                          )}
                          <div className="flex items-center gap-1 text-xs text-slate-500">
                            <Star className="w-3 h-3" />
                            {repo.stargazers_count}
                          </div>
                          <a
                            href={repo.html_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 rounded hover:bg-white/10 transition-colors"
                          >
                            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                          </a>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Service categories */}
        {Object.entries(groupedServices).map(([category, categoryServices], catIdx) => (
          <div key={category} className="mb-8">
            <h3 className="text-lg font-semibold text-white mb-4">
              {categoryLabels[category] || category}
            </h3>
            <div className="grid gap-4 md:grid-cols-2">
              {categoryServices.map((service, index) => {
                const isGithubConnected = service.id === 'github' && githubConnection.connected;
                return (
                  <motion.div
                    key={service.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: (catIdx * 0.1) + (index * 0.05) }}
                    whileHover={{ y: -3, scale: 1.01 }}
                    className={`rounded-2xl border p-5 transition-all ${
                      isGithubConnected
                        ? 'border-green-500/20 bg-green-500/5'
                        : 'border-white/10 bg-slate-900/60 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${service.color} flex items-center justify-center shadow-lg flex-shrink-0`}>
                        <service.icon className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-white">{service.name}</h4>
                          {isGithubConnected && (
                            <Check className="w-4 h-4 text-green-400" />
                          )}
                        </div>
                        <p className="text-sm text-slate-400 mt-1">{service.description}</p>
                        {!isGithubConnected && (
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleConnect(service)}
                            className="mt-3 flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm font-medium text-slate-200 hover:bg-white/10 transition-all"
                          >
                            <Lock className="w-3.5 h-3.5" />
                            Привязать сервис
                          </motion.button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        ))}
      </motion.div>

      {/* GitHub Setup Modal */}
      <AnimatePresence>
        {showGithubSetup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6"
            onClick={() => setShowGithubSetup(false)}
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
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-600 to-gray-800 flex items-center justify-center">
                    <Github className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white">Подключить GitHub</h3>
                </div>
                <button
                  onClick={() => setShowGithubSetup(false)}
                  className="p-2 rounded-lg hover:bg-white/5 transition-colors"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                  <p className="text-sm text-blue-300">
                    Создайте Personal Access Token в{' '}
                    <a
                      href="https://github.com/settings/tokens/new"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 underline hover:text-blue-300"
                    >
                      настройках GitHub
                    </a>
                    {' '}с правами: <code className="px-1.5 py-0.5 bg-blue-500/20 rounded text-blue-300">repo</code>,{' '}
                    <code className="px-1.5 py-0.5 bg-blue-500/20 rounded text-blue-300">read:user</code>
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Personal Access Token
                  </label>
                  <input
                    type="password"
                    value={githubToken}
                    onChange={(e) => setGithubToken(e.target.value)}
                    placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>

                <div className="flex gap-3">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleConnectGithub}
                    disabled={loadingGithub}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-600 hover:to-purple-700 transition-all disabled:opacity-50"
                  >
                    {loadingGithub ? 'Подключаем...' : 'Подключить'}
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowGithubSetup(false)}
                    className="px-6 py-3 bg-white/5 border border-white/10 text-white rounded-lg font-semibold hover:bg-white/10 transition-all"
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
