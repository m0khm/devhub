import React from 'react';
import { Link } from 'react-router-dom';

const features = [
  {
    title: 'Единый поток решений',
    description: 'Объединяем обсуждения, задачи и файлы, чтобы команда быстрее принимала решения.',
  },
  {
    title: 'Фокус на результате',
    description: 'Понятные next steps, статусы и дедлайны — от идеи до релиза.',
  },
  {
    title: 'Прозрачность для всех',
    description: 'Видимость прогресса для команды и стейкхолдеров без лишних статусов.',
  },
];

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-slate-950 to-indigo-900 opacity-90" />
        <div className="absolute -top-32 -right-24 h-96 w-96 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-80 w-80 rounded-full bg-indigo-500/20 blur-3xl" />

        <div className="relative mx-auto flex min-h-[80vh] w-full max-w-6xl flex-col px-6 pb-20 pt-10">
          <header className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 text-lg font-semibold">
                DH
              </div>
              <span className="text-lg font-semibold tracking-wide">DevHub</span>
            </div>
            <div className="flex items-center gap-3">
              <Link
                to="/login"
                className="rounded-full border border-white/30 px-5 py-2 text-sm font-medium text-white transition hover:border-white hover:bg-white/10"
              >
                Войти
              </Link>
              <Link
                to="/register"
                className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-slate-900 transition hover:bg-blue-100"
              >
                Регистрация
              </Link>
            </div>
          </header>

          <main className="mt-16 grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <div className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.2em] text-white/70">
                Workspace для команд продукта
              </div>
              <h1 className="mt-6 text-4xl font-semibold leading-tight text-white sm:text-5xl">
                DevHub — не просто мессенджер, мы убираем разрыв между обсуждением и действиями
              </h1>
              <p className="mt-6 text-lg text-white/70">
                Собирайте контекст, планы и выполнение в одном пространстве. Больше никаких
                бесконечных чатов без результата — только ясные шаги, исполнители и движение вперед.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  to="/register"
                  className="rounded-full bg-blue-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 transition hover:bg-blue-400"
                >
                  Начать бесплатно
                </Link>
                <Link
                  to="/login"
                  className="rounded-full border border-white/30 px-6 py-3 text-sm font-semibold text-white transition hover:border-white hover:bg-white/10"
                >
                  Войти в рабочее пространство
                </Link>
              </div>
              <div className="mt-10 flex flex-wrap gap-6 text-sm text-white/60">
                <span>• Быстрый онбординг</span>
                <span>• Безопасные команды</span>
                <span>• Прозрачная аналитика</span>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl shadow-blue-500/10 backdrop-blur">
              <div className="grid gap-6">
                {features.map((feature) => (
                  <div
                    key={feature.title}
                    className="rounded-2xl border border-white/10 bg-slate-900/60 p-5 transition hover:border-white/20"
                  >
                    <h3 className="text-base font-semibold text-white">{feature.title}</h3>
                    <p className="mt-2 text-sm text-white/70">{feature.description}</p>
                  </div>
                ))}
              </div>
              <div className="mt-8 rounded-2xl border border-white/10 bg-gradient-to-br from-blue-500/20 via-indigo-500/10 to-transparent p-6">
                <p className="text-sm text-white/80">
                  «DevHub помог нам сократить время от обсуждения до релиза с недель до дней».
                </p>
                <p className="mt-3 text-xs uppercase tracking-[0.25em] text-white/50">
                  Команда продуктовой разработки
                </p>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};
