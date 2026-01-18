import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useProjectStore } from '../../../store/projectStore';
import {
  ChatBubbleLeftRightIcon,
  StarIcon,
  PlusIcon,
  Cog6ToothIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';

export const ProjectSidebar: React.FC = () => {
  const { projects, currentProject } = useProjectStore();
  const location = useLocation();
  const isProfileActive = location.pathname === '/profile';

  return (
    <div className="flex h-full flex-col items-center justify-between py-4">
      <div className="flex w-full flex-col items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-xs font-semibold text-slate-200 shadow-inner">
          DH
        </div>
        <div className="flex w-full flex-1 flex-col items-center gap-2 overflow-y-auto px-2 pb-4">
        {projects.map((project) => {
          const isActive = currentProject?.id === project.id;
          const initials = project.name
            .split(' ')
            .map((word) => word[0])
            .join('')
            .slice(0, 2)
            .toUpperCase();

          return (
            <Link
              key={project.id}
              to={`/projects/${project.id}`}
              title={project.name}
              className={`group flex h-11 w-11 items-center justify-center rounded-2xl border transition ${
                isActive
                  ? 'border-blue-500/80 bg-slate-900 text-white shadow-[0_0_12px_rgba(37,99,235,0.35)]'
                  : 'border-transparent bg-slate-900/60 text-slate-300 hover:border-slate-700 hover:bg-slate-900'
              }`}
            >
              {project.avatar_url ? (
                <img
                  src={project.avatar_url}
                  alt={project.name}
                  className="h-9 w-9 rounded-full border border-slate-700 object-cover"
                />
              ) : (
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-800 text-[11px] font-semibold text-white">
                  {initials}
                </div>
              )}
            </Link>
          );
        })}
        </div>
      </div>
      <div className="flex flex-col items-center gap-2">
        <button
          type="button"
          className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-800 bg-slate-900/70 text-slate-300 transition hover:border-slate-700 hover:bg-slate-900"
          aria-label="Все сообщения"
        >
          <ChatBubbleLeftRightIcon className="h-5 w-5" />
        </button>
        <button
          type="button"
          className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-800 bg-slate-900/70 text-slate-300 transition hover:border-slate-700 hover:bg-slate-900"
          aria-label="Избранное"
        >
          <StarIcon className="h-5 w-5" />
        </button>
        <button
          type="button"
          className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-800 bg-slate-900/70 text-slate-300 transition hover:border-slate-700 hover:bg-slate-900"
          aria-label="Добавить проект"
        >
          <PlusIcon className="h-5 w-5" />
        </button>
        <Link
          to="/profile"
          className={`flex h-11 w-11 items-center justify-center rounded-2xl border transition ${
            isProfileActive
              ? 'border-blue-500/80 bg-slate-900 text-white shadow-[0_0_12px_rgba(37,99,235,0.35)]'
              : 'border-slate-800 bg-slate-900/70 text-slate-300 hover:border-slate-700 hover:bg-slate-900'
          }`}
          aria-label="Профиль"
        >
          <UserCircleIcon className="h-5 w-5" />
        </Link>
        <button
          type="button"
          className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-800 bg-slate-900/70 text-slate-300 transition hover:border-slate-700 hover:bg-slate-900"
          aria-label="Настройки"
        >
          <Cog6ToothIcon className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};
