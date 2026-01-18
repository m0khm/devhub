import React, { useEffect, useState, useRef, useMemo } from 'react';
import type { Topic, Message } from '../../../shared/types';
import { apiClient } from '../../../api/client';
import { wsClient } from '../../../api/websocket';
import { useAuthStore } from '../../../store/authStore';
import { useMessageStore } from '../../../store/messageStore';
import { useThemeStore } from '../../../store/themeStore';
import toast from 'react-hot-toast';
import { MessageList } from './MessageList';
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
  const [pinnedMessages, setPinnedMessages] = useState<Message[]>([]);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);
  const typingTimeoutRef = useRef<Record<string, NodeJS.Timeout>>({});
  const pinnedIds = useMemo(
    () => new Set(pinnedMessages.map((message) => message.id)),
    [pinnedMessages]
  );

  useEffect(() => {
    clearMessages();
    setHighlightedMessageId(null);
    setPinnedMessages([]);
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
      setMessages(response.data.reverse()); // oldest first
    } catch (error) {
      toast.error('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const loadPinnedMessages = async () => {
    try {
      const response = await apiClient.get<Message[]>(`/topics/${topic.id}/pins`);
      setPinnedMessages(response.data);
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

  const handleSendMessage = async (content: string) => {
    try {
      await apiClient.post(`/topics/${topic.id}/messages`, {
        content,
        type: 'text',
      });
      // добавится через WS
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to send message');
    }
  };

  const handleTogglePin = async (message: Message) => {
    const isPinned = pinnedIds.has(message.id);
    try {
      if (isPinned) {
        await apiClient.delete(`/messages/${message.id}/pin`);
        setPinnedMessages((prev) => prev.filter((item) => item.id !== message.id));
      } else {
        await apiClient.post(`/messages/${message.id}/pin`);
        setPinnedMessages((prev) => [message, ...prev.filter((item) => item.id !== message.id)]);
      }
    } catch (error) {
      toast.error(isPinned ? 'Failed to unpin message' : 'Failed to pin message');
    }
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

      {/* Messages */}
      <MessageList
        messages={messages}
        pinnedMessages={pinnedMessages}
        loading={loading}
        highlightedMessageId={highlightedMessageId}
        onTogglePin={handleTogglePin}
      />

      {/* Typing indicator */}
      {typingUsers.size > 0 && (
        <div className="px-6 py-2 text-sm text-text-muted italic">
          Someone is typing...
        </div>
      )}

      {/* Message input */}
      <MessageInput topicId={topic.id} onSend={handleSendMessage} />
    </div>
  );
};
