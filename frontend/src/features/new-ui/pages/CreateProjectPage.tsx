import { motion } from 'motion/react';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Rocket } from 'lucide-react';
import { apiClient } from '../../../api/client';
import { useProjectStore } from '../../../store/projectStore';
import type { Project } from '../../../shared/types';
import { getDefaultKanbanColumns, saveKanbanColumns } from '../utils/kanbanStorage';

const TEMPLATE_PROJECT_NAME = 'Новый проект';

export function CreateProjectPage() {
  const navigate = useNavigate();
  const { projects, setProjects, setCurrentProject } = useProjectStore();
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  const loadProjects = useCallback(async () => {
    try {
      const response = await apiClient.get<Project[]>('/projects');
      const fetchedProjects = Array.isArray(response.data) ? response.data : [];
      setProjects(fetchedProjects);
      if (fetchedProjects.length > 0) {
        setCurrentProject(fetchedProjects[0]);
        navigate('/workspace');
      }
    } catch (error) {
      toast.error('Не удалось загрузить проекты');
    } finally {
      setChecking(false);
    }
  }, [navigate, setCurrentProject, setProjects]);

  useEffect(() => {
    if (projects.length > 0) {
      setChecking(false);
      return;
    }
    void loadProjects();
  }, [loadProjects, projects.length]);

  const handleCreate = async () => {
    setLoading(true);
    try {
      const response = await apiClient.post<Project>('/projects', {
        name: TEMPLATE_PROJECT_NAME,
        description: 'Проект создан на основе шаблона по умолчанию.',
      });
      const project = response.data;
      setProjects([...projects, project]);
      setCurrentProject(project);
      saveKanbanColumns(project.id, getDefaultKanbanColumns());
      toast.success('Проект создан');
      navigate('/workspace');
    } catch (error: any) {
      const message = error.response?.data?.error || 'Не удалось создать проект';
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
        className="max-w-lg w-full rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-10 text-center shadow-2xl"
      >
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg">
          <Rocket className="h-8 w-8" />
        </div>
        <h1 className="text-3xl font-bold text-white mb-4">Создать проект</h1>
        <p className="text-slate-300 mb-8">
          Пока в аккаунте нет проектов. Создайте workspace с готовым набором
          тем, настроек и канбан-колонок.
        </p>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleCreate}
          disabled={loading}
          className="w-full rounded-2xl bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-4 text-lg font-semibold text-white shadow-lg transition disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? 'Создаем...' : 'Создать с шаблоном'}
        </motion.button>
      </motion.div>
    </div>
  );
}
