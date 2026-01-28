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

export const ProjectWorkspace: React.FC = () => {
  const { projectId: routeProjectId } = useParams<{ projectId: string }>();
  const { projects, currentProject, setCurrentProject, setProjects } = useProjectStore();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isProjectSettingsOpen, setIsProjectSettingsOpen] = useState(false);
  const [isFavoritesOpen, setIsFavoritesOpen] = useState(false);

  const loadProjects = useCallback(async () => {
    try {
      const response = await apiClient.get<Project[]>('/projects');
      setProjects(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      toast.error('Failed to load projects');
    }
  }, [setProjects]);

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
  const openFavoritesModal = () => setIsFavoritesOpen(true);

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
