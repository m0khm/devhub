import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { Topic, Message } from '../../../shared/types';
import { apiClient } from '../../../api/client';
import { wsClient } from '../../../api/websocket';
import { useAuthStore } from '../../../store/authStore';
import { useMessageStore } from '../../../store/messageStore';
import { useThemeStore } from '../../../store/themeStore';
import toast from 'react-hot-toast';
import { MessageList } from './MessageList';
import { MessageItem } from './MessageItem';
import { MessageInput } from './MessageInput';
import { SearchBar } from './SearchBar';
import { VideoCallButton } from '../../video/components/VideoCallButton';

interface ChatViewProps {
  topic: Topic;
}

export const ChatView: React.FC<ChatViewProps> = ({ topic }) => {
  const { token } = useAuthStore();
  const {
    messages,
    setMessages,
    addMessage,
    updateMessage,
    deleteMessage,
    clearMessages,
  } = useMessageStore();
  const { theme, toggleTheme } = useThemeStore();

  const [loading, setLoading] = useState(true);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);
  const [replyToMessage, setReplyToMessage] = useState<Message | null>(null);
  const [threadRootId, setThreadRootId] = useState<string | null>(null);
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
    loadMessages();

    if (token) {
      wsClient.connect(topic.id, token, {
        onNewMessage: (payload) => {
          addMessage(payload.message);
        },
        onMessageUpdated: (payload) => {
          updateMessage(payload.message.id, payload.message);
        },
        onMessageDeleted: (payload) => {
          deleteMessage(payload.message_id);
        },
        onTyping: (payload) => {
          handleTyping(payload);
        },
        onReactionUpdated: (payload) => {
          updateMessage(payload.message_id, { reactions: payload.reactions });
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
      setMessages(response.data.reverse()); // oldest first
    } catch (error) {
      toast.error('Failed to load messages');
    } finally {
      setLoading(false);
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

  const handleSendMessage = async (content: string, parentId?: string) => {
    try {
      await apiClient.post(`/topics/${topic.id}/messages`, {
        content,
        type: 'text',
        parent_id: parentId,
      });
      // добавится через WS
      setReplyToMessage(null);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to send message');
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

  return (
    <div className="flex-1 flex min-h-0 flex-col">
      {/* Topic header */}
      <div className="flex items-center justify-between border-b border-border/70 bg-surface/80 px-6 py-4 shadow-sm">
        <div>
          <h2 className="text-xl font-semibold text-text">{topic.name}</h2>
          {topic.description && (
            <p className="text-sm text-text-muted mt-1">{topic.description}</p>
          )}
        </div>

        <div className="flex items-center gap-2">
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

      <div className="flex-1 min-h-0 flex">
        <div className="flex-1 min-h-0 flex flex-col">
          {/* Messages */}
          <MessageList
            messages={messages}
            loading={loading}
            highlightedMessageId={highlightedMessageId}
            onReply={handleReply}
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

        {threadRoot && (
          <aside className="w-full max-w-sm border-l border-slate-800/70 bg-slate-900/80 flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800/70">
              <div>
                <p className="text-sm font-semibold text-slate-200">Thread</p>
                <p className="text-xs text-slate-400">Replies to this message</p>
              </div>
              <button
                type="button"
                onClick={handleCloseThread}
                className="text-xs text-slate-400 hover:text-slate-100 transition"
              >
                Close
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
              <MessageItem message={threadRoot} onReply={handleReply} />
              {threadMessages.length === 0 ? (
                <p className="text-xs text-slate-500">No replies yet.</p>
              ) : (
                <div className="space-y-3">
                  {threadMessages.map((message) => (
                    <MessageItem key={message.id} message={message} onReply={handleReply} />
                  ))}
                </div>
              )}
            </div>
          </aside>
        )}
      </div>
    </div>
  );
};
