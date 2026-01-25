import React from 'react';
import { Link } from 'react-router-dom';

export const TermsPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 px-6 py-12">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Пользовательское соглашение</h1>
          <p className="text-slate-300">
            Это краткая версия пользовательского соглашения DevHub. Используя сервис, вы
            соглашаетесь соблюдать правила сообщества и не размещать запрещённый контент.
          </p>
        </div>

        <section className="space-y-3 text-slate-300">
          <h2 className="text-xl font-semibold text-white">Основные положения</h2>
          <ul className="list-disc space-y-2 pl-6">
            <li>Вы отвечаете за безопасность своего аккаунта.</li>
            <li>Нельзя публиковать спам или вредоносный контент.</li>
            <li>Мы можем обновлять условия и уведомлять вас об изменениях.</li>
          </ul>
        </section>

        <div className="pt-4">
          <Link to="/register" className="text-blue-400 hover:text-blue-300 font-medium">
            Вернуться к регистрации
          </Link>
        </div>
      </div>
    </div>
  );
};
