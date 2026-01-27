import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { apiClient } from '../../api/client';

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

interface RepoBranch {
  name: string;
  lastCommit: string;
  updatedAt: string;
}

interface RepoCommit {
  hash: string;
  message: string;
  author: string;
  timestamp: string;
}

interface RepoChange {
  id: string;
  summary: string;
  author: string;
  timestamp: string;
  files: string[];
}

interface RepoActivity {
  branches: RepoBranch[];
  commits: RepoCommit[];
  changes: RepoChange[];
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

const fallbackActivity: Record<string, RepoActivity> = {
  alpha: {
    branches: [
      { name: 'main', lastCommit: '9bf2c21', updatedAt: '2 hours ago' },
      { name: 'design/refresh', lastCommit: '0f4ad20', updatedAt: 'yesterday' },
      { name: 'feat/notifications', lastCommit: 'ad129fe', updatedAt: '2 days ago' },
      { name: 'chore/cleanup', lastCommit: 'c018ef2', updatedAt: 'last week' },
    ],
    commits: [
      {
        hash: '9bf2c21',
        message: 'Polish header spacing + restore theme tokens',
        author: 'Maya Chen',
        timestamp: 'Today · 12:45',
      },
      {
        hash: '0f4ad20',
        message: 'Add onboarding hints for new repos',
        author: 'Devon Lee',
        timestamp: 'Yesterday · 16:10',
      },
      {
        hash: 'ad129fe',
        message: 'Refactor build pipeline for UI bundles',
        author: 'Ira Diaz',
        timestamp: 'Mon · 09:02',
      },
    ],
    changes: [
      {
        id: 'change-1',
        summary: 'Updated sidebar navigation layout',
        author: 'Maya Chen',
        timestamp: 'Today · 11:30',
        files: ['src/components/Sidebar.tsx', 'src/styles/sidebar.css'],
      },
      {
        id: 'change-2',
        summary: 'Refined color tokens for dark mode',
        author: 'Devon Lee',
        timestamp: 'Yesterday · 15:42',
        files: ['src/styles/theme.css'],
      },
      {
        id: 'change-3',
        summary: 'Improved lint rules and formatting',
        author: 'Ira Diaz',
        timestamp: 'Mon · 08:15',
        files: ['.eslintrc', 'package.json'],
      },
    ],
  },
  beta: {
    branches: [
      { name: 'main', lastCommit: 'a70f343', updatedAt: 'yesterday' },
      { name: 'feat/billing-api', lastCommit: 'd11c3ad', updatedAt: '3 days ago' },
      { name: 'ops/metrics', lastCommit: 'bb67e12', updatedAt: 'last week' },
    ],
    commits: [
      {
        hash: 'a70f343',
        message: 'Add request tracing to API gateway',
        author: 'Felix Park',
        timestamp: 'Yesterday · 18:03',
      },
      {
        hash: 'd11c3ad',
        message: 'Introduce billing endpoints',
        author: 'Rosa Miles',
        timestamp: 'Mon · 10:27',
      },
      {
        hash: 'bb67e12',
        message: 'Tune worker concurrency defaults',
        author: 'Felix Park',
        timestamp: 'Fri · 17:50',
      },
    ],
    changes: [
      {
        id: 'change-4',
        summary: 'Migrated database connection pool',
        author: 'Rosa Miles',
        timestamp: 'Yesterday · 13:20',
        files: ['cmd/api/main.go', 'config/database.yml'],
      },
      {
        id: 'change-5',
        summary: 'Added health checks for workers',
        author: 'Felix Park',
        timestamp: 'Mon · 11:04',
        files: ['internal/health/handler.go'],
      },
    ],
  },
};

const defaultActivity: RepoActivity = {
  branches: [],
  commits: [],
  changes: [],
};

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
  const [branchList, setBranchList] = useState<RepoBranch[]>([]);
  const [commitList, setCommitList] = useState<RepoCommit[]>([]);
  const [changeList, setChangeList] = useState<RepoChange[]>([]);
  const [loadingActivity, setLoadingActivity] = useState(false);
  const [showAllBranches, setShowAllBranches] = useState(false);
  const [showAllCommits, setShowAllCommits] = useState(false);
  const [showAllChanges, setShowAllChanges] = useState(false);

  const selectedRepo = repos.find((repo) => repo.id === selectedRepoId) ?? repos[0];
  const selectedFile = selectedRepo?.files.find((file) => file.path === selectedFilePath);
  const activityLimit = 3;

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

