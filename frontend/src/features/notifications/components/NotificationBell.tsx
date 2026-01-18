import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../../../api/client';
import type { Notification } from '../../../shared/types';
import { useNotificationStore } from '../../../store/notificationStore';

export const NotificationBell: React.FC = () => {
  const navigate = useNavigate();
  const { notifications, setNotifications, markRead } = useNotificationStore();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleOutside = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener('mousedown', handleOutside);
    }
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [open]);

  useEffect(() => {
    const loadNotifications = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get<Notification[]>('/notifications', {
          params: { limit: 20 },
        });
        setNotifications(Array.isArray(response.data) ? response.data : []);
      } finally {
        setLoading(false);
      }
    };
    loadNotifications();
  }, [setNotifications]);

  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.is_read).length,
    [notifications]
  );

  const handleItemClick = async (item: Notification) => {
    try {
      if (!item.is_read) {
        await apiClient.patch(`/notifications/${item.id}/read`);
        markRead(item.id);
      }
      if (item.link) {
        navigate(item.link);
      }
      setOpen(false);
    } catch (error) {
      console.error('Failed to mark notification read', error);
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface-muted text-text transition hover:bg-surface"
        aria-label="Notifications"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          className="text-text"
        >
          <path
            d="M12 3a6 6 0 0 0-6 6v4.2l-1.3 2.6a1 1 0 0 0 .9 1.4h13a1 1 0 0 0 .9-1.4L18 13.2V9a6 6 0 0 0-6-6Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M9.5 20a2.5 2.5 0 0 0 5 0"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 text-xs font-semibold text-white">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-3 w-80 rounded-xl border border-border bg-base shadow-xl">
          <div className="border-b border-border px-4 py-3">
            <div className="text-sm font-semibold text-text">Notifications</div>
            <div className="text-xs text-text-muted">{unreadCount} unread</div>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="px-4 py-6 text-sm text-text-muted">Loading...</div>
            ) : notifications.length === 0 ? (
              <div className="px-4 py-6 text-sm text-text-muted">
                You have no notifications yet.
              </div>
            ) : (
              <div className="divide-y divide-border/70">
                {notifications.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleItemClick(item)}
                    className="flex w-full flex-col gap-1 px-4 py-3 text-left transition hover:bg-surface"
                  >
                    <span className="flex items-center gap-2 text-sm font-medium text-text">
                      {!item.is_read && (
                        <span className="h-2 w-2 rounded-full bg-blue-500" />
                      )}
                      {item.title}
                    </span>
                    <span className="text-xs text-text-muted">{item.body}</span>
                    <span className="text-[11px] text-text-muted/80">
                      {new Date(item.created_at).toLocaleString()}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
