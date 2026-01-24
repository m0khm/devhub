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
  right: React.ReactNode;
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
  const [inviteUserId, setInviteUserId] = useState('');
  const [inviteRole, setInviteRole] = useState<'member' | 'admin'>('member');
  const [inviteSubmitting, setInviteSubmitting] = useState(false);

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

  const handleInvite = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!resolvedProjectId) return;
    if (!inviteUserId.trim()) {
      toast.error('Enter a user ID to invite');
      return;
    }

    try {
      setInviteSubmitting(true);
      await apiClient.post(`/projects/${resolvedProjectId}/members`, {
        user_id: inviteUserId.trim(),
        role: inviteRole,
      });
      setInviteUserId('');
      toast.success('Member invited');
      await loadMembers(resolvedProjectId);
    } catch (error) {
      toast.error('Failed to invite member');
    } finally {
      setInviteSubmitting(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!resolvedProjectId) return;
    try {
      await apiClient.delete(`/projects/${resolvedProjectId}/members/${memberId}`);
      toast.success('Member removed');
      await loadMembers(resolvedProjectId);
    } catch (error) {
      toast.error('Failed to remove member');
    }
  };

  const handleTopicDeleted = async (topicId: string) => {
    if (!resolvedProjectId) return;
    await loadTopics(resolvedProjectId);
    setSelectedTopicId((current) => (current === topicId ? null : current));
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
        right: (
          <div className="flex h-full items-center justify-center text-sm text-slate-500">
            Project details will appear here.
          </div>
        ),
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
        right: (
          <div className="flex h-full flex-col text-slate-100">
            <div className="border-b border-slate-800/70 pb-3">
              <h2 className="text-sm font-semibold text-slate-200">Members</h2>
              {currentProject && (
                <p className="mt-1 text-xs text-slate-400">Project: {currentProject.name}</p>
              )}
            </div>
            <div className="flex-1 space-y-4 overflow-y-auto pt-4">
              <form onSubmit={handleInvite} className="space-y-3">
                <div>
                  <label className="mb-1 block text-xs text-slate-400" htmlFor="invite-user-id">
                    Invite by user ID or @handle
                  </label>
                  <input
                    id="invite-user-id"
                    className="w-full rounded border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={inviteUserId}
                    onChange={(event) => setInviteUserId(event.target.value)}
                    placeholder="@devhub_user or UUID"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-slate-400" htmlFor="invite-role">
                    Role
                  </label>
                  <select
                    id="invite-role"
                    className="w-full rounded border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={inviteRole}
                    onChange={(event) => setInviteRole(event.target.value as 'member' | 'admin')}
                  >
                    <option value="member">Member</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <button
                  type="submit"
                  className="w-full rounded bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
                  disabled={inviteSubmitting}
                >
                  {inviteSubmitting ? 'Inviting...' : 'Invite'}
                </button>
              </form>

              <div>
                <h3 className="mb-2 text-xs uppercase tracking-wide text-slate-500">
                  Current members
                </h3>
                {membersLoading ? (
                  <div className="text-sm text-slate-400">Loading members...</div>
                ) : members.length === 0 ? (
                  <div className="text-sm text-slate-400">No members yet.</div>
                ) : (
                  <div className="space-y-3">
                    {members.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-start justify-between rounded border border-slate-800/80 bg-slate-900/60 p-3"
                      >
                        <div>
                          <div className="text-sm font-medium text-slate-100">
                            {member.user?.name || member.user?.email || member.user_id}
                          </div>
                          <div className="text-xs text-slate-400">{member.user?.email}</div>
                          <span className="mt-2 inline-flex items-center rounded-full bg-slate-800/80 px-2 py-0.5 text-xs text-slate-300">
                            {member.role}
                          </span>
                        </div>
                        <button
                          className="text-xs text-red-400 hover:text-red-300"
                          onClick={() => handleRemoveMember(member.user_id)}
                          type="button"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ),
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
      <aside className="hidden w-80 border-l border-slate-800/80 bg-slate-950/60 p-4 backdrop-blur lg:block">
        {slots.right}
      </aside>
    </div>
  );
};