  useEffect(() => {
    let isMounted = true;

    const applyFallback = () => {
      const fallback = fallbackActivity[selectedRepoId] ?? defaultActivity;
      if (!isMounted) {
        return;
      }
      setBranchList(fallback.branches);
      setCommitList(fallback.commits);
      setChangeList(fallback.changes);
    };

    const loadActivity = async () => {
      if (!projectId || !selectedRepoId) {
        applyFallback();
        return;
      }
      setLoadingActivity(true);
      try {
        const [branchesRes, commitsRes, changesRes] = await Promise.all([
          apiClient.get<RepoBranch[]>(
            `/projects/${projectId}/repos/${selectedRepoId}/branches`
          ),
          apiClient.get<RepoCommit[]>(
            `/projects/${projectId}/repos/${selectedRepoId}/commits`
          ),
          apiClient.get<RepoChange[]>(
            `/projects/${projectId}/repos/${selectedRepoId}/changes`
          ),
        ]);
        if (
          !Array.isArray(branchesRes.data) ||
          !Array.isArray(commitsRes.data) ||
          !Array.isArray(changesRes.data)
        ) {
          throw new Error('Invalid repo activity payload');
        }
        if (!isMounted) {
          return;
        }
        setBranchList(branchesRes.data);
        setCommitList(commitsRes.data);
        setChangeList(changesRes.data);
      } catch (error) {
        applyFallback();
      } finally {
        if (isMounted) {
          setLoadingActivity(false);
        }
      }
    };

    loadActivity();
    setShowAllBranches(false);
    setShowAllCommits(false);
    setShowAllChanges(false);

    return () => {
      isMounted = false;
    };
  }, [projectId, selectedRepoId]);

  const visibleBranches = showAllBranches ? branchList : branchList.slice(0, activityLimit);
  const visibleCommits = showAllCommits ? commitList : commitList.slice(0, activityLimit);
  const visibleChanges = showAllChanges ? changeList : changeList.slice(0, activityLimit);

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
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-100">Branches</h3>
                {branchList.length > activityLimit && (
                  <button
                    type="button"
                    onClick={() => setShowAllBranches((prev) => !prev)}
                    className="text-xs text-blue-400 hover:text-blue-300"
                  >
                    {showAllBranches ? 'Show less' : 'Show more'}
                  </button>
                )}
              </div>
              <div className="mt-3 space-y-2 text-sm text-slate-300">
                {loadingActivity ? (
                  <p className="text-xs text-slate-500">Loading branches...</p>
                ) : visibleBranches.length > 0 ? (
                  visibleBranches.map((branch) => (
                    <div
                      key={branch.name}
                      className="rounded-md border border-slate-800 bg-slate-950/60 px-3 py-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-100">{branch.name}</span>
                        <span className="text-[11px] text-slate-500">{branch.updatedAt}</span>
                      </div>
                      <p className="mt-1 text-[11px] text-slate-400">
                        Last commit · {branch.lastCommit}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500">No branches available.</p>
                )}
              </div>
            </div>
            <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-100">Recent commits</h3>
                {commitList.length > activityLimit && (
                  <button
                    type="button"
                    onClick={() => setShowAllCommits((prev) => !prev)}
                    className="text-xs text-blue-400 hover:text-blue-300"
                  >
                    {showAllCommits ? 'Show less' : 'Show more'}
                  </button>
                )}
              </div>
              <div className="mt-3 space-y-2 text-sm text-slate-300">
                {loadingActivity ? (
                  <p className="text-xs text-slate-500">Loading commits...</p>
                ) : visibleCommits.length > 0 ? (
                  visibleCommits.map((commit) => (
                    <div
                      key={commit.hash}
                      className="rounded-md border border-slate-800 bg-slate-950/60 px-3 py-2"
                    >
                      <p className="text-sm font-medium text-slate-100">{commit.message}</p>
                      <p className="mt-1 text-[11px] text-slate-400">
                        {commit.hash} · {commit.author}
                      </p>
                      <p className="text-[11px] text-slate-500">{commit.timestamp}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500">No commits yet.</p>
                )}
              </div>
            </div>
            <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-100">Change history</h3>
                {changeList.length > activityLimit && (
                  <button
                    type="button"
                    onClick={() => setShowAllChanges((prev) => !prev)}
                    className="text-xs text-blue-400 hover:text-blue-300"
                  >
                    {showAllChanges ? 'Show less' : 'Show more'}
                  </button>
                )}
              </div>
              <div className="mt-3 space-y-2 text-sm text-slate-300">
                {loadingActivity ? (
                  <p className="text-xs text-slate-500">Loading history...</p>
                ) : visibleChanges.length > 0 ? (
                  visibleChanges.map((change) => (
                    <div
                      key={change.id}
                      className="rounded-md border border-slate-800 bg-slate-950/60 px-3 py-2"
                    >
                      <p className="text-sm font-medium text-slate-100">{change.summary}</p>
                      <p className="mt-1 text-[11px] text-slate-400">
                        {change.author} · {change.timestamp}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {change.files.slice(0, 2).join(', ')}
                        {change.files.length > 2 ? '…' : ''}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500">No change history yet.</p>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
