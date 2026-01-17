import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { apiClient } from '../../../api/client';
import { useProjectStore } from '../../../store/projectStore';
import type { Project, ProjectMemberWithUser, Topic } from '../../../shared/types';
import toast from 'react-hot-toast';
import { TopicSidebar } from '../../topics/components/TopicSidebar';
import { ChatView } from '../../messages/components/ChatView';
import { AppShell } from '../../../components/AppShell';
import { ProjectSidebar } from './ProjectSidebar';
import { useAuthStore } from '../../../store/authStore';
import {
  Cog6ToothIcon,
  EllipsisVerticalIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';

export const ProjectView: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const {
    currentProject,
    setCurrentProject,
    currentTopics,
    setCurrentTopics,
    projects,
    setProjects,
  } = useProjectStore();
  const { user } = useAuthStore();
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  const [directThreads, setDirectThreads] = useState<DirectMessageThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<ProjectMemberWithUser[]>([]);
  const [membersLoading, setMembersLoading] = useState(true);
  const [inviteUserId, setInviteUserId] = useState('');
  const [inviteRole, setInviteRole] = useState<'member' | 'admin'>('member');
  const [inviteSubmitting, setInviteSubmitting] = useState(false);

  useEffect(() => {
    if (projectId) {
      loadProject();
      loadTopics();
      loadMembers();
    }

    setLoading(true);
    Promise.all([loadProject(), loadTopics(), loadDirectThreads()]).finally(() => {
      setLoading(false);
    });
  }, [projectId]);

  useEffect(() => {
    if (selectedTopicId) {
      return;
    }

    const defaultTopic = currentTopics[0] || directThreads[0];
    if (defaultTopic) {
      setSelectedTopicId(defaultTopic.id);
    }
  }, [currentTopics, directThreads, selectedTopicId]);

  const loadProject = async () => {
    try {
      const response = await apiClient.get<Project>(`/projects/${projectId}`);
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

  const loadTopics = async () => {
    try {
      const response = await apiClient.get<Topic[]>(`/projects/${projectId}/topics`);
      const topics = Array.isArray(response.data) ? response.data : [];
      const standardTopics = topics.filter((topic) => topic.type !== 'direct');
      setCurrentTopics(standardTopics);
    } catch (error) {
      toast.error('Failed to load topics');
    }
  };

  const loadDirectThreads = async () => {
    try {
      const response = await apiClient.get<DirectMessageThread[]>('/dm', {
        params: { projectId },
      });
      setDirectThreads(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      toast.error('Failed to load direct messages');
    }
  };

  const loadMembers = async () => {
    try {
      const response = await apiClient.get<ProjectMemberWithUser[]>(
        `/projects/${projectId}/members`
      );
      setMembers(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      toast.error('Failed to load project members');
    } finally {
      setMembersLoading(false);
    }
  };

  const handleInvite = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!inviteUserId.trim()) {
      toast.error('Enter a user ID to invite');
      return;
    }

    try {
      setInviteSubmitting(true);
      await apiClient.post(`/projects/${projectId}/members`, {
        user_id: inviteUserId.trim(),
        role: inviteRole,
      });
      setInviteUserId('');
      toast.success('Member invited');
      await loadMembers();
    } catch (error) {
      toast.error('Failed to invite member');
    } finally {
      setInviteSubmitting(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    try {
      await apiClient.delete(`/projects/${projectId}/members/${memberId}`);
      toast.success('Member removed');
      await loadMembers();
    } catch (error) {
      toast.error('Failed to remove member');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-slate-300">Loading...</div>
      </div>
    );
  }

  const selectedTopic =
    currentTopics.find((t) => t.id === selectedTopicId) ||
    directThreads.find((thread) => thread.id === selectedTopicId);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar with topics */}
      <TopicSidebar
        topics={currentTopics}
        directThreads={directThreads}
        selectedTopicId={selectedTopicId}
        onSelectTopic={setSelectedTopicId}
        onTopicCreated={loadTopics}
      />

      {/* Main chat area */}
      <div className="flex-1 flex flex-col">
        {selectedTopic ? (
          <ChatView topic={selectedTopic} />
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <p className="text-slate-300">Select a topic to start chatting</p>
            </div>
          </div>
        )}
      </div>

      {/* Members panel */}
      <div className="w-80 border-l bg-white flex flex-col">
        <div className="p-4 border-b">
          <h2 className="text-sm font-semibold text-gray-700">Members</h2>
          {currentProject && (
            <p className="text-xs text-gray-500 mt-1">Project: {currentProject.name}</p>
          )}
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <form onSubmit={handleInvite} className="space-y-3">
            <div>
              <label className="text-xs text-gray-500 block mb-1" htmlFor="invite-user-id">
                Invite user ID
              </label>
              <input
                id="invite-user-id"
                className="w-full rounded border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={inviteUserId}
                onChange={(event) => setInviteUserId(event.target.value)}
                placeholder="UUID of user"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1" htmlFor="invite-role">
                Role
              </label>
              <select
                id="invite-role"
                className="w-full rounded border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            <h3 className="text-xs uppercase text-gray-400 tracking-wide mb-2">Current members</h3>
            {membersLoading ? (
              <div className="text-sm text-gray-500">Loading members...</div>
            ) : members.length === 0 ? (
              <div className="text-sm text-gray-500">No members yet.</div>
            ) : (
              <div className="space-y-3">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-start justify-between rounded border border-gray-100 p-3"
                  >
                    <div>
                      <div className="text-sm font-medium text-gray-800">
                        {member.user?.name || member.user?.email || member.user_id}
                      </div>
                      <div className="text-xs text-gray-500">{member.user?.email}</div>
                      <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600 mt-2">
                        {member.role}
                      </span>
                    </div>
                    <button
                      className="text-xs text-red-500 hover:text-red-600"
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
    </div>
  );
};
