import React from 'react';

interface AppShellProps {
  left: React.ReactNode;
  middle: React.ReactNode;
  header?: React.ReactNode;
  main: React.ReactNode;
  right?: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({
  left,
  middle,
  header,
  main,
  right,
}) => {
  return (
    <div className="h-screen w-full bg-base text-text">
      <div className="flex h-full">
        <aside className="w-64 border-r border-border/80 bg-base/70 backdrop-blur">
          {left}
        </aside>
        <aside className="w-72 border-r border-border/80 bg-surface/80 backdrop-blur">
          {middle}
        </aside>
        <section className="flex-1 flex min-w-0 flex-col">
          {header && (
            <div className="border-b border-border/70 bg-surface/80 px-6 py-4 shadow-sm">
              {header}
            </div>
          )}
          <div className="flex flex-1 min-w-0">
            <div className="flex-1 min-w-0 bg-surface/60">{main}</div>
            {right && (
              <aside className="hidden w-80 border-l border-border/80 bg-base/60 p-4 backdrop-blur lg:block">
                {right}
              </aside>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};
