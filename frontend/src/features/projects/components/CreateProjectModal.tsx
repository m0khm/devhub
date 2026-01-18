import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import toast from 'react-hot-toast';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { apiClient } from '../../../api/client';

interface CreateProjectModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({
  open,
  onClose,
  onCreated,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const nameRef = useRef<HTMLInputElement | null>(null);
  const prevOverflow = useRef<string>('');

  useEffect(() => {
    if (!open) return;

    prevOverflow.current = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const t = window.setTimeout(() => nameRef.current?.focus(), 0);

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);

    return () => {
      window.clearTimeout(t);
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow.current || '';
    };
  }, [open, onClose]);

  useEffect(() => {
    if (open) {
      setName('');
      setDescription('');
      setSubmitting(false);
    }
  }, [open]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSubmitting(true);
    try {
      await apiClient.post('/projects', {
        name: name.trim(),
        description: description.trim() ? description.trim() : undefined,
      });
      toast.success('Project created!');
      await onCreated();
      onClose();
    } catch (err: any) {
      console.error('[API] POST /projects failed', err);
      toast.error(err?.response?.data?.error || 'Failed to create project');
    } finally {
      setSubmitting(false);
    }
  };

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
    maxWidth: 480,
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
          id="create-project-dialog"
          role="dialog"
          aria-modal="true"
          style={dialogStyle}
          className="text-text"
          onMouseDown={(e) => e.stopPropagation()}
        >
          <div className="flex items-start justify-between mb-4">
            <h2 className="text-2xl font-bold">Create New Project</h2>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-2 text-text-muted hover:bg-surface-muted"
              aria-label="Close"
            >
              <XMarkIcon className="w-5 h-5 text-text-muted" />
            </button>
          </div>

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-text-muted">
                Project Name
              </label>
              <input
                ref={nameRef}
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-border bg-surface/80 px-4 py-2 text-text outline-none focus:ring-2 focus:ring-accent"
                placeholder="My Awesome Project"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-text-muted">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-lg border border-border bg-surface/80 px-4 py-2 text-text outline-none focus:ring-2 focus:ring-accent"
                placeholder="Optional description"
                rows={3}
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-accent px-4 py-2 text-accent-foreground transition hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? 'Creating...' : 'Create Project'}
            </button>
          </form>
        </div>
      </div>
    </>
  );

  return createPortal(modal, document.body);
};
