import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

const presets = [
  {
    id: 'notifications',
    title: 'Notifications',
    description: 'Tune digest and alert preferences for this project.',
  },
  {
    id: 'workspace',
    title: 'Workspace layout',
    description: 'Choose a workspace layout that fits your workflow.',
  },
  {
    id: 'access',
    title: 'Access controls',
    description: 'Review member access and project visibility.',
  },
];

export const CustomPage: React.FC = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [activePreset, setActivePreset] = useState(presets[0]?.id ?? '');

  const activeDetails = presets.find((preset) => preset.id === activePreset) ?? presets[0];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 bg-slate-950/90 px-6 py-5">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-widest text-slate-500">Project</p>
            <h1 className="text-2xl font-semibold">Customize · {projectId}</h1>
            <p className="text-sm text-slate-400">
              Tailor project settings and workspace behaviors.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate(`/projects/${projectId}`)}
            className="rounded-md border border-slate-700 px-3 py-2 text-sm text-slate-200 transition hover:border-slate-500"
          >
            Back to workspace
          </button>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-6 py-6 lg:grid-cols-[280px_1fr]">
        <aside className="space-y-3">
          {presets.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => setActivePreset(preset.id)}
              className={`w-full rounded-lg border px-4 py-3 text-left transition ${
                activePreset === preset.id
                  ? 'border-blue-500 bg-blue-500/10 text-blue-200'
                  : 'border-slate-800 bg-slate-900/40 text-slate-200 hover:border-slate-600'
              }`}
            >
              <p className="text-sm font-semibold">{preset.title}</p>
              <p className="mt-1 text-xs text-slate-400">{preset.description}</p>
            </button>
          ))}
        </aside>
        <section className="rounded-lg border border-slate-800 bg-slate-900/40 p-6">
          <p className="text-xs uppercase tracking-widest text-slate-500">Selected</p>
          <h2 className="mt-2 text-xl font-semibold text-slate-100">
            {activeDetails?.title}
          </h2>
          <p className="mt-2 text-sm text-slate-300">{activeDetails?.description}</p>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-4">
              <p className="text-sm font-semibold text-slate-100">Quick actions</p>
              <ul className="mt-3 space-y-2 text-sm text-slate-300">
                <li>• Review current configuration</li>
                <li>• Add custom automation rules</li>
                <li>• Sync settings across topics</li>
              </ul>
            </div>
            <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-4">
              <p className="text-sm font-semibold text-slate-100">Upcoming steps</p>
              <ul className="mt-3 space-y-2 text-sm text-slate-300">
                <li>• Connect third-party integrations</li>
                <li>• Assign owners to settings</li>
                <li>• Publish configuration updates</li>
              </ul>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};
