import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { Plus, MoreHorizontal, Calendar, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useOutletContext } from 'react-router-dom';
import type { WorkspaceOutletContext } from '../../pages/WorkspaceLayout';
import type { KanbanColumn, KanbanTask } from '../../utils/kanbanStorage';
import { getDefaultKanbanColumns, loadKanbanColumns, saveKanbanColumns } from '../../utils/kanbanStorage';

const defaultTaskDraft = {
  title: '',
  description: '',
  assignee: '',
  priority: 'medium',
};

export function KanbanView() {
  const { currentProject } = useOutletContext<WorkspaceOutletContext>();
  const [draggedTask, setDraggedTask] = useState<{
    task: KanbanTask;
    sourceColumnId: string;
  } | null>(null);
  const [columns, setColumns] = useState<KanbanColumn[]>(() => getDefaultKanbanColumns());
  const [activeColumnId, setActiveColumnId] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<KanbanTask | null>(null);
  const [taskDraft, setTaskDraft] = useState(defaultTaskDraft);

  const storageProjectId = currentProject?.id ?? 'default';

  useEffect(() => {
    setColumns(loadKanbanColumns(storageProjectId));
  }, [storageProjectId]);

  useEffect(() => {
    saveKanbanColumns(storageProjectId, columns);
  }, [columns, storageProjectId]);

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
      description: task.description,
      assignee: task.assignee,
      priority: task.priority,
    });
  };

  const closeTaskModal = () => {
    setActiveColumnId(null);
    setEditingTask(null);
    setTaskDraft(defaultTaskDraft);
  };

  const handleSaveTask = () => {
    if (!activeColumnId) return;
    if (!taskDraft.title.trim()) {
      toast.error('Введите название задачи');
      return;
    }

    setColumns((prev) =>
      prev.map((column) => {
        if (column.id !== activeColumnId) return column;
        if (editingTask) {
          return {
            ...column,
            tasks: column.tasks.map((task) =>
              task.id === editingTask.id ? { ...task, ...taskDraft } : task
            ),
          };
        }
        const newTask: KanbanTask = {
          id: Date.now(),
          title: taskDraft.title.trim(),
          description: taskDraft.description.trim() || 'Без описания',
          assignee: taskDraft.assignee.trim() || 'DH',
          priority: taskDraft.priority,
        };
        return { ...column, tasks: [...column.tasks, newTask] };
      })
    );

    toast.success(editingTask ? 'Задача обновлена' : 'Задача создана');
    closeTaskModal();
  };

  const handleDeleteTask = () => {
    if (!activeColumnId || !editingTask) return;
    setColumns((prev) =>
      prev.map((column) => {
        if (column.id !== activeColumnId) return column;
        return {
          ...column,
          tasks: column.tasks.filter((task) => task.id !== editingTask.id),
        };
      })
    );
    toast.success('Задача удалена');
    closeTaskModal();
  };

  const handleDragStart = (task: KanbanTask, columnId: string) => {
    setDraggedTask({ task, sourceColumnId: columnId });
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDrop = (targetColumnId: string) => {
    if (!draggedTask) return;
    const { task, sourceColumnId } = draggedTask;
    if (sourceColumnId === targetColumnId) {
      setDraggedTask(null);
      return;
    }

    setColumns((prev) =>
      prev.map((column) => {
        if (column.id === sourceColumnId) {
          return { ...column, tasks: column.tasks.filter((item) => item.id !== task.id) };
        }
        if (column.id === targetColumnId) {
          return { ...column, tasks: [...column.tasks, task] };
        }
        return column;
      })
    );

    toast.success(
      `Задача перемещена в ${columns.find((col) => col.id === targetColumnId)?.title ?? 'новую колонку'}`
    );
    setDraggedTask(null);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-slate-500';
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
                  column.tasks.map((task: KanbanTask, taskIndex: number) => (
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
                      <p className="text-xs text-slate-400 mb-3">{task.description}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-xs font-semibold">
                            {task.assignee}
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
              onClick={(event) => event.stopPropagation()}
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
                    onChange={(event) => setTaskDraft((prev) => ({ ...prev, title: event.target.value }))}
                    className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </label>
                <label className="block text-sm text-slate-300">
                  Описание
                  <textarea
                    value={taskDraft.description}
                    onChange={(event) =>
                      setTaskDraft((prev) => ({ ...prev, description: event.target.value }))
                    }
                    rows={3}
                    className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </label>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block text-sm text-slate-300">
                    Ответственный
                    <input
                      value={taskDraft.assignee}
                      onChange={(event) =>
                        setTaskDraft((prev) => ({ ...prev, assignee: event.target.value }))
                      }
                      className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    />
                  </label>
                  <label className="block text-sm text-slate-300">
                    Приоритет
                    <select
                      value={taskDraft.priority}
                      onChange={(event) =>
                        setTaskDraft((prev) => ({ ...prev, priority: event.target.value }))
                      }
                      className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    >
                      <option value="low">Низкий</option>
                      <option value="medium">Средний</option>
                      <option value="high">Высокий</option>
                    </select>
                  </label>
                </div>
              </div>
              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={handleSaveTask}
                  className="flex-1 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 py-2.5 font-semibold text-white hover:from-blue-600 hover:to-purple-700 transition"
                >
                  Сохранить
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
