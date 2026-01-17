import React, { useEffect, useRef } from 'react';
import type { Message } from '../../../shared/types';
import { MessageItem } from './MessageItem';

interface MessageListProps {
  messages: Message[];
  loading: boolean;
}

export const MessageList: React.FC<MessageListProps> = ({ messages, loading }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-slate-300">Loading messages...</div>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-300 mb-2">No messages yet</p>
          <p className="text-sm text-slate-500">Be the first to send a message!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 bg-slate-900/40">
      {messages.map((message) => (
        <MessageItem key={message.id} message={message} />
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
};
