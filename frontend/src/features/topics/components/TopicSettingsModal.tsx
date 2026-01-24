import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { XMarkIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { apiClient } from '../../../api/client';
import type { Topic } from '../../../shared/types';

interface TopicSettingsModalProps {
  open: boolean;
  onClose: () => void;
  topicId?: string | null;
}

export const TopicSettingsModal: React.FC<TopicSettingsModalProps> = ({
  open,
  onClose,
  topicId,
}) => {
  const prevOverflow = useRef<string>('');
  const [topic, setTopic] = useState<Topic | null>(null);
  const [loading, setLoading] = useState(false);
  const [muteNotifications, setMuteNotifications] = useState(false);
  const [autoJoinThreads, setAutoJoinThreads] = useState(true);

  useEffect(() => {
    if (!open || !topicId) return;
    setLoading(true);
    apiClient
      .get<Topic>(`/topics/${topicId}`)
      .then((response) => {
        setTopic(response.data);
      })
      .catch(() => {
        toast.error('Failed to load topic details');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [open, topicId]);

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

  if (!open) return null;

  const overlayStyle: React.CSSProperties = {
    position: 'fixed',
    inset: 0,
    zIndex: 999999,
    background: 'rgba(0,0,0,0.5)',
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
    maxWidth: 520,
    background: 'rgb(var(--color-surface))',
    border: '1px solid rgb(var(--color-border))',
    borderRadius: 16,
    boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
    padding: 24,
    pointerEvents: 'auto',
  };

  const modal = (
    <>
      <div style={overlayStyle} onMouseDown={onClose} />
      <div style={wrapStyle}>
        <div
          role="dialog"
          aria-modal="true"
          style={dialogStyle}
          className="text-text"
          onMouseDown={(event) => event.stopPropagation()}
        >
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-semibold">Topic settings</h2>
              <p className="text-sm text-text-muted">
                {topic?.name || 'Topic details'}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-2 text-text-muted hover:bg-surface-muted"
              aria-label="Close"
            >
              <XMarkIcon className="h-5 w-5 text-text-muted" />
            </button>
          </div>

          <div className="mt-6 space-y-6">
            <section className="rounded-lg border border-border/70 bg-surface/70 p-4">
              <h3 className="text-sm font-semibold text-text">Overview</h3>
              {loading ? (
                <p className="mt-3 text-sm text-text-muted">Loading topic…</p>
              ) : (
                <div className="mt-3 space-y-2 text-sm text-text-muted">
                  <p>
                    <span className="font-medium text-text">Name:</span>{' '}
                    {topic?.name || 'Unknown'}
                  </p>
                  <p>
                    <span className="font-medium text-text">Type:</span>{' '}
                    {topic?.type || 'n/a'}
                  </p>
                  {topic?.description && <p>{topic.description}</p>}
                </div>
              )}
            </section>

            <section className="rounded-lg border border-border/70 bg-surface/70 p-4">
              <h3 className="text-sm font-semibold text-text">Preferences</h3>
              <div className="mt-4 space-y-3 text-sm text-text-muted">
                <label className="flex items-center justify-between gap-4">
                  <span>Mute notifications</span>
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-accent"
                    checked={muteNotifications}
                    onChange={(event) => setMuteNotifications(event.target.checked)}
                  />
                </label>
                <label className="flex items-center justify-between gap-4">
                  <span>Auto-join threads</span>
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-accent"
                    checked={autoJoinThreads}
                    onChange={(event) => setAutoJoinThreads(event.target.checked)}
                  />
                </label>
              </div>
            </section>
          </div>
        </div>
      </div>
    </>
  );

  return createPortal(modal, document.body);
};
