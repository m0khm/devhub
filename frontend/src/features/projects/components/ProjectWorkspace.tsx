import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { AppShell } from '../../../components/AppShell';
import { useProjectStore } from '../../../store/projectStore';
import { ProfileModal } from '../../profile/ProfileModal';
import { ProjectSidebar } from './ProjectSidebar';
import { ProjectView } from './ProjectView';

export const ProjectWorkspace: React.FC = () => {
  const { projectId: routeProjectId } = useParams<{ projectId: string }>();
  const { projects, currentProject, setCurrentProject } = useProjectStore();
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  useEffect(() => {
    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
    };
  }, []);

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
            left={<ProjectSidebar onOpenProfile={openProfileModal} />}
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
