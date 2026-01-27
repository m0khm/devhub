import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { apiClient } from '../../api/client';

interface CodeFile {
  id?: string;
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

export const CodePage: React.FC = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [repos, setRepos] = useState<Repo[]>([]);
  const [selectedRepoId, setSelectedRepoId] = useState('');
  const [selectedFilePath, setSelectedFilePath] = useState('');
  const [newRepoName, setNewRepoName] = useState('');
  const [newRepoDescription, setNewRepoDescription] = useState('');
  const [newFilePath, setNewFilePath] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const saveTimeoutRef = useRef<number | null>(null);

  const selectedRepo = repos.find((repo) => repo.id === selectedRepoId) ?? repos[0];
  const selectedFile = selectedRepo?.files.find((file) => file.path === selectedFilePath);
  const storageKey = projectId ? `code_repos_${projectId}` : 'code_repos';

  useEffect(() => {
    if (!projectId) {
      return;
    }

    const stored = localStorage.getItem(storageKey);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as Repo[];
        if (Array.isArray(parsed)) {
          setRepos(parsed);
        }
      } catch {
        localStorage.removeItem(storageKey);
      }
    }

    const loadRepos = async () => {
      try {
        const response = await apiClient.get<Repo[]>(`/projects/${projectId}/repos`);
        setRepos(Array.isArray(response.data) ? response.data : []);
      } catch {
        // fallback to localStorage data
      } finally {
        setIsLoading(false);
      }
    };

    loadRepos();
  }, [projectId, storageKey]);

  useEffect(() => {
    if (!projectId) {
      return;
    }
    localStorage.setItem(storageKey, JSON.stringify(repos));
  }, [projectId, repos, storageKey]);

  useEffect(() => {
    if (!repos.length) {
      setSelectedRepoId('');
      setSelectedFilePath('');
      return;
    }

    if (!selectedRepoId || !repos.some((repo) => repo.id === selectedRepoId)) {
      setSelectedRepoId(repos[0].id);
      setSelectedFilePath(repos[0].files[0]?.path ?? '');
      return;
    }

    if (
      selectedRepoId &&
      selectedFilePath &&
      repos
        .find((repo) => repo.id === selectedRepoId)
        ?.files.some((file) => file.path === selectedFilePath)
    ) {
      return;
    }

    const currentRepo = repos.find((repo) => repo.id === selectedRepoId);
    setSelectedFilePath(currentRepo?.files[0]?.path ?? '');
  }, [repos, selectedRepoId, selectedFilePath]);

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        window.clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  const handleCreateFile = async () => {
    if (!selectedRepo || !newFilePath.trim()) {
      return;
    }
    const trimmedPath = newFilePath.trim();
    if (!projectId) {
      return;
    }

    try {
      const response = await apiClient.post<CodeFile>(
        `/projects/${projectId}/repos/${selectedRepo.id}/files`,
        {
          path: trimmedPath,
          content: '',
        }
      );
      const createdFile = response.data;
      setRepos((prev) =>
        prev.map((repo) =>
          repo.id === selectedRepo.id
            ? { ...repo, files: [...repo.files, createdFile] }
            : repo
        )
      );
      setSelectedFilePath(createdFile.path);
      setNewFilePath('');
    } catch {
      const fallbackFile: CodeFile = { id: `${Date.now()}`, path: trimmedPath, content: '' };
      setRepos((prev) =>
        prev.map((repo) =>
          repo.id === selectedRepo.id
            ? { ...repo, files: [...repo.files, fallbackFile] }
            : repo
        )
      );
      setSelectedFilePath(fallbackFile.path);
      setNewFilePath('');
    }
  };

  const handleCreateRepo = async () => {
    if (!newRepoName.trim()) {
      return;
    }
    if (!projectId) {
      return;
    }

    try {
      const response = await apiClient.post<Repo>(`/projects/${projectId}/repos`, {
        name: newRepoName.trim(),
        description: newRepoDescription.trim() || undefined,
      });
      const newRepo = response.data;
      setRepos((prev) => [newRepo, ...prev]);
      setSelectedRepoId(newRepo.id);
      setSelectedFilePath(newRepo.files[0]?.path ?? '');
      setNewRepoName('');
      setNewRepoDescription('');
    } catch {
      const fallbackRepo: Repo = {
        id: `${newRepoName.trim()}-${Date.now()}`,
        name: newRepoName.trim(),
        description: newRepoDescription.trim() || undefined,
        updatedAt: new Date().toISOString(),
        files: [],
      };
      setRepos((prev) => [fallbackRepo, ...prev]);
      setSelectedRepoId(fallbackRepo.id);
      setSelectedFilePath('');
      setNewRepoName('');
      setNewRepoDescription('');
    }
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

    if (!projectId || !selectedFile.id) {
      return;
    }

    if (saveTimeoutRef.current) {
      window.clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = window.setTimeout(async () => {
      try {
        await apiClient.put(
          `/projects/${projectId}/repos/${selectedRepo.id}/files/${selectedFile.id}`,
          {
            content: nextContent,
            language: selectedFile.language,
          }
        );
      } catch {
        // keep local edits if API fails
      }
    }, 700);
  };

  const formatUpdatedAt = (value?: string) => {
    if (!value) {
      return 'unknown';
    }
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return value;
    }
    return parsed.toLocaleString();
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
              {isLoading ? (
                <div className="px-4 py-6 text-xs text-slate-500">Loading repositories...</div>
              ) : repos.length === 0 ? (
                <div className="px-4 py-6 text-xs text-slate-500">No repositories yet.</div>
              ) : (
                repos.map((repo) => (
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
                    <p className="mt-2 text-[11px] text-slate-500">
                      Updated {formatUpdatedAt(repo.updatedAt)}
                    </p>
                  </button>
                ))
              )}
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
