import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { apiClient } from '../../../api/client';

interface KanbanColumn {
  id: string;
  title: string;
  position: number;
}

interface CreateTaskModalProps {
  projectId: string;
  onClose: () => void;
  onCreated?: () => void;
}

export const CreateTaskModal: React.FC<CreateTaskModalProps> = ({
  projectId,
  onClose,
  onCreated,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [columns, setColumns] = useState<KanbanColumn[]>([]);
  const [selectedColumnId, setSelectedColumnId] = useState('');
  const [columnsLoading, setColumnsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newColumnTitle, setNewColumnTitle] = useState('');
  const [creatingColumn, setCreatingColumn] = useState(false);

  const sortedColumns = useMemo(
    () => [...columns].sort((a, b) => a.position - b.position),
    [columns]
  );

  const loadColumns = async () => {
    setColumnsLoading(true);
    try {
      const response = await apiClient.get<KanbanColumn[]>(
        `/projects/${projectId}/kanban/columns`
      );
      const list = Array.isArray(response.data) ? response.data : [];
      setColumns(list);
      if (!selectedColumnId && list.length > 0) {
        setSelectedColumnId(list[0].id);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to load columns');
    } finally {
      setColumnsLoading(false);
    }
  };

  useEffect(() => {
    void loadColumns();
  }, [projectId]);

  const handleCreateColumn = async () => {
    const trimmed = newColumnTitle.trim();
    if (!trimmed) {
      toast.error('Введите название колонки');
      return;
    }
    setCreatingColumn(true);
    try {
      const response = await apiClient.post<KanbanColumn>(
        `/projects/${projectId}/kanban/columns`,
        { title: trimmed }
      );
      const created = response.data;
      setColumns((prev) => [...prev, created]);
      setSelectedColumnId(created.id);
      setNewColumnTitle('');
      toast.success('Колонка создана');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Не удалось создать колонку');
    } finally {
      setCreatingColumn(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedColumnId) {
      toast.error('Выберите колонку');
      return;
    }
    setSaving(true);
    try {
      await apiClient.post(
        `/projects/${projectId}/kanban/columns/${selectedColumnId}/tasks`,
        {
          title: title.trim(),
          description: description.trim() ? description.trim() : undefined,
          priority,
        }
      );
      toast.success('Задача создана');
      onCreated?.();
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Не удалось создать задачу');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-xl bg-surface p-6 text-text shadow-xl">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold">Создать задачу</h2>
            <p className="text-xs text-text-muted">
              Добавьте задачу в канбан-колонку проекта.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-text-muted hover:bg-surface-muted"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-text-muted">
              Название задачи
            </label>
            <input
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="w-full rounded-lg border border-border bg-base/70 px-4 py-2 text-text focus:ring-2 focus:ring-accent"
              placeholder="Например: Подготовить бриф"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-text-muted">
              Описание
            </label>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className="w-full rounded-lg border border-border bg-base/70 px-4 py-2 text-text focus:ring-2 focus:ring-accent"
              rows={3}
              placeholder="Коротко опишите задачу"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-text-muted">
              Колонка
            </label>
            {columnsLoading ? (
              <div className="text-xs text-text-muted">Загрузка колонок...</div>
            ) : (
              <select
                value={selectedColumnId}
                onChange={(event) => setSelectedColumnId(event.target.value)}
                className="w-full rounded-lg border border-border bg-base/70 px-4 py-2 text-text focus:ring-2 focus:ring-accent"
              >
                <option value="" disabled>
                  Выберите колонку
                </option>
                {sortedColumns.map((column) => (
                  <option key={column.id} value={column.id}>
                    {column.title}
                  </option>
                ))}
              </select>
            )}
            {!columnsLoading && sortedColumns.length === 0 && (
              <div className="mt-2 rounded-lg border border-dashed border-border px-3 py-3 text-xs text-text-muted">
                Нет колонок в канбане. Создайте первую:
                <div className="mt-2 flex flex-wrap gap-2">
                  <input
                    type="text"
                    value={newColumnTitle}
                    onChange={(event) => setNewColumnTitle(event.target.value)}
                    className="flex-1 rounded-lg border border-border bg-base/70 px-3 py-2 text-text focus:ring-2 focus:ring-accent"
                    placeholder="Название колонки"
                  />
                  <button
                    type="button"
                    onClick={handleCreateColumn}
                    disabled={creatingColumn}
                    className="rounded-lg bg-accent px-3 py-2 text-xs font-semibold text-accent-foreground disabled:opacity-60"
                  >
                    {creatingColumn ? 'Создаем...' : 'Создать'}
                  </button>
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-text-muted">
              Приоритет
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 'low', label: 'Низкий' },
                { value: 'medium', label: 'Средний' },
                { value: 'high', label: 'Высокий' },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setPriority(option.value)}
                  className={`rounded-lg border px-3 py-2 text-xs font-semibold transition ${
                    priority === option.value
                      ? 'border-accent bg-accent/20 text-accent'
                      : 'border-border text-text-muted hover:border-accent/60 hover:text-text'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-border px-4 py-2 text-text transition hover:bg-surface-muted"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={saving || !title.trim() || !selectedColumnId}
              className="flex-1 rounded-lg bg-accent px-4 py-2 text-accent-foreground transition hover:bg-accent/90 disabled:opacity-50"
            >
              {saving ? 'Создаем...' : 'Создать'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
