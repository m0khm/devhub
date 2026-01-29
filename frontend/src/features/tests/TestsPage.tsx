import React from 'react';
import { useParams } from 'react-router-dom';

export const TestsPage: React.FC = () => {
  const { projectId } = useParams();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <p className="text-xs uppercase tracking-widest text-slate-500">Project</p>
        <h1 className="mt-2 text-3xl font-semibold">Tests · {projectId ?? 'Workspace'}</h1>
        <p className="mt-3 text-sm text-slate-400">
          Обзор тестовых запусков, отчетов и статусов проверки качества.
        </p>
        <div className="mt-8 rounded-2xl border border-white/10 bg-slate-900/60 p-6">
          <p className="text-sm font-semibold text-slate-100">Последние проверки</p>
          <ul className="mt-4 space-y-3 text-sm text-slate-300">
            <li>• CI pipeline завершен успешно (unit tests).</li>
            <li>• Регрессионные тесты в очереди.</li>
            <li>• Настройте уведомления для новых запусков.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
