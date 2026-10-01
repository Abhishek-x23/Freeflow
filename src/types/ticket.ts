export type CustomerPlan = 'enterprise' | 'pro' | 'free' | 'platinum' | string;

export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

export type TicketPriority = 'P0' | 'P1' | 'P2' | 'P3' | 'P5' | string;

export type TicketCategory =
  | 'account_access'
  | 'billing'
  | 'urgent_billing'
  | 'bug'
  | 'feature_request'
  | 'other'
  | string;

export type TriageDecision = 'auto_accept' | 'manual_review' | 'maybe' | string;

export interface Ticket {
  external_id: string;
  customer_id: string;
  customer_plan: CustomerPlan;
  subject: string;
  body: string | null;
  attachment_url: string | null;
  created_at: string;
  status: TicketStatus;
  assigned_to: string | null;
  category: TicketCategory;
  priority: TicketPriority;
  ai_priority?: TicketPriority;
  summary: string | null;
  triage_decision: TriageDecision;
  review_reason: string | null;
  updated_at: string;
  version?: number;
}

export interface TicketFilters {
  status?: string;
  priority?: string;
  category?: string;
  ai_decision?: string;
  search?: string;
}

export type DeadlineState = 'late' | 'at_risk' | 'on_track' | 'future' | 'unknown';

export interface DeadlineInfo {
  deadline: Date | null;
  state: DeadlineState;
  remainingMs: number;
  formattedCountdown: string;
  totalDurationMs: number;
  percentRemaining: number;
  isExpired: boolean;
}
