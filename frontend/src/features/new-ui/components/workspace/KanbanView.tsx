import { motion } from 'motion/react';
import { useEffect, useMemo, useState } from 'react';
import { Plus, MoreHorizontal, Calendar, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { apiClient } from '../../../../api/client';
import { useAuthStore } from '../../../../store/authStore';
import { useProjectStore } from '../../../../store/projectStore';

interface KanbanTask {
  id: string;
  column_id: string;
  title: string;
  description?: string | null;
  assignee?: string | null;
  priority: string;
  due_date?: string | null;
  position: number;
}

interface KanbanColumn {
  id: string;
  title: string;
  position: number;
  tasks: KanbanTask[];
}

export function KanbanView() {
  const { currentProject } = useProjectStore();
  const { user } = useAuthStore();
  const [columns, setColumns] = useState<KanbanColumn[]>([]);
  const [draggedTask, setDraggedTask] = useState<{
    task: KanbanTask;
    sourceColumn: string;
  } | null>(null);

  const columnColors = [
    'from-slate-500 to-slate-600',
    'from-blue-500 to-cyan-500',
    'from-purple-500 to-pink-500',
    'from-green-500 to-emerald-500',
    'from-orange-500 to-red-500',
  ];

  const coloredColumns = useMemo(
    () =>
      columns.map((column, index) => ({
        ...column,
        color: columnColors[index % columnColors.length],
      })),
    [columns]
  );

  useEffect(() => {
    const loadColumns = async () => {
      if (!currentProject) return;
      try {
        const response = await apiClient.get<KanbanColumn[]>(
          `/projects/${currentProject.id}/kanban/columns`
        );
        const list = Array.isArray(response.data) ? response.data : [];
        setColumns(list);
      } catch (error) {
        toast.error('Не удалось загрузить канбан');
      }
    };

    loadColumns();
  }, [currentProject]);

  const handleDragStart = (task: KanbanTask, columnId: string) => {
    setDraggedTask({ task, sourceColumn: columnId });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (targetColumnId: string) => {
    if (!draggedTask) return;

    try {
      if (!currentProject) return;
      await apiClient.put(`/projects/${currentProject.id}/kanban/tasks/${draggedTask.task.id}`, {
        column_id: targetColumnId,
      });
      setColumns((prev) => {
        const newColumns = prev.map((col) => {
          if (col.id === draggedTask.sourceColumn) {
            return {
              ...col,
              tasks: col.tasks.filter((t) => t.id !== draggedTask.task.id),
            };
          }
          if (col.id === targetColumnId) {
            return {
              ...col,
              tasks: [...col.tasks, { ...draggedTask.task, column_id: targetColumnId }],
            };
          }
          return col;
        });
        return newColumns;
      });
      toast.success(`Задача перемещена`);
    } catch (error) {
      toast.error('Не удалось переместить задачу');
    } finally {
      setDraggedTask(null);
    }
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
        {coloredColumns.map((column, colIndex) => (
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
                <div className="flex items-center gap-1">
                  <button
                    className="p-1 hover:bg-white/5 rounded transition-all"
                    onClick={async () => {
                      const title = window.prompt('Новое название колонки', column.title);
                      if (!title || !currentProject) return;
                      try {
                        const response = await apiClient.put<KanbanColumn>(
                          `/projects/${currentProject.id}/kanban/columns/${column.id}`,
                          { title }
                        );
                        setColumns((prev) =>
                          prev.map((col) =>
                            col.id === column.id ? { ...col, title: response.data.title } : col
                          )
                        );
                      } catch (error) {
                        toast.error('Не удалось обновить колонку');
                      }
                    }}
                  >
                    <MoreHorizontal className="w-4 h-4 text-slate-400" />
                  </button>
                  <button
                    className="p-1 hover:bg-white/5 rounded transition-all"
                    onClick={async () => {
                      if (!currentProject) return;
                      const confirmed = window.confirm('Удалить колонку и задачи?');
                      if (!confirmed) return;
                      try {
                        await apiClient.delete(
                          `/projects/${currentProject.id}/kanban/columns/${column.id}`
                        );
                        setColumns((prev) => prev.filter((col) => col.id !== column.id));
                      } catch (error) {
                        toast.error('Не удалось удалить колонку');
                      }
                    }}
                  >
                    <Trash2 className="w-4 h-4 text-slate-400" />
                  </button>
                </div>
              </div>

              {/* Tasks */}
              <div className="space-y-3">
                {column.tasks.map((task, taskIndex) => (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: taskIndex * 0.05 }}
                    draggable
                    onDragStart={() => handleDragStart(task, column.id)}
                    whileHover={{ scale: 1.02, y: -2 }}
                    className="p-4 bg-slate-800/50 border border-white/10 rounded-xl cursor-move hover:border-white/20 transition-all group"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-white text-sm">{task.title}</h4>
                      <div className="flex items-center gap-2">
                        <button
                          className="opacity-0 group-hover:opacity-100 transition"
                          onClick={async () => {
                            if (!currentProject) return;
                            const confirmed = window.confirm('Удалить задачу?');
                            if (!confirmed) return;
                            try {
                              await apiClient.delete(
                                `/projects/${currentProject.id}/kanban/tasks/${task.id}`
                              );
                              setColumns((prev) =>
                                prev.map((col) =>
                                  col.id === column.id
                                    ? { ...col, tasks: col.tasks.filter((t) => t.id !== task.id) }
                                    : col
                                )
                              );
                            } catch (error) {
                              toast.error('Не удалось удалить задачу');
                            }
                          }}
                        >
                          <Trash2 className="w-3 h-3 text-slate-500" />
                        </button>
                        <div
                          className={`w-2 h-2 rounded-full ${getPriorityColor(
                            task.priority
                          )} flex-shrink-0`}
                        ></div>
                      </div>
                    </div>
                    <p className="text-xs text-slate-400 mb-3">
                      {task.description ?? 'Без описания'}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-xs font-semibold">
                          {task.assignee?.slice(0, 2).toUpperCase() ?? 'ME'}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-slate-500">
                        <Calendar className="w-3 h-3" />
                        <span>{task.due_date ? new Date(task.due_date).toLocaleDateString('ru-RU') : 'Без срока'}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}

                {/* Add Task Button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={async () => {
                    if (!currentProject) return;
                    const title = window.prompt('Название задачи');
                    if (!title) return;
                    const description = window.prompt('Описание задачи (опционально)') ?? '';
                    try {
                      const response = await apiClient.post<KanbanTask>(
                        `/projects/${currentProject.id}/kanban/columns/${column.id}/tasks`,
                        {
                          title,
                          description: description || undefined,
                          assignee: user?.name ?? 'Me',
                          priority: 'medium',
                          position: column.tasks.length,
                        }
                      );
                      setColumns((prev) =>
                        prev.map((col) =>
                          col.id === column.id
                            ? { ...col, tasks: [...col.tasks, response.data] }
                            : col
                        )
                      );
                    } catch (error) {
                      toast.error('Не удалось создать задачу');
                    }
                  }}
                  className="w-full py-3 border-2 border-dashed border-white/10 rounded-xl text-slate-400 hover:text-white hover:border-white/20 transition-all flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span className="text-sm font-medium">Добавить задачу</span>
                </motion.button>
              </div>
            </div>
          </motion.div>
        ))}

        {/* Add Column */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="flex-shrink-0 w-80"
        >
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={async () => {
              if (!currentProject) return;
              const title = window.prompt('Название колонки');
              if (!title) return;
              try {
                const response = await apiClient.post<KanbanColumn>(
                  `/projects/${currentProject.id}/kanban/columns`,
                  {
                    title,
                    position: columns.length,
                  }
                );
                setColumns((prev) => [...prev, { ...response.data, tasks: [] }]);
              } catch (error) {
                toast.error('Не удалось создать колонку');
              }
            }}
            className="w-full h-32 border-2 border-dashed border-white/10 rounded-2xl text-slate-400 hover:text-white hover:border-white/20 hover:bg-white/5 transition-all flex flex-col items-center justify-center gap-2"
          >
            <Plus className="w-6 h-6" />
            <span className="font-medium">Добавить колонку</span>
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
}
