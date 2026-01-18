import React from 'react';
import type { Message } from '../../../shared/types';
import { useAuthStore } from '../../../store/authStore';
import { apiClient } from '../../../api/client';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import { DocumentIcon, PhotoIcon } from '@heroicons/react/24/outline';
import hljs from 'highlight.js';
import 'highlight.js/styles/github-dark.css';

interface MessageItemProps {
  message: Message;
  isHighlighted?: boolean;
}

interface CodeMetadata {
  language?: string;
  filename?: string;
  content?: string;
}

interface FileMetadata {
  filename?: string;
  mime_type?: string;
  size?: number;
  url?: string;
}

export const MessageItem = React.forwardRef<HTMLDivElement, MessageItemProps>(
  ({ message, isHighlighted = false }, ref) => {
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

    const renderFileContent = () => {
      if (message.type !== 'file' || !message.metadata) return null;

      const metadata =
        typeof message.metadata === 'string'
          ? JSON.parse(message.metadata)
          : (message.metadata as FileMetadata | undefined);

      const isImage = metadata.mime_type?.startsWith('image/');

      return (
        <div className="mt-2">
          {isImage ? (
            <a href={metadata.url} target="_blank" rel="noopener noreferrer">
              <img
                src={metadata.url}
                alt={metadata.filename}
                className="max-w-sm rounded-lg cursor-pointer hover:opacity-90 transition"
              />
            </a>
          ) : (
            <a
              href={metadata.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-lg bg-slate-800/70 p-3 text-slate-100 hover:bg-slate-800 transition"
            >
              <DocumentIcon className="w-8 h-8 text-slate-400" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{metadata.filename}</p>
                <p className="text-xs text-slate-400">
                  {(metadata.size / 1024).toFixed(1)} KB
                </p>
              </div>
            </a>
          )}
        </div>
      );
    };

    const renderCodeContent = () => {
      if (message.type !== 'code') return null;

      const metadata =
        typeof message.metadata === 'string'
          ? JSON.parse(message.metadata)
          : message.metadata;

      const codeContent = metadata?.content ?? message.content;
      const language = metadata?.language;
      const filename = metadata?.filename;

      const highlightedCode =
        language && hljs.getLanguage(language)
          ? hljs.highlight(codeContent, { language }).value
          : hljs.highlightAuto(codeContent).value;

      return (
        <div className="mt-2 w-full">
          {filename && (
            <div className="rounded-t-lg bg-slate-900/80 px-3 py-2 text-xs text-slate-300 font-mono">
              {filename}
            </div>
          )}
          <pre
            className={`overflow-x-auto rounded-lg bg-slate-900/90 p-3 text-sm ${
              filename ? 'rounded-t-none' : ''
            }`}
          >
            <code
              className="hljs"
              dangerouslySetInnerHTML={{ __html: highlightedCode }}
            />
          </pre>
          {language && (
            <div className="mt-1 text-xs text-slate-400">{language}</div>
          )}
        </div>
      );
    };

    return (
      <div
        ref={ref}
        className={`flex gap-3 rounded-2xl transition ${
          isOwnMessage ? 'flex-row-reverse' : ''
        } ${isHighlighted ? 'ring-2 ring-sky-400/60 bg-sky-500/10' : ''}`}
      >
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
            <span
              className={`font-semibold text-sm text-slate-200 ${isOwnMessage ? 'order-2' : ''}`}
            >
              {message.user?.name || 'Unknown'}
            </span>
            <span className={`text-xs text-slate-400 ${isOwnMessage ? 'order-1' : ''}`}>
              {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
            </span>
          </div>

          <div
            className={`inline-block px-4 py-2 rounded-2xl ${
              isOwnMessage
                ? 'bg-sky-500/90 text-white shadow'
                : 'bg-slate-800/80 text-slate-100 shadow'
            }`}
          >
            {message.type === 'code' ? (
              renderCodeContent()
            ) : (
              <>
                <p className="whitespace-pre-wrap break-words">{message.content}</p>
                {renderFileContent()}
              </>
            )}
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
                      ? 'bg-sky-500/20 border border-sky-500/40 text-slate-100'
                      : 'bg-slate-800/60 text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  <span>{reaction.emoji}</span>
                  <span className="text-xs text-slate-300">{reaction.count}</span>
                </button>
              ))}
              <button
                onClick={() => handleReaction('👍')}
                className="px-2 py-1 rounded-full text-sm bg-slate-800/60 text-slate-200 hover:bg-slate-800 transition"
              >
                +
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }
);

MessageItem.displayName = 'MessageItem';
