import {
  PaginatedTicketsResponse,
  TicketUpdatesResponse,
  ClaimTicketPayload,
  UpdateStatusPayload,
  TriageTicketPayload,
} from '../types/api';
import { Ticket, TicketFilters } from '../types/ticket';

export class ApiError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

interface FetchOptions extends RequestInit {
  bypassSimulation?: boolean;
}

async function request<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const { bypassSimulation, headers: customHeaders, ...restOptions } = options;
  const headers = new Headers(customHeaders);

  if (bypassSimulation) {
    headers.set('x-disable-simulation', 'true');
  }

  if (options.body && typeof options.body === 'string' && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(endpoint, {
    ...restOptions,
    headers,
  });

  if (!response.ok) {
    let errorMessage = `Request failed with status ${response.status}`;
    let errorCode: string | undefined;

    try {
      const errData = await response.json();
      if (errData && typeof errData === 'object') {
        errorMessage = (errData as { error?: string }).error || errorMessage;
        errorCode = (errData as { code?: string }).code;
      }
    } catch {
      // response was not JSON
    }

    throw new ApiError(errorMessage, response.status, errorCode);
  }

  return response.json() as Promise<T>;
}

export const apiClient = {
  getTickets: (filters: TicketFilters = {}, page: number = 1, limit: number = 25, bypass = false) => {
    const params = new URLSearchParams();
    params.set('page', page.toString());
    params.set('limit', limit.toString());

    if (filters.status && filters.status !== 'all') params.set('status', filters.status);
    if (filters.priority && filters.priority !== 'all') params.set('priority', filters.priority);
    if (filters.category && filters.category !== 'all') params.set('category', filters.category);
    if (filters.ai_decision && filters.ai_decision !== 'all') params.set('ai_decision', filters.ai_decision);
    if (filters.search && filters.search.trim()) params.set('q', filters.search.trim());

    return request<PaginatedTicketsResponse>(`/api/tickets?${params.toString()}`, {
      bypassSimulation: bypass,
    });
  },

  getTicketById: (id: string, bypass = false) => {
    return request<Ticket>(`/api/tickets/${encodeURIComponent(id)}`, {
      bypassSimulation: bypass,
    });
  },

  claimTicket: (id: string, payload: ClaimTicketPayload, bypass = false) => {
    return request<Ticket>(`/api/tickets/${encodeURIComponent(id)}/claim`, {
      method: 'POST',
      body: JSON.stringify(payload),
      bypassSimulation: bypass,
    });
  },

  updateStatus: (id: string, payload: UpdateStatusPayload, bypass = false) => {
    return request<Ticket>(`/api/tickets/${encodeURIComponent(id)}/status`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
      bypassSimulation: bypass,
    });
  },

  triageTicket: (id: string, payload: TriageTicketPayload, bypass = false) => {
    return request<Ticket>(`/api/tickets/${encodeURIComponent(id)}/triage`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
      bypassSimulation: bypass,
    });
  },

  retriageTicket: (id: string, bypass = false) => {
    return request<Ticket>(`/api/tickets/${encodeURIComponent(id)}/retriage`, {
      method: 'POST',
      bypassSimulation: bypass,
    });
  },

  getUpdates: (sinceTimestamp?: string | null, bypass = false) => {
    const params = new URLSearchParams();
    if (sinceTimestamp) {
      params.set('since', sinceTimestamp);
    }
    return request<TicketUpdatesResponse>(`/api/tickets/updates?${params.toString()}`, {
      bypassSimulation: bypass,
    });
  },
};
