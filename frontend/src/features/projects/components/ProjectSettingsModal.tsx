import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { XMarkIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { apiClient } from '../../../api/client';
import { useProjectStore } from '../../../store/projectStore';
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
  const updateProject = useProjectStore((state) => state.updateProject);
  const memberCount = useMemo(() => members.length, [members]);
  const [accessLevel, setAccessLevel] = useState<
    'private' | 'members' | 'public'
  >('private');
  const [visibility, setVisibility] = useState<'visible' | 'hidden' | 'archived'>(
    'visible'
  );
  const [muteNotifications, setMuteNotifications] = useState(false);
  const [saving, setSaving] = useState(false);

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
    if (!project) return;
    setAccessLevel(project.access_level ?? 'private');
    setVisibility(project.visibility ?? 'visible');
    setMuteNotifications(project.notifications_muted ?? false);
  }, [project]);

  const handleSave = async () => {
    if (!project) return;
    setSaving(true);
    try {
      const payload = {
        access_level: accessLevel,
        visibility,
        notifications_muted: muteNotifications,
      };
      const response = await apiClient.put<Project>(
        `/projects/${project.id}`,
        payload
      );
      updateProject(project.id, response.data);
      toast.success('Project settings updated');
      onClose();
    } catch (error: any) {
      const message = error.response?.data?.error || 'Failed to update project';
      toast.error(message);
    } finally {
      setSaving(false);
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
              <h3 className="text-sm font-semibold text-text">Access & visibility</h3>
              <div className="mt-4 space-y-4 text-sm text-text-muted">
                <label className="flex flex-col gap-2">
                  <span className="text-text">Access level</span>
                  <select
                    className="rounded-md border border-border/70 bg-base px-3 py-2 text-sm text-text"
                    value={accessLevel}
                    onChange={(event) =>
                      setAccessLevel(
                        event.target.value as 'private' | 'members' | 'public'
                      )
                    }
                  >
                    <option value="private">Invite only</option>
                    <option value="members">Members with link</option>
                    <option value="public">Public</option>
                  </select>
                </label>
                <label className="flex flex-col gap-2">
                  <span className="text-text">Visibility</span>
                  <select
                    className="rounded-md border border-border/70 bg-base px-3 py-2 text-sm text-text"
                    value={visibility}
                    onChange={(event) =>
                      setVisibility(
                        event.target.value as 'visible' | 'hidden' | 'archived'
                      )
                    }
                  >
                    <option value="visible">Visible to members</option>
                    <option value="hidden">Hidden from discovery</option>
                    <option value="archived">Archived</option>
                  </select>
                </label>
              </div>
            </section>

            <section className="rounded-lg border border-border/70 bg-surface/70 p-4">
              <h3 className="text-sm font-semibold text-text">Notifications</h3>
              <div className="mt-4 space-y-3 text-sm text-text-muted">
                <label className="flex items-center justify-between gap-4">
                  <span>Mute project notifications</span>
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-accent"
                    checked={muteNotifications}
                    onChange={(event) => setMuteNotifications(event.target.checked)}
                  />
                </label>
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
          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-border/70 px-4 py-2 text-sm text-text-muted hover:bg-surface-muted"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save settings'}
            </button>
          </div>
        </div>
      </div>
    </>
  );

  return createPortal(modal, document.body);
};
