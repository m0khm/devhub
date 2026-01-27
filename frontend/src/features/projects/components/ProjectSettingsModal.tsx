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
  onMembersUpdated?: () => void | Promise<void>;
}

export const ProjectSettingsModal: React.FC<ProjectSettingsModalProps> = ({
  open,
  onClose,
  project,
  members,
  membersLoading,
  onMembersUpdated,
}) => {
  const prevOverflow = useRef<string>('');
  const updateProject = useProjectStore((state) => state.updateProject);
  const deleteProject = useProjectStore((state) => state.deleteProject);
  const memberCount = useMemo(() => members.length, [members]);
  const [accessLevel, setAccessLevel] = useState<
    'private' | 'members' | 'public'
  >('private');
  const [visibility, setVisibility] = useState<'visible' | 'hidden' | 'archived'>(
    'visible'
  );
  const [muteNotifications, setMuteNotifications] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [roleMenu, setRoleMenu] = useState<{
    member: ProjectMemberWithUser;
    x: number;
    y: number;
  } | null>(null);
  const [roleUpdating, setRoleUpdating] = useState(false);

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

  useEffect(() => {
    if (open) return;
    setRoleMenu(null);
  }, [open]);

  useEffect(() => {
    if (!roleMenu) return;

    const handleClose = () => setRoleMenu(null);
    window.addEventListener('click', handleClose);
    window.addEventListener('contextmenu', handleClose);
    window.addEventListener('scroll', handleClose, true);

    return () => {
      window.removeEventListener('click', handleClose);
      window.removeEventListener('contextmenu', handleClose);
      window.removeEventListener('scroll', handleClose, true);
    };
  }, [roleMenu]);

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

  const handleDelete = async () => {
    if (!project || deleting) return;
    const confirmed = window.confirm(
      `Delete "${project.name}"? This action cannot be undone.`
    );
    if (!confirmed) return;
    setDeleting(true);
    try {
      await apiClient.delete(`/projects/${project.id}`);
      deleteProject(project.id);
      toast.success('Project deleted');
      onClose();
    } catch (error: any) {
      const message = error.response?.data?.error || 'Failed to delete project';
      toast.error(message);
    } finally {
      setDeleting(false);
    }
  };

  const handleContextMenu = (
    event: React.MouseEvent<HTMLLIElement>,
    member: ProjectMemberWithUser
  ) => {
    event.preventDefault();
    if (!project) return;
    const menuWidth = 180;
    const menuHeight = 96;
    const padding = 12;
    const x = Math.min(
      event.clientX,
      window.innerWidth - menuWidth - padding
    );
    const y = Math.min(
      event.clientY,
      window.innerHeight - menuHeight - padding
    );
    setRoleMenu({ member, x, y });
  };

  const handleRoleChange = async (role: 'admin' | 'member') => {
    if (!project || !roleMenu || roleUpdating) return;
    setRoleUpdating(true);
    try {
      await apiClient.patch(
        `/projects/${project.id}/members/${roleMenu.member.user_id}`,
        { role }
      );
      toast.success('Member role updated');
      await onMembersUpdated?.();
      setRoleMenu(null);
    } catch (error: any) {
      const message =
        error.response?.data?.error || 'Failed to update member role';
      toast.error(message);
    } finally {
      setRoleUpdating(false);
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
                        onContextMenu={(event) =>
                          handleContextMenu(event, member)
                        }
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

            <section className="rounded-lg border border-red-500/40 bg-red-500/10 p-4">
              <h3 className="text-sm font-semibold text-red-600">Danger zone</h3>
              <p className="mt-2 text-sm text-red-500/80">
                Deleting a project removes all of its data and cannot be undone.
              </p>
              <div className="mt-4">
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="rounded-lg border border-red-500/60 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {deleting ? 'Deleting...' : 'Delete project'}
                </button>
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
          {roleMenu && (
            <div
              className="fixed z-[1000001] w-44 rounded-lg border border-border/70 bg-surface p-2 text-sm text-text shadow-lg"
              style={{ left: roleMenu.x, top: roleMenu.y }}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="px-2 pb-2 text-xs text-text-muted">
                Change role
              </div>
              {roleMenu.member.role === 'owner' ? (
                <div className="px-2 py-1 text-xs text-text-muted">
                  Owner role cannot be changed
                </div>
              ) : (
                <div className="space-y-1">
                  <button
                    type="button"
                    className="w-full rounded-md px-2 py-1 text-left text-sm text-text hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-60"
                    onClick={() => handleRoleChange('admin')}
                    disabled={roleUpdating || roleMenu.member.role === 'admin'}
                  >
                    Make admin
                  </button>
                  <button
                    type="button"
                    className="w-full rounded-md px-2 py-1 text-left text-sm text-text hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-60"
                    onClick={() => handleRoleChange('member')}
                    disabled={roleUpdating || roleMenu.member.role === 'member'}
                  >
                    Make member
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );

  return createPortal(modal, document.body);
};
