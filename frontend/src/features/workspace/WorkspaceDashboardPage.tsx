import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { apiClient } from '../../api/client';
import { useProjectStore } from '../../store/projectStore';
import type { ProjectMemberWithUser, Topic } from '../../shared/types';

export const WorkspaceDashboardPage: React.FC = () => {
  const { projectId } = useParams<{ projectId?: string }>();
  const currentProject = useProjectStore((state) => state.currentProject);
  const [members, setMembers] = useState<ProjectMemberWithUser[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [repoCount, setRepoCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!projectId) return;
    setIsLoading(true);

    Promise.all([
      apiClient.get<ProjectMemberWithUser[]>(`/projects/${projectId}/members`),
      apiClient.get<Topic[]>(`/projects/${projectId}/topics`),
      apiClient.get(`/projects/${projectId}/repos`),
    ])
      .then(([membersResponse, topicsResponse, repoResponse]) => {
        setMembers(Array.isArray(membersResponse.data) ? membersResponse.data : []);
        setTopics(Array.isArray(topicsResponse.data) ? topicsResponse.data : []);
        const repoData = Array.isArray(repoResponse.data) ? repoResponse.data : [];
        setRepoCount(repoData.length);
      })
      .catch(() => {
        setMembers([]);
        setTopics([]);
        setRepoCount(0);
      })
      .finally(() => setIsLoading(false));
  }, [projectId]);

  const basePath = projectId ? `/projects/${projectId}` : '/app';
  const stats = useMemo(
    () => [
      { label: 'Members', value: members.length },
      { label: 'Topics', value: topics.length },
      { label: 'Repos', value: repoCount },
    ],
    [members.length, topics.length, repoCount]
  );

  return (
    <div className="flex min-h-full flex-col gap-6 px-6 py-6 text-text">
      <section className="rounded-3xl border border-border/80 bg-surface/70 p-6">
        <p className="text-xs uppercase tracking-[0.3em] text-text-muted">Dashboard</p>
        <h1 className="mt-2 text-2xl font-semibold text-text">
          {currentProject ? currentProject.name : 'Workspace overview'}
        </h1>
        <p className="mt-2 text-sm text-text-muted">
          Быстрый обзор активных модулей проекта и доступ к ключевым разделам.
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl border border-border/70 bg-base/70 px-4 py-3"
            >
              <p className="text-xs uppercase tracking-[0.25em] text-text-muted">
                {stat.label}
              </p>
              <p className="mt-2 text-2xl font-semibold text-text">
                {isLoading ? '...' : stat.value}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        {[
          { label: 'Chat', description: 'Командные обсуждения и DM.', path: `${basePath}/chat` },
          { label: 'Topics', description: 'Разделы и каналы проекта.', path: `${basePath}/topics` },
          { label: 'Files', description: 'Репозитории и файлы.', path: `${basePath}/files` },
          { label: 'Code', description: 'Редактор и активности.', path: `${basePath}/code` },
          { label: 'Planning', description: 'Планы и дорожные карты.', path: `${basePath}/planning` },
          { label: 'Deploy', description: 'Релизы и окружения.', path: `${basePath}/deploy` },
          { label: 'Hub', description: 'Поиск людей и сообществ.', path: `${basePath}/hub` },
          { label: 'Profile', description: 'Личный профиль и настройки.', path: `${basePath}/profile` },
          { label: 'Notifications', description: 'Уведомления и события.', path: `${basePath}/notifications` },
          { label: 'Video', description: 'Видеозвонки по темам.', path: `${basePath}/video` },
          { label: 'Settings', description: 'Проектные настройки.', path: `${basePath}/custom` },
        ].map((item) => (
          <Link
            key={item.label}
            to={item.path}
            className="flex flex-col gap-2 rounded-3xl border border-border/80 bg-surface/60 p-5 transition hover:border-accent/60 hover:bg-surface/80"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-text">{item.label}</h2>
              <span className="text-xs uppercase tracking-[0.3em] text-text-muted">
                Open
              </span>
            </div>
            <p className="text-sm text-text-muted">{item.description}</p>
          </Link>
        ))}
      </section>
    </div>
  );
};
