import React, { useEffect, useRef } from 'react';
import type { Message } from '../../../shared/types';
import { MessageItem } from './MessageItem';

interface MessageListProps {
  messages?: Message[] | null;
  pinnedMessages?: Message[] | null;
  loading: boolean;
  highlightedMessageId?: string | null;
  onReply?: (message: Message) => void;
  onTogglePin?: (message: Message) => void;
}

export const MessageList: React.FC<MessageListProps> = ({
  messages = [],
  pinnedMessages = [],
  loading,
  highlightedMessageId,
  onReply,
  onTogglePin,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const normalizedPinnedMessages = pinnedMessages ?? [];
  const normalizedMessages = messages ?? [];
  const pinnedIds = new Set(normalizedPinnedMessages.map((message) => message.id));
  const visibleMessages = normalizedMessages.filter(
    (message) => !pinnedIds.has(message.id),
  );

  useEffect(() => {
    if (!highlightedMessageId) {
      scrollToBottom();
    }
  }, [normalizedMessages, highlightedMessageId]);

  useEffect(() => {
    if (!highlightedMessageId) return;
    const node = messageRefs.current.get(highlightedMessageId);
    node?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [highlightedMessageId, normalizedMessages]);

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

  if (normalizedMessages.length === 0 && normalizedPinnedMessages.length === 0) {
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
      {normalizedPinnedMessages.length > 0 && (
        <div className="rounded-2xl border border-slate-700/50 bg-slate-900/80 p-3">
          <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-300">
            📌 Pinned
          </div>
          <div className="space-y-3">
            {normalizedPinnedMessages.map((message) => (
              <MessageItem
                key={message.id}
                ref={setMessageRef(message.id)}
                message={message}
                isPinned
                isHighlighted={message.id === highlightedMessageId}
                onTogglePin={onTogglePin}
              />
            ))}
          </div>
        </div>
      )}
      {visibleMessages.map((message) => (
        <MessageItem
          key={message.id}
          ref={setMessageRef(message.id)}
          message={message}
          isHighlighted={message.id === highlightedMessageId}
          onReply={onReply}
          onTogglePin={onTogglePin}
        />
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
};
