import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Ticket, TicketFilters } from '../../types/ticket';
import { VALID_AGENT_IDS } from '../../types/agent';

export interface TicketState {
  // Normalized entities dictionary: external_id -> Ticket
  entities: Record<string, Ticket>;
  // Order of IDs for the current view
  ids: string[];
  // Active filters
  filters: TicketFilters;
  // Current active agent ID (persisted in localStorage)
  selectedAgentId: string;
  // Pagination
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
  // Multi-selection for bulk operations
  selectedTicketIds: string[];
  // Buffered incoming new tickets (so list doesn't jump while reading)
  pendingTickets: Ticket[];
  // Loading & error states
  status: 'idle' | 'loading' | 'loading-more' | 'failed';
  error: string | null;
  // Last live-sync timestamp
  lastSyncTimestamp: string | null;
  // Optimistic rollback backups: external_id -> previous Ticket state
  optimisticBackups: Record<string, Ticket>;
}

// Initial agent from localStorage if available, default to 'agent-1' (Priya)
const getInitialAgent = (): string => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('apex_selected_agent');
    if (saved && (VALID_AGENT_IDS as readonly string[]).includes(saved)) {
      return saved;
    }
  }
  return 'agent-1';
};

const initialState: TicketState = {
  entities: {},
  ids: [],
  filters: {
    status: 'all',
    priority: 'all',
    category: 'all',
    ai_decision: 'all',
    search: '',
  },
  selectedAgentId: getInitialAgent(),
  pagination: {
    page: 1,
    limit: 25,
    total: 0,
    hasMore: false,
  },
  selectedTicketIds: [],
  pendingTickets: [],
  status: 'idle',
  error: null,
  lastSyncTimestamp: null,
  optimisticBackups: {},
};

