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

  // Allowed next status transitions per rules:
  // open -> in_progress
  // in_progress -> resolved
  // resolved -> open
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
  const cleanBodyHtml = sanitizeHtml(ticket.body || '<p class="text-slate-400 italic">No description provided for this ticket.</p>');
  const cleanSummaryHtml = sanitizeHtml(ticket.summary || 'No AI summary generated.');

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
      setActionSuccess('Ticket claimed successfully!');
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
      setActionSuccess(`Status transitioned to '${newStatus.replace('_', ' ')}'`);
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
      setActionSuccess('AI re-triage complete! Updated classification & summary.');
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
    <div className="max-w-5xl mx-auto py-4 px-4 sm:px-6 flex flex-col gap-6">
      {/* Top Navigation & Breadcrumb */}
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Ticket List</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-bold text-slate-500">
            {ticket.external_id}
          </span>
          <TicketStatusBadge status={ticket.status} size="sm" />
          <PriorityBadge priority={ticket.priority} size="sm" />
        </div>
      </div>

      {/* Notifications / Errors */}
      {actionError && (
        <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900 text-xs text-red-800 dark:text-red-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" />
            <span>{actionError}</span>
          </div>
          <button
            onClick={() => setActionError(null)}
            className="text-red-700 font-bold ml-2"
          >
            Dismiss
          </button>
        </div>
      )}

      {actionSuccess && (
        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900 text-xs text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
          <button
            onClick={() => setActionSuccess(null)}
            className="text-emerald-700 font-bold ml-2"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Subject, Body, Customer Information */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Header Card */}
          <div className="p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                <span>Customer: {ticket.customer_id}</span>
                <span>•</span>
                <span className="capitalize font-medium text-slate-700 dark:text-slate-300">
                  {ticket.customer_plan} plan
                </span>
                {ticket.customer_plan === 'enterprise' && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200">
                    SLA Priority Protected (Min P1)
                  </span>
                )}
              </div>
              <h1
                className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white break-words"
                dir="auto"
              >
                {ticket.subject || '(No subject provided)'}
              </h1>
            </div>

            {/* Sanitized Customer Body */}
            <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Customer Message (Sanitized)
              </h4>
              <div
                className="prose dark:prose-invert max-w-none text-sm text-slate-800 dark:text-slate-200 leading-relaxed break-words bg-slate-50/50 dark:bg-slate-800/30 p-4 rounded-xl border border-slate-100 dark:border-slate-800/60"
                dir="auto"
                dangerouslySetInnerHTML={{ __html: cleanBodyHtml }}
              />
            </div>

            {/* Attachment link handling */}
            {ticket.attachment_url && (
              <div className="border-t border-slate-100 dark:border-slate-800 pt-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1.5">
                  Attachment
                </span>
                {safeAttachment ? (
                  <a
                    href={safeAttachment}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  >
                    <Paperclip className="w-3.5 h-3.5" />
                    <span className="truncate max-w-xs">{ticket.attachment_url}</span>
                    <ExternalLink className="w-3 h-3 ml-1 opacity-70" />
                  </a>
                ) : hasUnsafeAttachment ? (
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-red-200 bg-red-50 text-red-700 text-xs font-medium">
                    <ShieldAlert className="w-4 h-4 text-red-600" />
                    <span>
                      Blocked dangerous attachment URL protocol (potential XSS/script execution)
                    </span>
                  </div>
                ) : null}
              </div>
            )}
          </div>

          {/* AI Intelligence & Triage Details Card */}
          <div className="p-5 sm:p-6 rounded-2xl border border-purple-200 dark:border-purple-900/60 bg-purple-50/30 dark:bg-purple-950/20 shadow-xs flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-purple-600 text-white flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    AI Triage Analysis
                  </h3>
                  <span className="text-xs text-purple-700 dark:text-purple-300">
                    Decision: {ticket.triage_decision.replace('_', ' ')}
                  </span>
                </div>
              </div>

              {/* Re-run AI Button */}
              <button
                onClick={handleRetriage}
                disabled={isSubmitting}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-purple-300 dark:border-purple-800 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-950 text-xs font-semibold shadow-2xs transition-colors disabled:opacity-50"
              >
                {isSubmitting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5" />
                )}
                <span>Re-run AI</span>
              </button>
            </div>

            {/* AI Summary (Sanitized) */}
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                AI Summary
              </span>
              <div
                className="text-xs text-slate-700 dark:text-slate-300 italic bg-white dark:bg-slate-900/80 p-3 rounded-lg border border-purple-100 dark:border-purple-900/40"
                dangerouslySetInnerHTML={{ __html: cleanSummaryHtml }}
              />
            </div>

            {/* Priority Comparison if changed */}
            {hasPriorityDifference && (
              <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-xs">
                <div className="flex items-center gap-1.5 font-bold text-amber-900 dark:text-amber-200 mb-1">
                  <Info className="w-3.5 h-3.5 text-amber-600" />
                  <span>Priority Adjusted from AI Suggestion</span>
                </div>
                <div className="flex items-center gap-3 mt-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-500">AI Suggested:</span>
                    <PriorityBadge priority={ticket.ai_priority} size="sm" />
                  </div>
                  <span className="text-slate-400">→</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-500">Final Assigned:</span>
                    <PriorityBadge priority={ticket.priority} size="sm" />
                  </div>
                </div>
                {ticket.review_reason && (
                  <p className="mt-2 text-slate-600 dark:text-slate-400">
                    <strong>Reason:</strong> {ticket.review_reason}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Col: Actions, Assignment, SLA Countdown */}
        <div className="flex flex-col gap-6">
          {/* Action & Status Card */}
          <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col gap-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Agent Actions
            </h3>

            {/* Claim Action */}
            <div className="flex flex-col gap-2">
              <span className="text-xs text-slate-500">Assignment:</span>
              {assignedAgent ? (
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-6 h-6 rounded-full ${assignedAgent.avatarColor} text-white flex items-center justify-center text-xs font-bold`}
                    >
                      {assignedAgent.initials}
                    </div>
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      {assignedAgent.name} {isClaimedByMe && '(You)'}
                    </span>
                  </div>
                  {!isClaimedByMe && !isClosed && (
                    <button
                      onClick={handleClaim}
                      disabled={isSubmitting}
                      className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                      Re-claim
                    </button>
                  )}
                </div>
              ) : (
                <button
                  onClick={handleClaim}
                  disabled={isSubmitting || isClosed}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-sm transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <UserCheck className="w-4 h-4" />
                  )}
                  <span>Claim this ticket</span>
                </button>
              )}
            </div>

            {/* Status Transitions */}
            <div className="flex flex-col gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <span className="text-xs text-slate-500">Allowed Transitions:</span>

              {isClosed ? (
                <div className="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs text-slate-500 italic">
                  Ticket is in terminal Closed state (archived).
                </div>
              ) : nextStatuses.length > 0 ? (
                <div className="flex flex-col gap-2">
                  {nextStatuses.map((st) => (
                    <button
                      key={st}
                      onClick={() => handleStatusChange(st)}
                      disabled={isSubmitting}
                      className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 transition-colors disabled:opacity-50"
                    >
                      {st === 'in_progress' && <Play className="w-3.5 h-3.5 text-indigo-500" />}
                      {st === 'resolved' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
                      {st === 'open' && <RotateCcw className="w-3.5 h-3.5 text-sky-500" />}
                      <span>Move to {st.replace('_', ' ')}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <span className="text-xs text-slate-400">No further transitions available</span>
              )}
            </div>
          </div>

          {/* SLA Tracking Card */}
          <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col gap-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              <span>SLA Target</span>
            </h3>

            <DeadlineCountdown
              createdAt={ticket.created_at}
              priority={ticket.priority}
              now={now}
            />

            <div className="text-[11px] text-slate-500 space-y-1 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="flex justify-between">
                <span>Created At:</span>
                <span className="font-mono text-slate-700 dark:text-slate-300">
                  {ticket.created_at}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Last Updated:</span>
                <span className="font-mono text-slate-700 dark:text-slate-300">
                  {ticket.updated_at}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
