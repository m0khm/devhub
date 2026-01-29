import { motion } from 'motion/react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Building2, Rocket, Users } from 'lucide-react';
import { apiClient } from '../../../api/client';
import { useProjectStore } from '../../../store/projectStore';
import { useWorkspaceStore } from '../../../store/workspaceStore';
import type { Project, Workspace } from '../../../shared/types';
import { getDefaultKanbanColumns, saveKanbanColumns } from '../utils/kanbanStorage';

const TEMPLATE_PROJECT_NAME = 'Новый проект';
const DEFAULT_WORKSPACE_NAME = 'Моя команда';

type OnboardingStep = 'workspace' | 'project';

export function CreateProjectPage() {
  const navigate = useNavigate();
  const { projects, setProjects, setCurrentProject } = useProjectStore();
  const {
    workspaces,
    currentWorkspace,
    setWorkspaces,
    setCurrentWorkspace,
    addWorkspace,
  } = useWorkspaceStore();
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [step, setStep] = useState<OnboardingStep>('workspace');
  const [workspaceName, setWorkspaceName] = useState(DEFAULT_WORKSPACE_NAME);
  const [projectName, setProjectName] = useState(TEMPLATE_PROJECT_NAME);
  const [joinProjectId, setJoinProjectId] = useState('');
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string | null>(null);

  const activeWorkspace = useMemo(() => {
    return (
      workspaces.find((workspace) => workspace.id === selectedWorkspaceId) ||
      currentWorkspace ||
      workspaces[0] ||
      null
    );
  }, [currentWorkspace, selectedWorkspaceId, workspaces]);

  const loadWorkspaces = useCallback(async () => {
    const response = await apiClient.get<Workspace[]>('/workspaces');
    const fetched = Array.isArray(response.data) ? response.data : [];
    setWorkspaces(fetched);
    return fetched;
  }, [setWorkspaces]);

  const loadProjects = useCallback(
    async (workspaceId: string) => {
      const response = await apiClient.get<Project[]>(`/workspaces/${workspaceId}/projects`);
      const fetchedProjects = Array.isArray(response.data) ? response.data : [];
      setProjects(fetchedProjects);
      return fetchedProjects;
    },
    [setProjects]
  );

  const handleWorkspaceSelection = useCallback(
    async (workspace: Workspace) => {
      setCurrentWorkspace(workspace);
      setSelectedWorkspaceId(workspace.id);
      const fetchedProjects = await loadProjects(workspace.id);
      if (fetchedProjects.length > 0) {
        setCurrentProject(fetchedProjects[0]);
        navigate(`/workspace/chat/${fetchedProjects[0].id}`);
        return;
      }
      setStep('project');
    },
    [loadProjects, navigate, setCurrentProject, setCurrentWorkspace]
  );

  const bootstrap = useCallback(async () => {
    try {
      const fetchedWorkspaces = await loadWorkspaces();
      if (fetchedWorkspaces.length === 0) {
        setStep('workspace');
        return;
      }

      const workspace =
        currentWorkspace && fetchedWorkspaces.some((item) => item.id === currentWorkspace.id)
          ? currentWorkspace
          : fetchedWorkspaces[0];

      setCurrentWorkspace(workspace);
      setSelectedWorkspaceId(workspace.id);
      const fetchedProjects = await loadProjects(workspace.id);
      if (fetchedProjects.length > 0) {
        setCurrentProject(fetchedProjects[0]);
        navigate(`/workspace/chat/${fetchedProjects[0].id}`);
        return;
      }
      setStep('project');
    } catch (error) {
      toast.error('Не удалось загрузить workspace');
      setStep('workspace');
    }
  }, [currentWorkspace, loadProjects, loadWorkspaces, navigate, setCurrentProject, setCurrentWorkspace]);

  useEffect(() => {
    if (projects.length > 0) {
      setChecking(false);
      return;
    }
    void bootstrap().finally(() => setChecking(false));
  }, [bootstrap, projects.length]);

  const handleCreateWorkspace = async () => {
    if (!workspaceName.trim()) {
      toast.error('Введите название workspace');
      return;
    }
    setLoading(true);
    try {
      const response = await apiClient.post<Workspace>('/workspaces', {
        name: workspaceName.trim(),
        description: 'Workspace для вашей команды и проектов.',
      });
      const workspace = response.data;
      addWorkspace(workspace);
      setCurrentWorkspace(workspace);
      setSelectedWorkspaceId(workspace.id);
      setStep('project');
      toast.success('Workspace создан');
    } catch (error: any) {
      const message = error.response?.data?.error || 'Не удалось создать workspace';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async () => {
    if (!activeWorkspace) {
      toast.error('Выберите workspace');
      return;
    }
    if (!projectName.trim()) {
      toast.error('Введите название проекта');
      return;
    }
    setLoading(true);
    try {
      const response = await apiClient.post<Project>(
        `/workspaces/${activeWorkspace.id}/projects`,
        {
          name: projectName.trim(),
          description: 'Проект создан на основе шаблона по умолчанию.',
        }
      );
      const project = response.data;
      const nextProjects = [...projects, project];
      setProjects(nextProjects);
      setCurrentProject(project);
      saveKanbanColumns(project.id, getDefaultKanbanColumns());
      toast.success('Проект создан');
      navigate(`/workspace/chat/${project.id}`);
    } catch (error: any) {
      const message = error.response?.data?.error || 'Не удалось создать проект';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinProject = async () => {
    if (!joinProjectId.trim()) {
      toast.error('Введите ID проекта');
      return;
    }
    setLoading(true);
    try {
      const response = await apiClient.post<Project>('/projects/join', {
        project_id: joinProjectId.trim(),
      });
      const project = response.data;
      const updatedWorkspaces = await loadWorkspaces();
      const matchingWorkspace = project.workspace_id
        ? updatedWorkspaces.find((workspace) => workspace.id === project.workspace_id) || null
        : null;
      if (matchingWorkspace) {
        setCurrentWorkspace(matchingWorkspace);
        setSelectedWorkspaceId(matchingWorkspace.id);
        const fetchedProjects = await loadProjects(matchingWorkspace.id);
        const current =
          fetchedProjects.find((item) => item.id === project.id) || project;
        setProjects(fetchedProjects.length > 0 ? fetchedProjects : [project]);
        setCurrentProject(current);
      } else {
        setCurrentProject(project);
        setProjects([...projects, project]);
      }
      toast.success('Вы присоединились к проекту');
      navigate(`/workspace/chat/${project.id}`);
    } catch (error: any) {
      const message = error.response?.data?.error || 'Не удалось присоединиться к проекту';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-purple-950 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-3xl w-full rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-10 text-center shadow-2xl"
      >
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg">
          {step === 'workspace' ? <Building2 className="h-8 w-8" /> : <Rocket className="h-8 w-8" />}
        </div>
        <h1 className="text-3xl font-bold text-white mb-4">
          {step === 'workspace' ? 'Создать workspace' : 'Добавить проект'}
        </h1>
        <p className="text-slate-300 mb-8">
          {step === 'workspace'
            ? 'Сначала создадим пространство для команды, чтобы хранить проекты и доступы.'
            : 'Создайте новый проект в выбранном workspace или присоединитесь к существующему.'}
        </p>

        {step === 'workspace' ? (
          <div className="space-y-4 text-left">
            <label className="block text-sm font-medium text-slate-200">Название workspace</label>
            <input
              value={workspaceName}
              onChange={(event) => setWorkspaceName(event.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Например, Команда продукта"
            />
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleCreateWorkspace}
              disabled={loading}
              className="w-full rounded-2xl bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-4 text-lg font-semibold text-white shadow-lg transition disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Создаем...' : 'Создать workspace'}
            </motion.button>
          </div>
        ) : (
          <div className="grid gap-6 text-left md:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <div className="flex items-center gap-3 mb-4">
                <Rocket className="h-5 w-5 text-blue-300" />
                <h2 className="text-lg font-semibold text-white">Новый проект</h2>
              </div>
              <label className="block text-sm font-medium text-slate-200">Workspace</label>
              <select
                value={activeWorkspace?.id ?? ''}
                onChange={(event) => {
                  const nextWorkspace = workspaces.find(
                    (workspace) => workspace.id === event.target.value
                  );
                  if (nextWorkspace) {
                    void handleWorkspaceSelection(nextWorkspace);
                  }
                }}
                className="mt-2 w-full rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 text-white"
              >
                {workspaces.map((workspace) => (
                  <option key={workspace.id} value={workspace.id}>
                    {workspace.name}
                  </option>
                ))}
              </select>
              <label className="mt-4 block text-sm font-medium text-slate-200">Название проекта</label>
              <input
                value={projectName}
                onChange={(event) => setProjectName(event.target.value)}
                className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleCreateProject}
                disabled={loading}
                className="mt-4 w-full rounded-2xl bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-3 text-base font-semibold text-white shadow-lg transition disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? 'Создаем...' : 'Создать проект'}
              </motion.button>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <div className="flex items-center gap-3 mb-4">
                <Users className="h-5 w-5 text-purple-300" />
                <h2 className="text-lg font-semibold text-white">Присоединиться</h2>
              </div>
              <label className="block text-sm font-medium text-slate-200">ID проекта</label>
              <input
                value={joinProjectId}
                onChange={(event) => setJoinProjectId(event.target.value)}
                className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="UUID проекта"
              />
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleJoinProject}
                disabled={loading}
                className="mt-4 w-full rounded-2xl bg-gradient-to-r from-purple-500 to-indigo-600 px-6 py-3 text-base font-semibold text-white shadow-lg transition disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? 'Подключаем...' : 'Присоединиться'}
              </motion.button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
