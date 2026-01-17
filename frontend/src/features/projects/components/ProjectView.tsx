import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { apiClient } from '../../../api/client';
import { useProjectStore } from '../../../store/projectStore';
import type { Project, Topic } from '../../../shared/types';
import toast from 'react-hot-toast';
import { TopicSidebar } from '../../topics/components/TopicSidebar';
import { ChatView } from '../../messages/components/ChatView';
import { AppShell } from '../../../components/AppShell';
import { ProjectSidebar } from './ProjectSidebar';
import { useAuthStore } from '../../../store/authStore';
import {
  Cog6ToothIcon,
  EllipsisVerticalIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';

export const ProjectView: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const {
    currentProject,
    setCurrentProject,
    currentTopics,
    setCurrentTopics,
    projects,
    setProjects,
  } = useProjectStore();
  const { user } = useAuthStore();
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (projectId) {
      loadProject();
      loadTopics();
      loadProjects();
    }
  }, [projectId]);

  const loadProject = async () => {
    try {
      const response = await apiClient.get<Project>(`/projects/${projectId}`);
      setCurrentProject(response.data);
    } catch (error) {
      toast.error('Failed to load project');
    }
  };

  const loadProjects = async () => {
    try {
      const response = await apiClient.get<Project[]>('/projects');
      setProjects(response.data);
    } catch (error) {
      toast.error('Failed to load projects');
    }
  };

  const loadTopics = async () => {
    try {
      const response = await apiClient.get<Topic[]>(`/projects/${projectId}/topics`);
      setCurrentTopics(response.data);
      
      // Auto-select first topic
      if (response.data.length > 0 && !selectedTopicId) {
        setSelectedTopicId(response.data[0].id);
      }
    } catch (error) {
      toast.error('Failed to load topics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-slate-300">Loading...</div>
      </div>
    );
  }

  const selectedTopic = currentTopics.find((t) => t.id === selectedTopicId);
  const projectInitials = useMemo(() => {
    if (!currentProject?.name) return 'PR';
    return currentProject.name
      .split(' ')
      .map((word) => word[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }, [currentProject?.name]);

  return (
    <AppShell
      left={<ProjectSidebar />}
      middle={
        <TopicSidebar
          topics={currentTopics}
          selectedTopicId={selectedTopicId}
          onSelectTopic={setSelectedTopicId}
          onTopicCreated={loadTopics}
        />
      }
      header={
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {currentProject?.avatar_url ? (
              <img
                src={currentProject.avatar_url}
                alt={currentProject.name}
                className="h-12 w-12 rounded-2xl border border-slate-700 object-cover"
              />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-800 text-sm font-semibold text-white">
                {projectInitials}
              </div>
            )}
            <div>
              <h1 className="text-lg font-semibold text-white">
                {currentProject?.name || 'Project'}
              </h1>
              <p className="text-sm text-slate-400">
                {projects.length} проектов • {currentTopics.length} топиков
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-2 text-slate-300 hover:bg-slate-800/70 hover:text-white transition"
            >
              <UserGroupIcon className="h-5 w-5" />
            </button>
            <button
              type="button"
              className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-2 text-slate-300 hover:bg-slate-800/70 hover:text-white transition"
            >
              <Cog6ToothIcon className="h-5 w-5" />
            </button>
            <button
              type="button"
              className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-2 text-slate-300 hover:bg-slate-800/70 hover:text-white transition"
            >
              <EllipsisVerticalIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      }
      main={
        selectedTopic ? (
          <ChatView topic={selectedTopic} />
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <p className="text-slate-300">Select a topic to start chatting</p>
            </div>
          </div>
        )
      }
      right={
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-800/80 bg-slate-900/70 p-4 shadow-lg">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
              Профиль
            </p>
            <div className="mt-4 flex items-center gap-3">
              {user?.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={user.name}
                  className="h-12 w-12 rounded-full border border-slate-700 object-cover"
                />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-700 text-sm font-semibold text-white">
                  {user?.name?.[0]?.toUpperCase() || 'U'}
                </div>
              )}
              <div>
                <p className="text-sm font-semibold text-white">
                  {user?.name || 'User'}
                </p>
                <p className="text-xs text-slate-400">{user?.email || 'you@team.com'}</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800/80 bg-slate-900/70 p-4 shadow-lg">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
              Участники
            </p>
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between rounded-xl bg-slate-800/60 px-3 py-2">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-700 text-xs font-semibold text-white">
                    {user?.name?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <div>
                    <p className="text-sm text-white">{user?.name || 'You'}</p>
                    <p className="text-xs text-slate-400">Вы</p>
                  </div>
                </div>
                <span className="text-xs text-slate-400">online</span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-slate-800/40 px-3 py-2">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-600 text-xs font-semibold text-white">
                    TM
                  </div>
                  <div>
                    <p className="text-sm text-white">Team member</p>
                    <p className="text-xs text-slate-400">Админ</p>
                  </div>
                </div>
                <span className="text-xs text-slate-500">away</span>
              </div>
            </div>
            <button
              type="button"
              className="mt-4 w-full rounded-xl border border-slate-700/80 bg-slate-900/70 px-3 py-2 text-sm text-slate-200 hover:bg-slate-800/80 transition"
            >
              Пригласить участника
            </button>
          </div>
        </div>
      }
    />
  );
};
