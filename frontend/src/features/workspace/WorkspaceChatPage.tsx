import React from 'react';
import { useParams } from 'react-router-dom';
import { ProjectView } from '../projects/components/ProjectView';

export const WorkspaceChatPage: React.FC = () => {
  const { projectId } = useParams<{ projectId?: string }>();

  return (
    <div className="flex h-full min-h-0 flex-col">
      <ProjectView projectId={projectId} />
    </div>
  );
};
