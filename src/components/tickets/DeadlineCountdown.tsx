import React from 'react';
import { TicketPriority } from '../../types/ticket';
import { calculateDeadlineInfo, getDeadlineBadgeStyle } from '../../lib/deadline-utils';
import { cn } from '../../lib/utils';

interface DeadlineCountdownProps {
  createdAt: string | null | undefined;
  priority: TicketPriority | null | undefined;
  now: Date;
  showIcon?: boolean;
  className?: string;
  compact?: boolean;
}

export const DeadlineCountdown: React.FC<DeadlineCountdownProps> = ({
  createdAt,
  priority,
  now,
  className,
  compact = false,
}) => {
  const info = calculateDeadlineInfo(createdAt, priority, now);
  const badgeStyle = getDeadlineBadgeStyle(info.state);

  if (compact) {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1.5 text-[11px] px-2 py-0.5 rounded border font-mono tracking-tight whitespace-nowrap',
          badgeStyle.bg,
          badgeStyle.text,
          badgeStyle.border,
          className
        )}
        title={`SLA Target: ${badgeStyle.label} (${info.percentRemaining.toFixed(0)}% remaining)`}
      >
        <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', badgeStyle.dotColor)} />
        <span>{info.formattedCountdown}</span>
      </span>
    );
  }

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <div className="flex items-center justify-between gap-1.5">
        <span
          className={cn(
            'inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded border font-medium',
            badgeStyle.bg,
            badgeStyle.text,
            badgeStyle.border
          )}
        >
          <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', badgeStyle.dotColor)} />
          <span>{badgeStyle.label}</span>
        </span>
        <span className="font-mono text-xs font-semibold tabular-nums text-zinc-900">
          {info.formattedCountdown}
        </span>
      </div>

      {info.totalDurationMs > 0 && info.state !== 'future' && (
        <div className="w-full bg-zinc-100 h-1.5 rounded overflow-hidden">
          <div
            className={cn(
              'h-full transition-all duration-300',
              info.state === 'late'
                ? 'bg-rose-500'
                : info.state === 'at_risk'
                ? 'bg-amber-500'
                : 'bg-emerald-500'
            )}
            style={{ width: `${Math.min(100, Math.max(0, info.percentRemaining))}%` }}
          />
        </div>
      )}
    </div>
  );
};
