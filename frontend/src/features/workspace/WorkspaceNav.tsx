import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  BellIcon,
  CalendarDaysIcon,
  ChatBubbleLeftRightIcon,
  CodeBracketIcon,
  Cog6ToothIcon,
  HomeIcon,
  PlayCircleIcon,
  RocketLaunchIcon,
  Squares2X2Icon,
  UserCircleIcon,
  VideoCameraIcon,
} from '@heroicons/react/24/outline';

interface WorkspaceNavProps {
  projectId?: string;
}

const navLinkStyles = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-3 rounded-xl border px-3 py-2 text-sm font-medium transition ${
    isActive
      ? 'border-accent/60 bg-accent/10 text-accent'
      : 'border-transparent text-text-muted hover:border-border/70 hover:text-text'
  }`;

export const WorkspaceNav: React.FC<WorkspaceNavProps> = ({ projectId }) => {
  const basePath = projectId ? `/projects/${projectId}` : '/app';

  return (
    <nav className="flex h-full flex-col gap-6 px-4 py-6 text-sm">
      <div>
        <p className="px-3 text-xs uppercase tracking-[0.3em] text-text-muted">
          Workspace
        </p>
        <div className="mt-3 space-y-2">
          <NavLink end to={basePath} className={navLinkStyles}>
            <HomeIcon className="h-5 w-5" />
            Dashboard
          </NavLink>
          <NavLink to={`${basePath}/chat`} className={navLinkStyles}>
            <ChatBubbleLeftRightIcon className="h-5 w-5" />
            Chat
          </NavLink>
          <NavLink to={`${basePath}/topics`} className={navLinkStyles}>
            <Squares2X2Icon className="h-5 w-5" />
            Topics
          </NavLink>
          <NavLink to={`${basePath}/files`} className={navLinkStyles}>
            <CodeBracketIcon className="h-5 w-5" />
            Files
          </NavLink>
        </div>
      </div>

      <div>
        <p className="px-3 text-xs uppercase tracking-[0.3em] text-text-muted">Build</p>
        <div className="mt-3 space-y-2">
          <NavLink to={`${basePath}/code`} className={navLinkStyles}>
            <CodeBracketIcon className="h-5 w-5" />
            Code
          </NavLink>
          <NavLink to={`${basePath}/planning`} className={navLinkStyles}>
            <CalendarDaysIcon className="h-5 w-5" />
            Planning
          </NavLink>
          <NavLink to={`${basePath}/deploy`} className={navLinkStyles}>
            <RocketLaunchIcon className="h-5 w-5" />
            Deploy
          </NavLink>
        </div>
      </div>

      <div>
        <p className="px-3 text-xs uppercase tracking-[0.3em] text-text-muted">
          Connect
        </p>
        <div className="mt-3 space-y-2">
          <NavLink to={`${basePath}/hub`} className={navLinkStyles}>
            <PlayCircleIcon className="h-5 w-5" />
            Hub
          </NavLink>
          <NavLink to={`${basePath}/profile`} className={navLinkStyles}>
            <UserCircleIcon className="h-5 w-5" />
            Profile
          </NavLink>
          <NavLink to={`${basePath}/notifications`} className={navLinkStyles}>
            <BellIcon className="h-5 w-5" />
            Notifications
          </NavLink>
          <NavLink to={`${basePath}/video`} className={navLinkStyles}>
            <VideoCameraIcon className="h-5 w-5" />
            Video
          </NavLink>
          <NavLink to={`${basePath}/custom`} className={navLinkStyles}>
            <Cog6ToothIcon className="h-5 w-5" />
            Settings
          </NavLink>
        </div>
      </div>
    </nav>
  );
};
