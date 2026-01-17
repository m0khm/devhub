import React, { useState } from 'react';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { apiClient } from '../../../api/client';
import type { Message } from '../../../shared/types';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';

interface SearchBarProps {
  topicId: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({ topicId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    const q = query.trim();
    if (!q) return;

    setLoading(true);
    try {
      const response = await apiClient.get<Message[]>(
        `/topics/${topicId}/search?q=${encodeURIComponent(q)}`
      );
      setResults(response.data);
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
    setLoading(false);
  };

  const open = () => {
    setIsOpen(true);
    // results не чистим, чтобы можно было открыть снова и увидеть прошлые результаты
  };

  return (
    <>
      {/* кнопка открытия */}
      <button
        type="button"
        onClick={open}
        className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
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
            className="bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4 max-h-[600px] flex flex-col"
            onMouseDown={(e) => e.stopPropagation()}
          >
            {/* Search header */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <MagnifyingGlassIcon className="w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Search messages..."
                  className="flex-1 outline-none text-lg"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={handleClose}
                  className="p-1 hover:bg-gray-100 rounded transition"
                  aria-label="Close search"
                >
                  <XMarkIcon className="w-6 h-6 text-gray-500" />
                </button>
              </div>

              <div className="mt-3 flex justify-end">
                <button
                  type="button"
                  onClick={handleSearch}
                  disabled={loading || !query.trim()}
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  Search
                </button>
              </div>
            </div>

            {/* Search results */}
            <div className="flex-1 overflow-y-auto p-4">
              {loading ? (
                <div className="text-center py-8 text-gray-500">Searching...</div>
              ) : results.length > 0 ? (
                <div className="space-y-3">
                  {results.map((message) => (
                    <div
                      key={message.id}
                      className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition cursor-pointer"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-semibold">
                          {message.user?.name?.[0] || '?'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline gap-2 mb-1">
                            <span className="font-semibold text-sm">
                              {message.user?.name || 'Unknown'}
                            </span>
                            <span className="text-xs text-gray-500">
                              {formatDistanceToNow(new Date(message.created_at), {
                                addSuffix: true,
                              })}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">
                            {message.content}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : query && !loading ? (
                <div className="text-center py-8 text-gray-500">No messages found</div>
              ) : (
                <div className="text-center py-8 text-gray-400">Type to search messages</div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
