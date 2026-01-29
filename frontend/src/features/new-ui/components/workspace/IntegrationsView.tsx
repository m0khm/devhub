import { motion } from 'motion/react';
import { Plug, ShieldCheck, Workflow } from 'lucide-react';

export function IntegrationsView() {
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

        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-6">
            <div className="mb-3 flex items-center gap-3 text-white">
              <Workflow className="h-5 w-5 text-emerald-400" />
              <span className="text-lg font-semibold">Сценарии автоматизации</span>
            </div>
            <p className="text-sm text-slate-400">
              Создавайте цепочки действий, чтобы обновления задач и уведомления
              проходили без ручных шагов.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 p-6">
            <div className="mb-3 flex items-center gap-3 text-white">
              <ShieldCheck className="h-5 w-5 text-cyan-300" />
              <span className="text-lg font-semibold">Безопасные подключения</span>
            </div>
            <p className="text-sm text-slate-400">
              Подключения будут доступны в ближайших релизах. Мы обеспечим
              прозрачные права доступа и контроль.
            </p>
            <button
              type="button"
              className="mt-4 rounded-xl bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
            >
              Запросить интеграцию
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
