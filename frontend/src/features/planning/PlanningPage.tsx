import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';

const actionItems = [
  {
    id: 'kanban',
    label: 'Create Kanban board',
    description: 'Stub: configure columns and backlog.',
  },
  {
    id: 'calendar',
    label: 'Create Calendar view',
    description: 'Stub: sync milestones and dates.',
  },
  {
    id: 'jira',
    label: 'Connect Jira project',
    description: 'Stub: map issues to DevHub.',
  },
];

export const PlanningPage: React.FC = () => {
  const { projectId } = useParams();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handleClick = (event: MouseEvent) => {
      if (!menuRef.current) return;
      if (menuRef.current.contains(event.target as Node)) return;
      setMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [menuOpen]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="border-b border-slate-800 bg-slate-950/90 px-6 py-5">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-widest text-slate-500">Project</p>
            <h1 className="text-2xl font-semibold">Planning · {projectId ?? 'workspace'}</h1>
            <p className="text-sm text-slate-400">
              Track initiatives, milestones, and delivery plans.
            </p>
          </div>
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen((prev) => !prev)}
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-indigo-500"
            >
              New planning view
            </button>
            {menuOpen && (
              <div className="absolute right-0 mt-2 w-64 rounded-lg border border-slate-800 bg-slate-900/95 p-2 shadow-lg">
                <p className="px-3 py-2 text-xs uppercase tracking-widest text-slate-500">
                  Create
                </p>
                <div className="space-y-1">
                  {actionItems.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className="w-full rounded-md px-3 py-2 text-left transition hover:bg-slate-800/80"
                    >
                      <div className="text-sm font-semibold text-slate-100">
                        {item.label}
                      </div>
                      <div className="text-xs text-slate-400">{item.description}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-6">
        <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-6">
          <h2 className="text-lg font-semibold text-slate-100">Planning workspace</h2>
          <p className="mt-2 text-sm text-slate-400">
            Select a planning view to start organizing workstreams. This page will host
            Kanban boards, calendars, and integrations.
          </p>
        </div>
      </div>
    </div>
  );
};
