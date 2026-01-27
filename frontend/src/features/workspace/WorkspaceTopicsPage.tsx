import React from 'react';
import { useParams } from 'react-router-dom';
import { ProjectView } from '../projects/components/ProjectView';

export const WorkspaceTopicsPage: React.FC = () => {
  const { projectId } = useParams<{ projectId?: string }>();

  return (
    <ProjectView projectId={projectId}>
      {(slots) => (
        <div className="flex h-full min-h-[520px] min-w-0">
          <aside className="w-80 border-r border-border/70 bg-base/70">
            {slots.middle}
          </aside>
          <section className="flex flex-1 flex-col gap-4 bg-surface/60 p-6 text-text">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-text-muted">
                Topics
              </p>
              <h1 className="mt-2 text-xl font-semibold text-text">
                Управляйте темами проекта
              </h1>
              <p className="mt-2 text-sm text-text-muted">
                Выберите тему слева, чтобы перейти в обсуждение или создать новую
                ветку.
              </p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-base/70 p-4 text-sm text-text-muted">
              Темы синхронизированы с чатами и прямыми сообщениями.
            </div>
          </section>
        </div>
      )}
    </ProjectView>
  );
};
