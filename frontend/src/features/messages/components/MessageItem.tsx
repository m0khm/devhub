import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type { FileMetadata, Message } from '../../../shared/types';
import { useAuthStore } from '../../../store/authStore';
import { apiClient } from '../../../api/client';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import {
  DocumentIcon,
  MapPinIcon,
  EllipsisVerticalIcon,
  TrashIcon,
  ArrowUturnLeftIcon,
  FaceSmileIcon,
} from '@heroicons/react/24/outline';

interface MessageItemProps {
  message: Message;
  messageMap?: Map<string, Message>;
  isPinned?: boolean;
  isHighlighted?: boolean;
  onSelect?: (message: Message) => void;
  onReply?: (message: Message) => void;
  onTogglePin?: (message: Message) => void;
  onDelete?: (message: Message) => void;
}

export const MessageItem = React.forwardRef<HTMLDivElement, MessageItemProps>(
  (
    {
      message,
      messageMap,
      isPinned = false,
      isHighlighted = false,
      onSelect,
      onReply,
      onTogglePin,
      onDelete,
    },
    ref,
  ) => {
    const { user: currentUser } = useAuthStore();
    const isOwnMessage = message.user_id === currentUser?.id;
    const [menuOpen, setMenuOpen] = useState(false);
    const [menuPosition, setMenuPosition] = useState<{ x: number; y: number } | null>(null);
    const parentMessage = message.parent_id
      ? messageMap?.get(message.parent_id)
      : undefined;

    const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);

    const fileMeta = useMemo(() => {
      if (message.type !== 'file' || !message.metadata) return null;
      try {
        return typeof message.metadata === 'string'
          ? (JSON.parse(message.metadata) as FileMetadata)
          : (message.metadata as FileMetadata);
      } catch {
        return null;
      }
    }, [message.type, message.metadata]);

    const isImageFile = Boolean(fileMeta?.mime_type?.startsWith('image/'));
    const canPreviewImage = isImageFile && (typeof fileMeta?.size !== 'number' || fileMeta.size <= 5 * 1024 * 1024);

    useEffect(() => {
      let revoked: string | null = null;

      // очищаем старый preview при смене сообщения
      setImagePreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });

      if (!canPreviewImage || !fileMeta?.filename) return;

      (async () => {
        try {
          const response = await apiClient.get(`/files/${message.id}/download`, {
            responseType: 'blob',
          });

          const blob = new Blob([response.data], {
            type:
              response.headers?.['content-type'] ||
              fileMeta.mime_type ||
              'image/*',
          });

          const url = URL.createObjectURL(blob);
          revoked = url;
          setImagePreviewUrl(url);
        } catch {
          // молча — превью просто не покажем
        }
      })();

      return () => {
        if (revoked) URL.revokeObjectURL(revoked);
      };
    }, [message.id, canPreviewImage, fileMeta?.filename, fileMeta?.mime_type, fileMeta?.size]);


    const handleReaction = useCallback(
      async (emoji: string) => {
        try {
          await apiClient.post(`/messages/${message.id}/reactions`, { emoji });
        } catch (error) {
          toast.error('Failed to add reaction');
        }
      },
      [message.id],
    );

    const actionItems = useMemo(() => {
      const items: Array<{
        key: string;
        label: string;
        icon: React.ReactNode;
        onClick: () => void;
      }> = [];

      if (onReply) {
        items.push({
          key: 'reply',
          label: 'Reply',
          icon: <ArrowUturnLeftIcon className="h-4 w-4 text-slate-300" />,
          onClick: () => onReply(message),
        });
      }

      if (onTogglePin) {
        items.push({
          key: 'pin',
          label: isPinned ? 'Unpin' : 'Pin',
          icon: <MapPinIcon className="h-4 w-4 text-sky-300" />,
          onClick: () => onTogglePin(message),
        });
      }

      items.push({
        key: 'reaction',
        label: 'Reaction 👍',
        icon: <FaceSmileIcon className="h-4 w-4 text-amber-300" />,
        onClick: () => handleReaction('👍'),
      });

      if (onDelete && isOwnMessage) {
        items.push({
          key: 'delete',
          label: 'Delete',
          icon: <TrashIcon className="h-4 w-4 text-rose-400" />,
          onClick: () => onDelete(message),
        });
      }

      return items;
    }, [handleReaction, isOwnMessage, isPinned, message, onDelete, onReply, onTogglePin]);

    useEffect(() => {
      if (!menuOpen) return undefined;

      const handleOutsideClick = () => {
        setMenuOpen(false);
        setMenuPosition(null);
      };

      window.addEventListener('click', handleOutsideClick);
      return () => {
        window.removeEventListener('click', handleOutsideClick);
      };
    }, [menuOpen]);

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
    const isPdf =
      mimeType === 'application/pdf' ||
      (metadata.filename?.toLowerCase().endsWith('.pdf') ?? false);
    const isAudio = mimeType.startsWith('audio/');
    const isVideo = mimeType.startsWith('video/');
    const fileSize =
      typeof metadata.size === 'number'
        ? `${(metadata.size / 1024).toFixed(1)} KB`
        : null;

    const renderDownloadCard = (hint?: string) => (
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          void handleDownload(metadata);
        }}
        className="flex w-full items-center gap-3 rounded-lg bg-slate-800/70 p-3 text-slate-100 hover:bg-slate-800 transition"
      >
        <DocumentIcon className="w-8 h-8 text-slate-400" />
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{metadata.filename}</p>
          {fileSize && <p className="text-xs text-slate-400">{fileSize}</p>}
          {hint && <p className="text-xs text-slate-400">{hint}</p>}
        </div>
      </button>
    );

    return (
      <div className="mt-2">

        {isImage && imagePreviewUrl && (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              // можно открыть в новой вкладке:
              window.open(imagePreviewUrl, '_blank', 'noopener,noreferrer');
            }}
            className="block text-left"
          >
            <img
              src={imagePreviewUrl}
              alt={metadata.filename}
              className="max-w-xs rounded-lg cursor-pointer hover:opacity-90 transition border border-slate-700/60"
            />
          </button>
        )}

        {isImage && renderDownloadCard('Image (click to download)')}
        {isPdf && renderDownloadCard('PDF (click to download)')}
        {isAudio && renderDownloadCard('Audio (click to download)')}
        {isVideo && renderDownloadCard('Video (click to download)')}
        {!isImage && !isPdf && !isAudio && !isVideo && renderDownloadCard()}

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

    if (message.type === 'system') {
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
          className={`flex justify-center py-2 ${
            isHighlighted ? 'ring-2 ring-sky-400/60 bg-sky-500/10 rounded-2xl' : ''
          } ${onSelect ? 'cursor-pointer' : ''}`}
        >
          <div className="rounded-full bg-slate-800/70 px-4 py-1 text-xs text-slate-400">
            {message.content}
          </div>
        </div>
      );
    }

    return (
      <div
        ref={ref}
        onClick={onSelect ? () => onSelect(message) : undefined}
        onContextMenu={(event) => {
          if (actionItems.length === 0) return;
          event.preventDefault();
          event.stopPropagation();
          setMenuOpen(true);
          setMenuPosition({ x: event.clientX, y: event.clientY });
        }}
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
                {message.user?.handle ?? message.user?.name ?? message.user?.email ?? 'Unknown'}
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

            {actionItems.length > 0 && (
              <div className="relative">
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    const rect = event.currentTarget.getBoundingClientRect();
                    setMenuOpen((prev) => !prev);
                    setMenuPosition({ x: rect.right, y: rect.bottom });
                  }}
                  className="rounded-full p-1 text-slate-300 hover:text-slate-100 hover:bg-slate-800/80 transition"
                  aria-label="Message actions"
                >
                  <EllipsisVerticalIcon className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          {menuOpen && menuPosition && (
            <div
              className="fixed z-20 w-44 rounded-lg border border-slate-700/60 bg-slate-900/95 py-1 text-left shadow-lg"
              style={{ left: menuPosition.x, top: menuPosition.y }}
            >
              {actionItems.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    item.onClick();
                    setMenuOpen(false);
                    setMenuPosition(null);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-200 hover:bg-slate-800/80"
                >
                  {item.icon}
                  {item.label}
                </button>
              ))}
            </div>
          )}

          <div className="inline-flex flex-col items-start text-left">
            <div
              className={`px-4 py-2 rounded-2xl ${
                isOwnMessage
                  ? 'bg-sky-500/90 text-white shadow'
                  : 'bg-slate-800/80 text-slate-100 shadow'
              }`}
            >
              {parentMessage && (
                <div className="mb-2 rounded-lg border border-slate-700/60 bg-slate-900/70 px-3 py-2 text-xs text-slate-300">
                  <span className="font-semibold text-slate-200">
                    Replying to {parentMessage.user?.name || 'Unknown'}
                  </span>
                  <span className="mx-1 text-slate-500">•</span>
                  <span className="line-clamp-2">
                    {parentMessage.content || '...'}
                  </span>
                </div>
              )}
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
          </div>
        </div>
      </div>
    );
  }
);

MessageItem.displayName = 'MessageItem';
