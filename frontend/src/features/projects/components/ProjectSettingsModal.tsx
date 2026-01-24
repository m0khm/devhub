import React, { useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { XMarkIcon } from '@heroicons/react/24/outline';
import type { Project, ProjectMemberWithUser } from '../../../shared/types';

interface ProjectSettingsModalProps {
  open: boolean;
  onClose: () => void;
  project?: Project | null;
  members: ProjectMemberWithUser[];
  membersLoading: boolean;
}

export const ProjectSettingsModal: React.FC<ProjectSettingsModalProps> = ({
  open,
  onClose,
  project,
  members,
  membersLoading,
}) => {
  const prevOverflow = useRef<string>('');
  const memberCount = useMemo(() => members.length, [members]);

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
              <h2 className="text-2xl font-semibold">Project settings</h2>
              <p className="text-sm text-text-muted">
                {project?.name || 'Project details'}
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
              <div className="mt-3 space-y-2 text-sm text-text-muted">
                <p>
                  <span className="font-medium text-text">Project:</span>{' '}
                  {project?.name || 'Not selected'}
                </p>
                {project?.description && <p>{project.description}</p>}
              </div>
            </section>

            <section className="rounded-lg border border-border/70 bg-surface/70 p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-text">Members</h3>
                <span className="text-sm text-text-muted">
                  {membersLoading ? 'Loading...' : `${memberCount} total`}
                </span>
              </div>
              <div className="mt-4 space-y-2 text-sm text-text-muted">
                {membersLoading ? (
                  <p>Loading members…</p>
                ) : members.length === 0 ? (
                  <p>No members yet.</p>
                ) : (
                  <ul className="space-y-2">
                    {members.map((member) => (
                      <li
                        key={member.id}
                        className="flex items-center justify-between rounded-md border border-border/70 bg-base/40 px-3 py-2"
                      >
                        <div>
                          <div className="text-sm font-medium text-text">
                            {member.user?.name || member.user?.email || member.user_id}
                          </div>
                          <div className="text-xs text-text-muted">
                            {member.user?.email}
                          </div>
                        </div>
                        <span className="rounded-full bg-surface-muted px-2 py-0.5 text-xs text-text-muted">
                          {member.role}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>
          </div>
        </div>
      </div>
    </>
  );

  return createPortal(modal, document.body);
};
