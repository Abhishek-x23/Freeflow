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

    const displaySubject =
      ticket.subject && ticket.subject.trim()
        ? ticket.subject
        : '(No subject provided)';

    return (
      <div
        className={`p-3 rounded-lg border transition-colors ${
          isSelected
            ? 'border-blue-300 bg-blue-50/20'
            : 'border-zinc-200 bg-white hover:border-zinc-300'
        }`}
      >
        {/* Top Header: Checkbox + ID + Badges */}
        <div className="flex items-center justify-between gap-2 pb-2 border-b border-zinc-100">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => onToggleSelect(ticket.external_id)}
              className="w-3.5 h-3.5 rounded text-blue-600 focus:ring-blue-500 border-zinc-300 cursor-pointer"
              aria-label={`Select ticket ${ticket.external_id}`}
            />
            <span
              onClick={() => onOpenDetails(ticket.external_id)}
              className="font-mono text-xs font-semibold text-zinc-900 cursor-pointer hover:text-blue-600"
            >
              {ticket.external_id}
            </span>
            {ticket.customer_plan === 'enterprise' && (
              <span className="text-[10px] font-semibold px-1 py-0.2 rounded bg-amber-50 text-amber-800 border border-amber-200">
                ENT
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <PriorityBadge priority={ticket.priority} size="sm" />
            <TicketStatusBadge status={ticket.status} size="sm" />
          </div>
        </div>

        {/* Middle Subject & Category */}
        <div
          onClick={() => onOpenDetails(ticket.external_id)}
          className="py-2 cursor-pointer"
        >
          <h3
            className="text-xs sm:text-sm font-medium text-zinc-900 break-words leading-snug line-clamp-2"
            dir="auto"
          >
            {displaySubject}
          </h3>

          <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-zinc-400 mt-1">
            <span className="capitalize">{ticket.category.replace('_', ' ')}</span>
            <span>•</span>
            <span>Customer {ticket.customer_id}</span>
            {ticket.triage_decision === 'manual_review' && (
              <>
                <span>•</span>
                <span className="inline-flex items-center gap-0.5 text-amber-700 font-medium">
                  <Sparkles className="w-2.5 h-2.5 text-amber-600" />
                  Review
                </span>
              </>
            )}
          </div>
        </div>

        {/* Bottom Bar: SLA + Assignee / Quick Action */}
        <div className="pt-2 border-t border-zinc-100 flex items-center justify-between gap-2 text-xs">
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
              <div className="flex items-center gap-1 text-[11px] text-zinc-600">
                <div
                  className={`w-3.5 h-3.5 rounded-full ${assignedAgent.avatarColor} text-white flex items-center justify-center text-[8px] font-bold`}
                >
                  {assignedAgent.initials}
                </div>
                <span className={isClaimedByMe ? 'text-blue-700 font-semibold' : ''}>
                  {assignedAgent.name}
                </span>
              </div>
            ) : canQuickClaim ? (
              <button
                onClick={() => onQuickClaim(ticket.external_id)}
                className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white transition-colors"
              >
                <UserCheck className="w-3 h-3" />
                <span>Claim</span>
              </button>
            ) : null}

            <button
              onClick={() => onOpenDetails(ticket.external_id)}
              className="p-1 text-zinc-400 hover:text-zinc-700"
              aria-label="Open ticket details"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    );
  }
);

TicketCard.displayName = 'TicketCard';
