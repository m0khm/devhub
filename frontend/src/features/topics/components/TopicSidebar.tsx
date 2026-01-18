import React, { useEffect, useState } from 'react';
import type { DirectMessageThread, Topic, User } from '../../../shared/types';
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
  UserCircleIcon,
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
  const topicTypeLabel: Record<Topic['type'], string> = {
    chat: 'Обсуждение',
    code: 'Код',
    deploy: 'Деплой',
    bugs: 'Баги',
    planning: 'Планирование',
    custom: 'Кастомная',
    direct: 'Личный чат',
  };

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
    <div className="flex h-full flex-col text-slate-100">
      {/* Project header */}
      <div className="border-b border-slate-800/70 px-4 py-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="truncate font-semibold text-slate-100">
            {currentProject?.name || 'Project'}
          </h2>
          <button
            type="button"
            onClick={() => setShowInviteModal(true)}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-700 px-2 py-1 text-xs font-medium text-slate-300 hover:bg-slate-800/70"
          >
            <UserPlusIcon className="h-4 w-4" />
            Invite
          </button>
        </div>
        <p className="mt-1 text-xs text-slate-400">
          {topics.length} {topics.length === 1 ? 'topic' : 'topics'}
        </p>
      </div>

      {/* Topics list */}
      <div className="flex-1 space-y-5 overflow-y-auto p-3">
        <div>
          <p className="px-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Темы
          </p>
          <div className="mt-2">
            {topics.map((topic) => (
              <button
                key={topic.id}
                onClick={() => onSelectTopic(topic.id)}
                className={`w-full flex items-center gap-3 rounded-xl px-3 py-2 transition ${
                  selectedTopicId === topic.id
                    ? 'bg-slate-800/90 text-white shadow-sm'
                    : 'text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <span
                  className={
                    selectedTopicId === topic.id ? 'text-blue-400' : 'text-slate-400'
                  }
                >
                  {typeof getTopicIcon(topic.type, topic.icon) === 'string' ? (
                    <span className="text-xl">{getTopicIcon(topic.type, topic.icon)}</span>
                  ) : (
                    getTopicIcon(topic.type, topic.icon)
                  )}
                </span>
                <span className="flex-1 text-left">
                  <span className="block truncate text-sm font-semibold">{topic.name}</span>
                  <span className="block truncate text-xs text-slate-400">
                    {topicTypeLabel[topic.type]}
                  </span>
                </span>
              </button>
            ))}
            {topics.length === 0 && (
              <p className="px-3 py-2 text-xs text-slate-500">Нет тем</p>
            )}
          </div>
        </div>

        <div>
          <p className="px-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Личные чаты
          </p>
          <div className="mt-2">
            {directThreads.map((thread) => {
              const handleLabel = thread.user?.handle ? `@${thread.user.handle}` : null;
              return (
                <button
                  key={thread.id}
                  onClick={() => onSelectTopic(thread.id)}
                  className={`w-full flex items-center gap-3 rounded-xl px-3 py-2 transition ${
                    selectedTopicId === thread.id
                      ? 'bg-slate-800/90 text-white shadow-sm'
                      : 'text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <span
                    className={
                      selectedTopicId === thread.id ? 'text-blue-400' : 'text-slate-400'
                    }
                  >
                    <UserCircleIcon className="w-5 h-5" />
                  </span>
                  <span className="flex-1 text-left">
                    <span className="block truncate text-sm font-semibold">
                      {thread.user?.name || thread.name}
                    </span>
                    <span className="block truncate text-xs text-slate-400">
                      {handleLabel ? `Личный чат · ${handleLabel}` : 'Личный чат'}
                    </span>
                  </span>
                </button>
              );
            })}
            {directThreads.length === 0 && (
              <p className="px-3 py-2 text-xs text-slate-500">Нет личных чатов</p>
            )}
          </div>
        </div>
      </div>

      {/* Create topic button */}
      <div className="border-t border-slate-800/70 p-3">
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-200 transition hover:bg-slate-800/70"
        >
          <PlusIcon className="w-5 h-5 text-slate-400" />
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
      <div className="w-full max-w-md rounded-xl bg-slate-900 p-6 text-slate-100 shadow-xl">
        <h2 className="text-2xl font-bold mb-4">Create New Topic</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">
              Topic Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950/70 px-4 py-2 text-slate-100 focus:ring-2 focus:ring-blue-500"
              placeholder="General Chat"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">
              Type
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as Topic['type'])}
              className="w-full rounded-lg border border-slate-700 bg-slate-950/70 px-4 py-2 text-slate-100 focus:ring-2 focus:ring-blue-500"
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
            <label className="mb-2 block text-sm font-medium text-slate-300">
              Description (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950/70 px-4 py-2 text-slate-100 focus:ring-2 focus:ring-blue-500"
              rows={2}
              placeholder="What's this topic for?"
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-slate-700 px-4 py-2 text-slate-200 transition hover:bg-slate-800"
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
      <div className="w-full max-w-md rounded-xl bg-slate-900 p-6 text-slate-100 shadow-xl">
        <div className="mb-4 flex items-start justify-between">
          <h2 className="text-2xl font-bold">Invite member</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-800"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <form onSubmit={submitInvite} className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">
              Search by @handle or email
            </label>
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSelectedUser(null);
              }}
              className="w-full rounded-lg border border-slate-700 bg-slate-950/70 px-4 py-2 text-slate-100 focus:ring-2 focus:ring-blue-500"
              placeholder="@devhub or jane@company.com"
            />
            {loading && <p className="mt-2 text-xs text-slate-400">Searching...</p>}
            {!loading && query.trim() && results.length === 0 && !selectedUser && (
              <p className="mt-2 text-xs text-slate-400">No users found.</p>
            )}
            {results.length > 0 && (
              <ul className="mt-2 max-h-48 overflow-y-auto rounded-lg border border-slate-700 bg-slate-950">
                {results.map((user) => (
                  <li key={user.id}>
                    <button
                      type="button"
                      onClick={() => selectUser(user)}
                      className="flex w-full flex-col px-3 py-2 text-left hover:bg-slate-800"
                    >
                      <span className="text-sm font-medium text-slate-100">{user.name}</span>
                      <span className="text-xs text-slate-400">{user.email}</span>
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
              className="flex-1 rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-800"
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
