import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  ChatBubbleLeftRightIcon,
  StarIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { apiClient } from '../../../api/client';
import { useProjectStore } from '../../../store/projectStore';

interface FavoritesModalProps {
  open: boolean;
  onClose: () => void;
}

interface FavoriteTopicItem {
  id: string;
  title: string;
  subtitle?: string;
}

interface FavoriteMessageItem {
  id: string;
  title: string;
  subtitle?: string;
}

interface FavoriteTopicResponse {
  id: string;
  name: string;
  project_id: string;
  favorited_at: string;
}

interface FavoriteMessageResponse {
  id: string;
  content: string;
  topic_id: string;
  topic_name: string;
  favorited_at: string;
}

interface FavoritesResponse {
  topics: FavoriteTopicResponse[];
  messages: FavoriteMessageResponse[];
}

export const FavoritesModal: React.FC<FavoritesModalProps> = ({
  open,
  onClose,
}) => {
  const prevOverflow = useRef<string>('');
  const { currentProject } = useProjectStore();
  const [favorites, setFavorites] = useState<FavoritesResponse>({
    topics: [],
    messages: [],
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!open) return;

    prevOverflow.current = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);

    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow.current || '';
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open || !currentProject) return;
    let isActive = true;
    setIsLoading(true);

    apiClient
      .get<FavoritesResponse>(`/projects/${currentProject.id}/favorites`)
      .then((response) => {
        if (!isActive) return;
        setFavorites({
          topics: response.data?.topics ?? [],
          messages: response.data?.messages ?? [],
        });
      })
      .catch(() => {
        if (!isActive) return;
        setFavorites({ topics: [], messages: [] });
      })
      .finally(() => {
        if (!isActive) return;
        setIsLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, [open, currentProject]);

  const favoriteTopics = useMemo<FavoriteTopicItem[]>(() => {
    if (favorites.topics.length > 0) {
      return favorites.topics.map((topic) => ({
        id: topic.id,
        title: topic.name,
        subtitle: currentProject
          ? `Проект: ${currentProject.name}`
          : 'Обсуждение команды',
      }));
    }
    return [];
  }, [favorites.topics, currentProject]);

  const favoriteMessages = useMemo<FavoriteMessageItem[]>(() => {
    if (favorites.messages.length > 0) {
      return favorites.messages.map((message) => ({
        id: message.id,
        title: message.content,
        subtitle: message.topic_name
          ? `Тема: ${message.topic_name}`
          : 'Сообщение команды',
      }));
    }
    return [];
  }, [favorites.messages]);

  if (!open) return null;

  const overlayStyle: React.CSSProperties = {
    position: 'fixed',
    inset: 0,
    zIndex: 999999,
    background: 'rgba(15, 23, 42, 0.65)',
    backdropFilter: 'blur(2px)',
  };

  const wrapStyle: React.CSSProperties = {
    position: 'fixed',
    inset: 0,
    zIndex: 1000000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    pointerEvents: 'none',
  };

  const dialogStyle: React.CSSProperties = {
    width: '100%',
    maxWidth: 640,
    maxHeight: '90vh',
    background: 'rgb(15, 23, 42)',
    border: '1px solid rgba(148, 163, 184, 0.2)',
    borderRadius: 20,
    boxShadow: '0 24px 80px rgba(15, 23, 42, 0.45)',
    overflowY: 'auto',
    padding: 28,
    pointerEvents: 'auto',
    color: 'white',
  };

  const modal = (
    <>
      <div style={overlayStyle} onMouseDown={onClose} />
      <div style={wrapStyle}>
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Избранное"
          style={dialogStyle}
          onMouseDown={(event) => event.stopPropagation()}
        >
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-sm text-slate-300">
                <StarIcon className="h-4 w-4" />
                Избранное
              </div>
              <h2 className="mt-1 text-2xl font-semibold text-white">
                Быстрый доступ к важному
              </h2>
              <p className="mt-2 text-sm text-slate-400">
                Список избранных тем и сообщений для проекта{' '}
                {currentProject?.name ?? 'DevHub'}.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-slate-700/60 p-2 text-slate-200 transition hover:border-slate-500 hover:text-white"
              aria-label="Закрыть избранное"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-6">
            <section>
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-200">
                <StarIcon className="h-4 w-4 text-yellow-300" />
                Избранные темы
              </div>
              <ul className="space-y-3">
                {isLoading ? (
                  <li className="rounded-2xl border border-dashed border-slate-800/80 bg-slate-900/40 px-4 py-3 text-sm text-slate-400">
                    Загрузка избранного...
                  </li>
                ) : favoriteTopics.length > 0 ? (
                  favoriteTopics.map((topic) => (
                    <li
                      key={topic.id}
                      className="rounded-2xl border border-slate-800/80 bg-slate-900/70 px-4 py-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-sm font-semibold text-white">
                            {topic.title}
                          </div>
                          {topic.subtitle && (
                            <div className="mt-1 text-xs text-slate-400">
                              {topic.subtitle}
                            </div>
                          )}
                        </div>
                      </div>
                    </li>
                  ))
                ) : (
                  <li className="rounded-2xl border border-dashed border-slate-800/80 bg-slate-900/40 px-4 py-3 text-sm text-slate-400">
                    Нет избранного
                  </li>
                )}
              </ul>
            </section>

            <section>
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-200">
                <ChatBubbleLeftRightIcon className="h-4 w-4 text-cyan-300" />
                Избранные сообщения
              </div>
              <ul className="space-y-3">
                {isLoading ? (
                  <li className="rounded-2xl border border-dashed border-slate-800/80 bg-slate-900/40 px-4 py-3 text-sm text-slate-400">
                    Загрузка избранного...
                  </li>
                ) : favoriteMessages.length > 0 ? (
                  favoriteMessages.map((message) => (
                    <li
                      key={message.id}
                      className="rounded-2xl border border-slate-800/80 bg-slate-900/70 px-4 py-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-sm font-semibold text-white">
                            {message.title}
                          </div>
                          {message.subtitle && (
                            <div className="mt-1 text-xs text-slate-400">
                              {message.subtitle}
                            </div>
                          )}
                        </div>
                      </div>
                    </li>
                  ))
                ) : (
                  <li className="rounded-2xl border border-dashed border-slate-800/80 bg-slate-900/40 px-4 py-3 text-sm text-slate-400">
                    Нет избранного
                  </li>
                )}
              </ul>
            </section>
          </div>
        </div>
      </div>
    </>
  );

  return createPortal(modal, document.body);
};
