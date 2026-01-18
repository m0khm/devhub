import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import toast from 'react-hot-toast';
import { PlusIcon, FolderIcon, XMarkIcon } from '@heroicons/react/24/outline';

import { apiClient } from '../../../api/client';
import { useProjectStore } from '../../../store/projectStore';
import type { Project } from '../../../shared/types';

export const ProjectList: React.FC = () => {
  const { projects, currentProject, setProjects, setCurrentProject } = useProjectStore();
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    void loadProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadProjects = async () => {
    try {
      const res = await apiClient.get<Project[]>('/projects');
      setProjects(res.data ?? []);
    } catch (e) {
      console.error('[API] GET /projects failed', e);
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    console.log('[UI] openCreateModal click');
    setShowCreateModal(true);
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center px-4 text-sm text-slate-400">
        Loading projects...
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-slate-950 text-slate-100">
      <div className="flex items-center justify-between px-4 py-5">
        <div className="text-xs font-semibold uppercase tracking-widest text-slate-400">
          Projects
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-2.5 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-700"
        >
          <PlusIcon className="h-4 w-4" />
          New
        </button>
      </div>

      {projects.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
          <FolderIcon className="mb-3 h-10 w-10 text-slate-500" />
          <h2 className="text-sm font-semibold text-slate-200">No projects yet</h2>
          <p className="mb-4 mt-1 text-xs text-slate-400">
            Create your first project to get started.
          </p>
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-700"
          >
            <PlusIcon className="h-4 w-4" />
            Create Project
          </button>
        </div>
      ) : (
        <div className="flex-1 space-y-1 overflow-y-auto px-3 pb-4">
          {projects.map((project) => {
            const isActive = currentProject?.id === project.id;
            const initials = project.name
              .split(' ')
              .map((word) => word[0])
              .join('')
              .slice(0, 2)
              .toUpperCase();

            return (
              <button
                key={project.id}
                type="button"
                onClick={() => setCurrentProject(project)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm transition ${
                  isActive
                    ? 'bg-slate-800/80 text-white shadow-md'
                    : 'text-slate-300 hover:bg-slate-800/60'
                }`}
              >
                {project.avatar_url ? (
                  <img
                    src={project.avatar_url}
                    alt={project.name}
                    className="h-9 w-9 rounded-full border border-slate-700 object-cover"
                  />
                ) : (
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-700 text-xs font-semibold text-white">
                    {initials}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="truncate font-medium">{project.name}</p>
                  {project.description ? (
                    <p className="truncate text-xs text-slate-400">{project.description}</p>
                  ) : (
                    <p className="text-xs text-slate-500">Team workspace</p>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      <CreateProjectModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={loadProjects}
      />
    </div>
  );
};

interface CreateProjectModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

const CreateProjectModal: React.FC<CreateProjectModalProps> = ({ open, onClose, onCreated }) => {
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
    background: '#0f172a',
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
          className="text-slate-100"
          onMouseDown={(e) => e.stopPropagation()}
        >
          <div className="flex items-start justify-between mb-4">
            <h2 className="text-2xl font-bold">Create New Project</h2>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-2 text-slate-300 hover:bg-slate-800"
              aria-label="Close"
            >
              <XMarkIcon className="w-5 h-5 text-slate-300" />
            </button>
          </div>

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Project Name
              </label>
              <input
                ref={nameRef}
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-900/80 px-4 py-2 text-slate-100 outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="My Awesome Project"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Description (optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-900/80 px-4 py-2 text-slate-100 outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="What's this project about?"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-lg border border-slate-700 px-4 py-2 text-slate-200 transition hover:bg-slate-800"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
              >
                {submitting ? 'Creating...' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );

  return createPortal(modal, document.body);
};
