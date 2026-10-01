import React, { useState } from 'react';
import { Ticket, TicketStatus } from '../../types/ticket';
import { PriorityBadge } from './PriorityBadge';
import { TicketStatusBadge } from './TicketStatusBadge';
import { DeadlineCountdown } from './DeadlineCountdown';
import { useCurrentTime } from '../../hooks/useCurrentTime';
import { sanitizeHtml } from '../../lib/sanitize';
import { isSafeUrl, sanitizeAttachmentUrl } from '../../lib/safe-url';
import { getAgentById } from '../../types/agent';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  claimTicketThunk,
  updateStatusThunk,
  retriageTicketThunk,
} from '../../features/tickets/ticketThunks';
import { selectSelectedAgentId } from '../../features/tickets/ticketSelectors';
import {
  ArrowLeft,
  UserCheck,
  Sparkles,
  Paperclip,
  Clock,
  ShieldAlert,
  Loader2,
  CheckCircle2,
  Play,
  RotateCcw,
  ExternalLink,
  Info,
} from 'lucide-react';

interface TicketDetailsProps {
  ticket: Ticket;
  onBack: () => void;
}

export const TicketDetails: React.FC<TicketDetailsProps> = ({ ticket, onBack }) => {
  const dispatch = useAppDispatch();
  const currentAgentId = useAppSelector(selectSelectedAgentId);
  const now = useCurrentTime();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const assignedAgent = getAgentById(ticket.assigned_to);
  const isClaimedByMe = ticket.assigned_to === currentAgentId;
  const isClosed = ticket.status === 'closed';

  const getNextAllowedStatuses = (status: TicketStatus): TicketStatus[] => {
    switch (status) {
      case 'open':
        return ['in_progress'];
      case 'in_progress':
        return ['resolved'];
      case 'resolved':
        return ['open'];
      default:
        return [];
    }
  };

  const nextStatuses = getNextAllowedStatuses(ticket.status);

  // Sanitized body rendering
  const cleanBodyHtml = sanitizeHtml(
    ticket.body || '<p class="text-zinc-400 italic">No description provided for this ticket.</p>'
  );
  const cleanSummaryHtml = sanitizeHtml(ticket.summary || 'No summary generated.');

  // Safe attachment URL validation
  const safeAttachment = sanitizeAttachmentUrl(ticket.attachment_url);
  const hasUnsafeAttachment = ticket.attachment_url && !isSafeUrl(ticket.attachment_url);

  // Claim handler
  const handleClaim = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      await dispatch(
        claimTicketThunk({ ticketId: ticket.external_id, agentId: currentAgentId })
      ).unwrap();
      setActionSuccess('Ticket claimed successfully.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to claim ticket';
      setActionError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Status transition handler
  const handleStatusChange = async (newStatus: TicketStatus) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      await dispatch(
        updateStatusThunk({ ticketId: ticket.external_id, newStatus })
      ).unwrap();
      setActionSuccess(`Status changed to '${newStatus.replace('_', ' ')}'.`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update status';
      setActionError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Re-run AI Triage handler
  const handleRetriage = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      await dispatch(retriageTicketThunk({ ticketId: ticket.external_id })).unwrap();
      setActionSuccess('Re-triage complete. Updated classifications & summary.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to re-triage ticket';
      setActionError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasPriorityDifference =
    Boolean(ticket.ai_priority) && ticket.ai_priority !== ticket.priority;

  return (
    <div className="max-w-6xl mx-auto py-2 flex flex-col gap-4">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-zinc-200">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-600 hover:text-zinc-900 px-2.5 py-1.5 rounded border border-zinc-200 bg-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to tickets</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-semibold text-zinc-500">
            {ticket.external_id}
          </span>
          <TicketStatusBadge status={ticket.status} size="sm" />
          <PriorityBadge priority={ticket.priority} size="sm" />
        </div>
      </div>

      {/* Notifications / Alerts */}
      {actionError && (
        <div className="p-3 rounded border border-red-200 bg-red-50 text-xs text-red-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" />
            <span>{actionError}</span>
          </div>
          <button
            onClick={() => setActionError(null)}
            className="text-red-700 font-semibold ml-2 underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {actionSuccess && (
        <div className="p-3 rounded border border-emerald-200 bg-emerald-50 text-xs text-emerald-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
          <button
            onClick={() => setActionSuccess(null)}
            className="text-emerald-700 font-semibold ml-2 underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Content: Two Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left Column (2/3 width): Ticket Conversation & Triage Analysis */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          {/* Main Ticket Details Section */}
          <div className="bg-white border border-zinc-200 rounded-lg p-4 sm:p-5 flex flex-col gap-3">
            <div>
              <div className="flex items-center gap-2 text-xs text-zinc-500 mb-1">
                <span>Customer {ticket.customer_id}</span>
                <span>•</span>
                <span className="capitalize text-zinc-700 font-medium">
                  {ticket.customer_plan} plan
                </span>
                {ticket.customer_plan === 'enterprise' && (
                  <span className="text-[10px] font-semibold px-1 py-0.2 rounded bg-amber-50 text-amber-800 border border-amber-200">
                    Enterprise SLA Protected (Min P1)
                  </span>
                )}
              </div>
              <h1
                className="text-base sm:text-lg font-semibold text-zinc-900 break-words"
                dir="auto"
              >
                {ticket.subject || '(No subject provided)'}
              </h1>
            </div>

            {/* Sanitized Message Body */}
            <div className="border-t border-zinc-100 pt-3">
              <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-400 block mb-2">
                Customer Message
              </span>
              <div
                className="prose prose-zinc max-w-none text-xs sm:text-sm text-zinc-800 leading-relaxed break-words bg-zinc-50/60 p-3.5 rounded border border-zinc-150"
                dir="auto"
                dangerouslySetInnerHTML={{ __html: cleanBodyHtml }}
              />
            </div>

            {/* Attachment link */}
            {ticket.attachment_url && (
              <div className="border-t border-zinc-100 pt-3">
                <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-400 block mb-1.5">
                  Attachment
                </span>
                {safeAttachment ? (
                  <a
                    href={safeAttachment}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded border border-zinc-200 bg-zinc-50 text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-zinc-100 transition-colors"
                  >
                    <Paperclip className="w-3.5 h-3.5" />
                    <span className="truncate max-w-xs">{ticket.attachment_url}</span>
                    <ExternalLink className="w-3 h-3 opacity-60" />
                  </a>
                ) : hasUnsafeAttachment ? (
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded border border-red-200 bg-red-50 text-red-700 text-xs font-medium">
                    <ShieldAlert className="w-4 h-4 text-red-600" />
                    <span>Blocked unsafe URL protocol (potential security risk)</span>
                  </div>
                ) : null}
              </div>
            )}
          </div>

          {/* AI Triage & Analysis Section */}
          <div className="bg-white border border-zinc-200 rounded-lg p-4 sm:p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <h3 className="text-xs sm:text-sm font-semibold text-zinc-900">
                  AI Triage Analysis
                </h3>
                <span className="text-xs text-zinc-500">
                  ({ticket.triage_decision.replace('_', ' ')})
                </span>
              </div>

              <button
                onClick={handleRetriage}
                disabled={isSubmitting}
                className="h-7 inline-flex items-center gap-1.5 px-2.5 rounded border border-zinc-200 bg-white hover:bg-zinc-50 text-xs font-medium text-zinc-700 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? (
                  <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
                ) : (
                  <Sparkles className="w-3 h-3 text-blue-600" />
                )}
                <span>Re-run Triage</span>
              </button>
            </div>

            {/* AI Summary */}
            <div>
              <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-400 block mb-1">
                Generated Summary
              </span>
              <div
                className="text-xs text-zinc-700 bg-zinc-50/70 p-3 rounded border border-zinc-100"
                dangerouslySetInnerHTML={{ __html: cleanSummaryHtml }}
              />
            </div>

            {/* Priority Comparison if changed */}
            {hasPriorityDifference && (
              <div className="p-3 rounded border border-amber-200 bg-amber-50/60 text-xs">
                <div className="flex items-center gap-1.5 font-semibold text-amber-800 mb-1">
                  <Info className="w-3.5 h-3.5 text-amber-600" />
                  <span>Priority Adjusted from AI Suggestion</span>
                </div>
                <div className="flex items-center gap-2 text-zinc-600 mt-1">
                  <span>AI Suggested:</span>
                  <PriorityBadge priority={ticket.ai_priority} size="sm" />
                  <span className="text-zinc-400">→</span>
                  <span>Assigned:</span>
                  <PriorityBadge priority={ticket.priority} size="sm" />
                </div>
                {ticket.review_reason && (
                  <p className="mt-1.5 text-zinc-700">
                    <strong>Reason:</strong> {ticket.review_reason}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column (1/3 width): Compact Actions & Metadata Sidebar */}
        <div className="flex flex-col gap-4">
          {/* Action & Assignment Card */}
          <div className="bg-white border border-zinc-200 rounded-lg p-4 flex flex-col gap-3.5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Assignment & Status
            </h3>

            {/* Assignment Section */}
            <div className="flex flex-col gap-1.5">
              <span className="text-xs text-zinc-500">Assignee:</span>
              {assignedAgent ? (
                <div className="flex items-center justify-between p-2 rounded border border-zinc-200 bg-zinc-50">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-5 h-5 rounded-full ${assignedAgent.avatarColor} text-white flex items-center justify-center text-[10px] font-bold shrink-0`}
                    >
                      {assignedAgent.initials}
                    </div>
                    <span className="text-xs font-medium text-zinc-800">
                      {assignedAgent.name} {isClaimedByMe && '(You)'}
                    </span>
                  </div>
                  {!isClaimedByMe && !isClosed && (
                    <button
                      onClick={handleClaim}
                      disabled={isSubmitting}
                      className="text-xs font-medium text-blue-600 hover:underline"
                    >
                      Re-claim
                    </button>
                  )}
                </div>
              ) : (
                <button
                  onClick={handleClaim}
                  disabled={isSubmitting || isClosed}
                  className="w-full h-8 flex items-center justify-center gap-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <UserCheck className="w-3.5 h-3.5" />
                  )}
                  <span>Claim ticket</span>
                </button>
              )}
            </div>

            {/* Status Transitions */}
            <div className="flex flex-col gap-2 pt-3 border-t border-zinc-100">
              <span className="text-xs text-zinc-500">Next Action:</span>

              {isClosed ? (
                <div className="p-2 rounded bg-zinc-50 border border-zinc-200 text-xs text-zinc-500 italic">
                  Ticket is archived and closed.
                </div>
              ) : nextStatuses.length > 0 ? (
                <div className="flex flex-col gap-1.5">
                  {nextStatuses.map((st) => (
                    <button
                      key={st}
                      onClick={() => handleStatusChange(st)}
                      disabled={isSubmitting}
                      className="w-full h-8 flex items-center justify-center gap-1.5 rounded border border-zinc-200 hover:bg-zinc-50 text-xs font-medium text-zinc-800 transition-colors disabled:opacity-50"
                    >
                      {st === 'in_progress' && <Play className="w-3.5 h-3.5 text-amber-500" />}
                      {st === 'resolved' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                      {st === 'open' && <RotateCcw className="w-3.5 h-3.5 text-blue-600" />}
                      <span>Mark as {st.replace('_', ' ')}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <span className="text-xs text-zinc-400">No further transitions</span>
              )}
            </div>
          </div>

          {/* SLA Tracking Sidebar Box */}
          <div className="bg-white border border-zinc-200 rounded-lg p-4 flex flex-col gap-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-zinc-500" />
              <span>SLA Target</span>
            </h3>

            <DeadlineCountdown
              createdAt={ticket.created_at}
              priority={ticket.priority}
              now={now}
            />

            <div className="text-[11px] text-zinc-500 space-y-1.5 pt-2 border-t border-zinc-100">
              <div className="flex justify-between">
                <span>Created:</span>
                <span className="font-mono text-zinc-700">{ticket.created_at}</span>
              </div>
              <div className="flex justify-between">
                <span>Updated:</span>
                <span className="font-mono text-zinc-700">{ticket.updated_at}</span>
              </div>
              <div className="flex justify-between">
                <span>Category:</span>
                <span className="capitalize text-zinc-700">
                  {ticket.category.replace('_', ' ')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
