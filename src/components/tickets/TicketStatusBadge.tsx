import React from 'react';
import { TicketStatus } from '../../types/ticket';
import { cn } from '../../lib/utils';

interface TicketStatusBadgeProps {
  status: TicketStatus;
  className?: string;
  size?: 'sm' | 'md';
}

export const TicketStatusBadge: React.FC<TicketStatusBadgeProps> = ({
  status,
  className,
  size = 'md',
}) => {
  const sizeClasses = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-xs px-2.5 py-1 font-medium';

  let colorClasses = 'bg-slate-100 text-slate-700 border-slate-300';
  let label: string = status;

  switch (status) {
    case 'open':
      colorClasses = 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800';
      label = 'Open';
      break;
    case 'in_progress':
      colorClasses = 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800';
      label = 'In Progress';
      break;
    case 'resolved':
      colorClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800';
      label = 'Resolved';
      break;
    case 'closed':
      // Edge case T-2010
      colorClasses = 'bg-zinc-100 text-zinc-600 border-zinc-300 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700';
      label = 'Closed (Archived)';
      break;
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border whitespace-nowrap',
        sizeClasses,
        colorClasses,
        className
      )}
    >
      <span className={cn('w-1.5 h-1.5 rounded-full', {
        'bg-sky-500': status === 'open',
        'bg-indigo-500': status === 'in_progress',
        'bg-emerald-500': status === 'resolved',
        'bg-zinc-400': status === 'closed',
      })} />
      {label}
    </span>
  );
};
