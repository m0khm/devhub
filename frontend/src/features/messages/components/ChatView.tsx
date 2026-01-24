import React, { useEffect, useState, useRef, useMemo } from 'react';
import type { Mention, Topic, Message } from '../../../shared/types';
import { apiClient } from '../../../api/client';
import { wsClient } from '../../../api/websocket';
import { useAuthStore } from '../../../store/authStore';
import { useMessageStore } from '../../../store/messageStore';
import { useNotificationStore } from '../../../store/notificationStore';
import { useThemeStore } from '../../../store/themeStore';
import toast from 'react-hot-toast';
import { MessageList } from './MessageList';
import { MessageItem } from './MessageItem';
import { MessageInput } from './MessageInput';
import { SearchBar } from './SearchBar';
import { VideoCallButton } from '../../video/components/VideoCallButton';
import { TopicSettingsModal } from '../../topics/components/TopicSettingsModal';

interface ChatViewProps {
  topic: Topic;
  onOpenProfile?: () => void;
  onTopicDeleted?: (topicId: string) => void | Promise<void>;
}

export const ChatView: React.FC<ChatViewProps> = ({
  topic,
  onOpenProfile,
  onTopicDeleted,
}) => {
  const { token } = useAuthStore();
  const {
    messages,
    setMessages,
    addMessage,
    updateMessage,
    deleteMessage,
    clearMessages,
  } = useMessageStore();
  const { addNotification } = useNotificationStore();
  const { theme, toggleTheme } = useThemeStore();

  const [loading, setLoading] = useState(true);
  const [pinnedMessages, setPinnedMessages] = useState<Message[]>([]);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);
  const [replyToMessage, setReplyToMessage] = useState<Message | null>(null);
  const [threadRootId, setThreadRootId] = useState<string | null>(null);
  const [isTopicSettingsOpen, setIsTopicSettingsOpen] = useState(false);
  const typingTimeoutRef = useRef<Record<string, NodeJS.Timeout>>({});
  const messageMap = useMemo(
    () => new Map(messages.map((message) => [message.id, message])),
    [messages]
  );

  const resolveThreadRoot = (message: Message) => {
    let current = message;
    while (current.parent_id && messageMap.has(current.parent_id)) {
      const next = messageMap.get(current.parent_id);
      if (!next) break;
      current = next;
    }
    return current;
  };

  const threadRoot = threadRootId ? messageMap.get(threadRootId) ?? null : null;
  const threadMessages = useMemo(() => {
    if (!threadRootId) return [];
    const childrenMap = new Map<string, Message[]>();
    messages.forEach((message) => {
      if (!message.parent_id) return;
      const list = childrenMap.get(message.parent_id) ?? [];
      list.push(message);
      childrenMap.set(message.parent_id, list);
    });

    const sortByTime = (items: Message[]) =>
      items.sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );

    const result: Message[] = [];
    const visit = (parentId: string) => {
      const children = sortByTime(childrenMap.get(parentId) ?? []);
      children.forEach((child) => {
        result.push(child);
        visit(child.id);
      });
    };

    visit(threadRootId);
    return result;
  }, [messages, threadRootId]);

  useEffect(() => {
    clearMessages();
    setHighlightedMessageId(null);
    setPinnedMessages([]);
    setShowTopicSettings(false);
    loadMessages();
    loadPinnedMessages();

    if (token) {
      wsClient.connect(topic.id, token, {
        onNewMessage: (payload) => {
          addMessage(payload.message);
        },
        onMessageUpdated: (payload) => {
          updateMessage(payload.message.id, payload.message);
          setPinnedMessages((prev) =>
            prev.map((message) =>
              message.id === payload.message.id ? { ...message, ...payload.message } : message
            )
          );
        },
        onMessageDeleted: (payload) => {
          deleteMessage(payload.message_id);
          setPinnedMessages((prev) =>
            prev.filter((message) => message.id !== payload.message_id)
          );
        },
        onTyping: (payload) => {
          handleTyping(payload);
        },
        onReactionUpdated: (payload) => {
          updateMessage(payload.message_id, { reactions: payload.reactions });
        },
        onNotificationCreated: (payload) => {
          const notification = payload?.notification;
          if (!notification) {
            return;
          }
          if (user?.id && notification.user_id !== user.id) {
            return;
          }
          addNotification(notification);
        },
        onConnect: () => {
          console.log('WebSocket connected');
        },
        onDisconnect: () => {
          console.log('WebSocket disconnected');
        },
        onError: (err) => {
          console.error('WebSocket error:', err);
        },
      });
    }

    return () => {
      wsClient.disconnect();
      clearMessages();
      setPinnedMessages([]);

      Object.values(typingTimeoutRef.current).forEach((t) => clearTimeout(t));
      typingTimeoutRef.current = {};
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topic.id, token]);

  const loadMessages = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get<Message[]>(
        `/topics/${topic.id}/messages?limit=50`
      );
      const list = Array.isArray(response.data) ? response.data : [];
      setMessages(list.reverse()); // oldest first
    } catch (error) {
      toast.error('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const loadPinnedMessages = async () => {
    try {
      const response = await apiClient.get<Message[]>(`/topics/${topic.id}/pins`);
      setPinnedMessages(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      toast.error('Failed to load pinned messages');
    }
  };

  const handleTyping = (payload: any) => {
    const userId = payload.user_id;
    if (!userId) return;

    setTypingUsers((prev) => new Set(prev).add(userId));

    if (typingTimeoutRef.current[userId]) {
      clearTimeout(typingTimeoutRef.current[userId]);
    }

    typingTimeoutRef.current[userId] = setTimeout(() => {
      setTypingUsers((prev) => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
      delete typingTimeoutRef.current[userId];
    }, 3000);
  };

  const handleSendMessage = async (content: string, mentions: Mention[]) => {
    try {
      const metadata =
        mentions.length > 0 ? JSON.stringify({ mentions }) : undefined;
      await apiClient.post(`/topics/${topic.id}/messages`, {
        content,
        type: 'text',
        metadata,
      });
      // добавится через WS
      setReplyToMessage(null);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to send message');
    }
  };

  const handleTogglePin = async (message: Message) => {
    const isPinned = pinnedMessages.some((item) => item.id === message.id);
    try {
      if (isPinned) {
        await apiClient.delete(`/messages/${message.id}/pin`);
        setPinnedMessages((prev) => prev.filter((item) => item.id !== message.id));
      } else {
        await apiClient.post(`/messages/${message.id}/pin`);
        setPinnedMessages((prev) => [...prev, message]);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to update pin');
    }
  };

  const handleReply = (message: Message) => {
    setReplyToMessage(message);
    setThreadRootId(resolveThreadRoot(message).id);
  };

  const handleCloseThread = () => {
    setThreadRootId(null);
    setReplyToMessage(null);
  };

  const handleDeleteTopic = async () => {
    const confirmed = window.confirm(
      'Удалить тему? Все сообщения и связанные данные будут удалены.'
    );
    if (!confirmed) {
      return;
    }

    setDeleteTopicLoading(true);
    try {
      await apiClient.delete(`/topics/${topic.id}`);
      toast.success('Тема удалена');
      setShowTopicSettings(false);
      await onTopicDeleted?.(topic.id);
    } catch (error: unknown) {
      const message =
        error && typeof error === 'object' && 'response' in error
          ? (error as { response?: { data?: { error?: string } } }).response?.data
              ?.error
          : undefined;
      toast.error(message || 'Не удалось удалить тему');
    } finally {
      setDeleteTopicLoading(false);
    }
  };

  return (
    <div className="flex-1 flex min-h-0 flex-col">
      {/* Topic header */}
      <div className="flex items-center justify-between border-b border-border/70 bg-surface/80 px-6 py-4 shadow-sm">
        <div>
          <button
            type="button"
            onClick={() => setIsTopicSettingsOpen(true)}
            className="text-left text-xl font-semibold text-text hover:text-accent"
          >
            {topic.name}
          </button>
          {topic.description && (
            <p className="text-sm text-text-muted mt-1">{topic.description}</p>
          )}
        </div>

        <div className="flex items-center gap-2">
          {topic.type !== 'direct' && (
            <button
              type="button"
              onClick={() => setShowTopicSettings(true)}
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface-muted px-3 py-2 text-sm text-text transition hover:bg-surface"
              aria-label="Настройки темы"
              title="Настройки темы"
            >
              <span aria-hidden>⚙️</span>
              <span className="hidden sm:inline">Тема</span>
            </button>
          )}
          {onOpenProfile && (
            <button
              type="button"
              onClick={onOpenProfile}
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface-muted px-3 py-2 text-sm text-text transition hover:bg-surface"
              aria-label="Настройки профиля"
              title="Настройки профиля"
            >
              <span aria-hidden>👤</span>
              <span className="hidden sm:inline">Профиль</span>
            </button>
          )}
          <button
            type="button"
            onClick={toggleTheme}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface-muted px-3 py-2 text-sm text-text transition hover:bg-surface"
            aria-label="Toggle theme"
          >
            <span aria-hidden>{theme === 'dark' ? '🌙' : '☀️'}</span>
            <span className="hidden sm:inline">
              {theme === 'dark' ? 'Dark' : 'Light'}
            </span>
          </button>
          <VideoCallButton topicId={topic.id} />
          <SearchBar topicId={topic.id} onJumpToMessage={setHighlightedMessageId} />
        </div>
      </div>
      <TopicSettingsModal
        open={isTopicSettingsOpen}
        onClose={() => setIsTopicSettingsOpen(false)}
        topicId={topic.id}
      />

      <div className="flex-1 min-h-0 flex">
        <div className="flex-1 min-h-0 flex flex-col">
          {/* Messages */}
          <MessageList
            messages={messages ?? []}
            pinnedMessages={pinnedMessages ?? []}
            loading={loading}
            highlightedMessageId={highlightedMessageId}
            onReply={handleReply}
            onTogglePin={handleTogglePin}
          />

          {/* Typing indicator */}
          {typingUsers.size > 0 && (
            <div className="px-6 py-2 text-sm text-text-muted italic">
              Someone is typing...
            </div>
          )}

          {/* Message input */}
          <MessageInput
            topicId={topic.id}
            onSend={handleSendMessage}
            replyTo={replyToMessage}
            onCancelReply={() => setReplyToMessage(null)}
          />
        </div>
      </div>

      {showTopicSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-surface p-6 text-text shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-semibold text-text">Настройки темы</h3>
                <p className="text-sm text-text-muted">
                  Управляйте параметрами выбранной темы.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowTopicSettings(false)}
                className="rounded-full border border-border p-2 text-text-muted transition hover:text-text"
                aria-label="Закрыть настройки темы"
              >
                ✕
              </button>
            </div>

            <div className="mt-6 space-y-6">
              <section className="rounded-xl border border-border/70 bg-surface-muted/40 p-4">
                <h4 className="text-sm font-semibold text-text">Общие</h4>
                <div className="mt-3 space-y-2 text-sm text-text-muted">
                  <div>
                    <span className="font-medium text-text">Название:</span>{' '}
                    {topic.name}
                  </div>
                  <div>
                    <span className="font-medium text-text">Описание:</span>{' '}
                    {topic.description || 'Не задано'}
                  </div>
                </div>
              </section>

              <section className="rounded-xl border border-red-400/40 bg-red-500/10 p-4">
                <h4 className="text-sm font-semibold text-red-300">Danger Zone</h4>
                <p className="mt-2 text-sm text-red-200/90">
                  Удаление темы необратимо и приведёт к удалению всех сообщений.
                </p>
                <button
                  type="button"
                  onClick={handleDeleteTopic}
                  disabled={deleteTopicLoading}
                  className="mt-4 inline-flex items-center justify-center rounded-lg border border-red-400/60 bg-red-500/20 px-4 py-2 text-sm font-semibold text-red-200 transition hover:bg-red-500/30 disabled:opacity-60"
                >
                  {deleteTopicLoading ? 'Удаляем...' : 'Удалить тему'}
                </button>
              </section>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
