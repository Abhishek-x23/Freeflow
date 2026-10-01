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

    const displaySubject =
      ticket.subject && ticket.subject.trim()
        ? ticket.subject
        : '(No subject provided)';

    return (
      <tr
        className={`group border-b border-zinc-100 transition-colors hover:bg-zinc-50/70 ${
          isSelected ? 'bg-blue-50/30' : ''
        }`}
      >
        {/* Selection Checkbox */}
        <td
          className="w-10 px-3 py-2.5 text-center"
          onClick={(e) => e.stopPropagation()}
        >
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onToggleSelect(ticket.external_id)}
            className="w-3.5 h-3.5 rounded text-blue-600 focus:ring-blue-500 border-zinc-300 cursor-pointer"
            aria-label={`Select ticket ${ticket.external_id}`}
          />
        </td>

        {/* ID & Plan */}
        <td
          className="px-3 py-2.5 font-mono text-xs cursor-pointer whitespace-nowrap"
          onClick={() => onOpenDetails(ticket.external_id)}
        >
          <div className="font-semibold text-zinc-900 group-hover:text-blue-600 transition-colors flex items-center gap-1.5">
            {ticket.external_id}
            {ticket.customer_plan === 'enterprise' && (
              <span className="text-[10px] font-sans font-semibold px-1 py-0.2 rounded bg-amber-50 text-amber-800 border border-amber-200">
                ENT
              </span>
            )}
          </div>
          <span className="text-[11px] text-zinc-400 capitalize">
            {ticket.customer_plan}
          </span>
        </td>

        {/* Subject & Category */}
        <td
          className="px-3 py-2.5 cursor-pointer max-w-sm lg:max-w-md"
          onClick={() => onOpenDetails(ticket.external_id)}
        >
          <div className="flex items-center gap-1.5">
            <span
              className="text-xs sm:text-sm font-medium text-zinc-900 group-hover:text-blue-600 transition-colors break-words line-clamp-1"
              dir="auto"
            >
              {displaySubject}
            </span>
            {ticket.triage_decision === 'manual_review' && (
              <span
                className="shrink-0 inline-flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.2 rounded bg-amber-50 text-amber-800 border border-amber-200"
                title="Flagged for Manual AI Triage Review"
              >
                <Sparkles className="w-2.5 h-2.5 text-amber-600" />
                Review
              </span>
            )}
          </div>
          <div className="text-[11px] text-zinc-400 flex items-center gap-1.5 mt-0.5">
            <span className="capitalize">{ticket.category.replace('_', ' ')}</span>
            <span>•</span>
            <span>Customer {ticket.customer_id}</span>
          </div>
        </td>

        {/* Priority */}
        <td
          className="px-3 py-2.5 whitespace-nowrap cursor-pointer"
          onClick={() => onOpenDetails(ticket.external_id)}
        >
          <PriorityBadge priority={ticket.priority} size="sm" />
        </td>

        {/* Status */}
        <td
          className="px-3 py-2.5 whitespace-nowrap cursor-pointer"
          onClick={() => onOpenDetails(ticket.external_id)}
        >
          <TicketStatusBadge status={ticket.status} size="sm" />
        </td>

        {/* Assigned Agent */}
        <td
          className="px-3 py-2.5 whitespace-nowrap cursor-pointer text-xs"
          onClick={() => onOpenDetails(ticket.external_id)}
        >
          {assignedAgent ? (
            <div className="flex items-center gap-1.5">
              <div
                className={`w-4 h-4 rounded-full ${assignedAgent.avatarColor} text-white flex items-center justify-center text-[9px] font-bold shrink-0`}
              >
                {assignedAgent.initials}
              </div>
              <span
                className={`text-xs ${
                  isClaimedByMe
                    ? 'text-blue-700 font-semibold'
                    : 'text-zinc-700'
                }`}
              >
                {assignedAgent.name} {isClaimedByMe && '(You)'}
              </span>
            </div>
          ) : (
            <span className="text-zinc-400 text-xs italic">Unassigned</span>
          )}
        </td>

        {/* SLA Countdown */}
        <td
          className="px-3 py-2.5 whitespace-nowrap cursor-pointer min-w-[110px]"
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
        <td
          className="px-3 py-2.5 text-right whitespace-nowrap"
          onClick={(e) => e.stopPropagation()}
        >
          {canQuickClaim ? (
            <button
              onClick={() => onQuickClaim(ticket.external_id)}
              className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white transition-colors"
              title="Claim this ticket"
            >
              <UserCheck className="w-3 h-3" />
              <span>Claim</span>
            </button>
          ) : (
            <button
              onClick={() => onOpenDetails(ticket.external_id)}
              className="text-xs text-zinc-400 hover:text-zinc-900 px-2 py-1 transition-colors"
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
