import React, { useEffect, useState } from 'react';
import type { Topic, User } from '../../../shared/types';
import { useProjectStore } from '../../../store/projectStore';
import { apiClient } from '../../../api/client';
import toast from 'react-hot-toast';
import {
  PlusIcon,
  ChatBubbleLeftIcon,
  CodeBracketIcon,
  RocketLaunchIcon,
  BugAntIcon,
  ClipboardDocumentListIcon,
  UserPlusIcon,
} from '@heroicons/react/24/outline';

interface TopicSidebarProps {
  topics: Topic[];
  directThreads: DirectMessageThread[];
  selectedTopicId: string | null;
  onSelectTopic: (topicId: string) => void;
  onTopicCreated: () => void;
}

export const TopicSidebar: React.FC<TopicSidebarProps> = ({
  topics,
  directThreads,
  selectedTopicId,
  onSelectTopic,
  onTopicCreated,
}) => {
  const { currentProject } = useProjectStore();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);

  const getTopicIcon = (type: string, icon?: string) => {
    if (icon) return icon;

    const iconMap: Record<string, React.ReactNode> = {
      chat: <ChatBubbleLeftIcon className="w-5 h-5" />,
      code: <CodeBracketIcon className="w-5 h-5" />,
      deploy: <RocketLaunchIcon className="w-5 h-5" />,
      bugs: <BugAntIcon className="w-5 h-5" />,
      planning: <ClipboardDocumentListIcon className="w-5 h-5" />,
    };

    return iconMap[type] || <ChatBubbleLeftIcon className="w-5 h-5" />;
  };

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
      {/* Project header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-semibold text-gray-900 truncate">
            {currentProject?.name || 'Project'}
          </h2>
          <button
            type="button"
            onClick={() => setShowInviteModal(true)}
            className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50"
          >
            <UserPlusIcon className="h-4 w-4" />
            Invite
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          {topics.length} {topics.length === 1 ? 'topic' : 'topics'}
        </p>
      </div>

      {/* Topics list */}
      <div className="flex-1 overflow-y-auto p-2 space-y-3">
        <div>
          <p className="px-2 text-xs font-semibold text-gray-400 uppercase tracking-wide">
            Темы
          </p>
          <div className="mt-2">
            {topics.map((topic) => (
              <button
                key={topic.id}
                onClick={() => onSelectTopic(topic.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg mb-1 transition ${
                  selectedTopicId === topic.id
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span
                  className={selectedTopicId === topic.id ? 'text-blue-600' : 'text-gray-500'}
                >
                  {typeof getTopicIcon(topic.type, topic.icon) === 'string' ? (
                    <span className="text-xl">{getTopicIcon(topic.type, topic.icon)}</span>
                  ) : (
                    getTopicIcon(topic.type, topic.icon)
                  )}
                </span>
                <span className="flex-1 text-left truncate font-medium text-sm">
                  {topic.name}
                </span>
              </button>
            ))}
            {topics.length === 0 && (
              <p className="px-3 py-2 text-xs text-gray-400">Нет тем</p>
            )}
          </div>
        </div>

        <div>
          <p className="px-2 text-xs font-semibold text-gray-400 uppercase tracking-wide">
            Личные чаты
          </p>
          <div className="mt-2">
            {directThreads.map((thread) => (
              <button
                key={thread.id}
                onClick={() => onSelectTopic(thread.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg mb-1 transition ${
                  selectedTopicId === thread.id
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span
                  className={selectedTopicId === thread.id ? 'text-blue-600' : 'text-gray-500'}
                >
                  <UserCircleIcon className="w-5 h-5" />
                </span>
                <span className="flex-1 text-left truncate font-medium text-sm">
                  {thread.user?.name || thread.name}
                </span>
              </button>
            ))}
            {directThreads.length === 0 && (
              <p className="px-3 py-2 text-xs text-gray-400">Нет личных чатов</p>
            )}
          </div>
        </div>
      </div>

      {/* Create topic button */}
      <div className="p-2 border-t border-gray-200">
        <button
          onClick={() => setShowCreateModal(true)}
          className="w-full flex items-center gap-2 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
        >
          <PlusIcon className="w-5 h-5" />
          <span className="text-sm font-medium">Add Topic</span>
        </button>
      </div>

      {showCreateModal && (
        <CreateTopicModal
          projectId={currentProject!.id}
          onClose={() => setShowCreateModal(false)}
          onCreated={() => {
            setShowCreateModal(false);
            onTopicCreated();
          }}
        />
      )}

      {showInviteModal && currentProject && (
        <InviteMemberModal
          projectId={currentProject.id}
          onClose={() => setShowInviteModal(false)}
        />
      )}
    </div>
  );
};

// Create Topic Modal
interface CreateTopicModalProps {
  projectId: string;
  onClose: () => void;
  onCreated: () => void;
}

const CreateTopicModal: React.FC<CreateTopicModalProps> = ({
  projectId,
  onClose,
  onCreated,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<Topic['type']>('chat');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await apiClient.post(`/projects/${projectId}/topics`, {
        name,
        description: description || undefined,
        type,
      });
      toast.success('Topic created!');
      onCreated();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to create topic');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-md w-full p-6">
        <h2 className="text-2xl font-bold mb-4">Create New Topic</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Topic Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="General Chat"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as Topic['type'])}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="chat">💬 Chat</option>
              <option value="code">💻 Code</option>
              <option value="deploy">🚀 Deploy</option>
              <option value="bugs">🐛 Bugs</option>
              <option value="planning">📋 Planning</option>
              <option value="custom">⚙️ Custom</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              rows={2}
              placeholder="What's this topic for?"
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface InviteMemberModalProps {
  projectId: string;
  onClose: () => void;
}

const InviteMemberModal: React.FC<InviteMemberModalProps> = ({ projectId, onClose }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!query.trim() || selectedUser) {
      setResults([]);
      return;
    }

    const handle = window.setTimeout(async () => {
      const trimmed = query.trim();
      if (!trimmed) return;

      setLoading(true);
      try {
        const response = await apiClient.get<User[]>('/users', {
          params: { query: trimmed },
        });
        setResults(response.data);
      } catch (error: any) {
        toast.error(error.response?.data?.error || 'Failed to search users');
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => window.clearTimeout(handle);
  }, [query, selectedUser]);

  const selectUser = (user: User) => {
    setSelectedUser(user);
    setQuery(`${user.name} (${user.email})`);
    setResults([]);
  };

  const submitInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) {
      toast.error('Select a user to invite');
      return;
    }

    setSubmitting(true);
    try {
      await apiClient.post(`/projects/${projectId}/members`, {
        user_id: selectedUser.id,
      });
      toast.success('Invitation sent!');
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to invite user');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-start justify-between">
          <h2 className="text-2xl font-bold">Invite member</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <form onSubmit={submitInvite} className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Search by name or email</label>
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSelectedUser(null);
              }}
              className="w-full rounded-lg border px-4 py-2 focus:ring-2 focus:ring-blue-500"
              placeholder="jane@company.com"
            />
            {loading && <p className="mt-2 text-xs text-gray-500">Searching...</p>}
            {!loading && query.trim() && results.length === 0 && !selectedUser && (
              <p className="mt-2 text-xs text-gray-500">No users found.</p>
            )}
            {results.length > 0 && (
              <ul className="mt-2 max-h-48 overflow-y-auto rounded-lg border border-gray-200 bg-white">
                {results.map((user) => (
                  <li key={user.id}>
                    <button
                      type="button"
                      onClick={() => selectUser(user)}
                      className="flex w-full flex-col px-3 py-2 text-left hover:bg-gray-50"
                    >
                      <span className="text-sm font-medium text-gray-900">{user.name}</span>
                      <span className="text-xs text-gray-500">{user.email}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !selectedUser}
              className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? 'Inviting...' : 'Invite'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
