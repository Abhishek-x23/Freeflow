import React, { useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  selectVisibleTickets,
  selectSelectedTicketIds,
  selectSelectedAgentId,
  selectPagination,
  selectTicketLoadingStatus,
  selectTicketError,
} from '../../features/tickets/ticketSelectors';
import {
  toggleSelectTicket,
  selectAllTicketsOnPage,
  clearSelection,
} from '../../features/tickets/ticketSlice';
import { fetchTickets, claimTicketThunk } from '../../features/tickets/ticketThunks';
import { TicketRow } from './TicketRow';
import { TicketCard } from './TicketCard';
import { LoadingState } from '../shared/LoadingState';
import { EmptyState } from '../shared/EmptyState';
import { ErrorState } from '../shared/ErrorState';
import { useCurrentTime } from '../../hooks/useCurrentTime';
import { Loader2, AlertCircle } from 'lucide-react';

interface TicketListProps {
  onOpenDetails: (id: string) => void;
  onResetFilters: () => void;
}

export const TicketList: React.FC<TicketListProps> = ({
  onOpenDetails,
  onResetFilters,
}) => {
  const dispatch = useAppDispatch();
  const tickets = useAppSelector(selectVisibleTickets);
  const selectedIds = useAppSelector(selectSelectedTicketIds);
  const currentAgentId = useAppSelector(selectSelectedAgentId);
  const pagination = useAppSelector(selectPagination);
  const loadingStatus = useAppSelector(selectTicketLoadingStatus);
  const errorMessage = useAppSelector(selectTicketError);

  const now = useCurrentTime();
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // Infinite scroll IntersectionObserver
  useEffect(() => {
    if (!sentinelRef.current || !pagination.hasMore || loadingStatus !== 'idle') {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && pagination.hasMore && loadingStatus === 'idle') {
          dispatch(fetchTickets({ isAppend: true }));
        }
      },
      { rootMargin: '200px' }
    );

    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [pagination.hasMore, loadingStatus, dispatch]);

  const handleToggleSelect = (id: string) => {
    dispatch(toggleSelectTicket(id));
  };

  const handleSelectAll = () => {
    if (selectedIds.length === tickets.length && tickets.length > 0) {
      dispatch(clearSelection());
    } else {
      dispatch(selectAllTicketsOnPage());
    }
  };

  const handleQuickClaim = async (id: string) => {
    try {
      await dispatch(claimTicketThunk({ ticketId: id, agentId: currentAgentId })).unwrap();
    } catch (err: unknown) {
      // Handled in Redux and toast
    }
  };

  const handleRetry = () => {
    dispatch(fetchTickets({ isAppend: false }));
  };

  // 1. Initial Loading State
  if (loadingStatus === 'loading' && tickets.length === 0) {
    return <LoadingState message="Fetching support tickets..." />;
  }

  // 2. Error State
  if (loadingStatus === 'failed' && tickets.length === 0) {
    return (
      <ErrorState
        title="Failed to load tickets"
        message={errorMessage || 'Simulated 500 error or network failure. You can retry safely.'}
        onRetry={handleRetry}
      />
    );
  }

  // 3. Empty State
  if (tickets.length === 0 && loadingStatus === 'idle') {
    return <EmptyState onResetFilters={onResetFilters} />;
  }

  const allSelected = tickets.length > 0 && selectedIds.length === tickets.length;

  return (
    <div className="flex flex-col gap-3">
      {/* Inline non-blocking error banner if load-more failed */}
      {loadingStatus === 'failed' && tickets.length > 0 && (
        <div className="flex items-center justify-between p-3 rounded-lg bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-xs text-red-800 dark:text-red-300">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>Failed to load additional tickets ({errorMessage}).</span>
          </div>
          <button
            onClick={() => dispatch(fetchTickets({ isAppend: true }))}
            className="font-bold underline hover:no-underline ml-2"
          >
            Retry
          </button>
        </div>
      )}

      {/* Desktop Table View (Hidden on mobile) */}
      <div className="hidden md:block overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              <th className="w-10 px-4 py-3 text-center">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={handleSelectAll}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-slate-700 cursor-pointer"
                  aria-label="Select all tickets on current view"
                />
              </th>
              <th className="px-3 py-3">ID / Plan</th>
              <th className="px-4 py-3">Subject & Details</th>
              <th className="px-3 py-3">Priority</th>
              <th className="px-3 py-3">Status</th>
              <th className="px-3 py-3">Assigned</th>
              <th className="px-3 py-3">SLA Deadline</th>
              <th className="px-3 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {tickets.map((ticket) => (
              <TicketRow
                key={ticket.external_id}
                ticket={ticket}
                isSelected={selectedIds.includes(ticket.external_id)}
                onToggleSelect={handleToggleSelect}
                onOpenDetails={onOpenDetails}
                onQuickClaim={handleQuickClaim}
                currentAgentId={currentAgentId}
                now={now}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card Grid View (Shown on < 768px, perfect for 375px mobile) */}
      <div className="md:hidden flex flex-col gap-2.5">
        {tickets.map((ticket) => (
          <TicketCard
            key={ticket.external_id}
            ticket={ticket}
            isSelected={selectedIds.includes(ticket.external_id)}
            onToggleSelect={handleToggleSelect}
            onOpenDetails={onOpenDetails}
            onQuickClaim={handleQuickClaim}
            currentAgentId={currentAgentId}
            now={now}
          />
        ))}
      </div>

      {/* Infinite Scroll Sentinel & Load More Fallback */}
      <div ref={sentinelRef} className="py-4 text-center">
        {loadingStatus === 'loading-more' ? (
          <div className="inline-flex items-center gap-2 text-xs text-slate-500 font-medium">
            <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
            <span>Loading next page of tickets...</span>
          </div>
        ) : pagination.hasMore ? (
          <button
            onClick={() => dispatch(fetchTickets({ isAppend: true }))}
            className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors"
          >
            Load more tickets ({tickets.length} of {pagination.total})
          </button>
        ) : (
          <span className="text-xs text-slate-400">
            Showing all {pagination.total} matching tickets
          </span>
        )}
      </div>
    </div>
  );
};
