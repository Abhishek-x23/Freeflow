import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { selectReviewQueueTickets } from '../../features/tickets/ticketSelectors';
import { triageTicketThunk } from '../../features/tickets/ticketThunks';
import { Ticket } from '../../types/ticket';
import { PriorityBadge } from '../tickets/PriorityBadge';
import { sanitizeHtml } from '../../lib/sanitize';
import {
  Sparkles,
  Check,
  Edit3,
  ShieldAlert,
  Loader2,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';

interface ReviewQueueProps {
  onOpenTicket: (id: string) => void;
}

export const ReviewQueue: React.FC<ReviewQueueProps> = ({ onOpenTicket }) => {
  const dispatch = useAppDispatch();
  const reviewTickets = useAppSelector(selectReviewQueueTickets);

  const [activeEditingId, setActiveEditingId] = useState<string | null>(null);
  const [targetCategory, setTargetCategory] = useState<string>('');
  const [targetPriority, setTargetPriority] = useState<string>('');
  const [reasonText, setReasonText] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  const handleStartEdit = (ticket: Ticket) => {
    setActiveEditingId(ticket.external_id);
    setTargetCategory(ticket.category);
    setTargetPriority(ticket.priority);
    setReasonText('');
    setFormError(null);
  };

  const handleCancelEdit = () => {
    setActiveEditingId(null);
    setFormError(null);
  };

  const handleAcceptAI = async (ticket: Ticket) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setFormError(null);

    try {
      await dispatch(
        triageTicketThunk({
          ticketId: ticket.external_id,
          category: ticket.category,
          priority: ticket.priority,
          reason: 'Accepted initial AI model recommendation without modification.',
        })
      ).unwrap();

      setSuccessBanner(`Ticket ${ticket.external_id} approved.`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to approve ticket';
      setFormError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveCorrection = async (ticket: Ticket) => {
    if (isSubmitting) return;

    // 1. Validation: reason length >= 10 characters
    if (!reasonText || reasonText.trim().length < 10) {
      setFormError('A written explanation of at least 10 characters is required.');
      return;
    }

    // 2. Validation: Enterprise rule (min P1)
    if (ticket.customer_plan === 'enterprise') {
      if (targetPriority === 'P2' || targetPriority === 'P3' || targetPriority === 'P5') {
        setFormError('Enterprise policy: Enterprise tickets must maintain priority P0 or P1.');
        return;
      }
    }

    setIsSubmitting(true);
    setFormError(null);

    try {
      await dispatch(
        triageTicketThunk({
          ticketId: ticket.external_id,
          category: targetCategory,
          priority: targetPriority,
          reason: reasonText.trim(),
        })
      ).unwrap();

      setActiveEditingId(null);
      setSuccessBanner(`Ticket ${ticket.external_id} triage updated successfully.`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update triage';
      setFormError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (reviewTickets.length === 0) {
    return (
      <div className="py-16 px-4 text-center max-w-sm mx-auto flex flex-col items-center">
        <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
          <CheckCircle2 className="w-5 h-5" />
        </div>
        <h3 className="text-sm font-semibold text-zinc-900">
          Review Queue Clean
        </h3>
        <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
          No tickets currently require manual triage review. All AI classifications are verified.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-2 flex flex-col gap-4">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-lg bg-zinc-50 border border-zinc-200">
        <div>
          <h2 className="text-sm font-semibold text-zinc-900 flex items-center gap-2">
            <span>Triage Review Queue</span>
            <span className="text-xs font-mono font-medium px-2 py-0.2 rounded bg-amber-100 text-amber-800 border border-amber-200">
              {reviewTickets.length} pending
            </span>
          </h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            Review tickets where AI confidence was low or where business policy requires agent sign-off.
          </p>
        </div>
      </div>

      {/* Global Success / Error Feedback */}
      {successBanner && (
        <div className="p-3 rounded border border-emerald-200 bg-emerald-50 text-xs text-emerald-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successBanner}</span>
          </div>
          <button onClick={() => setSuccessBanner(null)} className="font-semibold underline ml-2">
            Dismiss
          </button>
        </div>
      )}

      {formError && (
        <div className="p-3 rounded border border-red-200 bg-red-50 text-xs text-red-800 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      {/* List of Tickets Needing Review */}
      <div className="flex flex-col gap-3">
        {reviewTickets.map((ticket) => {
          const isEditing = activeEditingId === ticket.external_id;
          const cleanSummary = sanitizeHtml(ticket.summary || '(No summary provided)');
          const isEnterprise = ticket.customer_plan === 'enterprise';

          return (
            <div
              key={ticket.external_id}
              className="p-4 rounded-lg border border-zinc-200 bg-white flex flex-col gap-3 transition-colors"
            >
              {/* Ticket Header */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-zinc-100">
                <div className="flex items-center gap-2">
                  <span
                    onClick={() => onOpenTicket(ticket.external_id)}
                    className="font-mono text-xs font-semibold text-zinc-900 hover:text-blue-600 cursor-pointer"
                  >
                    {ticket.external_id}
                  </span>
                  <span className="text-zinc-300">•</span>
                  <span className="text-xs text-zinc-500 capitalize">
                    {ticket.customer_plan} plan
                  </span>
                  {isEnterprise && (
                    <span className="text-[10px] font-semibold px-1 py-0.2 rounded bg-amber-50 text-amber-800 border border-amber-200">
                      Enterprise Protected
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-zinc-400">Current:</span>
                  <PriorityBadge priority={ticket.priority} size="sm" />
                  <span className="text-xs capitalize px-2 py-0.5 rounded bg-zinc-100 text-zinc-700 border border-zinc-200">
                    {ticket.category.replace('_', ' ')}
                  </span>
                </div>
              </div>

              {/* Subject & Reason */}
              <div>
                <h3
                  onClick={() => onOpenTicket(ticket.external_id)}
                  className="text-xs sm:text-sm font-medium text-zinc-900 cursor-pointer hover:text-blue-600 break-words"
                  dir="auto"
                >
                  {ticket.subject || '(No subject provided)'}
                </h3>

                <div className="mt-2 p-2.5 rounded bg-zinc-50 border border-zinc-150 text-xs flex flex-col gap-1">
                  <div className="flex items-center gap-1.5 text-zinc-700 font-medium">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    <span>Flagged: {ticket.review_reason || 'Manual review required'}</span>
                  </div>
                  <div
                    className="text-zinc-500 italic text-[11px]"
                    dangerouslySetInnerHTML={{ __html: cleanSummary }}
                  />
                </div>
              </div>

              {/* Edit Mode vs Action Buttons */}
              {isEditing ? (
                <div className="p-3 rounded border border-zinc-200 bg-zinc-50/50 flex flex-col gap-3">
                  <h4 className="text-xs font-semibold text-zinc-900 uppercase tracking-wider">
                    Modify Triage & Provide Justification
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Category Selector */}
                    <div>
                      <label className="text-[11px] font-medium text-zinc-600 block mb-1">
                        Category
                      </label>
                      <select
                        value={targetCategory}
                        onChange={(e) => setTargetCategory(e.target.value)}
                        className="w-full h-8 bg-white border border-zinc-200 rounded px-2 text-xs text-zinc-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="account_access">Account & Access</option>
                        <option value="billing">Billing & Invoices</option>
                        <option value="bug">Bugs & Technical</option>
                        <option value="feature_request">Feature Request</option>
                        <option value="other">Other Inquiry</option>
                      </select>
                    </div>

                    {/* Priority Selector */}
                    <div>
                      <label className="text-[11px] font-medium text-zinc-600 block mb-1">
                        Priority {isEnterprise && '(Enterprise minimum: P1)'}
                      </label>
                      <select
                        value={targetPriority}
                        onChange={(e) => setTargetPriority(e.target.value)}
                        className="w-full h-8 bg-white border border-zinc-200 rounded px-2 text-xs text-zinc-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="P0">P0 (Critical SLA - 1h)</option>
                        <option value="P1">P1 (High SLA - 4h)</option>
                        <option value="P2" disabled={isEnterprise}>
                          P2 (Medium SLA - 24h) {isEnterprise ? '- Not Allowed' : ''}
                        </option>
                        <option value="P3" disabled={isEnterprise}>
                          P3 (Low SLA - 72h) {isEnterprise ? '- Not Allowed' : ''}
                        </option>
                      </select>
                    </div>
                  </div>

                  {/* Required Written Reason */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-medium text-zinc-600">
                        Reason for modification (min 10 characters)
                      </label>
                      <span
                        className={`text-[10px] font-mono ${
                          reasonText.length < 10 ? 'text-amber-600' : 'text-emerald-600'
                        }`}
                      >
                        {reasonText.length}/10 chars
                      </span>
                    </div>
                    <textarea
                      rows={2}
                      value={reasonText}
                      onChange={(e) => setReasonText(e.target.value)}
                      placeholder="Explain why category or priority was modified..."
                      className="w-full bg-white border border-zinc-200 rounded p-2 text-xs text-zinc-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  {/* Buttons */}
                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      disabled={isSubmitting}
                      className="h-8 px-3 rounded border border-zinc-200 text-xs text-zinc-600 hover:bg-zinc-100 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSaveCorrection(ticket)}
                      disabled={isSubmitting || reasonText.trim().length < 10}
                      className="h-8 inline-flex items-center gap-1.5 px-3 rounded bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium text-xs transition-colors"
                    >
                      {isSubmitting ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Check className="w-3.5 h-3.5" />
                      )}
                      <span>Save Changes</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-3 pt-1">
                  <button
                    onClick={() => onOpenTicket(ticket.external_id)}
                    className="text-xs text-zinc-500 hover:text-zinc-900 flex items-center gap-1 transition-colors"
                  >
                    <span>View ticket</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleStartEdit(ticket)}
                      disabled={isSubmitting}
                      className="h-7 inline-flex items-center gap-1 px-2.5 rounded border border-zinc-200 hover:bg-zinc-50 text-xs font-medium text-zinc-700 transition-colors"
                    >
                      <Edit3 className="w-3 h-3 text-zinc-400" />
                      <span>Modify</span>
                    </button>

                    <button
                      onClick={() => handleAcceptAI(ticket)}
                      disabled={isSubmitting}
                      className="h-7 inline-flex items-center gap-1 px-2.5 rounded bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-medium transition-colors"
                    >
                      {isSubmitting ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Check className="w-3 h-3" />
                      )}
                      <span>Accept</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
