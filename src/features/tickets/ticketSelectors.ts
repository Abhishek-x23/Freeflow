import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '../../store/store';
import { Ticket } from '../../types/ticket';

export const selectTicketState = (state: RootState) => state.tickets;

export const selectTicketEntities = (state: RootState) => state.tickets.entities;
export const selectTicketIds = (state: RootState) => state.tickets.ids;
export const selectFilters = (state: RootState) => state.tickets.filters;
export const selectSelectedAgentId = (state: RootState) => state.tickets.selectedAgentId;
export const selectPagination = (state: RootState) => state.tickets.pagination;
export const selectSelectedTicketIds = (state: RootState) => state.tickets.selectedTicketIds;
export const selectPendingTickets = (state: RootState) => state.tickets.pendingTickets;
export const selectTicketLoadingStatus = (state: RootState) => state.tickets.status;
export const selectTicketError = (state: RootState) => state.tickets.error;

/**
 * Returns tickets currently visible on the list page
 */
export const selectVisibleTickets = createSelector(
  [selectTicketEntities, selectTicketIds],
  (entities, ids): Ticket[] => {
    return ids.map((id) => entities[id]).filter(Boolean);
  }
);

/**
 * Returns array of all loaded tickets across the store
 */
export const selectAllLoadedTickets = createSelector(
  [selectTicketEntities],
  (entities): Ticket[] => Object.values(entities)
);

/**
 * Header count: "My tickets (N)"
 * Evaluated from all loaded tickets: assigned to active agent and not yet resolved/closed.
 */
export const selectMyTicketsCount = createSelector(
  [selectAllLoadedTickets, selectSelectedAgentId],
  (tickets, agentId): number => {
    return tickets.filter(
      (t) => t.assigned_to === agentId && t.status !== 'resolved' && t.status !== 'closed'
    ).length;
  }
);

/**
 * Header count: "To review (N)"
 * Evaluated from all loaded tickets: triage_decision === 'manual_review' and not resolved/closed.
 */
export const selectToReviewCount = createSelector(
  [selectAllLoadedTickets],
  (tickets): number => {
    return tickets.filter(
      (t) => t.triage_decision === 'manual_review' && t.status !== 'resolved' && t.status !== 'closed'
    ).length;
  }
);

/**
 * Review Queue tickets for /review page
 */
export const selectReviewQueueTickets = createSelector(
  [selectAllLoadedTickets],
  (tickets): Ticket[] => {
    return tickets.filter(
      (t) => t.triage_decision === 'manual_review' && t.status !== 'resolved' && t.status !== 'closed'
    );
  }
);

/**
 * Returns specific ticket by ID
 */
export const selectTicketById = (ticketId: string) =>
  createSelector([selectTicketEntities], (entities): Ticket | undefined => entities[ticketId]);
