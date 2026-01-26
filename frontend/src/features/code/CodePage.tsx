import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

interface CodeFile {
  path: string;
  language?: string;
  content: string;
}

interface Repo {
  id: string;
  name: string;
  description?: string;
  updatedAt: string;
  files: CodeFile[];
}

const initialRepos: Repo[] = [
  {
    id: 'alpha',
    name: 'frontend-web',
    description: 'UI layer for DevHub.',
    updatedAt: '2 hours ago',
    files: [
      {
        path: 'src/App.tsx',
        language: 'typescript',
        content: `import React from 'react';\n\nexport const App = () => {\n  return <div>Hello DevHub</div>;\n};`,
      },
      {
        path: 'src/styles/theme.css',
        language: 'css',
        content: `:root {\n  --brand: #1f6feb;\n}\n\nbody {\n  font-family: 'Inter', sans-serif;\n}`,
      },
    ],
  },
  {
    id: 'beta',
    name: 'backend-api',
    description: 'API service and workers.',
    updatedAt: 'yesterday',
    files: [
      {
        path: 'cmd/api/main.go',
        language: 'go',
        content: `package main\n\nfunc main() {\n  println("DevHub API")\n}`,
      },
      {
        path: 'README.md',
        language: 'markdown',
        content: `# Backend API\n\n- Fiber\n- PostgreSQL\n- Redis`,
      },
    ],
  },
];

