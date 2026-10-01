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
    sm: 'text-[11px] px-1.5 py-0.5 leading-none font-mono',
    md: 'text-xs px-2 py-0.5 leading-tight font-mono font-medium',
    lg: 'text-xs px-2.5 py-1 leading-normal font-mono font-semibold',
  }[size];

  let colorClasses = 'bg-zinc-100 text-zinc-700 border-zinc-200';

  switch (p) {
    case 'P0':
      colorClasses = 'bg-red-50 text-red-700 border-red-200';
      break;
    case 'P1':
      colorClasses = 'bg-amber-50 text-amber-700 border-amber-200';
      break;
    case 'P2':
      colorClasses = 'bg-blue-50 text-blue-700 border-blue-200';
      break;
    case 'P3':
      colorClasses = 'bg-zinc-100 text-zinc-600 border-zinc-200';
      break;
    case 'P5':
      colorClasses = 'bg-rose-50 text-rose-700 border-rose-200';
      break;
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded border tracking-tight',
        sizeClasses,
        colorClasses,
        className
      )}
      title={`SLA Priority: ${p}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-75 shrink-0" />
      <span>{p}</span>
      {p === 'P5' && (
        <span className="text-[10px] font-sans text-rose-600 font-normal">
          (invalid)
        </span>
      )}
    </span>
  );
};
