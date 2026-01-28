import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { apiClient } from '../../../api/client';
import type { Topic, User } from '../../../shared/types';

interface CreateTopicModalProps {
  projectId: string;
  onClose: () => void;
  onCreated: () => void;
}

export const CreateTopicModal: React.FC<CreateTopicModalProps> = ({
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

export const InviteMemberModal: React.FC<InviteMemberModalProps> = ({
  projectId,
  onClose,
}) => {
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
