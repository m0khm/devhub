import React, { useState } from 'react';
import type { FileMetadata, Message } from '../../../shared/types';
import { useAuthStore } from '../../../store/authStore';
import { apiClient } from '../../../api/client';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import {
  DocumentIcon,
  MapPinIcon,
  EllipsisVerticalIcon,
} from '@heroicons/react/24/outline';

interface MessageItemProps {
  message: Message;
  isPinned?: boolean;
  isHighlighted?: boolean;
  onSelect?: (message: Message) => void;
  onReply?: (message: Message) => void;
  onTogglePin?: (message: Message) => void;
}

export const MessageItem = React.forwardRef<HTMLDivElement, MessageItemProps>(
  (
    { message, isPinned = false, isHighlighted = false, onSelect, onReply, onTogglePin },
    ref,
  ) => {
    const { user: currentUser } = useAuthStore();
    const isOwnMessage = message.user_id === currentUser?.id;
    const [menuOpen, setMenuOpen] = useState(false);

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

    const handleDownload = async (metadata: FileMetadata) => {
      if (!metadata.filename) {
        toast.error('Missing file metadata');
        return;
      }

      try {
        const response = await apiClient.get(`/files/${message.id}/download`, {
          responseType: 'blob',
        });
        const blob = new Blob([response.data], {
          type: response.headers['content-type'] || metadata.mime_type || 'application/octet-stream',
        });
        const objectUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = objectUrl;
        link.download = metadata.filename;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(objectUrl);
      } catch (error) {
        toast.error('Failed to download file');
      }
    };

    const renderFileContent = () => {
      if (message.type !== 'file' || !message.metadata) return null;

      const metadata =
        typeof message.metadata === 'string'
          ? JSON.parse(message.metadata)
          : (message.metadata as FileMetadata | undefined);

      if (!metadata) return null;

      const mimeType = metadata.mime_type ?? '';
      const isImage = mimeType.startsWith('image/');
      const isPdf = mimeType === 'application/pdf' || metadata.filename?.toLowerCase().endsWith('.pdf');
      const isAudio = mimeType.startsWith('audio/');
      const isVideo = mimeType.startsWith('video/');
      const fileSize =
        typeof metadata.size === 'number' ? `${(metadata.size / 1024).toFixed(1)} KB` : null;

      return (
        <div className="mt-2">
          {isImage ? (
            <a
              href={metadata.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(event) => event.stopPropagation()}
            >
              <img
                src={metadata.url}
                alt={metadata.filename}
                className="max-w-sm rounded-lg cursor-pointer hover:opacity-90 transition"
              />
            </a>
          )}

          {isPdf && (
            <div className="rounded-lg overflow-hidden border border-slate-700/60 bg-slate-900/60">
              <embed
                src={metadata.url}
                type="application/pdf"
                className="w-full h-64"
              />
            </div>
          )}

          {isAudio && (
            <audio controls className="w-full mt-2">
              <source src={metadata.url} type={mimeType} />
            </audio>
          )}

          {isVideo && (
            <video controls className="w-full mt-2 rounded-lg">
              <source src={metadata.url} type={mimeType} />
            </video>
          )}

          {!isImage && !isPdf && !isAudio && !isVideo && (
            <a
              href={metadata.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(event) => event.stopPropagation()}
              className="flex items-center gap-3 rounded-lg bg-slate-800/70 p-3 text-slate-100 hover:bg-slate-800 transition"
            >
              <DocumentIcon className="w-8 h-8 text-slate-400" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{metadata.filename}</p>
                {fileSize && <p className="text-xs text-slate-400">{fileSize}</p>}
              </div>
            </a>
          )}

          <div className="mt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={() => handleDownload(metadata)}
              className="text-xs font-medium text-slate-300 hover:text-slate-100 transition underline"
            >
              Скачать
            </button>
            {metadata.filename && (
              <span className="text-xs text-slate-500">{metadata.filename}</span>
            )}
            {fileSize && <span className="text-xs text-slate-500">{fileSize}</span>}
          </div>
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
        onClick={onSelect ? () => onSelect(message) : undefined}
        onKeyDown={
          onSelect
            ? (event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  onSelect(message);
                }
              }
            : undefined
        }
        role={onSelect ? 'button' : undefined}
        tabIndex={onSelect ? 0 : undefined}
        className={`flex gap-3 rounded-2xl transition ${
          isOwnMessage ? 'flex-row-reverse' : ''
        } ${isHighlighted ? 'ring-2 ring-sky-400/60 bg-sky-500/10' : ''} ${
          onSelect ? 'cursor-pointer' : ''
        }`}
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
          <div
            className={`flex items-baseline gap-2 mb-1 ${
              isOwnMessage ? 'justify-end' : 'justify-between'
            }`}
          >
            <div className={`flex items-baseline gap-2 ${isOwnMessage ? 'order-2' : ''}`}>
              <span
                className={`font-semibold text-sm text-slate-200 ${
                  isOwnMessage ? 'order-2' : ''
                }`}
              >
                {message.user?.name || 'Unknown'}
              </span>
              <span
                className={`text-xs text-slate-400 ${isOwnMessage ? 'order-1' : ''}`}
              >
                {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
              </span>
              {isPinned && (
                <span className="inline-flex items-center gap-1 text-xs text-sky-300">
                  <MapPinIcon className="h-3 w-3" />
                  pinned
                </span>
              )}
            </div>

            {onTogglePin && (
              <div className="relative">
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    setMenuOpen((prev) => !prev);
                  }}
                  className="rounded-full p-1 text-slate-300 hover:text-slate-100 hover:bg-slate-800/80 transition"
                  aria-label="Message actions"
                >
                  <EllipsisVerticalIcon className="h-4 w-4" />
                </button>
                {menuOpen && (
                  <div
                    className={`absolute z-10 mt-2 w-36 rounded-lg border border-slate-700/60 bg-slate-900/95 py-1 text-left shadow-lg ${
                      isOwnMessage ? 'right-0' : 'left-0'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        onTogglePin(message);
                        setMenuOpen(false);
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-200 hover:bg-slate-800/80"
                    >
                      <MapPinIcon className="h-4 w-4 text-sky-300" />
                      {isPinned ? 'Unpin' : 'Pin'}
                    </button>
                  </div>
                )}
              </div>
            )}
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
                  onClick={(event) => {
                    event.stopPropagation();
                    handleReaction(reaction.emoji);
                  }}
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
                onClick={(event) => {
                  event.stopPropagation();
                  handleReaction('👍');
                }}
                className="px-2 py-1 rounded-full text-sm bg-slate-800/60 text-slate-200 hover:bg-slate-800 transition"
              >
                +
              </button>
            </div>
          )}

          {onReply && (
            <div className={`mt-2 flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onReply(message);
                }}
                className="text-xs font-medium text-slate-400 hover:text-slate-200 transition"
              >
                Reply
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }
);

MessageItem.displayName = 'MessageItem';
