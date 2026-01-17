import React, { useEffect, useState, useRef } from 'react';
import type { Topic, Message } from '../../../shared/types';
import { apiClient } from '../../../api/client';
import { wsClient } from '../../../api/websocket';
import { useAuthStore } from '../../../store/authStore';
import { useMessageStore } from '../../../store/messageStore';
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

  const [loading, setLoading] = useState(true);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const typingTimeoutRef = useRef<Record<string, NodeJS.Timeout>>({});

  useEffect(() => {
    clearMessages();
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

  return (
    <div className="flex-1 flex flex-col h-screen">
      {/* Topic header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">{topic.name}</h2>
          {topic.description && (
            <p className="text-sm text-gray-600 mt-1">{topic.description}</p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <VideoCallButton topicId={topic.id} />
          <SearchBar topicId={topic.id} />
        </div>
      </div>

      {/* Messages */}
      <MessageList messages={messages} loading={loading} />

      {/* Typing indicator */}
      {typingUsers.size > 0 && (
        <div className="px-6 py-2 text-sm text-gray-500 italic">
          Someone is typing...
        </div>
      )}

      {/* Message input */}
      <MessageInput topicId={topic.id} onSend={handleSendMessage} />
    </div>
  );
};
