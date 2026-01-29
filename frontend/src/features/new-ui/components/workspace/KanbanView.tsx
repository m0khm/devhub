import { AnimatePresence, motion } from 'framer-motion'; // ← поправил импорт (было 'motion/react' — скорее всего опечатка)
import { useCallback, useEffect, useState } from 'react';
import { Plus, MoreHorizontal, Calendar, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useOutletContext, useParams } from 'react-router-dom';
import { apiClient } from '../../../../api/client';
import type { WorkspaceOutletContext } from '../../pages/WorkspaceLayout';

type KanbanTask = {
  id: string;
  title: string;
  description?: string | null;
  assignee?: string | null;
  priority?: string | null;
};

type KanbanColumn = {
  id: string;
  title: string;
  position: number;
  color: string;
  tasks: KanbanTask[];
};

type ApiKanbanTask = {
  id: string;
  title: string;
  description?: string | null;
  assignee?: string | null;
  priority?: string | null;
};

type ApiKanbanColumn = {
  id: string;
  title: string;
  position?: number;
  tasks?: ApiKanbanTask[];
};

const defaultTaskDraft = {
  title: '',
  description: '',
  assignee: '',
  priority: 'medium',
};

const columnColorPalette = [
  'from-slate-500 to-slate-600',
  'from-blue-500 to-cyan-500',
  'from-purple-500 to-pink-500',
  'from-green-500 to-emerald-500',
  'from-orange-500 to-amber-500',
  'from-indigo-500 to-violet-500',
];

