import React, { useEffect, useState } from 'react';
import { API_BASE_URL } from '../../api/client';

const ADMIN_TOKEN_KEY = 'admin_token';

type AdminStatus = 'checking' | 'authenticated' | 'unauthenticated';

type AdminDashboardSummary = {
  total_users: number;
  active_users: number;
  deleted_users: number;
};

type AdminUser = {
  id: string;
  email: string;
  name: string;
  handle?: string | null;
  last_ip?: string | null;
  created_at: string;
  updated_at: string;
};

type AdminDashboardResponse = {
  status: string;
  summary: AdminDashboardSummary;
  users: AdminUser[];
};

export const AdminPage: React.FC = () => {
  const [status, setStatus] = useState<AdminStatus>('checking');
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dashboard, setDashboard] = useState<AdminDashboardResponse | null>(null);
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(false);
  const [dashboardError, setDashboardError] = useState<string | null>(null);

  const loadDashboard = async (token: string) => {
    setIsLoadingDashboard(true);
    setDashboardError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/admin`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Invalid session');
      }

      const data = (await response.json()) as AdminDashboardResponse;
      setDashboard(data);
      return data;
    } finally {
      setIsLoadingDashboard(false);
    }
  };

  const validateSession = async (token: string) => {
    await loadDashboard(token);
  };

  useEffect(() => {
    const token = localStorage.getItem(ADMIN_TOKEN_KEY);
    if (!token) {
      setStatus('unauthenticated');
      return;
    }

    validateSession(token)
      .then(() => setStatus('authenticated'))
      .catch(() => {
        localStorage.removeItem(ADMIN_TOKEN_KEY);
        setDashboard(null);
        setStatus('unauthenticated');
      })
      .finally(() => setIsLoadingDashboard(false));
  }, []);

  useEffect(() => {
    if (status !== 'authenticated' || dashboard) {
      return;
    }

    const token = localStorage.getItem(ADMIN_TOKEN_KEY);
    if (!token) {
      return;
    }

    loadDashboard(token).catch(() => {
      setDashboardError('Не удалось загрузить данные. Попробуйте обновить страницу.');
    });
  }, [dashboard, status]);

  const refreshDashboard = async () => {
    const token = localStorage.getItem(ADMIN_TOKEN_KEY);
    if (!token) {
      setDashboardError('Сессия администратора не найдена.');
      return;
    }

    try {
      await loadDashboard(token);
    } catch {
      setDashboardError('Не удалось обновить данные.');
    } finally {
      setIsLoadingDashboard(false);
    }
  };

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_BASE_URL}/admin/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        throw new Error('Login failed');
      }

      const data = (await response.json()) as { token?: string };
      if (!data.token) {
        throw new Error('Missing token');
      }

      localStorage.setItem(ADMIN_TOKEN_KEY, data.token);
      await loadDashboard(data.token);
      setStatus('authenticated');
    } catch {
      setError('Неверные учётные данные. Попробуйте ещё раз.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    setStatus('unauthenticated');
    setDashboard(null);
  };

  if (status === 'checking') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-slate-600">Проверяем сессию администратора...</div>
      </div>
    );
  }

  if (status === 'authenticated') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-100 p-6">
        <div className="mx-auto max-w-5xl rounded-3xl bg-white p-8 shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-semibold text-slate-900">Admin Panel</h1>
              <p className="mt-2 text-slate-600">
                Доступ подтверждён. Актуальные метрики и список пользователей.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={refreshDashboard}
                className="rounded-full border border-indigo-200 px-4 py-2 text-sm font-medium text-indigo-600 transition hover:border-indigo-300 hover:text-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isLoadingDashboard}
              >
                {isLoadingDashboard ? 'Обновляем...' : 'Обновить'}
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-800"
              >
                Выйти
              </button>
            </div>
          </div>
          {dashboardError ? (
            <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {dashboardError}
            </div>
          ) : null}
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
              <div className="text-sm font-medium text-slate-500">Всего пользователей</div>
              <div className="mt-2 text-2xl font-semibold text-slate-900">
                {dashboard?.summary.total_users ?? '—'}
              </div>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
              <div className="text-sm font-medium text-slate-500">Активные пользователи</div>
              <div className="mt-2 text-2xl font-semibold text-slate-900">
                {dashboard?.summary.active_users ?? '—'}
              </div>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
              <div className="text-sm font-medium text-slate-500">Удалённые аккаунты</div>
              <div className="mt-2 text-2xl font-semibold text-slate-900">
                {dashboard?.summary.deleted_users ?? '—'}
              </div>
            </div>
          </div>
          <div className="mt-10">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-slate-900">Пользователи</h2>
              <span className="text-sm text-slate-500">
                {dashboard?.users.length ?? 0} записей
              </span>
            </div>
            <div className="mt-4 overflow-hidden rounded-2xl border border-slate-100">
              <div className="max-h-[420px] overflow-auto">
                <table className="min-w-full divide-y divide-slate-100 text-sm">
                  <thead className="bg-slate-50 text-left text-slate-500">
                    <tr>
                      <th className="px-4 py-3 font-medium">Имя</th>
                      <th className="px-4 py-3 font-medium">Email</th>
                      <th className="px-4 py-3 font-medium">Handle</th>
                      <th className="px-4 py-3 font-medium">Last IP</th>
                      <th className="px-4 py-3 font-medium">Создан</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white text-slate-700">
                    {dashboard?.users.map((user) => (
                      <tr key={user.id}>
                        <td className="px-4 py-3 font-medium text-slate-900">{user.name}</td>
                        <td className="px-4 py-3">{user.email}</td>
                        <td className="px-4 py-3">{user.handle ?? '—'}</td>
                        <td className="px-4 py-3">{user.last_ip ?? '—'}</td>
                        <td className="px-4 py-3">
                          {new Date(user.created_at).toLocaleDateString('ru-RU', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                          })}
                        </td>
                      </tr>
                    ))}
                    {dashboard?.users.length === 0 ? (
                      <tr>
                        <td className="px-4 py-4 text-center text-slate-500" colSpan={5}>
                          Пользователи пока не найдены.
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-xl">
        <h1 className="text-2xl font-semibold text-slate-900">Admin Login</h1>
        <p className="mt-2 text-sm text-slate-500">
          Используйте учётные данные администратора для входа.
        </p>
        <form onSubmit={handleLogin} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-600" htmlFor="admin-username">
              Логин
            </label>
            <input
              id="admin-username"
              type="text"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2 text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600" htmlFor="admin-password">
              Пароль
            </label>
            <input
              id="admin-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2 text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            />
          </div>
          {error ? <p className="text-sm text-red-500">{error}</p> : null}
          <button
            type="submit"
            className="w-full rounded-xl bg-indigo-600 px-4 py-2 font-medium text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Входим...' : 'Войти'}
          </button>
        </form>
      </div>
    </div>
  );
};
