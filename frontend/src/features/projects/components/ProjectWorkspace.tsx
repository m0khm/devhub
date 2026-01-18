import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { AppShell } from '../../../components/AppShell';
import { useProjectStore } from '../../../store/projectStore';
import { NotificationBell } from '../../notifications/components/NotificationBell';
import { ProjectList } from './ProjectList';
import { ProjectView } from './ProjectView';

export const ProjectWorkspace: React.FC = () => {
  const { projectId: routeProjectId } = useParams<{ projectId: string }>();
  const { projects, currentProject, setCurrentProject } = useProjectStore();

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

  const header = (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div>
        <div className="text-sm text-text-muted">Workspace</div>
        <div className="text-lg font-semibold text-text">
          {currentProject?.name || 'Select a project'}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <NotificationBell />
      </div>
    </div>
  );

  return (
    <ProjectView projectId={activeProjectId}>
      {(slots) => (
        <AppShell
          left={<ProjectList />}
          middle={slots.middle}
          header={header}
          main={slots.main}
          right={slots.right}
        />
      )}
    </ProjectView>
  );
};