export function KanbanView() {
  const { currentProject } = useOutletContext<WorkspaceOutletContext>() ?? ({} as any);
  const { projectId } = useParams();

  const [draggedTask, setDraggedTask] = useState<{
    task: KanbanTask;
    sourceColumnId: string;
  } | null>(null);
  const [columns, setColumns] = useState<KanbanColumn[]>([]);
  const [activeColumnId, setActiveColumnId] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<KanbanTask | null>(null);
  const [taskDraft, setTaskDraft] = useState(defaultTaskDraft);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const activeProjectId = projectId ?? currentProject?.id;

  const mapColumns = (list: ApiKanbanColumn[]) =>
    list
      .slice()
      .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
      .map((column, index) => ({
        id: column.id,
        title: column.title,
        position: column.position ?? index,
        color: columnColorPalette[index % columnColorPalette.length],
        tasks: Array.isArray(column.tasks) ? column.tasks : [],
      }));

  const loadColumns = useCallback(async () => {
    if (!activeProjectId) {
      setColumns([]);
      return;
    }
    setIsLoading(true);
    try {
      const response = await apiClient.get<ApiKanbanColumn[]>(
        `/projects/${activeProjectId}/kanban/columns`
      );
      const list = Array.isArray(response.data) ? response.data : [];
      setColumns(mapColumns(list));
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Не удалось загрузить колонки');
      setColumns([]);
    } finally {
      setIsLoading(false);
    }
  }, [activeProjectId]);

  useEffect(() => {
    void loadColumns();
  }, [loadColumns]);

  const openNewTaskModal = (columnId: string) => {
    setActiveColumnId(columnId);
    setEditingTask(null);
    setTaskDraft(defaultTaskDraft);
  };

  const openEditTaskModal = (columnId: string, task: KanbanTask) => {
    setActiveColumnId(columnId);
    setEditingTask(task);
    setTaskDraft({
      title: task.title,
      description: task.description ?? '',
      assignee: task.assignee ?? '',
      priority: task.priority ?? 'medium',
    });
  };

  const closeTaskModal = () => {
    setActiveColumnId(null);
    setEditingTask(null);
    setTaskDraft(defaultTaskDraft);
  };

  const handleSaveTask = () => {
    if (!activeProjectId || !activeColumnId) {
      toast.error('Сначала выберите проект');
      return;
    }
    if (!taskDraft.title.trim()) {
      toast.error('Введите название задачи');
      return;
    }

    const saveTask = async () => {
      setIsSaving(true);
      try {
        if (editingTask) {
          await apiClient.put(`/projects/\( {activeProjectId}/kanban/tasks/ \){editingTask.id}`, {
            title: taskDraft.title.trim(),
            description: taskDraft.description.trim() || undefined,
            assignee: taskDraft.assignee.trim() || undefined,
            priority: taskDraft.priority,
          });
          toast.success('Задача обновлена');
        } else {
          await apiClient.post(
            `/projects/\( {activeProjectId}/kanban/columns/ \){activeColumnId}/tasks`,
            {
              title: taskDraft.title.trim(),
              description: taskDraft.description.trim() || undefined,
              assignee: taskDraft.assignee.trim() || undefined,
              priority: taskDraft.priority,
            }
          );
          toast.success('Задача создана');
        }
        await loadColumns();
        closeTaskModal();
      } catch (error: any) {
        toast.error(error.response?.data?.error || 'Не удалось сохранить задачу');
      } finally {
        setIsSaving(false);
      }
    };

    void saveTask();
  };

  const handleDeleteTask = () => {
    if (!activeProjectId || !editingTask) return;
    const deleteTask = async () => {
      setIsSaving(true);
      try {
        await apiClient.delete(`/projects/\( {activeProjectId}/kanban/tasks/ \){editingTask.id}`);
        toast.success('Задача удалена');
        await loadColumns();
        closeTaskModal();
      } catch (error: any) {
        toast.error(error.response?.data?.error || 'Не удалось удалить задачу');
      } finally {
        setIsSaving(false);
      }
    };
    void deleteTask();
  };

  const handleDragStart = (task: KanbanTask, columnId: string) => {
    setDraggedTask({ task, sourceColumnId: columnId });
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDrop = (targetColumnId: string) => {
    if (!draggedTask || !activeProjectId) return;
    const { task, sourceColumnId } = draggedTask;
    if (sourceColumnId === targetColumnId) {
      setDraggedTask(null);
      return;
    }

    const targetTitle =
      columns.find((col) => col.id === targetColumnId)?.title ?? 'новую колонку';
    const optimistic = columns.map((column) => {
      if (column.id === sourceColumnId) {
        return { ...column, tasks: column.tasks.filter((item) => item.id !== task.id) };
      }
      if (column.id === targetColumnId) {
        return { ...column, tasks: [...column.tasks, task] };
      }
      return column;
    });
    setColumns(optimistic);
    setDraggedTask(null);

    const moveTask = async () => {
      try {
        await apiClient.put(`/projects/\( {activeProjectId}/kanban/tasks/ \){task.id}`, {
          column_id: targetColumnId,
        });
        await loadColumns();
        toast.success(`Задача перемещена в ${targetTitle}`);
      } catch (error: any) {
        toast.error(error.response?.data?.error || 'Не удалось переместить задачу');
        await loadColumns();
      }
    };
    void moveTask();
  };

  const getPriorityColor = (priority?: string | null) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500';
      case 'high':   return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low':    return 'bg-green-500';
      default:       return 'bg-slate-500';
    }
  };

  return (
    <div className="h-full overflow-x-auto p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h2 className="text-2xl font-bold text-white mb-2">Канбан Доска</h2>
        <p className="text-slate-400">Управляйте задачами с помощью drag & drop</p>
      </motion.div>

      {isLoading && (
        <div className="text-sm text-slate-400 mb-4">Загрузка колонок...</div>
      )}

      {!isLoading && columns.length === 0 && (
        <div className="rounded-xl border border-white/10 bg-slate-900/40 p-6 text-sm text-slate-400">
          В этом проекте пока нет канбан-колонок.
        </div>
      )}

      <div className="flex gap-6 min-w-max pb-6">
        {columns.map((column, colIndex) => (
          <motion.div
            key={column.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: colIndex * 0.1 }}
            onDragOver={handleDragOver}
            onDrop={() => handleDrop(column.id)}
            className="flex-shrink-0 w-80"
          >
            <div className="bg-slate-900/50 backdrop-blur-sm border border-white/10 rounded-2xl p-4">
              {/* Column Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${column.color}`}></div>
                  <h3 className="font-semibold text-white">{column.title}</h3>
                  <span className="px-2 py-0.5 bg-white/5 rounded-full text-xs text-slate-400">
                    {column.tasks.length}
                  </span>
                </div>
                <button className="p-1 hover:bg-white/5 rounded transition-all" type="button">
                  <MoreHorizontal className="w-4 h-4 text-slate-400" />
                </button>
              </div>

              {/* Tasks */}
              <div className="space-y-3">
                {column.tasks.length === 0 ? (
                  <div className="text-xs text-slate-500">Нет задач в этой колонке</div>
                ) : (
                  column.tasks.map((task, taskIndex) => (
                    <motion.div
                      key={task.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: taskIndex * 0.05 }}
                      draggable
                      onDragStart={() => handleDragStart(task, column.id)}
                      whileHover={{ scale: 1.02, y: -2 }}
                      onClick={() => openEditTaskModal(column.id, task)}
                      className="p-4 bg-slate-800/50 border border-white/10 rounded-xl cursor-pointer hover:border-white/20 transition-all group"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-white text-sm">{task.title}</h4>
                        <div className={`w-2 h-2 rounded-full ${getPriorityColor(task.priority)} flex-shrink-0`}></div>
                      </div>
                      <p className="text-xs text-slate-400 mb-3">
                        {task.description?.trim() ? task.description : 'Без описания'}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-xs font-semibold">
                            {task.assignee?.trim() ? task.assignee : 'DH'}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-slate-500">
                          <Calendar className="w-3 h-3" />
                          <span>{currentProject?.name ?? 'DevHub'}</span>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}

                {/* Add Task Button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => openNewTaskModal(column.id)}
                  className="w-full py-3 border-2 border-dashed border-white/10 rounded-xl text-slate-400 hover:text-white hover:border-white/20 transition-all flex items-center justify-center gap-2"
                  type="button"
                >
                  <Plus className="w-4 h-4" />
                  <span className="text-sm font-medium">Добавить задачу</span>
                </motion.button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {activeColumnId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6"
            onClick={closeTaskModal}
          >
            <motion.div
              initial={{ scale: 0.96, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.96, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-white">
                  {editingTask ? 'Редактировать задачу' : 'Новая задача'}
                </h3>
                {editingTask && (
                  <button
                    type="button"
                    onClick={handleDeleteTask}
                    className="flex items-center gap-2 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-1.5 text-sm text-red-200 hover:bg-red-500/20"
                  >
                    <Trash2 className="h-4 w-4" />
                    Удалить
                  </button>
                )}
              </div>

              <div className="mt-4 space-y-4">
                <label className="block text-sm text-slate-300">
                  Название
                  <input
                    value={taskDraft.title}
                    onChange={(e) => setTaskDraft((prev) => ({ ...prev, title: e.target.value }))}
                    className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </label>

                <label className="block text-sm text-slate-300">
                  Описание
                  <textarea
                    value={taskDraft.description}
                    onChange={(e) => setTaskDraft((prev) => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </label>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block text-sm text-slate-300">
                    Ответственный
                    <input
                      value={taskDraft.assignee}
                      onChange={(e) => setTaskDraft((prev) => ({ ...prev, assignee: e.target.value }))}
                      className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    />
                  </label>

                  <label className="block text-sm text-slate-300">
                    Приоритет
                    <select
                      value={taskDraft.priority}
                      onChange={(e) => setTaskDraft((prev) => ({ ...prev, priority: e.target.value }))}
                      className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    >
                      <option value="low">Низкий</option>
                      <option value="medium">Средний</option>
                      <option value="high">Высокий</option>
                      {/* можно добавить urgent, если бэкенд его поддерживает */}
                    </select>
                  </label>
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={handleSaveTask}
                  disabled={isSaving}
                  className="flex-1 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 py-2.5 font-semibold text-white hover:from-blue-600 hover:to-purple-700 transition"
                >
                  {isSaving ? 'Сохранение...' : 'Сохранить'}
                </button>
                <button
                  type="button"
                  onClick={closeTaskModal}
                  className="flex-1 rounded-xl border border-white/10 bg-white/5 py-2.5 font-semibold text-white hover:bg-white/10 transition"
                >
                  Отмена
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
