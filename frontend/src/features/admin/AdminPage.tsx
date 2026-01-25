import React, { useEffect, useState } from 'react';
import { API_BASE_URL } from '../../api/client';

const ADMIN_TOKEN_KEY = 'admin_token';

type AdminStatus = 'checking' | 'authenticated' | 'unauthenticated';

export const AdminPage: React.FC = () => {
  const [status, setStatus] = useState<AdminStatus>('checking');
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateSession = async (token: string) => {
    const response = await fetch(`${API_BASE_URL}/admin`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Invalid session');
    }
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
        setStatus('unauthenticated');
      });
  }, []);

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
        <div className="mx-auto max-w-3xl rounded-3xl bg-white p-8 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-semibold text-slate-900">Admin Panel</h1>
              <p className="mt-2 text-slate-600">
                Доступ подтверждён. Здесь можно разместить админские метрики и управление.
              </p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-800"
            >
              Выйти
            </button>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
              <div className="text-sm font-medium text-slate-500">Статус</div>
              <div className="mt-2 text-lg font-semibold text-slate-900">Online</div>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
              <div className="text-sm font-medium text-slate-500">Доступ</div>
              <div className="mt-2 text-lg font-semibold text-slate-900">Admin token</div>
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
