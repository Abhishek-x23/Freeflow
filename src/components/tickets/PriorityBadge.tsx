import React from 'react';
import { TicketPriority } from '../../types/ticket';
import { cn } from '../../lib/utils';

interface PriorityBadgeProps {
  priority: TicketPriority | null | undefined;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({
  priority,
  className,
  size = 'md',
}) => {
  const p = priority || 'Unknown';

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs px-2.5 py-1 font-semibold',
    lg: 'text-sm px-3 py-1 font-bold',
  }[size];

  let colorClasses = 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300';

  switch (p) {
    case 'P0':
      colorClasses = 'bg-red-100 text-red-800 border-red-300 dark:bg-red-950/70 dark:text-red-300 dark:border-red-800';
      break;
    case 'P1':
      colorClasses = 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/70 dark:text-amber-300 dark:border-amber-800';
      break;
    case 'P2':
      colorClasses = 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/70 dark:text-blue-300 dark:border-blue-800';
      break;
    case 'P3':
      colorClasses = 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
      break;
    case 'P5':
      // Edge case from T-2004: Invalid priority
      colorClasses = 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950/70 dark:text-purple-300';
      break;
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md border tracking-wide uppercase',
        sizeClasses,
        colorClasses,
        className
      )}
      title={`Priority SLA: ${p}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
      {p}
      {p === 'P5' && <span className="text-[10px] lowercase text-purple-600 dark:text-purple-400 font-normal">(invalid)</span>}
    </span>
  );
};
