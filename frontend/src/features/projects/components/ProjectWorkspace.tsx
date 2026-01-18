import React, { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { AppShell } from '../../../components/AppShell';
import { apiClient } from '../../../api/client';
import { useProjectStore } from '../../../store/projectStore';
import type { Project } from '../../../shared/types';
import { ProfileModal } from '../../profile/ProfileModal';
import { ProjectSidebar } from './ProjectSidebar';
import { ProjectView } from './ProjectView';

export const ProjectWorkspace: React.FC = () => {
  const { projectId: routeProjectId } = useParams<{ projectId: string }>();
  const { projects, currentProject, setCurrentProject, setProjects } = useProjectStore();
  const [isProfileOpen, setIsProfileOpen] = useState(false);

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

  return (
    <>
      <ProjectView projectId={activeProjectId} onOpenProfile={openProfileModal}>
        {(slots) => (
          <AppShell
            left={
              <ProjectSidebar
                onOpenProfile={openProfileModal}
                onProjectCreated={loadProjects}
              />
            }
            middle={slots.middle}
            main={slots.main}
            right={slots.right}
          />
        )}
      </ProjectView>
      <ProfileModal open={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
    </>
  );
};
