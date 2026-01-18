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
    <div className="flex h-full flex-col text-text">
      {/* Project header */}
      <div className="border-b border-border/70 px-4 py-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="truncate font-semibold text-text">
            {currentProject?.name || 'Project'}
          </h2>
          <button
            type="button"
            onClick={() => setShowInviteModal(true)}
            className="inline-flex items-center gap-1 rounded-lg border border-border px-2 py-1 text-xs font-medium text-text-muted hover:bg-surface-muted/70"
          >
            <UserPlusIcon className="h-4 w-4" />
            Invite
          </button>
        </div>
        <p className="mt-1 text-xs text-text-muted">
          {topics.length} {topics.length === 1 ? 'topic' : 'topics'}
        </p>
      </div>

      {/* Topics list */}
      <div className="flex-1 space-y-5 overflow-y-auto p-3">
        <div>
          <p className="px-2 text-xs font-semibold uppercase tracking-wide text-text-muted">
            Темы
          </p>
          <div className="mt-2">
            {topics.map((topic) => (
              <button
                key={topic.id}
                onClick={() => onSelectTopic(topic.id)}
                className={`w-full flex items-center gap-3 rounded-xl px-3 py-2 transition ${
                  selectedTopicId === topic.id
                    ? 'bg-surface-muted/90 text-text shadow-sm'
                    : 'text-text hover:bg-surface-muted/60'
                }`}
              >
                <span
                  className={
                    selectedTopicId === topic.id ? 'text-accent' : 'text-text-muted'
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
                  <span className="block truncate text-xs text-text-muted">
                    {topicTypeLabel[topic.type]}
                  </span>
                </span>
              </button>
            ))}
            {topics.length === 0 && (
              <p className="px-3 py-2 text-xs text-text-muted">Нет тем</p>
            )}
          </div>
        </div>

        <div>
          <p className="px-2 text-xs font-semibold uppercase tracking-wide text-text-muted">
            Личные чаты
          </p>
          <div className="mt-2">
            {directThreads.map((thread) => (
              <button
                key={thread.id}
                onClick={() => onSelectTopic(thread.id)}
                className={`w-full flex items-center gap-3 rounded-xl px-3 py-2 transition ${
                  selectedTopicId === thread.id
                    ? 'bg-surface-muted/90 text-text shadow-sm'
                    : 'text-text hover:bg-surface-muted/60'
                }`}
              >
                <span
                  className={
                    selectedTopicId === thread.id ? 'text-accent' : 'text-text-muted'
                  }
                >
                  <UserCircleIcon className="w-5 h-5" />
                </span>
                <span className="flex-1 text-left">
                  <span className="block truncate text-sm font-semibold">
                    {thread.user?.name || thread.name}
                  </span>
                  <span className="block truncate text-xs text-text-muted">
                    Личный чат
                  </span>
                </span>
              </button>
            ))}
            {directThreads.length === 0 && (
              <p className="px-3 py-2 text-xs text-text-muted">Нет личных чатов</p>
            )}
          </div>
        </div>
      </div>

      {/* Create topic button */}
      <div className="border-t border-border/70 p-3">
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-text transition hover:bg-surface-muted/70"
        >
          <PlusIcon className="w-5 h-5 text-text-muted" />
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="w-full max-w-md rounded-xl bg-surface p-6 text-text shadow-xl">
        <h2 className="text-2xl font-bold mb-4">Create New Topic</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-text-muted">
              Topic Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-border bg-base/70 px-4 py-2 text-text focus:ring-2 focus:ring-accent"
              placeholder="General Chat"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-text-muted">
              Type
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as Topic['type'])}
              className="w-full rounded-lg border border-border bg-base/70 px-4 py-2 text-text focus:ring-2 focus:ring-accent"
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
            <label className="mb-2 block text-sm font-medium text-text-muted">
              Description (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-lg border border-border bg-base/70 px-4 py-2 text-text focus:ring-2 focus:ring-accent"
              rows={2}
              placeholder="What's this topic for?"
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-border px-4 py-2 text-text transition hover:bg-surface-muted"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-lg bg-accent px-4 py-2 text-accent-foreground transition hover:bg-accent/90 disabled:opacity-50"
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
      <div className="w-full max-w-md rounded-xl bg-surface p-6 text-text shadow-xl">
        <div className="mb-4 flex items-start justify-between">
          <h2 className="text-2xl font-bold">Invite member</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-text-muted hover:bg-surface-muted"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <form onSubmit={submitInvite} className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-text-muted">
              Search by @handle or email
            </label>
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSelectedUser(null);
              }}
              className="w-full rounded-lg border border-border bg-base/70 px-4 py-2 text-text focus:ring-2 focus:ring-accent"
              placeholder="@devhub or jane@company.com"
            />
            {loading && <p className="mt-2 text-xs text-text-muted">Searching...</p>}
            {!loading && query.trim() && results.length === 0 && !selectedUser && (
              <p className="mt-2 text-xs text-text-muted">No users found.</p>
            )}
            {results.length > 0 && (
              <ul className="mt-2 max-h-48 overflow-y-auto rounded-lg border border-border bg-base">
                {results.map((user) => (
                  <li key={user.id}>
                    <button
                      type="button"
                      onClick={() => selectUser(user)}
                      className="flex w-full flex-col px-3 py-2 text-left hover:bg-surface-muted"
                    >
                      <span className="text-sm font-medium text-text">{user.name}</span>
                      <span className="text-xs text-text-muted">{user.email}</span>
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
              className="flex-1 rounded-lg border border-border px-4 py-2 text-sm font-medium text-text hover:bg-surface-muted"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !selectedUser}
              className="flex-1 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:bg-accent/90 disabled:opacity-50"
            >
              {submitting ? 'Inviting...' : 'Invite'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
