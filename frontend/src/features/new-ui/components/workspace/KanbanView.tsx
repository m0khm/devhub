import { motion } from 'motion/react';
import { useMemo, useState } from 'react';
import { Plus, MoreHorizontal, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { useOutletContext } from 'react-router-dom';
import type { WorkspaceOutletContext } from '../../pages/WorkspaceLayout';

const columnConfig = [
  { id: 'planning', title: 'Планирование', color: 'from-slate-500 to-slate-600' },
  { id: 'chat', title: 'Чаты', color: 'from-blue-500 to-cyan-500' },
  { id: 'code', title: 'Код', color: 'from-purple-500 to-pink-500' },
  { id: 'deploy', title: 'Deploy', color: 'from-orange-500 to-red-500' },
  { id: 'custom', title: 'Другое', color: 'from-green-500 to-emerald-500' },
  { id: 'direct', title: 'Личные', color: 'from-cyan-500 to-blue-500' },
];

export function KanbanView() {
  const { topics, directThreads, topicsLoading, setSelectedTopicId } =
    useOutletContext<WorkspaceOutletContext>();
  const [draggedTask, setDraggedTask] = useState<any>(null);

  const columns = useMemo(() => {
    const baseColumns = columnConfig.map((col) => ({ ...col, tasks: [] as any[] }));
    topics.forEach((topic) => {
      const target = baseColumns.find((col) => col.id === topic.type) ?? baseColumns[4];
      target.tasks.push({
        id: topic.id,
        title: topic.name,
        description: topic.description || 'Без описания',
        assignee: topic.created_by?.slice(0, 2)?.toUpperCase() ?? 'TM',
        priority: topic.message_count > 10 ? 'high' : 'medium',
        lastMessageAt: topic.last_message_at,
      });
    });
    directThreads.forEach((thread) => {
      const target = baseColumns.find((col) => col.id === 'direct');
      target?.tasks.push({
        id: thread.id,
        title: thread.user?.name ?? 'Личный чат',
        description: 'Личная переписка',
        assignee: thread.user?.name?.[0]?.toUpperCase() ?? 'DM',
        priority: 'low',
        lastMessageAt: thread.updated_at,
      });
    });
    return baseColumns;
  }, [topics, directThreads]);

  const handleDragStart = (task: any, columnId: string) => {
    setDraggedTask({ task, sourceColumn: columnId });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (targetColumnId: string) => {
    if (!draggedTask) return;

    toast.success(`Задача перемещена в ${columnConfig.find(c => c.id === targetColumnId)?.title}`);
    setDraggedTask(null);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-orange-500';
      case 'medium':
        return 'bg-yellow-500';
      case 'low':
        return 'bg-green-500';
      default:
        return 'bg-slate-500';
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
        <p className="text-slate-400">Темы проекта распределены по категориям</p>
      </motion.div>

      {topicsLoading ? (
        <div className="text-slate-400">Загрузка тем...</div>
      ) : topics.length === 0 && directThreads.length === 0 ? (
        <div className="text-slate-500">Пока нет данных для канбан-доски</div>
      ) : (
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
                  <button className="p-1 hover:bg-white/5 rounded transition-all">
                    <MoreHorizontal className="w-4 h-4 text-slate-400" />
                  </button>
                </div>

                {/* Tasks */}
                <div className="space-y-3">
                  {column.tasks.length === 0 ? (
                    <div className="text-xs text-slate-500">Нет тем в этой колонке</div>
                  ) : (
                    column.tasks.map((task: any, taskIndex: number) => (
                      <motion.div
                        key={task.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: taskIndex * 0.05 }}
                        draggable
                        onDragStart={() => handleDragStart(task, column.id)}
                        whileHover={{ scale: 1.02, y: -2 }}
                        onClick={() => setSelectedTopicId(task.id)}
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
                            <span>{task.lastMessageAt ? new Date(task.lastMessageAt).toLocaleDateString('ru-RU') : '—'}</span>
                          </div>
                        </div>
                      </motion.div>
                    ))
                  )}

                  {/* Add Task Button */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => toast.info('Создание новой задачи')}
                    className="w-full py-3 border-2 border-dashed border-white/10 rounded-xl text-slate-400 hover:text-white hover:border-white/20 transition-all flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span className="text-sm font-medium">Добавить задачу</span>
                  </motion.button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
