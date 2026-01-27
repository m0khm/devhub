import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Outlet, useParams } from 'react-router-dom';
import { AppShell } from '../../components/AppShell';
import { apiClient } from '../../api/client';
import { useProjectStore } from '../../store/projectStore';
import { NotificationBell } from '../notifications/components/NotificationBell';
import { ProfileModal } from '../profile/ProfileModal';
import { ProjectSettingsModal } from '../projects/components/ProjectSettingsModal';
import { ProjectSidebar } from '../projects/components/ProjectSidebar';
import type { Project, ProjectMemberWithUser } from '../../shared/types';
import { WorkspaceNav } from './WorkspaceNav';

export const WorkspaceLayout: React.FC = () => {
  const { projectId: routeProjectId } = useParams<{ projectId?: string }>();
  const { projects, currentProject, setCurrentProject, setProjects } = useProjectStore();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isProjectSettingsOpen, setIsProjectSettingsOpen] = useState(false);
  const [members, setMembers] = useState<ProjectMemberWithUser[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);

  const loadProjects = useCallback(async () => {
    try {
      const response = await apiClient.get<Project[]>('/projects');
      setProjects(Array.isArray(response.data) ? response.data : []);
    } catch {
      // handled with UI state
    }
  }, [setProjects]);

  const loadMembers = useCallback(
    async (projectId: string) => {
      setMembersLoading(true);
      try {
        const response = await apiClient.get<ProjectMemberWithUser[]>(
          `/projects/${projectId}/members`
        );
        setMembers(Array.isArray(response.data) ? response.data : []);
      } catch {
        setMembers([]);
      } finally {
        setMembersLoading(false);
      }
    },
    [setMembers, setMembersLoading]
  );

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

  useEffect(() => {
    if (!activeProjectId) return;
    void loadMembers(activeProjectId);
  }, [activeProjectId, loadMembers]);

  const header = useMemo(
    () => (
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
          <NotificationBell />
        </div>
      </div>
    ),
    [currentProject]
  );

  return (
    <>
      <AppShell
        left={
          <ProjectSidebar
            onOpenProfile={() => setIsProfileOpen(true)}
            onProjectCreated={loadProjects}
          />
        }
        middle={<WorkspaceNav projectId={activeProjectId} />}
        main={
          <div className="flex h-full min-h-0 flex-col">
            <Outlet />
          </div>
        }
        header={header}
      />
      <ProjectSettingsModal
        open={isProjectSettingsOpen}
        onClose={() => setIsProjectSettingsOpen(false)}
        project={currentProject}
        members={members}
        membersLoading={membersLoading}
        onMembersUpdated={() => {
          if (!activeProjectId) return;
          return loadMembers(activeProjectId);
        }}
      />
      <ProfileModal open={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
    </>
  );
};
