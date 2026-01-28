import { NotificationBell } from "../../notifications/components/NotificationBell";
import React, { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { AppShell } from '../../../components/AppShell';
import { apiClient } from '../../../api/client';
import { useProjectStore } from '../../../store/projectStore';
import type { Project } from '../../../shared/types';
import { ProfileModal } from '../../profile/ProfileModal';
import { FavoritesModal } from './FavoritesModal';
import { ProjectSidebar } from './ProjectSidebar';
import { ProjectView } from './ProjectView';
import { ProjectSettingsModal } from './ProjectSettingsModal';
import { CreateTaskModal } from './CreateTaskModal';
import { CreateTopicModal, InviteMemberModal } from '../../topics/components/TopicModals';

export const ProjectWorkspace: React.FC = () => {
  const { projectId: routeProjectId } = useParams<{ projectId: string }>();
  const {
    projects,
    currentProject,
    setCurrentProject,
    setProjects,
    setCurrentTopics,
  } = useProjectStore();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isProjectSettingsOpen, setIsProjectSettingsOpen] = useState(false);
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [isCreateTopicOpen, setIsCreateTopicOpen] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);

  const loadProjects = useCallback(async () => {
    try {
      const response = await apiClient.get<Project[]>('/projects');
      setProjects(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      toast.error('Failed to load projects');
    }
  }, [setProjects]);

  const refreshTopics = useCallback(async () => {
    if (!currentProject) return;
    try {
      const response = await apiClient.get(`/projects/${currentProject.id}/topics`);
      const topics = Array.isArray(response.data) ? response.data : [];
      setCurrentTopics(topics.filter((topic) => topic.type !== 'direct'));
    } catch (error) {
      toast.error('Failed to refresh topics');
    }
  }, [currentProject, setCurrentTopics]);

  useEffect(() => {
    void loadProjects();
  }, [loadProjects]);

  useEffect(() => {
    if (!routeProjectId && !currentProject && projects.length > 0) {
      setCurrentProject(projects[0]);
    }
  }, [routeProjectId, currentProject, projects, setCurrentProject]);

  useEffect(() => {
    if (!routeProjectId) return;
    if (currentProject?.id === routeProjectId) return;

    const match = projects.find((project) => project.id === routeProjectId);
    if (match) {
      setCurrentProject(match);
    }
  }, [routeProjectId, currentProject, projects, setCurrentProject]);

  const activeProjectId = routeProjectId ?? currentProject?.id;
  const openProfileModal = () => setIsProfileOpen(true);
  const actionDisabled = !currentProject;

  const header = (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div>
        <div className="text-sm text-text-muted">Workspace</div>
        {currentProject ? (
          <button
            type="button"
            onClick={() => setIsProjectSettingsOpen(true)}
            className="text-lg font-semibold text-text hover:text-accent"
          >
            {currentProject.name}
          </button>
        ) : (
          <div className="text-lg font-semibold text-text">Select a project</div>
        )}
      </div>
      <div className="flex items-center gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setIsCreateTaskOpen(true)}
            disabled={actionDisabled}
            className="rounded-full border border-border/80 px-3 py-1 text-xs font-semibold text-text transition hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-60"
          >
            Создать задачу
          </button>
          <button
            type="button"
            onClick={() => setIsCreateTopicOpen(true)}
            disabled={actionDisabled}
            className="rounded-full border border-border/80 px-3 py-1 text-xs font-semibold text-text transition hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-60"
          >
            Новая тема
          </button>
          <button
            type="button"
            onClick={() => setIsInviteOpen(true)}
            disabled={actionDisabled}
            className="rounded-full border border-border/80 px-3 py-1 text-xs font-semibold text-text transition hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-60"
          >
            Пригласить
          </button>
        </div>
        <Link
          to="/hub"
          className="rounded-full border border-border/80 px-3 py-1 text-xs font-semibold text-text transition hover:border-accent hover:text-accent"
        >
          Хаб
        </Link>
        <NotificationBell />
      </div>
    </div>
  );

  return (
    <>
      <ProjectView projectId={activeProjectId} onOpenProfile={openProfileModal}>
        {(slots) => (
          <>
            <AppShell
              left={
                <ProjectSidebar
                  onOpenProfile={openProfileModal}
                  onOpenFavorites={openFavoritesModal}
                  onOpenProjectSettings={() => setIsProjectSettingsOpen(true)}
                  onProjectCreated={loadProjects}
                />
              }
              middle={slots.middle}
              main={slots.main}
              header={header}
            />
            <ProjectSettingsModal
              open={isProjectSettingsOpen}
              onClose={() => setIsProjectSettingsOpen(false)}
              project={currentProject}
              members={slots.members}
              membersLoading={slots.membersLoading}
              onMembersUpdated={slots.refreshMembers}
            />
            {currentProject && isCreateTopicOpen && (
              <CreateTopicModal
                projectId={currentProject.id}
                onClose={() => setIsCreateTopicOpen(false)}
                onCreated={() => {
                  setIsCreateTopicOpen(false);
                  void refreshTopics();
                }}
              />
            )}
            {currentProject && isInviteOpen && (
              <InviteMemberModal
                projectId={currentProject.id}
                onClose={() => setIsInviteOpen(false)}
              />
            )}
            {currentProject && isCreateTaskOpen && (
              <CreateTaskModal
                projectId={currentProject.id}
                onClose={() => setIsCreateTaskOpen(false)}
              />
            )}
          </>
        )}
      </ProjectView>
      <ProfileModal open={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
      <FavoritesModal
        open={isFavoritesOpen}
        onClose={() => setIsFavoritesOpen(false)}
      />
    </>
  );
};
