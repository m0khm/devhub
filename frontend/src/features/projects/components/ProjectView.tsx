import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { apiClient } from '../../../api/client';
import { useProjectStore } from '../../../store/projectStore';
import type {
  DirectMessageThread,
  Project,
  ProjectMemberWithUser,
  Topic,
} from '../../../shared/types';
import toast from 'react-hot-toast';
import { TopicSidebar } from '../../topics/components/TopicSidebar';
import { ChatView } from '../../messages/components/ChatView';

interface ProjectViewSlots {
  middle: React.ReactNode;
  main: React.ReactNode;
  members: ProjectMemberWithUser[];
  membersLoading: boolean;
}

interface ProjectViewProps {
  projectId?: string;
  onOpenProfile?: () => void;
  children?: (slots: ProjectViewSlots) => React.ReactNode;
}

export const ProjectView: React.FC<ProjectViewProps> = ({
  projectId,
  onOpenProfile,
  children,
}) => {
  const { projectId: routeProjectId } = useParams<{ projectId: string }>();
  const {
    currentProject,
    setCurrentProject,
    currentTopics,
    setCurrentTopics,
    setProjects,
  } = useProjectStore();
  const resolvedProjectId = projectId ?? routeProjectId ?? currentProject?.id;
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  const [directThreads, setDirectThreads] = useState<DirectMessageThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<ProjectMemberWithUser[]>([]);
  const [membersLoading, setMembersLoading] = useState(true);

  useEffect(() => {
    if (!resolvedProjectId) return;

    setLoading(true);
    setMembersLoading(true);
    setSelectedTopicId(null);
    Promise.all([
      loadProject(resolvedProjectId),
      loadTopics(resolvedProjectId),
      loadDirectThreads(resolvedProjectId),
      loadProjects(),
      loadMembers(resolvedProjectId),
    ]).finally(() => {
      setLoading(false);
    });
  }, [resolvedProjectId]);

  useEffect(() => {
    if (selectedTopicId) {
      return;
    }

    const defaultTopic = currentTopics[0] || directThreads[0];
    if (defaultTopic) {
      setSelectedTopicId(defaultTopic.id);
    }
  }, [currentTopics, directThreads, selectedTopicId]);

  const loadProject = async (id: string) => {
    try {
      const response = await apiClient.get<Project>(`/projects/${id}`);
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

  const loadTopics = async (id: string) => {
    try {
      const response = await apiClient.get<Topic[]>(`/projects/${id}/topics`);
      const topics = Array.isArray(response.data) ? response.data : [];
      const standardTopics = topics.filter((topic) => topic.type !== 'direct');
      setCurrentTopics(standardTopics);
    } catch (error) {
      toast.error('Failed to load topics');
    }
  };

  const loadDirectThreads = async (id: string) => {
    try {
      const response = await apiClient.get<DirectMessageThread[]>('/dm', {
        params: { projectId: id },
      });
      setDirectThreads(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      toast.error('Failed to load direct messages');
    }
  };

  const loadMembers = async (id: string) => {
    try {
      const response = await apiClient.get<ProjectMemberWithUser[]>(
        `/projects/${id}/members`
      );
      setMembers(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      toast.error('Failed to load project members');
    }
    setMembersLoading(false);
  };

  const selectedTopic =
    currentTopics.find((t) => t.id === selectedTopicId) ||
    directThreads.find((thread) => thread.id === selectedTopicId);

  const slots: ProjectViewSlots = !resolvedProjectId
    ? {
        middle: (
          <div className="flex h-full items-center justify-center px-6 text-sm text-slate-400">
            Select a project
          </div>
        ),
        main: (
          <div className="flex h-full items-center justify-center text-slate-300">
            Choose a project from the left to view topics and chat.
          </div>
        ),
        members,
        membersLoading,
      }
    : {
        middle: (
          <TopicSidebar
            topics={currentTopics}
            directThreads={directThreads}
            selectedTopicId={selectedTopicId}
            onSelectTopic={setSelectedTopicId}
            onTopicCreated={() => loadTopics(resolvedProjectId)}
          />
        ),
        main: (
          <div className="flex h-full min-w-0 flex-col">
            {loading ? (
              <div className="flex flex-1 items-center justify-center">
                <div className="text-slate-300">Loading...</div>
              </div>
            ) : selectedTopic ? (
              <ChatView
                topic={selectedTopic}
                onOpenProfile={onOpenProfile}
                onTopicDeleted={handleTopicDeleted}
              />
            ) : (
              <div className="flex flex-1 items-center justify-center">
                <div className="text-center">
                  <p className="text-slate-300">Select a topic to start chatting</p>
                </div>
              </div>
            )}
          </div>
        ),
        members,
        membersLoading,
      };

  if (children) {
    return <>{children(slots)}</>;
  }

  return (
    <div className="flex h-full min-w-0">
      <aside className="w-72 border-r border-slate-800/80 bg-slate-900/80 backdrop-blur">
        {slots.middle}
      </aside>
      <div className="flex-1 min-w-0 bg-slate-900/60">{slots.main}</div>
    </div>
  );
};
