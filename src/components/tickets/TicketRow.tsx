import React, { memo } from 'react';
import { Ticket } from '../../types/ticket';
import { PriorityBadge } from './PriorityBadge';
import { TicketStatusBadge } from './TicketStatusBadge';
import { DeadlineCountdown } from './DeadlineCountdown';
import { getAgentById } from '../../types/agent';
import { UserCheck, Sparkles } from 'lucide-react';

interface TicketRowProps {
  ticket: Ticket;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
  onOpenDetails: (id: string) => void;
  onQuickClaim: (id: string) => void;
  currentAgentId: string;
  now: Date;
}

export const TicketRow: React.FC<TicketRowProps> = memo(
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
      <tr
        className={`group border-b border-slate-200 dark:border-slate-800 transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/40 ${
          isSelected ? 'bg-indigo-50/40 dark:bg-indigo-950/20' : ''
        }`}
      >
        {/* Selection Checkbox */}
        <td className="w-10 px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onToggleSelect(ticket.external_id)}
            className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-slate-700 cursor-pointer"
            aria-label={`Select ticket ${ticket.external_id}`}
          />
        </td>

        {/* ID & Plan */}
        <td
          className="px-3 py-3 font-mono text-xs cursor-pointer whitespace-nowrap"
          onClick={() => onOpenDetails(ticket.external_id)}
        >
          <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
            {ticket.external_id}
            {ticket.customer_plan === 'enterprise' && (
              <span className="text-[10px] font-sans font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 dark:bg-amber-900/60 dark:text-amber-200 uppercase">
                ENT
              </span>
            )}
          </div>
          <span className="text-[11px] text-slate-500 capitalize">{ticket.customer_plan}</span>
        </td>

        {/* Subject & Category */}
        <td
          className="px-4 py-3 cursor-pointer max-w-md"
          onClick={() => onOpenDetails(ticket.external_id)}
        >
          <div className="flex items-center gap-1.5">
            <span
              className="text-sm font-medium text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 break-words line-clamp-1"
              dir="auto"
            >
              {displaySubject}
            </span>
            {ticket.triage_decision === 'manual_review' && (
              <span
                className="shrink-0 flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300"
                title="Requires AI Triage Review"
              >
                <Sparkles className="w-2.5 h-2.5" />
                Review
              </span>
            )}
          </div>
          <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
            <span className="capitalize">{ticket.category.replace('_', ' ')}</span>
            <span>•</span>
            <span>{ticket.customer_id}</span>
          </div>
        </td>

        {/* Priority */}
        <td
          className="px-3 py-3 whitespace-nowrap cursor-pointer"
          onClick={() => onOpenDetails(ticket.external_id)}
        >
          <PriorityBadge priority={ticket.priority} size="sm" />
        </td>

        {/* Status */}
        <td
          className="px-3 py-3 whitespace-nowrap cursor-pointer"
          onClick={() => onOpenDetails(ticket.external_id)}
        >
          <TicketStatusBadge status={ticket.status} size="sm" />
        </td>

        {/* Assigned Agent */}
        <td
          className="px-3 py-3 whitespace-nowrap cursor-pointer text-xs"
          onClick={() => onOpenDetails(ticket.external_id)}
        >
          {assignedAgent ? (
            <div className="flex items-center gap-1.5">
              <div
                className={`w-5 h-5 rounded-full ${assignedAgent.avatarColor} text-white flex items-center justify-center text-[10px] font-bold`}
              >
                {assignedAgent.initials}
              </div>
              <span className={`font-medium ${isClaimedByMe ? 'text-indigo-600 dark:text-indigo-400 font-bold' : 'text-slate-700 dark:text-slate-300'}`}>
                {assignedAgent.name} {isClaimedByMe && '(You)'}
              </span>
            </div>
          ) : (
            <span className="text-slate-400 italic">Unassigned</span>
          )}
        </td>

        {/* SLA Countdown */}
        <td
          className="px-3 py-3 whitespace-nowrap cursor-pointer min-w-[130px]"
          onClick={() => onOpenDetails(ticket.external_id)}
        >
          <DeadlineCountdown
            createdAt={ticket.created_at}
            priority={ticket.priority}
            now={now}
            compact
          />
        </td>

        {/* Action Button */}
        <td className="px-3 py-3 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
          {canQuickClaim ? (
            <button
              onClick={() => onQuickClaim(ticket.external_id)}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-600 hover:text-white dark:bg-indigo-950 dark:text-indigo-300 dark:hover:bg-indigo-600 transition-colors shadow-xs"
              title="Claim this ticket"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Claim</span>
            </button>
          ) : (
            <button
              onClick={() => onOpenDetails(ticket.external_id)}
              className="text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white px-2 py-1"
            >
              View
            </button>
          )}
        </td>
      </tr>
    );
  }
);

TicketRow.displayName = 'TicketRow';
