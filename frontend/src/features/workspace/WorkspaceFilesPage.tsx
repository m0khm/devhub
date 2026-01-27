import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
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

export const WorkspaceFilesPage: React.FC = () => {
  const { projectId } = useParams<{ projectId?: string }>();
  const [repos, setRepos] = useState<Repo[]>([]);
  const [selectedRepoId, setSelectedRepoId] = useState('');
  const [selectedFilePath, setSelectedFilePath] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const storageKey = projectId ? `code_repos_${projectId}` : 'code_repos';

  useEffect(() => {
    if (!projectId) {
      setIsLoading(false);
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
        // keep local storage fallback
      } finally {
        setIsLoading(false);
      }
    };

    void loadRepos();
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

    const currentRepo = repos.find((repo) => repo.id === selectedRepoId);
    if (!selectedFilePath || !currentRepo?.files.some((file) => file.path === selectedFilePath)) {
      setSelectedFilePath(currentRepo?.files[0]?.path ?? '');
    }
  }, [repos, selectedRepoId, selectedFilePath]);

  const selectedRepo = useMemo(
    () => repos.find((repo) => repo.id === selectedRepoId),
    [repos, selectedRepoId]
  );
  const selectedFile = useMemo(
    () => selectedRepo?.files.find((file) => file.path === selectedFilePath),
    [selectedRepo, selectedFilePath]
  );

  return (
    <div className="flex h-full min-h-[520px] min-w-0">
      <aside className="w-80 border-r border-border/70 bg-base/70 p-4">
        <p className="text-xs uppercase tracking-[0.3em] text-text-muted">Files</p>
        <h1 className="mt-2 text-lg font-semibold text-text">Репозитории</h1>
        {isLoading ? (
          <p className="mt-4 text-sm text-text-muted">Загрузка…</p>
        ) : repos.length === 0 ? (
          <p className="mt-4 text-sm text-text-muted">
            Нет репозиториев. Создайте первый в разделе Code.
          </p>
        ) : (
          <div className="mt-4 space-y-4">
            {repos.map((repo) => (
              <div key={repo.id} className="space-y-2">
                <button
                  type="button"
                  onClick={() => setSelectedRepoId(repo.id)}
                  className={`w-full rounded-xl border px-3 py-2 text-left text-sm font-semibold transition ${
                    repo.id === selectedRepoId
                      ? 'border-accent/60 bg-accent/10 text-accent'
                      : 'border-border/60 text-text hover:border-border'
                  }`}
                >
                  {repo.name}
                </button>
                {repo.id === selectedRepoId && (
                  <div className="space-y-1 pl-3">
                    {repo.files.map((file) => (
                      <button
                        key={file.path}
                        type="button"
                        onClick={() => setSelectedFilePath(file.path)}
                        className={`w-full rounded-lg px-2 py-1 text-left text-xs transition ${
                          file.path === selectedFilePath
                            ? 'bg-base/80 text-text'
                            : 'text-text-muted hover:bg-base/60 hover:text-text'
                        }`}
                      >
                        {file.path}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </aside>
      <section className="flex flex-1 flex-col gap-4 bg-surface/60 p-6 text-text">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-text-muted">Preview</p>
          <h2 className="mt-2 text-xl font-semibold text-text">
            {selectedFile ? selectedFile.path : 'Выберите файл'}
          </h2>
          <p className="mt-1 text-sm text-text-muted">
            {selectedRepo?.description ?? 'Просмотр содержимого файла и метаданных.'}
          </p>
        </div>
        <div className="flex-1 overflow-auto rounded-2xl border border-border/70 bg-base/70 p-4 text-sm text-text-muted">
          {selectedFile ? (
            <pre className="whitespace-pre-wrap">{selectedFile.content || 'Пустой файл.'}</pre>
          ) : (
            <p>Выберите репозиторий и файл слева.</p>
          )}
        </div>
      </section>
    </div>
  );
};
