import React, { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
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

interface RepoBranch {
  name: string;
  updatedAt: string;
  lastCommit: string;
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

const defaultActivity = {
  branches: [] as RepoBranch[],
  commits: [] as RepoCommit[],
  changes: [] as RepoChange[],
};

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

  const [showAllBranches, setShowAllBranches] = useState(false);
  const [showAllCommits, setShowAllCommits] = useState(false);
  const [showAllChanges, setShowAllChanges] = useState(false);

  const activityLimit = 5;

  const [branchList, setBranchList] = useState<RepoBranch[]>([]);
  const [commitList, setCommitList] = useState<RepoCommit[]>([]);
  const [changeList, setChangeList] = useState<RepoChange[]>([]);
  const [loadingActivity, setLoadingActivity] = useState(false);

  const selectedRepo = repos.find((repo) => repo.id === selectedRepoId) ?? repos[0];
  const selectedFile = selectedRepo?.files.find((file) => file.path === selectedFilePath);
  useEffect(() => {
    if (!projectId) {
      return;
    }

    const loadRepos = async () => {
      try {
        const response = await apiClient.get<Repo[]>(`/projects/${projectId}/repos`);
        setRepos(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        const message =
          (error as { response?: { data?: { error?: string } } })?.response?.data?.error ??
          'Failed to load repositories';
        toast.error(message);
        setRepos([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadRepos();
  }, [projectId]);

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
      toast.error('Failed to create file');
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
      toast.error('Failed to create repository');
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
        toast.error('Failed to save file changes');
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

  useEffect(() => {
    let isMounted = true;

    const applyFallback = () => {
      if (!isMounted) return;
      setBranchList(defaultActivity.branches);
      setCommitList(defaultActivity.commits);
      setChangeList(defaultActivity.changes);
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
      } catch {
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
            <h1 className="text-2xl font-semibold">Code · {projectId ?? 'workspace'}</h1>
            <p className="text-sm text-slate-400">Repositories and files in one place.</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate(`/workspace/chat/${projectId}`)}
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
                        {change.files.length > 2 ? '...' : ''}
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
