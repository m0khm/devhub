import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { apiClient } from '../../api/client';
import type { Topic } from '../../shared/types';
import { VideoCallButton } from '../video/components/VideoCallButton';

export const WorkspaceVideoPage: React.FC = () => {
  const { projectId } = useParams<{ projectId?: string }>();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!projectId) return;
    setIsLoading(true);
    apiClient
      .get<Topic[]>(`/projects/${projectId}/topics`)
      .then((response) => {
        setTopics(Array.isArray(response.data) ? response.data : []);
      })
      .catch(() => {
        setTopics([]);
      })
      .finally(() => setIsLoading(false));
  }, [projectId]);

  return (
    <div className="flex min-h-full flex-col gap-6 px-6 py-6 text-text">
      <section className="rounded-3xl border border-border/80 bg-surface/70 p-6">
        <p className="text-xs uppercase tracking-[0.3em] text-text-muted">Video</p>
        <h1 className="mt-2 text-2xl font-semibold text-text">
          Видеовстречи по темам
        </h1>
        <p className="mt-2 text-sm text-text-muted">
          Запускайте звонки для активных обсуждений и синков команды.
        </p>
      </section>

      <section className="rounded-3xl border border-border/80 bg-base/70 p-5">
        <h2 className="text-lg font-semibold text-text">Темы для звонков</h2>
        {isLoading ? (
          <p className="mt-4 text-sm text-text-muted">Загрузка тем…</p>
        ) : topics.length === 0 ? (
          <p className="mt-4 text-sm text-text-muted">
            Нет доступных тем. Создайте тему в разделе Chat.
          </p>
        ) : (
          <div className="mt-4 space-y-3">
            {topics.map((topic) => (
              <div
                key={topic.id}
                className="flex items-center justify-between gap-3 rounded-2xl border border-border/70 bg-surface/80 px-4 py-3"
              >
                <div>
                  <p className="text-sm font-semibold text-text">{topic.title}</p>
                  <p className="text-xs text-text-muted">{topic.type}</p>
                </div>
                <VideoCallButton topicId={topic.id} />
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
