import React from 'react';
import { BellIcon } from '@heroicons/react/24/outline';
import { NotificationBell } from '../notifications/components/NotificationBell';

const exampleNotifications = [
  {
    id: '1',
    title: 'Новый комментарий',
    description: 'Алексей оставил комментарий в теме “Sprint planning”.',
  },
  {
    id: '2',
    title: 'Деплой завершён',
    description: 'Продакшен обновлён на версии 1.4.2.',
  },
];

export const WorkspaceNotificationsPage: React.FC = () => {
  return (
    <div className="flex min-h-full flex-col gap-6 px-6 py-6 text-text">
      <section className="rounded-3xl border border-border/80 bg-surface/70 p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-text-muted">
              Notifications
            </p>
            <h1 className="mt-2 text-2xl font-semibold text-text">
              Центр уведомлений
            </h1>
            <p className="mt-2 text-sm text-text-muted">
              Управляйте важными событиями и системными оповещениями.
            </p>
          </div>
          <NotificationBell />
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        {exampleNotifications.map((item) => (
          <div
            key={item.id}
            className="flex gap-4 rounded-3xl border border-border/80 bg-base/70 p-5"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-border/70 bg-surface/70">
              <BellIcon className="h-5 w-5 text-text-muted" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-text">{item.title}</h2>
              <p className="mt-1 text-sm text-text-muted">{item.description}</p>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
};
