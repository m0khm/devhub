import React from 'react';
import { Link } from 'react-router-dom';
import { useProjectStore } from '../../../store/projectStore';
import { ChatBubbleLeftRightIcon, StarIcon } from '@heroicons/react/24/outline';

export const ProjectSidebar: React.FC = () => {
  const { projects, currentProject } = useProjectStore();

  return (
    <div className="flex h-full flex-col">
      <div className="px-4 py-5">
        <div className="text-xs font-semibold uppercase tracking-widest text-slate-400">
          Проекты
        </div>
      </div>
      <div className="flex-1 space-y-1 overflow-y-auto px-3 pb-4">
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
              className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition ${
                isActive
                  ? 'bg-slate-800/80 text-white shadow-md'
                  : 'text-slate-300 hover:bg-slate-800/60'
              }`}
            >
              {project.avatar_url ? (
                <img
                  src={project.avatar_url}
                  alt={project.name}
                  className="h-9 w-9 rounded-full border border-slate-700 object-cover"
                />
              ) : (
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-700 text-xs font-semibold text-white">
                  {initials}
                </div>
              )}
              <div className="min-w-0">
                <p className="truncate font-medium">{project.name}</p>
                <p className="text-xs text-slate-400">Командный чат</p>
              </div>
            </Link>
          );
        })}
      </div>
      <div className="border-t border-slate-800/80 px-3 py-4">
        <div className="text-xs font-semibold uppercase tracking-widest text-slate-400">
          Чаты
        </div>
        <div className="mt-3 space-y-2">
          <button
            type="button"
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-300 transition hover:bg-slate-800/60"
          >
            <ChatBubbleLeftRightIcon className="h-5 w-5 text-slate-400" />
            Все сообщения
          </button>
          <button
            type="button"
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-300 transition hover:bg-slate-800/60"
          >
            <StarIcon className="h-5 w-5 text-slate-400" />
            Избранное
          </button>
        </div>
      </div>
    </div>
  );
};
