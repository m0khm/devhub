import React, { useEffect, useRef, useState } from 'react';
import type { Message } from '../../../shared/types';
import { MessageItem } from './MessageItem';

interface MessageListProps {
  messages?: Message[] | null;
  pinnedMessages?: Message[] | null;
  loading: boolean;
  highlightedMessageId?: string | null;
  onHighlightMessage?: (messageId: string | null) => void;
  onReply?: (message: Message) => void;
  onTogglePin?: (message: Message) => void;
  onDelete?: (message: Message) => void;
}

export const MessageList: React.FC<MessageListProps> = ({
  messages = [],
  pinnedMessages = [],
  loading,
  highlightedMessageId,
  onHighlightMessage,
  onReply,
  onTogglePin,
  onDelete,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const [pinnedHighlightId, setPinnedHighlightId] = useState<string | null>(null);
  const normalizedPinnedMessages = pinnedMessages ?? [];
  const normalizedMessages = messages ?? [];
  const messageMap = React.useMemo(() => new Map([...normalizedPinnedMessages, ...normalizedMessages].map((m) => [m.id, m])), [normalizedPinnedMessages, normalizedMessages]);
  const [currentPinnedIndex, setCurrentPinnedIndex] = useState(0);
  const visibleMessages = normalizedMessages;

  useEffect(() => {
    if (!highlightedMessageId && !pinnedHighlightId) {
      scrollToBottom();
    }
  }, [normalizedMessages, highlightedMessageId, pinnedHighlightId]);

  useEffect(() => {
    if (!highlightedMessageId) return;
    const node = messageRefs.current.get(highlightedMessageId);
    node?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [highlightedMessageId, normalizedMessages]);

  useEffect(() => {
    if (normalizedPinnedMessages.length === 0) {
      setCurrentPinnedIndex(0);
      return;
    }

    const highlightedIndex = highlightedMessageId
      ? normalizedPinnedMessages.findIndex(
          (message) => message.id === highlightedMessageId,
        )
      : -1;

    if (highlightedIndex >= 0) {
      setCurrentPinnedIndex(highlightedIndex);
      return;
    }

    setCurrentPinnedIndex((prev) =>
      Math.min(prev, normalizedPinnedMessages.length - 1),
    );
  }, [highlightedMessageId, normalizedPinnedMessages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const focusMessage = (messageId: string) => {
    onHighlightMessage?.(messageId);
    const node = messageRefs.current.get(messageId);
    node?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const handlePinnedNavigation = (direction: 'prev' | 'next') => {
    if (normalizedPinnedMessages.length === 0) return;
    const delta = direction === 'prev' ? -1 : 1;
    const nextIndex = Math.min(
      normalizedPinnedMessages.length - 1,
      Math.max(0, currentPinnedIndex + delta),
    );
    setCurrentPinnedIndex(nextIndex);
    const nextMessage = normalizedPinnedMessages[nextIndex];
    if (nextMessage) {
      focusMessage(nextMessage.id);
    }
  };

  const handlePinnedSelect = (messageId: string) => {
    const index = normalizedPinnedMessages.findIndex(
      (message) => message.id === messageId,
    );
    if (index >= 0) {
      setCurrentPinnedIndex(index);
    }
    focusMessage(messageId);
  };

  const setMessageRef =
    (messageId: string) => (node: HTMLDivElement | null) => {
      if (node) {
        messageRefs.current.set(messageId, node);
      } else {
        messageRefs.current.delete(messageId);
      }
    };

  const handlePinnedClick = (
    message: Message,
    event: React.MouseEvent<HTMLDivElement>,
  ) => {
    const target = event.target as HTMLElement | null;
    if (target?.closest('button, a')) return;
    setPinnedHighlightId(message.id);
    const node = messageRefs.current.get(message.id);
    node?.scrollIntoView({ behavior: 'smooth', block: 'center' });
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
    <div className="relative flex-1 min-h-0 overflow-y-auto bg-slate-900/60">
      {normalizedPinnedMessages.length > 0 && (
        <div className="rounded-2xl border border-slate-700/50 bg-slate-900/80 p-3">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs font-semibold uppercase tracking-wide text-slate-300">
            <div className="flex items-center gap-2">📌 Pinned</div>
            <div className="flex items-center gap-2 text-[11px] font-medium normal-case text-slate-400">
              <span>
                {currentPinnedIndex + 1}/{normalizedPinnedMessages.length}
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handlePinnedNavigation('prev')}
                  disabled={currentPinnedIndex === 0}
                  className="rounded-md border border-slate-700/60 px-2 py-1 text-slate-200 transition hover:bg-slate-800/80 disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Предыдущий закреп"
                >
                  Пред
                </button>
                <button
                  type="button"
                  onClick={() => handlePinnedNavigation('next')}
                  disabled={
                    currentPinnedIndex >= normalizedPinnedMessages.length - 1
                  }
                  className="rounded-md border border-slate-700/60 px-2 py-1 text-slate-200 transition hover:bg-slate-800/80 disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Следующий закреп"
                >
                  След
                </button>
              </div>
            </div>
          </div>
          <div className="space-y-3">
            {normalizedPinnedMessages.map((message) => (
              <MessageItem
                key={message.id}
                ref={setMessageRef(message.id)}
                message={message}
                messageMap={messageMap}
                isPinned
                isHighlighted={message.id === highlightedMessageId}
                onSelect={() => handlePinnedSelect(message.id)}
                onTogglePin={onTogglePin}
                onDelete={onDelete}
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
          messageMap={messageMap}
          isHighlighted={message.id === highlightedMessageId}
          onReply={onReply}
          onTogglePin={onTogglePin}
          onDelete={onDelete}
        />
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
};
