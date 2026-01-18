import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { PlusIcon, FolderIcon } from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';

import { apiClient } from '../../../api/client';
import { useProjectStore } from '../../../store/projectStore';
import type { Project } from '../../../shared/types';
import { CreateProjectModal } from './CreateProjectModal';

export const ProjectList: React.FC = () => {
  const { projects, setProjects } = useProjectStore();
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
    setShowCreateModal(true);
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-text-muted">Loading projects...</div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-base text-text">
      <div className="w-full px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-text">Your Projects</h1>
          <button
            type="button"
            onClick={openCreate}
            className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-accent-foreground transition hover:bg-accent/90"
          >
            <PlusIcon className="h-4 w-4" />
            Create Project
          </button>
        </div>
        {projects.length === 0 ? (
          <div className="py-12 text-center">
            <FolderIcon className="mx-auto mb-4 h-16 w-16 text-text-muted" />
            <h2 className="mb-2 text-xl font-semibold text-text">No projects yet</h2>
            <p className="mb-6 text-text-muted">
              Create your first project to get started
            </p>
            <button
              type="button"
              onClick={openCreate}
              className="inline-flex items-center gap-2 rounded-lg bg-accent px-6 py-3 text-accent-foreground transition hover:bg-accent/90"
            >
              <PlusIcon className="w-5 h-5" />
              Create Project
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {projects.map((p) => (
              <Link
                key={p.id}
                to={`/projects/${p.id}`}
                className="flex items-center gap-3 rounded-lg border border-border/70 bg-surface/70 px-3 py-2 transition hover:border-border hover:bg-surface/90"
              >
                <span className="text-text-muted">
                  <FolderIcon className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-text">
                    {p.name}
                  </span>
                  {p.description && (
                    <span className="block truncate text-xs text-text-muted">
                      {p.description}
                    </span>
                  )}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>

      <CreateProjectModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={loadProjects}
      />
    </div>
  );
};
