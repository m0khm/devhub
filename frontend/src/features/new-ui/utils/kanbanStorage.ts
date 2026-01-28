import { safeStorage } from '../../../shared/utils/storage';

export type KanbanTask = {
  id: number;
  title: string;
  description: string;
  assignee: string;
  priority: string;
};

export type KanbanColumn = {
  id: string;
  title: string;
  color: string;
  tasks: KanbanTask[];
};

const baseColumns: KanbanColumn[] = [
  {
    id: 'todo',
    title: 'To Do',
    color: 'from-slate-500 to-slate-600',
    tasks: [],
  },
  {
    id: 'inprogress',
    title: 'In Progress',
    color: 'from-blue-500 to-cyan-500',
    tasks: [],
  },
  {
    id: 'review',
    title: 'Review',
    color: 'from-purple-500 to-pink-500',
    tasks: [],
  },
  {
    id: 'done',
    title: 'Done',
    color: 'from-green-500 to-emerald-500',
    tasks: [],
  },
];

const getStorageKey = (projectId: string) => `kanban_columns_${projectId}`;

export const getDefaultKanbanColumns = (): KanbanColumn[] =>
  baseColumns.map((column) => ({
    ...column,
    tasks: [...column.tasks],
  }));

export const loadKanbanColumns = (projectId: string): KanbanColumn[] => {
  const stored = safeStorage.get(getStorageKey(projectId));
  if (!stored) {
    return getDefaultKanbanColumns();
  }

  try {
    const parsed = JSON.parse(stored) as KanbanColumn[];
    if (!Array.isArray(parsed)) {
      return getDefaultKanbanColumns();
    }
    return parsed;
  } catch (error) {
    console.warn('Failed to parse kanban columns, using defaults.', error);
    return getDefaultKanbanColumns();
  }
};

export const saveKanbanColumns = (projectId: string, columns: KanbanColumn[]) => {
  safeStorage.set(getStorageKey(projectId), JSON.stringify(columns));
};
