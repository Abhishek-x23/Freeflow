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
  const sizeClasses =
    size === 'sm'
      ? 'text-[11px] px-1.5 py-0.5 leading-none'
      : 'text-xs px-2 py-0.5 leading-tight font-medium';

  let colorClasses = 'bg-zinc-100 text-zinc-700 border-zinc-200';
  let dotColor = 'bg-zinc-400';
  let label: string = status;

  switch (status) {
    case 'open':
      colorClasses = 'bg-blue-50 text-blue-700 border-blue-200';
      dotColor = 'bg-blue-500';
      label = 'Open';
      break;
    case 'in_progress':
      colorClasses = 'bg-amber-50 text-amber-700 border-amber-200';
      dotColor = 'bg-amber-500';
      label = 'In Progress';
      break;
    case 'resolved':
      colorClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200';
      dotColor = 'bg-emerald-500';
      label = 'Resolved';
      break;
    case 'closed':
      colorClasses = 'bg-zinc-100 text-zinc-600 border-zinc-200';
      dotColor = 'bg-zinc-400';
      label = 'Closed';
      break;
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded border whitespace-nowrap',
        sizeClasses,
        colorClasses,
        className
      )}
    >
      <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', dotColor)} />
      <span>{label}</span>
    </span>
  );
};
