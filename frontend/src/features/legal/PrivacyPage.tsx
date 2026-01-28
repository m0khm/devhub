import React from 'react';
import { Link } from 'react-router-dom';

export const PrivacyPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 px-6 py-12">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Политика конфиденциальности</h1>
          <p className="text-slate-300">
            Здесь собрана краткая версия политики конфиденциальности DevHub. Мы бережно
            относимся к данным команд и используем их только для работы сервиса.
          </p>
        </div>

        <section className="space-y-3 text-slate-300">
          <h2 className="text-xl font-semibold text-white">Что мы собираем</h2>
          <ul className="list-disc space-y-2 pl-6">
            <li>Контактные данные для авторизации.</li>
            <li>Служебные логи, необходимые для стабильной работы.</li>
            <li>Аналитику использования, чтобы улучшать продукт.</li>
          </ul>
        </section>

        <section className="space-y-3 text-slate-300">
          <h2 className="text-xl font-semibold text-white">Ваши права</h2>
          <ul className="list-disc space-y-2 pl-6">
            <li>Запросить выгрузку данных.</li>
            <li>Удалить аккаунт и историю активности.</li>
            <li>Ограничить доступ к профилю в настройках.</li>
          </ul>
        </section>

        <div className="pt-4">
          <Link to="/" className="text-blue-400 hover:text-blue-300 font-medium">
            Вернуться на главную
          </Link>
        </div>
      </div>
    </div>
  );
};
