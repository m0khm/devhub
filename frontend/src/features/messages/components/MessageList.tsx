import React, { useEffect, useRef } from 'react';
import type { Message } from '../../../shared/types';
import { MessageItem } from './MessageItem';

interface MessageListProps {
  messages: Message[];
  loading: boolean;
  highlightedMessageId?: string | null;
  onReply?: (message: Message) => void;
}

export const MessageList: React.FC<MessageListProps> = ({
  messages,
  loading,
  highlightedMessageId,
  onReply,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  useEffect(() => {
    if (!highlightedMessageId) {
      scrollToBottom();
    }
  }, [messages, highlightedMessageId]);

  useEffect(() => {
    if (!highlightedMessageId) return;
    const node = messageRefs.current.get(highlightedMessageId);
    node?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [highlightedMessageId, messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const setMessageRef =
    (messageId: string) => (node: HTMLDivElement | null) => {
      if (node) {
        messageRefs.current.set(messageId, node);
      } else {
        messageRefs.current.delete(messageId);
      }
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
    <div className="flex-1 overflow-y-auto px-5 py-3 space-y-3 bg-slate-900/60">
      {messages.map((message) => (
        <MessageItem
          key={message.id}
          ref={setMessageRef(message.id)}
          message={message}
          isHighlighted={message.id === highlightedMessageId}
          onReply={onReply}
        />
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
};
