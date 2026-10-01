import { createAsyncThunk } from '@reduxjs/toolkit';
import { RootState, AppDispatch } from '../../store/store';
import { apiClient, ApiError } from '../../lib/api-client';
import {
  setTicketsLoading,
  setTicketsLoadingMore,
  setTicketsSuccess,
  setTicketsFailed,
  optimisticClaimStart,
  optimisticClaimRollback,
  optimisticClaimCommit,
  optimisticStatusStart,
  optimisticStatusRollback,
  optimisticStatusCommit,
  applyLiveUpdates,
  upsertTicket,
} from './ticketSlice';
import { Ticket, TicketStatus } from '../../types/ticket';
import { BulkOperationSummary } from '../../types/api';

/**
 * Fetch tickets based on current filters and page
 */
export const fetchTickets = createAsyncThunk<
  void,
  { isAppend?: boolean; bypassSimulation?: boolean } | undefined,
  { state: RootState; dispatch: AppDispatch }
>('tickets/fetchTickets', async (options = {}, { getState, dispatch }) => {
  const state = getState().tickets;
  const { isAppend = false, bypassSimulation = false } = options;

  if (isAppend) {
    dispatch(setTicketsLoadingMore());
  } else {
    dispatch(setTicketsLoading());
  }

  try {
    const pageToFetch = isAppend ? state.pagination.page + 1 : state.pagination.page;
    const response = await apiClient.getTickets(
      state.filters,
      pageToFetch,
      state.pagination.limit,
      bypassSimulation
    );

    dispatch(
      setTicketsSuccess({
        tickets: response.tickets,
        total: response.total,
        page: response.page,
        hasMore: response.hasMore,
        isAppend,
      })
    );
  } catch (err: unknown) {
    const message = err instanceof ApiError ? err.message : 'Failed to fetch tickets';
    dispatch(setTicketsFailed(message));
    throw err;
  }
});

/**
 * Optimistic ticket claim with rollback
 */
export const claimTicketThunk = createAsyncThunk<
  Ticket,
  { ticketId: string; agentId: string; bypassSimulation?: boolean },
  { state: RootState; dispatch: AppDispatch }
>('tickets/claimTicket', async ({ ticketId, agentId, bypassSimulation = false }, { dispatch }) => {
  // 1. Optimistic update
  dispatch(optimisticClaimStart({ ticketId, agentId }));

  try {
    // 2. Network call
    const updated = await apiClient.claimTicket(ticketId, { agent_id: agentId }, bypassSimulation);
    // 3. Retain change on success
    dispatch(optimisticClaimCommit(updated));
    return updated;
  } catch (err: unknown) {
    // 4. Rollback on failure
    dispatch(optimisticClaimRollback(ticketId));
    throw err;
  }
});

/**
 * Optimistic status transition with rollback
 */
export const updateStatusThunk = createAsyncThunk<
  Ticket,
  { ticketId: string; newStatus: TicketStatus; bypassSimulation?: boolean },
  { state: RootState; dispatch: AppDispatch }
>('tickets/updateStatus', async ({ ticketId, newStatus, bypassSimulation = false }, { dispatch }) => {
  // 1. Optimistic update
  dispatch(optimisticStatusStart({ ticketId, newStatus }));

  try {
    // 2. Network call
    const updated = await apiClient.updateStatus(ticketId, { status: newStatus as any }, bypassSimulation);
    // 3. Retain change on success
    dispatch(optimisticStatusCommit(updated));
    return updated;
  } catch (err: unknown) {
    // 4. Rollback on failure
    dispatch(optimisticStatusRollback(ticketId));
    throw err;
  }
});

/**
 * Triage ticket classification review
 */
export const triageTicketThunk = createAsyncThunk<
  Ticket,
  { ticketId: string; category?: string; priority?: string; reason: string; bypassSimulation?: boolean },
  { state: RootState; dispatch: AppDispatch }
>('tickets/triageTicket', async ({ ticketId, category, priority, reason, bypassSimulation = false }, { dispatch }) => {
  const updated = await apiClient.triageTicket(
    ticketId,
    { category, priority, reason },
    bypassSimulation
  );
  dispatch(upsertTicket(updated));
  return updated;
});

/**
 * Re-run AI classification locally
 */
export const retriageTicketThunk = createAsyncThunk<
  Ticket,
  { ticketId: string; bypassSimulation?: boolean },
  { state: RootState; dispatch: AppDispatch }
>('tickets/retriageTicket', async ({ ticketId, bypassSimulation = false }, { dispatch }) => {
  const updated = await apiClient.retriageTicket(ticketId, bypassSimulation);
  dispatch(upsertTicket(updated));
  return updated;
});

/**
 * Poll live updates from /api/tickets/updates?since=
 */
export const pollLiveUpdatesThunk = createAsyncThunk<
  void,
  { bypassSimulation?: boolean } | undefined,
  { state: RootState; dispatch: AppDispatch }
>('tickets/pollUpdates', async (options = {}, { getState, dispatch }) => {
  const { bypassSimulation = false } = options;
  const lastSync = getState().tickets.lastSyncTimestamp;

  try {
    const response = await apiClient.getUpdates(lastSync, bypassSimulation);
    if (response.updates.length > 0) {
      dispatch(applyLiveUpdates(response));
    }
  } catch (err: unknown) {
    // Polling errors should be logged without crashing the app
    console.debug('[LiveSync] Polling check encountered error:', err);
  }
});

/**
 * Bulk Claim: claims multiple tickets individually.
 * Preserves individual outcomes, retains successes, rolls back failures.
 */
export const bulkClaimThunk = createAsyncThunk<
  BulkOperationSummary,
  { ticketIds: string[]; agentId: string },
  { state: RootState; dispatch: AppDispatch }
>('tickets/bulkClaim', async ({ ticketIds, agentId }, { dispatch }) => {
  const results = await Promise.all(
    ticketIds.map(async (id) => {
      // Optimistic update
      dispatch(optimisticClaimStart({ ticketId: id, agentId }));
      try {
        const ticket = await apiClient.claimTicket(id, { agent_id: agentId });
        dispatch(optimisticClaimCommit(ticket));
        return { ticketId: id, success: true, ticket };
      } catch (err: unknown) {
        dispatch(optimisticClaimRollback(id));
        const message = err instanceof ApiError ? err.message : 'Claim failed';
        return { ticketId: id, success: false, error: message };
      }
    })
  );

  const succeeded = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;

  return {
    total: ticketIds.length,
    succeeded,
    failed,
    results,
  };
});

/**
 * Bulk Status Update: transitions multiple tickets individually.
 */
export const bulkUpdateStatusThunk = createAsyncThunk<
  BulkOperationSummary,
  { ticketIds: string[]; newStatus: TicketStatus },
  { state: RootState; dispatch: AppDispatch }
>('tickets/bulkUpdateStatus', async ({ ticketIds, newStatus }, { dispatch }) => {
  const results = await Promise.all(
    ticketIds.map(async (id) => {
      dispatch(optimisticStatusStart({ ticketId: id, newStatus }));
      try {
        const ticket = await apiClient.updateStatus(id, { status: newStatus as any });
        dispatch(optimisticStatusCommit(ticket));
        return { ticketId: id, success: true, ticket };
      } catch (err: unknown) {
        dispatch(optimisticStatusRollback(id));
        const message = err instanceof ApiError ? err.message : 'Status transition failed';
        return { ticketId: id, success: false, error: message };
      }
    })
  );

  const succeeded = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;

  return {
    total: ticketIds.length,
    succeeded,
    failed,
    results,
  };
});
