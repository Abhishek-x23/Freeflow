import { Ticket } from './ticket';

export interface PaginatedTicketsResponse {
  tickets: Ticket[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasMore: boolean;
}

export interface TicketUpdatesResponse {
  updates: Ticket[];
  timestamp: string;
}

export interface ApiErrorResponse {
  error: string;
  code?: string;
  field?: string;
  details?: Record<string, unknown>;
}

export interface ClaimTicketPayload {
  agent_id: string;
}

export interface UpdateStatusPayload {
  status: 'open' | 'in_progress' | 'resolved';
}

export interface TriageTicketPayload {
  category?: string;
  priority?: string;
  reason: string;
}

export interface BulkOperationResult {
  ticketId: string;
  success: boolean;
  ticket?: Ticket;
  error?: string;
}

export interface BulkOperationSummary {
  total: number;
  succeeded: number;
  failed: number;
  results: BulkOperationResult[];
}
