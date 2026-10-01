import React, { memo } from 'react';
import { Ticket } from '../../types/ticket';
import { PriorityBadge } from './PriorityBadge';
import { TicketStatusBadge } from './TicketStatusBadge';
import { DeadlineCountdown } from './DeadlineCountdown';
import { getAgentById } from '../../types/agent';
import { UserCheck, Sparkles, ChevronRight } from 'lucide-react';

interface TicketCardProps {
  ticket: Ticket;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
  onOpenDetails: (id: string) => void;
  onQuickClaim: (id: string) => void;
  currentAgentId: string;
  now: Date;
}

export const TicketCard: React.FC<TicketCardProps> = memo(
  ({
    ticket,
    isSelected,
    onToggleSelect,
    onOpenDetails,
    onQuickClaim,
    currentAgentId,
    now,
  }) => {
    const assignedAgent = getAgentById(ticket.assigned_to);
    const isClaimedByMe = ticket.assigned_to === currentAgentId;
    const canQuickClaim = ticket.status === 'open' && !ticket.assigned_to;

    const displaySubject = ticket.subject && ticket.subject.trim()
      ? ticket.subject
      : '(No subject provided)';

    return (
      <div
        className={`p-3.5 sm:p-4 rounded-xl border transition-all ${
          isSelected
            ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20 shadow-sm'
            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
        }`}
      >
        {/* Top Header: Checkbox + ID + Priority + Status */}
        <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => onToggleSelect(ticket.external_id)}
              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-slate-700 cursor-pointer"
              aria-label={`Select ticket ${ticket.external_id}`}
            />
            <span
              onClick={() => onOpenDetails(ticket.external_id)}
              className="font-mono text-xs font-bold text-slate-900 dark:text-white cursor-pointer hover:underline"
            >
              {ticket.external_id}
            </span>
            {ticket.customer_plan === 'enterprise' && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 dark:bg-amber-900/60 dark:text-amber-200">
                Enterprise
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <PriorityBadge priority={ticket.priority} size="sm" />
            <TicketStatusBadge status={ticket.status} size="sm" />
          </div>
        </div>

        {/* Middle Subject & Category */}
        <div
          onClick={() => onOpenDetails(ticket.external_id)}
          className="py-2.5 cursor-pointer"
        >
          <div className="flex items-start gap-1.5">
            <h3
              className="text-sm font-semibold text-slate-900 dark:text-slate-100 break-words leading-snug line-clamp-2"
              dir="auto"
            >
              {displaySubject}
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-1.5">
            <span className="capitalize">{ticket.category.replace('_', ' ')}</span>
            <span>•</span>
            <span>Customer: {ticket.customer_id}</span>
            {ticket.triage_decision === 'manual_review' && (
              <>
                <span>•</span>
                <span className="flex items-center gap-0.5 text-purple-700 dark:text-purple-300 font-semibold">
                  <Sparkles className="w-3 h-3 text-purple-500" />
                  Manual Review
                </span>
              </>
            )}
          </div>
        </div>

        {/* Bottom Bar: SLA + Agent / Quick Action */}
        <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 text-xs">
          <div>
            <DeadlineCountdown
              createdAt={ticket.created_at}
              priority={ticket.priority}
              now={now}
              compact
            />
          </div>

          <div className="flex items-center gap-2">
            {assignedAgent ? (
              <div className="flex items-center gap-1 text-[11px] text-slate-600 dark:text-slate-400">
                <div
                  className={`w-4 h-4 rounded-full ${assignedAgent.avatarColor} text-white flex items-center justify-center text-[9px] font-bold`}
                >
                  {assignedAgent.initials}
                </div>
                <span className={isClaimedByMe ? 'text-indigo-600 font-semibold' : ''}>
                  {assignedAgent.name}
                </span>
              </div>
            ) : canQuickClaim ? (
              <button
                onClick={() => onQuickClaim(ticket.external_id)}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-600 hover:text-white dark:bg-indigo-950 dark:text-indigo-300 transition-colors"
              >
                <UserCheck className="w-3 h-3" />
                <span>Claim</span>
              </button>
            ) : null}

            <button
              onClick={() => onOpenDetails(ticket.external_id)}
              className="p-1 text-slate-400 hover:text-slate-800 dark:hover:text-white"
              aria-label="Open ticket details"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }
);

TicketCard.displayName = 'TicketCard';