export const CodePage: React.FC = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [repos, setRepos] = useState<Repo[]>(initialRepos);
  const [selectedRepoId, setSelectedRepoId] = useState(initialRepos[0]?.id ?? '');
  const [selectedFilePath, setSelectedFilePath] = useState(
    initialRepos[0]?.files[0]?.path ?? ''
  );
  const [newRepoName, setNewRepoName] = useState('');
  const [newRepoDescription, setNewRepoDescription] = useState('');
  const [newFilePath, setNewFilePath] = useState('');

  const selectedRepo = repos.find((repo) => repo.id === selectedRepoId) ?? repos[0];
  const selectedFile = selectedRepo?.files.find((file) => file.path === selectedFilePath);

  const handleCreateFile = () => {
    if (!selectedRepo || !newFilePath.trim()) {
      return;
    }
    const trimmedPath = newFilePath.trim();
    let fileAdded = false;
    setRepos((prev) =>
      prev.map((repo) => {
        if (repo.id !== selectedRepo.id) {
          return repo;
        }
        if (repo.files.some((file) => file.path === trimmedPath)) {
          return repo;
        }
        fileAdded = true;
        return {
          ...repo,
          files: [
            ...repo.files,
            {
              path: trimmedPath,
              content: '',
            },
          ],
        };
      })
    );
    if (fileAdded) {
      setSelectedFilePath(trimmedPath);
      setNewFilePath('');
    }
  };

  const handleCreateRepo = () => {
    if (!newRepoName.trim()) {
      return;
    }
    const newRepo: Repo = {
      id: `${newRepoName}-${Date.now()}`,
      name: newRepoName.trim(),
      description: newRepoDescription.trim() || undefined,
      updatedAt: 'just now',
      files: [
        {
          path: 'README.md',
          language: 'markdown',
          content: `# ${newRepoName.trim()}\n\nDescribe your project here.`,
        },
      ],
    };
    setRepos((prev) => [newRepo, ...prev]);
    setSelectedRepoId(newRepo.id);
    setSelectedFilePath(newRepo.files[0].path);
    setNewRepoName('');
    setNewRepoDescription('');
  };

  const handleFileContentChange = (nextContent: string) => {
    if (!selectedRepo || !selectedFile) {
      return;
    }
    setRepos((prev) =>
      prev.map((repo) => {
        if (repo.id !== selectedRepo.id) {
          return repo;
        }
        return {
          ...repo,
          files: repo.files.map((file) =>
            file.path === selectedFile.path ? { ...file, content: nextContent } : file
          ),
        };
      })
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="border-b border-slate-800 bg-slate-950/90 px-6 py-5">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-widest text-slate-500">Project</p>
            <h1 className="text-2xl font-semibold">Code · {projectId}</h1>
            <p className="text-sm text-slate-400">Repositories and files in one place.</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate(`/projects/${projectId}`)}
              className="rounded-md border border-slate-700 px-3 py-2 text-sm text-slate-200 transition hover:border-slate-500"
            >
              Back to workspace
            </button>
            <button
              type="button"
              className="rounded-md border border-slate-700 px-3 py-2 text-sm text-slate-200 transition hover:border-slate-500"
            >
              Clone
            </button>
            <button
              type="button"
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-500"
              onClick={handleCreateRepo}
            >
              New repository
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-6 py-6 lg:grid-cols-[280px_1fr]">
        <aside className="space-y-4">
          <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
            <h2 className="text-sm font-semibold text-slate-200">Create repository</h2>
            <div className="mt-3 space-y-2">
              <input
                value={newRepoName}
                onChange={(event) => setNewRepoName(event.target.value)}
                placeholder="Repository name"
                className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-blue-500 focus:outline-none"
              />
              <textarea
                value={newRepoDescription}
                onChange={(event) => setNewRepoDescription(event.target.value)}
                placeholder="Short description"
                rows={3}
                className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-blue-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleCreateRepo}
                className="w-full rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-500"
              >
                Create
              </button>
            </div>
          </div>

          <div className="rounded-lg border border-slate-800 bg-slate-900/60">
            <div className="border-b border-slate-800 px-4 py-3 text-sm font-semibold text-slate-200">
              Repositories
            </div>
            <div className="max-h-[420px] overflow-y-auto">
              {repos.map((repo) => (
                <button
                  type="button"
                  key={repo.id}
                  onClick={() => {
                    setSelectedRepoId(repo.id);
                    setSelectedFilePath(repo.files[0]?.path ?? '');
                  }}
                  className={`w-full border-b border-slate-800 px-4 py-3 text-left transition hover:bg-slate-800/60 ${
                    repo.id === selectedRepo?.id ? 'bg-slate-800/70' : ''
                  }`}
                >
                  <p className="text-sm font-semibold text-slate-100">{repo.name}</p>
                  <p className="text-xs text-slate-400">{repo.description}</p>
                  <p className="mt-2 text-[11px] text-slate-500">Updated {repo.updatedAt}</p>
                </button>
              ))}
            </div>
          </div>
        </aside>

        <section className="space-y-6">
          <div className="rounded-lg border border-slate-800 bg-slate-900/60">
            <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-100">{selectedRepo?.name}</h2>
                <p className="text-sm text-slate-400">{selectedRepo?.description}</p>
              </div>
              <div className="text-xs text-slate-500">Default branch: main</div>
            </div>
            <div className="grid grid-cols-1 gap-0 lg:grid-cols-[240px_1fr]">
              <div className="border-r border-slate-800">
                <div className="border-b border-slate-800 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Files
                  </p>
                  <div className="mt-3 space-y-2">
                    <input
                      value={newFilePath}
                      onChange={(event) => setNewFilePath(event.target.value)}
                      placeholder="Name / path"
                      className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:border-blue-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleCreateFile}
                      className="w-full rounded-md bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-500"
                    >
                      Create file
                    </button>
                  </div>
                </div>
                <div className="max-h-[420px] overflow-y-auto">
                  {selectedRepo?.files.map((file) => (
                    <button
                      key={file.path}
                      type="button"
                      onClick={() => setSelectedFilePath(file.path)}
                      className={`w-full border-b border-slate-800 px-4 py-3 text-left text-sm transition hover:bg-slate-800/60 ${
                        file.path === selectedFilePath ? 'bg-slate-800/70' : ''
                      }`}
                    >
                      {file.path}
                    </button>
                  ))}
                </div>
              </div>
              <div className="p-4">
                {selectedFile ? (
                  <div>
                    <div className="mb-2 flex items-center justify-between text-xs text-slate-400">
                      <span>{selectedFile.path}</span>
                      <span>{selectedFile.language ?? 'auto'}</span>
                    </div>
                    <textarea
                      value={selectedFile.content}
                      onChange={(event) => handleFileContentChange(event.target.value)}
                      rows={16}
                      className="w-full rounded-lg border border-slate-800 bg-slate-950 p-4 text-sm text-slate-100 focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                ) : (
                  <div className="py-10 text-center text-sm text-slate-400">
                    Select a file to preview.
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
