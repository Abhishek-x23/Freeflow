import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  selectSelectedTicketIds,
  selectSelectedAgentId,
} from '../../features/tickets/ticketSelectors';
import { clearSelection } from '../../features/tickets/ticketSlice';
import { bulkClaimThunk, bulkUpdateStatusThunk } from '../../features/tickets/ticketThunks';
import { TicketStatus } from '../../types/ticket';
import { BulkOperationSummary } from '../../types/api';
import { UserCheck, CheckCircle2, Play, X, Loader2, AlertCircle } from 'lucide-react';

export const BulkActions: React.FC = () => {
  const dispatch = useAppDispatch();
  const selectedIds = useAppSelector(selectSelectedTicketIds);
  const selectedAgentId = useAppSelector(selectSelectedAgentId);

  const [isRunning, setIsRunning] = useState(false);
  const [resultSummary, setResultSummary] = useState<BulkOperationSummary | null>(null);

  if (selectedIds.length === 0 && !resultSummary) {
    return null;
  }

  const handleBulkClaim = async () => {
    if (selectedIds.length === 0 || isRunning) return;
    setIsRunning(true);
    setResultSummary(null);

    try {
      const summary = await dispatch(
        bulkClaimThunk({ ticketIds: selectedIds, agentId: selectedAgentId })
      ).unwrap();
      setResultSummary(summary);
      dispatch(clearSelection());
    } catch {
      // Results handled inside thunk
    } finally {
      setIsRunning(false);
    }
  };

  const handleBulkStatus = async (status: TicketStatus) => {
    if (selectedIds.length === 0 || isRunning) return;
    setIsRunning(true);
    setResultSummary(null);

    try {
      const summary = await dispatch(
        bulkUpdateStatusThunk({ ticketIds: selectedIds, newStatus: status })
      ).unwrap();
      setResultSummary(summary);
      dispatch(clearSelection());
    } catch {
      // Results handled inside thunk
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-2xl px-4">
      <div className="bg-slate-900/95 dark:bg-slate-950/95 text-white backdrop-blur-md rounded-2xl shadow-2xl border border-slate-700 p-3 sm:p-4 flex flex-col gap-2.5">
        {/* Results Banner if operation just finished */}
        {resultSummary && (
          <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-700">
            <div className="flex items-center gap-2">
              {resultSummary.failed === 0 ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
              )}
              <span>
                Completed: <strong>{resultSummary.succeeded}</strong> succeeded
                {resultSummary.failed > 0 && (
                  <span className="text-amber-300 ml-1">
                    (<strong>{resultSummary.failed}</strong> failed & rolled back)
                  </span>
                )}
              </span>
            </div>
            <button
              onClick={() => setResultSummary(null)}
              className="text-slate-400 hover:text-white p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Action Controls Bar */}
        {selectedIds.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="bg-indigo-600 text-white font-bold px-2 py-0.5 rounded-full text-[11px]">
                {selectedIds.length}
              </span>
              <span className="font-medium text-slate-200">selected</span>
              <button
                onClick={() => dispatch(clearSelection())}
                disabled={isRunning}
                className="text-slate-400 hover:text-white underline ml-1"
              >
                Clear
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Claim selected */}
              <button
                onClick={handleBulkClaim}
                disabled={isRunning}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium rounded-lg transition-colors"
              >
                {isRunning ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <UserCheck className="w-3.5 h-3.5" />
                )}
                <span>Claim</span>
              </button>

              {/* Status to In Progress */}
              <button
                onClick={() => handleBulkStatus('in_progress')}
                disabled={isRunning}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 border border-slate-700 font-medium rounded-lg transition-colors"
              >
                <Play className="w-3.5 h-3.5 text-indigo-400" />
                <span>In Progress</span>
              </button>

              {/* Status to Resolved */}
              <button
                onClick={() => handleBulkStatus('resolved')}
                disabled={isRunning}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white font-medium rounded-lg transition-colors"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Resolve</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
