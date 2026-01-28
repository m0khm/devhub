import { motion } from 'motion/react';
import type { DragEvent } from 'react';
import { useState } from 'react';
import { Plus, MoreHorizontal, User, Calendar } from 'lucide-react';
import { toast } from 'sonner';

const initialColumns = [
  {
    id: 'todo',
    title: 'To Do',
    color: 'from-slate-500 to-slate-600',
    tasks: [
      { id: 1, title: 'Redesign landing page', description: 'Update hero section', assignee: 'AK', priority: 'high' },
      { id: 2, title: 'Fix login bug', description: 'Users report issues', assignee: 'MC', priority: 'urgent' },
    ],
  },
  {
    id: 'inprogress',
    title: 'In Progress',
    color: 'from-blue-500 to-cyan-500',
    tasks: [
      { id: 3, title: 'API integration', description: 'Connect backend', assignee: 'ДВ', priority: 'high' },
    ],
  },
  {
    id: 'review',
    title: 'Review',
    color: 'from-purple-500 to-pink-500',
    tasks: [
      { id: 4, title: 'Code review PR #234', description: 'New feature branch', assignee: 'М', priority: 'medium' },
    ],
  },
  {
    id: 'done',
    title: 'Done',
    color: 'from-green-500 to-emerald-500',
    tasks: [
      { id: 5, title: 'Setup CI/CD', description: 'GitHub Actions configured', assignee: 'AK', priority: 'low' },
    ],
  },
];

export function KanbanView() {
  const [columns, setColumns] = useState(initialColumns);
  const [draggedTask, setDraggedTask] = useState<any>(null);

  const handleDragStart = (task: any, columnId: string) => {
    setDraggedTask({ task, sourceColumn: columnId });
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDrop = (targetColumnId: string) => {
    if (!draggedTask) return;

    setColumns(prev => {
      const newColumns = prev.map(col => {
        if (col.id === draggedTask.sourceColumn) {
          return {
            ...col,
            tasks: col.tasks.filter(t => t.id !== draggedTask.task.id),
          };
        }
        if (col.id === targetColumnId) {
          return {
            ...col,
            tasks: [...col.tasks, draggedTask.task],
          };
        }
        return col;
      });
      return newColumns;
    });

    toast.success(`Задача перемещена в ${columns.find(c => c.id === targetColumnId)?.title}`);
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
                <button className="p-1 hover:bg-white/5 rounded transition-all">
                  <MoreHorizontal className="w-4 h-4 text-slate-400" />
                </button>
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
                        <span>Сегодня</span>
                      </div>
                    </div>
                  </motion.div>
                ))}

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
            onClick={() => toast.info('Создание новой колонки')}
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
