import React from 'react';

import { cn } from './classNames';

export const Panel = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm', className)}
      {...props}
    />
  )
);

Panel.displayName = 'Panel';

export const PanelHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex items-start justify-between gap-4 px-5 pt-5', className)} {...props} />
  )
);

PanelHeader.displayName = 'PanelHeader';

export const PanelTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3 ref={ref} className={cn('text-lg font-semibold text-white', className)} {...props} />
  )
);

PanelTitle.displayName = 'PanelTitle';

export const PanelDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p ref={ref} className={cn('text-sm text-slate-300', className)} {...props} />
));

PanelDescription.displayName = 'PanelDescription';

export const PanelBody = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('px-5 pb-5 pt-4', className)} {...props} />
  )
);

PanelBody.displayName = 'PanelBody';
