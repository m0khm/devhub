import React, { useState } from 'react';
import type { Topic } from '../../../shared/types';
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
} from '@heroicons/react/24/outline';

interface TopicSidebarProps {
  topics: Topic[];
  selectedTopicId: string | null;
  onSelectTopic: (topicId: string) => void;
  onTopicCreated: () => void;
}

export const TopicSidebar: React.FC<TopicSidebarProps> = ({
  topics,
  selectedTopicId,
  onSelectTopic,
  onTopicCreated,
}) => {
  const { currentProject } = useProjectStore();
  const [showCreateModal, setShowCreateModal] = useState(false);

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
    <div className="flex h-full flex-col">
      {/* Project header */}
      <div className="px-4 py-5 border-b border-slate-800/70">
        <h2 className="font-semibold text-white truncate">
          {currentProject?.name || 'Project'}
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          {topics.length} {topics.length === 1 ? 'topic' : 'topics'}
        </p>
      </div>

      {/* Topics list */}
      <div className="flex-1 overflow-y-auto p-3">
        {topics.map((topic) => (
          <button
            key={topic.id}
            onClick={() => onSelectTopic(topic.id)}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl mb-2 transition ${
              selectedTopicId === topic.id
                ? 'bg-slate-800/80 text-white shadow'
                : 'text-slate-300 hover:bg-slate-800/60'
            }`}
          >
            <span
              className={
                selectedTopicId === topic.id ? 'text-sky-300' : 'text-slate-400'
              }
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
      </div>

      {/* Create topic button */}
      <div className="p-3 border-t border-slate-800/70">
        <button
          onClick={() => setShowCreateModal(true)}
          className="w-full flex items-center gap-2 px-3 py-2 text-slate-300 hover:bg-slate-800/60 rounded-xl transition"
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