export const ticketSlice = createSlice({
  name: 'tickets',
  initialState,
  reducers: {
    setSelectedAgent: (state, action: PayloadAction<string>) => {
      state.selectedAgentId = action.payload;
      if (typeof window !== 'undefined') {
        localStorage.setItem('apex_selected_agent', action.payload);
      }
    },

    setFilters: (state, action: PayloadAction<TicketFilters>) => {
      state.filters = { ...state.filters, ...action.payload };
      state.pagination.page = 1;
    },

    resetFilters: (state) => {
      state.filters = {
        status: 'all',
        priority: 'all',
        category: 'all',
        ai_decision: 'all',
        search: '',
      };
      state.pagination.page = 1;
    },

    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.filters.search = action.payload;
      state.pagination.page = 1;
    },

    setPage: (state, action: PayloadAction<number>) => {
      state.pagination.page = action.payload;
    },

    toggleSelectTicket: (state, action: PayloadAction<string>) => {
      const id = action.payload;
      if (state.selectedTicketIds.includes(id)) {
        state.selectedTicketIds = state.selectedTicketIds.filter((item) => item !== id);
      } else {
        state.selectedTicketIds.push(id);
      }
    },

    selectAllTicketsOnPage: (state) => {
      state.selectedTicketIds = [...state.ids];
    },

    clearSelection: (state) => {
      state.selectedTicketIds = [];
    },

    setTicketsLoading: (state) => {
      state.status = 'loading';
      state.error = null;
    },

    setTicketsLoadingMore: (state) => {
      state.status = 'loading-more';
    },

    setTicketsSuccess: (
      state,
      action: PayloadAction<{
        tickets: Ticket[];
        total: number;
        page: number;
        hasMore: boolean;
        isAppend?: boolean;
      }>
    ) => {
      const { tickets, total, page, hasMore, isAppend } = action.payload;
      state.status = 'idle';
      state.error = null;
      state.pagination.total = total;
      state.pagination.page = page;
      state.pagination.hasMore = hasMore;

      if (!isAppend) {
        // Replace current visible list
        state.ids = tickets.map((t) => t.external_id);
      } else {
        // Append IDs avoiding duplicates
        const newIds = tickets.map((t) => t.external_id);
        const existingSet = new Set(state.ids);
        for (const id of newIds) {
          if (!existingSet.has(id)) {
            state.ids.push(id);
          }
        }
      }

      // Upsert into normalized entities
      for (const t of tickets) {
        state.entities[t.external_id] = t;
      }
    },

    setTicketsFailed: (state, action: PayloadAction<string>) => {
      state.status = 'failed';
      state.error = action.payload;
    },

    upsertTicket: (state, action: PayloadAction<Ticket>) => {
      const ticket = action.payload;
      state.entities[ticket.external_id] = ticket;
      if (!state.ids.includes(ticket.external_id)) {
        state.ids.unshift(ticket.external_id);
      }
    },

    // Optimistic Claiming
    optimisticClaimStart: (state, action: PayloadAction<{ ticketId: string; agentId: string }>) => {
      const { ticketId, agentId } = action.payload;
      const current = state.entities[ticketId];
      if (current) {
        // Backup for potential rollback
        state.optimisticBackups[ticketId] = { ...current };
        state.entities[ticketId] = {
          ...current,
          assigned_to: agentId,
          status: current.status === 'open' ? 'in_progress' : current.status,
          updated_at: new Date().toISOString(),
        };
      }
    },

    optimisticClaimRollback: (state, action: PayloadAction<string>) => {
      const ticketId = action.payload;
      const backup = state.optimisticBackups[ticketId];
      if (backup) {
        state.entities[ticketId] = backup;
        delete state.optimisticBackups[ticketId];
      }
    },

    optimisticClaimCommit: (state, action: PayloadAction<Ticket>) => {
      const ticket = action.payload;
      state.entities[ticket.external_id] = ticket;
      delete state.optimisticBackups[ticket.external_id];
    },

    // Optimistic Status Update
    optimisticStatusStart: (state, action: PayloadAction<{ ticketId: string; newStatus: Ticket['status'] }>) => {
      const { ticketId, newStatus } = action.payload;
      const current = state.entities[ticketId];
      if (current) {
        state.optimisticBackups[ticketId] = { ...current };
        state.entities[ticketId] = {
          ...current,
          status: newStatus,
          updated_at: new Date().toISOString(),
        };
      }
    },

    optimisticStatusRollback: (state, action: PayloadAction<string>) => {
      const ticketId = action.payload;
      const backup = state.optimisticBackups[ticketId];
      if (backup) {
        state.entities[ticketId] = backup;
        delete state.optimisticBackups[ticketId];
      }
    },

    optimisticStatusCommit: (state, action: PayloadAction<Ticket>) => {
      const ticket = action.payload;
      state.entities[ticket.external_id] = ticket;
      delete state.optimisticBackups[ticket.external_id];
    },

    // Live Updates Reconciliation
    applyLiveUpdates: (state, action: PayloadAction<{ updates: Ticket[]; timestamp: string }>) => {
      const { updates, timestamp } = action.payload;
      state.lastSyncTimestamp = timestamp;

      for (const update of updates) {
        const existing = state.entities[update.external_id];

        if (existing) {
          // Ticket is already known: update entity in place so details/counts update immediately
          state.entities[update.external_id] = update;
        } else {
          // Brand new ticket: do NOT inject into list while agent is reading!
          // Buffer it into pendingTickets
          const alreadyPending = state.pendingTickets.some((t) => t.external_id === update.external_id);
          if (!alreadyPending) {
            state.pendingTickets.push(update);
          }
        }
      }
    },

    showPendingTickets: (state) => {
      // Prepend pending tickets into current list
      for (const ticket of state.pendingTickets) {
        state.entities[ticket.external_id] = ticket;
        if (!state.ids.includes(ticket.external_id)) {
          state.ids.unshift(ticket.external_id);
        }
      }
      state.pagination.total += state.pendingTickets.length;
      state.pendingTickets = [];
    },

    clearError: (state) => {
      state.error = null;
    },
  },
});

export const {
  setSelectedAgent,
  setFilters,
  resetFilters,
  setSearchQuery,
  setPage,
  toggleSelectTicket,
  selectAllTicketsOnPage,
  clearSelection,
  setTicketsLoading,
  setTicketsLoadingMore,
  setTicketsSuccess,
  setTicketsFailed,
  upsertTicket,
  optimisticClaimStart,
  optimisticClaimRollback,
  optimisticClaimCommit,
  optimisticStatusStart,
  optimisticStatusRollback,
  optimisticStatusCommit,
  applyLiveUpdates,
  showPendingTickets,
  clearError,
} = ticketSlice.actions;

export default ticketSlice.reducer;
