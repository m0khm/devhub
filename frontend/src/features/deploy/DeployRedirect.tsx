import React, { useEffect, useMemo, useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { apiClient } from '../../api/client';
import { useProjectStore } from '../../store/projectStore';
import type { Project } from '../../shared/types';

export const DeployRedirect: React.FC = () => {
  const { currentProject, projects, setCurrentProject, setProjects } = useProjectStore();
  const [hasLoaded, setHasLoaded] = useState(false);

  const targetProject = useMemo(
    () => currentProject ?? projects[0] ?? null,
    [currentProject, projects]
  );

  useEffect(() => {
    if (targetProject || hasLoaded) return;

    const loadProjects = async () => {
      try {
        const response = await apiClient.get<Project[]>('/projects');
        const projectList = Array.isArray(response.data) ? response.data : [];
        setProjects(projectList);
        if (!currentProject && projectList.length > 0) {
          setCurrentProject(projectList[0]);
        }
      } finally {
        setHasLoaded(true);
      }
    };

    void loadProjects();
  }, [targetProject, hasLoaded, currentProject, setCurrentProject, setProjects]);

  if (targetProject) {
    return <Navigate to={`/projects/${targetProject.id}/deploy`} replace />;
  }

  if (!hasLoaded) {
    return null;
  }

  return <Navigate to="/onboarding" replace />;
};

export const LegacyDeployRedirect: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();

  if (!projectId) {
    return <Navigate to="/deploy" replace />;
  }

  return <Navigate to={`/projects/${projectId}/deploy`} replace />;
};
