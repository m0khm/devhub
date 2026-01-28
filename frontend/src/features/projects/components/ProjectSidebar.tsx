import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useProjectStore } from '../../../store/projectStore';
import { useAuthStore } from '../../../store/authStore';
import {
  ChatBubbleLeftRightIcon,
  StarIcon,
  PlusIcon,
  Cog6ToothIcon,
  ServerStackIcon,
} from '@heroicons/react/24/outline';
import { CreateProjectModal } from './CreateProjectModal';

interface ProjectSidebarProps {
  onOpenProfile?: () => void;
  onOpenFavorites?: () => void;
  onOpenProjectSettings?: () => void;
  onProjectCreated?: () => void;
}

export const ProjectSidebar: React.FC<ProjectSidebarProps> = ({
  onOpenProfile,
  onOpenFavorites,
  onOpenProjectSettings,
  onProjectCreated,
}) => {
  const { projects, currentProject } = useProjectStore();
  const user = useAuthStore((state) => state.user);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const navigate = useNavigate();
  const userDisplayName = user?.name ?? user?.handle ?? user?.email ?? 'User';
  const userInitials = userDisplayName
    .split(' ')
    .map((word) => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  const handleMessagesClick = () => {
    if (currentProject?.id) {
      navigate(`/projects/${currentProject.id}`);
      return;
    }
    navigate('/hub');
  };

  const handleSettingsClick = () => {
    if (currentProject?.id) {
      onOpenProjectSettings?.();
      return;
    }
    onOpenProfile?.();
  };

  return (
    <div className="flex h-full flex-col items-center justify-between py-4">
      <div className="flex w-full flex-col items-center gap-3">
        <button
          type="button"
          onClick={onOpenProfile}
          title="Профиль и настройки"
          className="group flex items-center gap-2 rounded-2xl border border-transparent bg-slate-900 px-3 py-2 text-left text-slate-200 shadow-inner transition hover:border-slate-700"
          aria-label="Профиль и настройки"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-transparent">
            {user?.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={userDisplayName}
                className="h-9 w-9 rounded-full border border-slate-700 object-cover"
              />
            ) : (
              <span className="text-xs font-semibold">{userInitials}</span>
            )}
          </span>
          <span className="text-xs font-medium leading-tight">
            <span className="block text-[10px] uppercase text-slate-400">Профиль</span>
            <span className="block text-sm text-slate-100">Настройки</span>
          </span>
        </button>
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
              to={`/workspace/chat/${project.id}`}
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
      <div className="flex w-full flex-col items-center gap-2 px-3">
        <button
          type="button"
          className="flex w-full items-center gap-2 rounded-2xl border border-slate-800 bg-slate-900/70 px-3 py-2 text-xs font-medium text-slate-200 transition hover:border-slate-700 hover:bg-slate-900"
          aria-label="Сообщения"
          onClick={handleMessagesClick}
        >
          <ChatBubbleLeftRightIcon className="h-4 w-4 text-slate-300" />
          <span>Сообщения</span>
        </button>
        <button
          type="button"
          className="flex w-full items-center gap-2 rounded-2xl border border-slate-800 bg-slate-900/70 px-3 py-2 text-xs font-medium text-slate-200 transition hover:border-slate-700 hover:bg-slate-900"
          aria-label="Избранное"
          onClick={onOpenFavorites}
        >
          <StarIcon className="h-4 w-4 text-slate-300" />
          <span>Избранное</span>
        </button>
        <Link
          to={currentProject?.id ? `/projects/${currentProject.id}/deploy` : '/deploy'}
          className="flex w-full items-center gap-2 rounded-2xl border border-slate-800 bg-slate-900/70 px-3 py-2 text-xs font-medium text-slate-200 transition hover:border-slate-700 hover:bg-slate-900"
          aria-label="Сервер"
        >
          <ServerStackIcon className="h-4 w-4 text-slate-300" />
          <span>Сервер</span>
        </Link>
        <button
          type="button"
          className="flex w-full items-center gap-2 rounded-2xl border border-slate-800 bg-slate-900/70 px-3 py-2 text-xs font-medium text-slate-200 transition hover:border-slate-700 hover:bg-slate-900"
          aria-label="Добавить проект"
          onClick={() => setShowCreateModal(true)}
          title="Добавить проект"
        >
          <PlusIcon className="h-4 w-4 text-slate-300" />
          <span>Добавить проект</span>
        </button>
        <button
          type="button"
          className="flex w-full items-center gap-2 rounded-2xl border border-slate-800 bg-slate-900/70 px-3 py-2 text-xs font-medium text-slate-200 transition hover:border-slate-700 hover:bg-slate-900"
          aria-label="Настройки"
          onClick={handleSettingsClick}
        >
          <Cog6ToothIcon className="h-4 w-4 text-slate-300" />
          <span>Настройки</span>
        </button>
      </div>
      <CreateProjectModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={async () => {
          await onProjectCreated?.();
          setShowCreateModal(false);
        }}
      />
    </div>
  );
};
