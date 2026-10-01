import React from 'react';
import { TicketPriority } from '../../types/ticket';
import { calculateDeadlineInfo, getDeadlineBadgeStyle } from '../../lib/deadline-utils';
import { cn } from '../../lib/utils';
import { Clock, AlertTriangle, AlertCircle, CheckCircle2 } from 'lucide-react';

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
  showIcon = true,
  className,
  compact = false,
}) => {
  const info = calculateDeadlineInfo(createdAt, priority, now);
  const badgeStyle = getDeadlineBadgeStyle(info.state);

  const renderIcon = () => {
    if (!showIcon) return null;
    switch (info.state) {
      case 'late':
        return <AlertCircle className="w-3.5 h-3.5 shrink-0 animate-pulse text-red-600 dark:text-red-400" />;
      case 'at_risk':
        return <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-600 dark:text-amber-400" />;
      case 'on_track':
        return <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />;
      default:
        return <Clock className="w-3.5 h-3.5 shrink-0 opacity-70" />;
    }
  };

  if (compact) {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded border font-mono font-medium',
          badgeStyle.bg,
          badgeStyle.text,
          badgeStyle.border,
          className
        )}
        title={`Status: ${badgeStyle.label} (${info.percentRemaining.toFixed(0)}% remaining)`}
      >
        {renderIcon()}
        <span>{info.formattedCountdown}</span>
      </span>
    );
  }

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <div className="flex items-center justify-between gap-1.5">
        <span
          className={cn(
            'inline-flex items-center gap-1.5 text-xs px-2.5 py-0.5 rounded-full border font-medium',
            badgeStyle.bg,
            badgeStyle.text,
            badgeStyle.border
          )}
        >
          {renderIcon()}
          <span>{badgeStyle.label}</span>
        </span>
        <span className="font-mono text-xs font-semibold tabular-nums text-slate-800 dark:text-slate-200">
          {info.formattedCountdown}
        </span>
      </div>

      {info.totalDurationMs > 0 && info.state !== 'future' && (
        <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
          <div
            className={cn(
              'h-full transition-all duration-300',
              info.state === 'late'
                ? 'bg-red-500'
                : info.state === 'at_risk'
                ? 'bg-amber-500'
                : 'bg-emerald-500'
            )}
            style={{ width: `${info.percentRemaining}%` }}
          />
        </div>
      )}
    </div>
  );
};
