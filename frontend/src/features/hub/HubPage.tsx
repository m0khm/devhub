import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { apiClient } from '../../api/client';
import type { Community, Group, Project, User } from '../../shared/types';

const emptyState = {
  users: [] as User[],
  groups: [] as Group[],
  communities: [] as Community[],
};

export const HubPage: React.FC = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(emptyState);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);

  useEffect(() => {
    const loadProjects = async () => {
      setIsLoadingProjects(true);
      try {
        const response = await apiClient.get<Project[]>('/projects');
        setProjects(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        toast.error('Не удалось загрузить проекты');
      } finally {
        setIsLoadingProjects(false);
      }
    };

    void loadProjects();
  }, []);

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setResults(emptyState);
      return;
    }

    const timeout = window.setTimeout(async () => {
      setIsSearching(true);
      try {
        const [usersResponse, groupsResponse, communitiesResponse] = await Promise.all([
          apiClient.get<User[]>('/users', { params: { query: trimmed } }),
          apiClient.get<Group[]>('/groups', { params: { query: trimmed } }),
          apiClient.get<Community[]>('/communities', { params: { query: trimmed } }),
        ]);

        setResults({
          users: Array.isArray(usersResponse.data) ? usersResponse.data : [],
          groups: Array.isArray(groupsResponse.data) ? groupsResponse.data : [],
          communities: Array.isArray(communitiesResponse.data) ? communitiesResponse.data : [],
        });
      } catch (error) {
        toast.error('Не удалось выполнить поиск');
      } finally {
        setIsSearching(false);
      }
    }, 350);

    return () => window.clearTimeout(timeout);
  }, [query]);

  const stats = useMemo(
    () => ({
      users: results.users.length,
      groups: results.groups.length,
      communities: results.communities.length,
    }),
    [results]
  );

  return (
    <div className="min-h-screen bg-base text-text">
      <div className="border-b border-border/70 bg-surface/70 px-6 py-6">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-text-muted">Hub</p>
              <h1 className="text-2xl font-semibold text-text">Поиск людей, групп и сообществ</h1>
            </div>
            <div className="flex items-center gap-3">
              <Link
                to="/app"
                className="rounded-full border border-border/80 px-4 py-2 text-sm font-medium text-text transition hover:border-accent hover:text-accent"
              >
                Вернуться в рабочее пространство
              </Link>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm text-text-muted" htmlFor="hub-search">
              Поиск по людям, группам и сообществам
            </label>
            <input
              id="hub-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Например, дизайнеры, fintech, @anna"
              className="w-full rounded-2xl border border-border/80 bg-surface px-4 py-3 text-base text-text outline-none transition focus:border-accent"
            />
            <div className="flex flex-wrap gap-4 text-sm text-text-muted">
              <span>Люди: {stats.users}</span>
              <span>Группы: {stats.groups}</span>
              <span>Сообщества: {stats.communities}</span>
              {isSearching && <span className="text-accent">Поиск...</span>}
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto grid w-full max-w-6xl gap-8 px-6 py-8 lg:grid-cols-[2fr_1fr]">
        <div className="grid gap-6">
          <section className="rounded-3xl border border-border/80 bg-surface/70 p-6">
            <h2 className="text-lg font-semibold text-text">Люди</h2>
            <p className="mt-1 text-sm text-text-muted">
              {query.trim()
                ? 'Результаты поиска по пользователям'
                : 'Введите запрос, чтобы найти участников'}
            </p>
            <div className="mt-4 grid gap-3">
              {results.users.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border/80 px-4 py-6 text-sm text-text-muted">
                  Пока нет подходящих пользователей.
                </div>
              ) : (
                results.users.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between rounded-2xl border border-border/70 bg-base px-4 py-3"
                  >
                    <div>
                      <div className="font-medium text-text">{user.name}</div>
                      <div className="text-sm text-text-muted">
                        {user.handle ? `@${user.handle}` : user.email}
                      </div>
                    </div>
                    <span className="rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">
                      Пользователь
                    </span>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="rounded-3xl border border-border/80 bg-surface/70 p-6">
            <h2 className="text-lg font-semibold text-text">Группы</h2>
            <p className="mt-1 text-sm text-text-muted">Команды внутри компании и проектные кружки</p>
            <div className="mt-4 grid gap-3">
              {results.groups.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border/80 px-4 py-6 text-sm text-text-muted">
                  Пока нет подходящих групп.
                </div>
              ) : (
                results.groups.map((group) => (
                  <div
                    key={group.id}
                    className="rounded-2xl border border-border/70 bg-base px-4 py-3"
                  >
                    <div className="font-medium text-text">{group.name}</div>
                    <div className="text-sm text-text-muted">
                      {group.description ?? 'Описание пока не добавлено.'}
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="rounded-3xl border border-border/80 bg-surface/70 p-6">
            <h2 className="text-lg font-semibold text-text">Сообщества</h2>
            <p className="mt-1 text-sm text-text-muted">
              Экосистемы, партнерские сети и внешние сообщества
            </p>
            <div className="mt-4 grid gap-3">
              {results.communities.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border/80 px-4 py-6 text-sm text-text-muted">
                  Пока нет подходящих сообществ.
                </div>
              ) : (
                results.communities.map((community) => (
                  <div
                    key={community.id}
                    className="rounded-2xl border border-border/70 bg-base px-4 py-3"
                  >
                    <div className="font-medium text-text">{community.name}</div>
                    <div className="text-sm text-text-muted">
                      {community.description ?? 'Описание пока не добавлено.'}
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

        <aside className="grid gap-6">
          <section className="rounded-3xl border border-border/80 bg-surface/70 p-6">
            <h2 className="text-lg font-semibold text-text">Проекты</h2>
            <p className="mt-1 text-sm text-text-muted">
              Быстрый переход в рабочие пространства проектов
            </p>
            <div className="mt-4 grid gap-3">
              {isLoadingProjects ? (
                <div className="rounded-2xl border border-dashed border-border/80 px-4 py-6 text-sm text-text-muted">
                  Загружаем проекты...
                </div>
              ) : projects.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border/80 px-4 py-6 text-sm text-text-muted">
                  У вас пока нет доступных проектов.
                </div>
              ) : (
                projects.map((project) => (
                  <div
                    key={project.id}
                    className="flex items-center justify-between rounded-2xl border border-border/70 bg-base px-4 py-3"
                  >
                    <div>
                      <div className="font-medium text-text">{project.name}</div>
                      <div className="text-sm text-text-muted">
                        {project.description ?? 'Без описания'}
                      </div>
                    </div>
                    <Link
                      to={`/projects/${project.id}`}
                      className="rounded-full border border-accent/60 px-3 py-1 text-xs font-semibold text-accent transition hover:bg-accent/10"
                    >
                      Открыть
                    </Link>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="rounded-3xl border border-border/80 bg-gradient-to-br from-accent/15 via-transparent to-transparent p-6">
            <h3 className="text-base font-semibold text-text">Добавляйте новые связи</h3>
            <p className="mt-2 text-sm text-text-muted">
              Создавайте группы и сообщества, чтобы расширять сеть вашей команды и подключать новые
              проекты.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                to="/app"
                className="rounded-full bg-accent px-4 py-2 text-xs font-semibold text-white"
              >
                Перейти в Workspace
              </Link>
              <Link
                to="/profile"
                className="rounded-full border border-border/80 px-4 py-2 text-xs font-semibold text-text transition hover:border-accent hover:text-accent"
              >
                Обновить профиль
              </Link>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
};
