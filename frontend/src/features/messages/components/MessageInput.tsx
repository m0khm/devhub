import React, { useState, useRef, useEffect } from 'react';
import { PaperAirplaneIcon } from '@heroicons/react/24/solid';
import { wsClient } from '../../../api/websocket';
import { FileUploadButton } from './FileUploadButton';

interface MessageInputProps {
  topicId: string; // NEW
  onSend: (content: string) => void;
}

export const MessageInput: React.FC<MessageInputProps> = ({ topicId, onSend }) => {
  const [content, setContent] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const commandOptions = [
    {
      name: '/invite',
      description: 'Invite a teammate',
      usage: '/invite email@example.com',
    },
    {
      name: '/topic',
      description: 'Rename this topic',
      usage: '/topic New topic name',
    },
    {
      name: '/shrug',
      description: 'Add a shrug to your message',
      usage: '/shrug that is fine',
    },
  ];

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [content]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);

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

    onSend(content.trim());
    setContent('');
    setIsTyping(false);
    wsClient.sendTyping(false);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const trimmedContent = content.trimStart();
  const isCommandInput = trimmedContent.startsWith('/');
  const commandQuery = isCommandInput
    ? trimmedContent.slice(1).split(' ')[0].toLowerCase()
    : '';
  const filteredCommands = isCommandInput
    ? commandOptions.filter((command) =>
        command.name.slice(1).toLowerCase().startsWith(commandQuery)
      )
    : [];

  const handleCommandSelect = (command: (typeof commandOptions)[number]) => {
    setContent(`${command.name} `);
    textareaRef.current?.focus();
  };

  return (
    <div className="border-t border-slate-800/80 bg-slate-900/80 px-6 py-4">
      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <div className="flex items-end gap-3">
          <FileUploadButton topicId={topicId} /> {/* NEW */}
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="Type a message... (Shift+Enter for new line)"
            className="flex-1 resize-none max-h-32 rounded-xl border border-slate-700/70 bg-slate-950/60 px-4 py-3 text-slate-100 placeholder:text-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/40"
            rows={1}
          />
          <button
            type="submit"
            disabled={!content.trim()}
            className="rounded-xl bg-sky-500/90 p-3 text-white shadow hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-50 transition"
          >
            <PaperAirplaneIcon className="w-5 h-5" />
          </button>
        </div>
        {isCommandInput && filteredCommands.length > 0 && (
          <div className="rounded-xl border border-slate-800/70 bg-slate-950/80 p-2 text-sm text-slate-200 shadow-lg">
            <p className="px-2 pb-1 text-xs uppercase tracking-wide text-slate-500">
              Commands
            </p>
            <ul className="space-y-1">
              {filteredCommands.map((command) => (
                <li key={command.name}>
                  <button
                    type="button"
                    onClick={() => handleCommandSelect(command)}
                    className="flex w-full items-start justify-between gap-3 rounded-lg px-2 py-2 text-left transition hover:bg-slate-900/80"
                  >
                    <div>
                      <div className="font-semibold text-slate-100">
                        {command.name}
                      </div>
                      <div className="text-xs text-slate-400">
                        {command.description}
                      </div>
                    </div>
                    <span className="text-xs text-slate-500">{command.usage}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </form>
    </div>
  );
};
