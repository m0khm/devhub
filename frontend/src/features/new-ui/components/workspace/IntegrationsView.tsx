import { motion } from 'motion/react';
import { useState } from 'react';
import { toast } from 'sonner';
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
} from 'lucide-react';

interface IntegrationService {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  color: string;
  category: 'vcs' | 'communication' | 'ci' | 'monitoring';
}

const services: IntegrationService[] = [
  { id: 'github', name: 'GitHub', description: 'Репозитории и pull requests', icon: Github, color: 'from-gray-600 to-gray-800', category: 'vcs' },
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
  const handleConnect = (service: IntegrationService) => {
    toast.info(`${service.name}: интеграция через OAuth скоро будет реализована`);
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
            <p className="text-slate-400">Подключайте сервисы через OAuth и автоматизируйте процессы.</p>
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
              Все интеграции используют OAuth для безопасной авторизации. Мы не храним ваши пароли,
              только токены доступа с минимальными правами.
            </p>
          </div>
        </motion.div>

        {/* Service categories */}
        {Object.entries(groupedServices).map(([category, categoryServices], catIdx) => (
          <div key={category} className="mb-8">
            <h3 className="text-lg font-semibold text-white mb-4">
              {categoryLabels[category] || category}
            </h3>
            <div className="grid gap-4 md:grid-cols-2">
              {categoryServices.map((service, index) => (
                <motion.div
                  key={service.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: (catIdx * 0.1) + (index * 0.05) }}
                  whileHover={{ y: -3, scale: 1.01 }}
                  className="rounded-2xl border border-white/10 bg-slate-900/60 p-5 hover:border-white/20 transition-all"
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${service.color} flex items-center justify-center shadow-lg flex-shrink-0`}>
                      <service.icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-white">{service.name}</h4>
                      <p className="text-sm text-slate-400 mt-1">{service.description}</p>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleConnect(service)}
                        className="mt-3 flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm font-medium text-slate-200 hover:bg-white/10 transition-all"
                      >
                        <Lock className="w-3.5 h-3.5" />
                        Привязать сервис
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        ))}
      </motion.div>
    </div>
  );
}
