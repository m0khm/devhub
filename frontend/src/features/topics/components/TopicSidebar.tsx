import React, { useState } from 'react';
import type { DirectMessageThread, Topic } from '../../../shared/types';
import { useProjectStore } from '../../../store/projectStore';
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
import { CreateTopicModal, InviteMemberModal } from './TopicModals';

interface TopicSidebarProps {
  topics: Topic[];
  directThreads: DirectMessageThread[];
  selectedTopicId: string | null;
  onSelectTopic: (topicId: string) => void;
  onTopicCreated: () => void;
}

export const TopicSidebar: React.FC<TopicSidebarProps> = ({
  topics = [], // Дефолт на пустой массив, чтобы избежать undefined
  directThreads = [], // Дефолт на пустой массив
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
      <div className="flex-1 space-y-4 overflow-y-auto px-3 py-3">
        <div>
          <p className="px-2 text-xs font-semibold uppercase tracking-wide text-text-muted">
            Темы
          </p>
          <div className="mt-2">
            {topics?.map((topic) => ( // Optional chaining для map
              <button
                key={topic.id}
                onClick={() => onSelectTopic(topic.id)}
                className={`w-full flex items-center gap-3 rounded-lg px-2.5 py-2 text-left transition ${
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
                    <span className="text-lg">{getTopicIcon(topic.type, topic.icon)}</span>
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
            {directThreads?.map((thread) => ( // Optional chaining для map
              <button
                key={thread.id}
                onClick={() => onSelectTopic(thread.id)}
                className={`w-full flex items-center gap-3 rounded-lg px-2.5 py-2 text-left transition ${
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
                  <span
                    className={
                      selectedTopicId === thread.id ? 'text-blue-400' : 'text-slate-400'
                    }
                  >
                    <UserCircleIcon className="w-5 h-5" />
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
