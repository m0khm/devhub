import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useAuthStore } from '../../store/authStore';
import { ProfileForm } from './ProfileForm';

interface ProfileModalProps {
  open: boolean;
  onClose: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ open, onClose }) => {
  const user = useAuthStore((state) => state.user);
  const prevOverflow = useRef<string>('');

  useEffect(() => {
    if (!open) return;

    prevOverflow.current = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
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
    background: 'rgba(15, 23, 42, 0.6)',
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
    maxWidth: 720,
    maxHeight: '90vh',
    background: '#fff',
    borderRadius: 20,
    boxShadow: '0 24px 80px rgba(15, 23, 42, 0.25)',
    overflowY: 'auto',
    padding: 28,
    pointerEvents: 'auto',
  };

  const modal = (
    <>
      <div style={overlayStyle} onMouseDown={onClose} />
      <div style={wrapStyle}>
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Profile settings"
          style={dialogStyle}
          onMouseDown={(event) => event.stopPropagation()}
        >
          <div className="mb-6 flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">
                Профиль и настройки
              </h2>
              <p className="text-sm text-gray-500">
                Управляйте данными аккаунта прямо здесь.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-gray-200 p-2 text-gray-500 transition hover:border-gray-300 hover:text-gray-700"
              aria-label="Закрыть модалку профиля"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
          {user ? (
            <ProfileForm user={user} onSaved={onClose} />
          ) : (
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-6 text-center">
              <h3 className="text-lg font-semibold text-gray-900">Profile</h3>
              <p className="mt-2 text-sm text-gray-600">
                Please log in to view your profile.
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );

  return createPortal(modal, document.body);
};
