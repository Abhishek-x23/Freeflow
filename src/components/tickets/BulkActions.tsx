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
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 w-full max-w-xl px-4">
      <div className="bg-zinc-900 text-zinc-100 rounded-lg shadow-xl border border-zinc-800 p-2.5 sm:p-3 flex flex-col gap-2">
        {/* Results Banner if operation just finished */}
        {resultSummary && (
          <div className="flex items-center justify-between text-xs pb-1.5 border-b border-zinc-800">
            <div className="flex items-center gap-1.5">
              {resultSummary.failed === 0 ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              )}
              <span>
                <strong>{resultSummary.succeeded}</strong> succeeded
                {resultSummary.failed > 0 && (
                  <span className="text-amber-300 ml-1">
                    (<strong>{resultSummary.failed}</strong> failed & rolled back)
                  </span>
                )}
              </span>
            </div>
            <button
              onClick={() => setResultSummary(null)}
              className="text-zinc-400 hover:text-white p-0.5"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Action Controls Bar */}
        {selectedIds.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-2.5 text-xs">
            <div className="flex items-center gap-2">
              <span className="bg-blue-600 text-white font-mono text-[11px] font-semibold px-1.5 py-0.2 rounded">
                {selectedIds.length}
              </span>
              <span className="text-zinc-300">selected</span>
              <button
                onClick={() => dispatch(clearSelection())}
                disabled={isRunning}
                className="text-zinc-400 hover:text-white underline ml-1 text-[11px]"
              >
                Clear
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {/* Claim selected */}
              <button
                onClick={handleBulkClaim}
                disabled={isRunning}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium rounded text-xs transition-colors"
              >
                {isRunning ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <UserCheck className="w-3 h-3" />
                )}
                <span>Claim</span>
              </button>

              {/* Status to In Progress */}
              <button
                onClick={() => handleBulkStatus('in_progress')}
                disabled={isRunning}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-zinc-200 border border-zinc-700 font-medium rounded text-xs transition-colors"
              >
                <Play className="w-3 h-3 text-blue-400" />
                <span>In Progress</span>
              </button>

              {/* Status to Resolved */}
              <button
                onClick={() => handleBulkStatus('resolved')}
                disabled={isRunning}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white font-medium rounded text-xs transition-colors"
              >
                <CheckCircle2 className="w-3 h-3" />
                <span>Resolve</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
