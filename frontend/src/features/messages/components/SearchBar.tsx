import React, { useState } from 'react';
import {
  ChevronDownIcon,
  ChevronUpIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { apiClient } from '../../../api/client';
import type { Message } from '../../../shared/types';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';

interface SearchBarProps {
  topicId: string;
  onJumpToMessage: (messageId: string | null) => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({ topicId, onJumpToMessage }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Message[]>([]);
  const [resultIds, setResultIds] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    const q = query.trim();
    if (!q) return;

    setLoading(true);
    try {
      const response = await apiClient.get<Message[]>(
        `/topics/${topicId}/messages?query=${encodeURIComponent(q)}`
      );
      const messages = response.data;
      const ids = messages.map((message) => message.id);
      setResults(messages);
      setResultIds(ids);
      if (ids.length > 0) {
        setCurrentIndex(0);
        onJumpToMessage(ids[0]);
      } else {
        setCurrentIndex(-1);
        onJumpToMessage(null);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSearch();
    if (e.key === 'Escape') handleClose();
  };

  const handleClose = () => {
    setIsOpen(false);
    setQuery('');
    setResults([]);
    setResultIds([]);
    setCurrentIndex(-1);
    setLoading(false);
    onJumpToMessage(null);
  };

  const open = () => {
    setIsOpen(true);
    // results не чистим, чтобы можно было открыть снова и увидеть прошлые результаты
  };

  const jumpToIndex = (index: number) => {
    const messageId = resultIds[index];
    if (!messageId) return;
    setCurrentIndex(index);
    onJumpToMessage(messageId);
  };

  const handleNext = () => {
    if (resultIds.length === 0) return;
    const nextIndex =
      currentIndex >= 0 ? (currentIndex + 1) % resultIds.length : 0;
    jumpToIndex(nextIndex);
  };

  const handlePrev = () => {
    if (resultIds.length === 0) return;
    const prevIndex =
      currentIndex > 0 ? currentIndex - 1 : resultIds.length - 1;
    jumpToIndex(prevIndex);
  };

  return (
    <>
      {/* кнопка открытия */}
      <button
        type="button"
        onClick={open}
        className="rounded-xl p-2 text-slate-300 hover:bg-slate-800/60 hover:text-white transition"
        title="Search messages"
        aria-label="Search messages"
      >
        <MagnifyingGlassIcon className="w-5 h-5" />
      </button>

      {/* модалка */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-start justify-center pt-20"
          onMouseDown={handleClose}
        >
          <div
            className="bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[600px] flex flex-col border border-slate-800/70"
            onMouseDown={(e) => e.stopPropagation()}
          >
            {/* Search header */}
            <div className="p-4 border-b border-slate-800/70">
              <div className="flex items-center gap-3">
                <MagnifyingGlassIcon className="w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Search messages..."
                  className="flex-1 bg-transparent text-lg text-slate-100 outline-none placeholder:text-slate-400"
                  autoFocus
                />
                <div className="flex items-center gap-1 text-xs text-slate-400">
                  <button
                    type="button"
                    onClick={handlePrev}
                    disabled={resultIds.length === 0}
                    className="rounded p-1 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50 transition"
                    aria-label="Previous match"
                    title="Previous match"
                  >
                    <ChevronUpIcon className="w-4 h-4" />
                  </button>
                  <span className="min-w-[40px] text-center">
                    {resultIds.length > 0 ? `${currentIndex + 1}/${resultIds.length}` : '0/0'}
                  </span>
                  <button
                    type="button"
                    onClick={handleNext}
                    disabled={resultIds.length === 0}
                    className="rounded p-1 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50 transition"
                    aria-label="Next match"
                    title="Next match"
                  >
                    <ChevronDownIcon className="w-4 h-4" />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={handleClose}
                  className="rounded p-1 hover:bg-slate-800 transition"
                  aria-label="Close search"
                >
                  <XMarkIcon className="w-6 h-6 text-slate-400" />
                </button>
              </div>

              <div className="mt-3 flex justify-end">
                <button
                  type="button"
                  onClick={handleSearch}
                  disabled={loading || !query.trim()}
                  className="rounded-lg bg-sky-500/90 px-4 py-2 text-white hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-50 transition"
                >
                  Search
                </button>
              </div>
            </div>

            {/* Search results */}
            <div className="flex-1 overflow-y-auto p-4">
              {loading ? (
                <div className="text-center py-8 text-slate-400">Searching...</div>
              ) : results.length > 0 ? (
                <div className="space-y-3">
                  {results.map((message, index) => (
                    <div
                      key={message.id}
                      onClick={() => jumpToIndex(index)}
                      className={`cursor-pointer rounded-xl bg-slate-800/70 p-4 transition hover:bg-slate-800 ${
                        index === currentIndex ? 'ring-2 ring-sky-400/70 bg-sky-500/10' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-500 text-sm font-semibold text-white">
                          {message.user?.name?.[0] || '?'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline gap-2 mb-1">
                            <span className="font-semibold text-sm text-slate-100">
                              {message.user?.name || 'Unknown'}
                            </span>
                            <span className="text-xs text-slate-400">
                              {formatDistanceToNow(new Date(message.created_at), {
                                addSuffix: true,
                              })}
                            </span>
                          </div>
                          <p className="text-sm text-slate-200 whitespace-pre-wrap break-words">
                            {message.content}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : query && !loading ? (
                <div className="text-center py-8 text-slate-400">No messages found</div>
              ) : (
                <div className="text-center py-8 text-slate-500">Type to search messages</div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
