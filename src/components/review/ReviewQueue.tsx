import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { selectReviewQueueTickets } from '../../features/tickets/ticketSelectors';
import { triageTicketThunk } from '../../features/tickets/ticketThunks';
import { Ticket, TicketPriority, TicketCategory } from '../../types/ticket';
import { PriorityBadge } from '../tickets/PriorityBadge';
import { sanitizeHtml } from '../../lib/sanitize';
import {
  Sparkles,
  Check,
  Edit3,
  ShieldAlert,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Info,
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

      setSuccessBanner(`Ticket ${ticket.external_id} approved and removed from review queue.`);
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
        setFormError('Enterprise policy violation: Enterprise tickets must maintain priority P0 or P1.');
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
      setSuccessBanner(`Ticket ${ticket.external_id} classification updated successfully.`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update classification';
      setFormError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (reviewTickets.length === 0) {
    return (
      <div className="py-16 px-4 text-center max-w-md mx-auto flex flex-col items-center">
        <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
          Review Queue is Clean!
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
          There are currently no tickets requiring human triage verification. All AI classifications are either accepted or already processed.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-4 flex flex-col gap-5">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-900">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-purple-600 text-white flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              AI Triage Review Queue ({reviewTickets.length} pending)
            </h2>
            <p className="text-xs text-purple-700 dark:text-purple-300">
              Verify ambiguous AI outputs, inspect customer context, and adjust priorities where needed.
            </p>
          </div>
        </div>
      </div>

      {/* Global Success / Error Feedback */}
      {successBanner && (
        <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 text-xs text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successBanner}</span>
          </div>
          <button onClick={() => setSuccessBanner(null)} className="font-bold ml-2">
            Dismiss
          </button>
        </div>
      )}

      {formError && (
        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/50 border border-red-200 text-xs text-red-800 dark:text-red-300 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      {/* List of Tickets Needing Review */}
      <div className="flex flex-col gap-4">
        {reviewTickets.map((ticket) => {
          const isEditing = activeEditingId === ticket.external_id;
          const cleanSummary = sanitizeHtml(ticket.summary || '(No summary provided by model)');
          const isEnterprise = ticket.customer_plan === 'enterprise';

          return (
            <div
              key={ticket.external_id}
              className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col gap-4 transition-all"
            >
              {/* Ticket Header */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <span
                    onClick={() => onOpenTicket(ticket.external_id)}
                    className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                  >
                    {ticket.external_id}
                  </span>
                  <span className="text-xs text-slate-500">•</span>
                  <span className="text-xs text-slate-700 dark:text-slate-300 capitalize font-medium">
                    {ticket.customer_plan} plan
                  </span>
                  {isEnterprise && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200">
                      Enterprise Protected
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">AI Suggested:</span>
                  <PriorityBadge priority={ticket.priority} size="sm" />
                  <span className="text-xs font-mono capitalize px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    {ticket.category.replace('_', ' ')}
                  </span>
                </div>
              </div>

              {/* Subject & Reason */}
              <div>
                <h3
                  onClick={() => onOpenTicket(ticket.external_id)}
                  className="text-sm font-semibold text-slate-900 dark:text-white cursor-pointer hover:text-indigo-600 break-words"
                  dir="auto"
                >
                  {ticket.subject || '(No subject provided)'}
                </h3>

                <div className="mt-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-xs flex flex-col gap-1.5">
                  <div className="flex items-center gap-1.5 text-purple-700 dark:text-purple-300 font-semibold">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Flagged Reason: {ticket.review_reason || 'Manual review triggered'}</span>
                  </div>
                  <div
                    className="text-slate-600 dark:text-slate-400 italic"
                    dangerouslySetInnerHTML={{ __html: cleanSummary }}
                  />
                </div>
              </div>

              {/* Edit Mode vs Action Buttons */}
              {isEditing ? (
                <div className="mt-2 p-4 rounded-xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 flex flex-col gap-3">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Correct Classification & Document Reason
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Category Selector */}
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                        Category
                      </label>
                      <select
                        value={targetCategory}
                        onChange={(e) => setTargetCategory(e.target.value)}
                        className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs"
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
                      <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                        Priority {isEnterprise && '(Enterprise minimum: P1)'}
                      </label>
                      <select
                        value={targetPriority}
                        onChange={(e) => setTargetPriority(e.target.value)}
                        className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs"
                      >
                        <option value="P0">P0 (Critical SLA - 1h)</option>
                        <option value="P1">P1 (High SLA - 4h)</option>
                        <option value="P2" disabled={isEnterprise}>
                          P2 (Medium SLA - 24h) {isEnterprise ? '- Not Allowed for Enterprise' : ''}
                        </option>
                        <option value="P3" disabled={isEnterprise}>
                          P3 (Low SLA - 72h) {isEnterprise ? '- Not Allowed for Enterprise' : ''}
                        </option>
                      </select>
                    </div>
                  </div>

                  {/* Required Written Reason */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                        Reason for change (min 10 characters required)
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
                      className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>

                  {/* Buttons */}
                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      disabled={isSubmitting}
                      className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs text-slate-600 hover:bg-slate-100"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSaveCorrection(ticket)}
                      disabled={isSubmitting || reasonText.trim().length < 10}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-xs shadow-xs"
                    >
                      {isSubmitting ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Check className="w-3.5 h-3.5" />
                      )}
                      <span>Confirm & Save</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-3 pt-2">
                  <button
                    onClick={() => onOpenTicket(ticket.external_id)}
                    className="text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center gap-1"
                  >
                    <span>View full ticket</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleStartEdit(ticket)}
                      disabled={isSubmitting}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                      <span>Change</span>
                    </button>

                    <button
                      onClick={() => handleAcceptAI(ticket)}
                      disabled={isSubmitting}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-xs transition-colors"
                    >
                      {isSubmitting ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Check className="w-3.5 h-3.5" />
                      )}
                      <span>Accept AI</span>
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
