import React, { useState, useRef, useEffect, useMemo } from 'react';
import { PaperAirplaneIcon } from '@heroicons/react/24/solid';
import { apiClient } from '../../../api/client';
import { wsClient } from '../../../api/websocket';
import { useAuthStore } from '../../../store/authStore';
import type { Mention, ProjectMemberWithUser } from '../../../shared/types';
import { FileUploadButton } from './FileUploadButton';

interface MessageInputProps {
  topicId: string;
  projectId: string;
  onSend: (content: string, mentions: Mention[]) => void;
}

interface MentionState {
  query: string;
  start: number;
  end: number;
}

const getMentionToken = (member: ProjectMemberWithUser) => {
  const handle = member.user.handle?.trim();
  if (handle) return handle;
  return member.user.name.replace(/\s+/g, '');
};

const getInitials = (name: string) =>
  name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase())
    .join('')
    .slice(0, 2) || '?';

const extractMentions = (
  text: string,
  members: ProjectMemberWithUser[],
  currentUserId?: string
) => {
  const tokens = new Set<string>();
  const regex = /@([\w.-]+)/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    tokens.add(match[1].toLowerCase());
  }

  const mentions = members
    .filter((member) => tokens.has(getMentionToken(member).toLowerCase()))
    .filter((member) => member.user.id !== currentUserId)
    .map((member) => ({
      id: member.user.id,
      name: member.user.name,
      handle: member.user.handle,
    }));

  return mentions;
};

export const MessageInput: React.FC<MessageInputProps> = ({
  topicId,
  projectId,
  onSend,
}) => {
  const [content, setContent] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [members, setMembers] = useState<ProjectMemberWithUser[]>([]);
  const [mentionState, setMentionState] = useState<MentionState | null>(null);
  const [activeMentionIndex, setActiveMentionIndex] = useState(0);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { user } = useAuthStore();

  useEffect(() => {
    const loadMembers = async () => {
      try {
        const response = await apiClient.get<ProjectMemberWithUser[]>(
          `/projects/${projectId}/members`
        );
        setMembers(response.data);
      } catch (error) {
        console.error('Failed to load project members:', error);
      }
    };

    if (projectId) {
      loadMembers();
    }
  }, [projectId]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [content]);

  const mentionSuggestions = useMemo(() => {
    if (!mentionState) return [];

    const query = mentionState.query.toLowerCase();
    return members.filter((member) => {
      const handle = member.user.handle?.toLowerCase() ?? '';
      const name = member.user.name.toLowerCase();
      const email = member.user.email.toLowerCase();
      return (
        handle.includes(query) || name.includes(query) || email.includes(query)
      );
    });
  }, [members, mentionState]);

  const updateMentionState = (text: string, cursorPosition: number | null) => {
    if (cursorPosition === null) {
      setMentionState(null);
      return;
    }

    const textBeforeCursor = text.slice(0, cursorPosition);
    const atIndex = textBeforeCursor.lastIndexOf('@');
    if (atIndex === -1) {
      setMentionState(null);
      return;
    }

    if (atIndex > 0 && !/\s/.test(textBeforeCursor[atIndex - 1])) {
      setMentionState(null);
      return;
    }

    const query = textBeforeCursor.slice(atIndex + 1);
    if (/\s/.test(query)) {
      setMentionState(null);
      return;
    }

    setMentionState({ query, start: atIndex, end: cursorPosition });
    setActiveMentionIndex(0);
  };

  const insertMention = (member: ProjectMemberWithUser) => {
    if (!mentionState) return;
    const token = getMentionToken(member);
    const before = content.slice(0, mentionState.start);
    const after = content.slice(mentionState.end);
    const needsSpace = after.length === 0 || !after.startsWith(' ');
    const insertion = `@${token}${needsSpace ? ' ' : ''}`;
    const nextContent = `${before}${insertion}${after}`;
    const nextCursor = before.length + insertion.length;

    setContent(nextContent);
    setMentionState(null);
    setActiveMentionIndex(0);

    requestAnimationFrame(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(nextCursor, nextCursor);
      }
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    updateMentionState(e.target.value, e.target.selectionStart);

    if (!isTyping && e.target.value.length > 0) {
      setIsTyping(true);
      wsClient.sendTyping(true);
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      wsClient.sendTyping(false);
    }, 2000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim()) return;

    const mentions = extractMentions(content.trim(), members, user?.id);
    onSend(content.trim(), mentions);
    setContent('');
    setIsTyping(false);
    wsClient.sendTyping(false);
    setMentionState(null);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (mentionSuggestions.length > 0 && mentionState) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveMentionIndex((prev) =>
          prev === mentionSuggestions.length - 1 ? 0 : prev + 1
        );
        return;
      }

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveMentionIndex((prev) =>
          prev === 0 ? mentionSuggestions.length - 1 : prev - 1
        );
        return;
      }

      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        insertMention(mentionSuggestions[activeMentionIndex]);
        return;
      }

      if (e.key === 'Escape') {
        e.preventDefault();
        setMentionState(null);
        return;
      }
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="border-t border-slate-800/80 bg-slate-900/80 px-6 py-4">
      <form onSubmit={handleSubmit} className="flex items-end gap-3">
        <FileUploadButton topicId={topicId} /> {/* NEW */}
        <div className="relative flex-1">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onClick={(e) =>
              updateMentionState(e.currentTarget.value, e.currentTarget.selectionStart)
            }
            onKeyUp={(e) =>
              updateMentionState(e.currentTarget.value, e.currentTarget.selectionStart)
            }
            placeholder="Type a message... (Shift+Enter for new line)"
            className="w-full resize-none max-h-32 rounded-xl border border-slate-700/70 bg-slate-950/60 px-4 py-3 text-slate-100 placeholder:text-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/40"
            rows={1}
          />
          {mentionState && mentionSuggestions.length > 0 && (
            <div className="absolute bottom-full mb-2 w-full overflow-hidden rounded-xl border border-slate-700/70 bg-slate-950/95 shadow-lg">
              <div className="max-h-48 overflow-y-auto py-1">
                {mentionSuggestions.map((member, index) => {
                  const isActive = index === activeMentionIndex;
                  const mentionLabel = getMentionToken(member);
                  return (
                    <button
                      key={member.id}
                      type="button"
                      onMouseDown={(event) => {
                        event.preventDefault();
                        insertMention(member);
                      }}
                      className={`flex w-full items-center gap-3 px-4 py-2 text-left text-sm transition ${
                        isActive
                          ? 'bg-slate-800 text-slate-100'
                          : 'text-slate-200 hover:bg-slate-800/70'
                      }`}
                    >
                      {member.user.avatar_url ? (
                        <img
                          src={member.user.avatar_url}
                          alt={member.user.name}
                          className="h-7 w-7 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-700 text-xs font-semibold text-slate-200">
                          {getInitials(member.user.name)}
                        </div>
                      )}
                      <div>
                        <div className="font-medium text-slate-100">{member.user.name}</div>
                        <div className="text-xs text-slate-400">
                          @{mentionLabel}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
        <button
          type="submit"
          disabled={!content.trim()}
          className="rounded-xl bg-sky-500/90 p-3 text-white shadow hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-50 transition"
        >
          <PaperAirplaneIcon className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
};
