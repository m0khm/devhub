import React from 'react';
import { Message } from '../../../shared/types';
import { useAuthStore } from '../../../store/authStore';
import { apiClient } from '../../../api/client';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';

interface MessageItemProps {
  message: Message;
}

export const MessageItem: React.FC<MessageItemProps> = ({ message }) => {
  const { user: currentUser } = useAuthStore();
  const isOwnMessage = message.user_id === currentUser?.id;

  const handleReaction = async (emoji: string) => {
    try {
      await apiClient.post(`/messages/${message.id}/reactions`, { emoji });
    } catch (error) {
      toast.error('Failed to add reaction');
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className={`flex gap-3 ${isOwnMessage ? 'flex-row-reverse' : ''}`}>
      {/* Avatar */}
      <div className="flex-shrink-0">
        {message.user?.avatar_url ? (
          <img
            src={message.user.avatar_url}
            alt={message.user.name}
            className="w-10 h-10 rounded-full"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold text-sm">
            {message.user ? getInitials(message.user.name) : '?'}
          </div>
        )}
      </div>

      {/* Message content */}
      <div className={`flex-1 ${isOwnMessage ? 'text-right' : ''}`}>
        <div className="flex items-baseline gap-2 mb-1">
          <span className={`font-semibold text-sm ${isOwnMessage ? 'order-2' : ''}`}>
            {message.user?.name || 'Unknown'}
          </span>
          <span className={`text-xs text-gray-500 ${isOwnMessage ? 'order-1' : ''}`}>
            {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
          </span>
        </div>

        <div
          className={`inline-block px-4 py-2 rounded-2xl ${
            isOwnMessage
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-900'
          }`}
        >
          <p className="whitespace-pre-wrap break-words">{message.content}</p>
        </div>

        {/* Reactions */}
        {message.reactions && message.reactions.length > 0 && (
          <div className="flex gap-1 mt-1 flex-wrap">
            {message.reactions.map((reaction) => (
              <button
                key={reaction.emoji}
                onClick={() => handleReaction(reaction.emoji)}
                className={`px-2 py-1 rounded-full text-sm flex items-center gap-1 transition ${
                  reaction.has_self
                    ? 'bg-blue-100 border border-blue-300'
                    : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                <span>{reaction.emoji}</span>
                <span className="text-xs text-gray-600">{reaction.count}</span>
              </button>
            ))}
            <button
              onClick={() => handleReaction('👍')}
              className="px-2 py-1 rounded-full text-sm bg-gray-100 hover:bg-gray-200 transition"
            >
              +
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
