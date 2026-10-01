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
    } catch {
      // Handled in Redux
    }
  };

  const handleRetry = () => {
    dispatch(fetchTickets({ isAppend: false }));
  };

  // 1. Initial Loading State
  if (loadingStatus === 'loading' && tickets.length === 0) {
    return <LoadingState message="Loading support tickets..." />;
  }

  // 2. Error State
  if (loadingStatus === 'failed' && tickets.length === 0) {
    return (
      <ErrorState
        title="Failed to load tickets"
        message={errorMessage || 'A simulated error or network failure occurred.'}
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
    <div className="flex flex-col gap-2.5">
      {/* Inline non-blocking error banner if load-more failed */}
      {loadingStatus === 'failed' && tickets.length > 0 && (
        <div className="flex items-center justify-between p-2.5 rounded border border-red-200 bg-red-50 text-xs text-red-800">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>Failed to load more tickets ({errorMessage}).</span>
          </div>
          <button
            onClick={() => dispatch(fetchTickets({ isAppend: true }))}
            className="font-semibold underline hover:no-underline ml-2"
          >
            Retry
          </button>
        </div>
      )}

      {/* Desktop Table View */}
      <div className="hidden md:block overflow-hidden rounded-lg border border-zinc-200 bg-white">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-zinc-50 border-b border-zinc-200 text-[11px] font-medium text-zinc-500 uppercase tracking-wider">
              <th className="w-10 px-3 py-2 text-center">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={handleSelectAll}
                  className="w-3.5 h-3.5 rounded text-blue-600 focus:ring-blue-500 border-zinc-300 cursor-pointer"
                  aria-label="Select all tickets on current view"
                />
              </th>
              <th className="px-3 py-2">ID / Plan</th>
              <th className="px-3 py-2">Subject & Details</th>
              <th className="px-3 py-2">Priority</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Assigned</th>
              <th className="px-3 py-2">SLA Target</th>
              <th className="px-3 py-2 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
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

      {/* Mobile Card Grid View (< 768px, verified at 375px) */}
      <div className="md:hidden flex flex-col gap-2">
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

      {/* Infinite Scroll Sentinel & Counter */}
      <div ref={sentinelRef} className="py-3 text-center">
        {loadingStatus === 'loading-more' ? (
          <div className="inline-flex items-center gap-2 text-xs text-zinc-500">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
            <span>Loading additional tickets...</span>
          </div>
        ) : pagination.hasMore ? (
          <button
            onClick={() => dispatch(fetchTickets({ isAppend: true }))}
            className="h-8 px-3.5 rounded border border-zinc-200 bg-white hover:bg-zinc-50 text-xs font-medium text-zinc-700 transition-colors"
          >
            Load more ({tickets.length} of {pagination.total})
          </button>
        ) : (
          <span className="text-xs text-zinc-400">
            Showing all {pagination.total} tickets
          </span>
        )}
      </div>
    </div>
  );
};
