import { Ticket, TicketFilters } from '../types/ticket';
import { isValidAgentId, VALID_AGENT_IDS } from '../types/agent';
import { loadNormalizedTestTickets } from './test-tickets';
import { generateMockTickets } from './mock-generator';
import { PaginatedTicketsResponse } from '../types/api';

/**
 * In-Memory Database and Business Service
 * Holds all test and generated tickets in a stable memory store.
 */
class MockDatabase {
  private ticketsMap: Map<string, Ticket> = new Map();
  private ticketOrder: string[] = [];
  private isInitialized = false;
  private lastBackgroundSimulation = Date.now();
  private nextGeneratedIdCounter = 6000;

  constructor() {
    this.initialize();
  }

  public initialize(forceReset = false): void {
    if (this.isInitialized && !forceReset) return;

    this.ticketsMap.clear();
    this.ticketOrder = [];

    // 1. Load the 12 normalized assessment test tickets (with deduplication)
    const testTickets = loadNormalizedTestTickets();
    for (const ticket of testTickets) {
      this.ticketsMap.set(ticket.external_id, { ...ticket });
      this.ticketOrder.push(ticket.external_id);
    }

    // 2. Generate ~5,000 deterministic mock tickets
    const generated = generateMockTickets(5000);
    for (const ticket of generated) {
      if (!this.ticketsMap.has(ticket.external_id)) {
        this.ticketsMap.set(ticket.external_id, { ...ticket });
        this.ticketOrder.push(ticket.external_id);
      }
    }

    this.isInitialized = true;
    console.log(`[MockDatabase] Initialized with ${this.ticketsMap.size} tickets in memory.`);
  }

  public reset(): void {
    this.initialize(true);
  }

  public getAllTickets(): Ticket[] {
    return this.ticketOrder.map((id) => this.ticketsMap.get(id)!).filter(Boolean);
  }

  public getTicketById(id: string): Ticket | null {
    const ticket = this.ticketsMap.get(id);
    return ticket ? { ...ticket } : null;
  }

  public getTickets(
    filters: TicketFilters = {},
    page: number = 1,
    limit: number = 25
  ): PaginatedTicketsResponse {
    let results = this.getAllTickets();

    // 1. Status filter
    if (filters.status && filters.status !== 'all') {
      results = results.filter((t) => t.status === filters.status);
    }

    // 2. Priority filter
    if (filters.priority && filters.priority !== 'all') {
      results = results.filter((t) => t.priority === filters.priority);
    }

    // 3. Category filter
    if (filters.category && filters.category !== 'all') {
      results = results.filter((t) => t.category === filters.category);
    }

    // 4. AI Decision filter
    if (filters.ai_decision && filters.ai_decision !== 'all') {
      results = results.filter((t) => t.triage_decision === filters.ai_decision);
    }

    // 5. Text search on subject and body
    if (filters.search && filters.search.trim()) {
      const q = filters.search.trim().toLowerCase();
      results = results.filter((t) => {
        const subjectMatch = t.subject && t.subject.toLowerCase().includes(q);
        const bodyMatch = t.body && t.body.toLowerCase().includes(q);
        const idMatch = t.external_id && t.external_id.toLowerCase().includes(q);
        return Boolean(subjectMatch || bodyMatch || idMatch);
      });
    }

    const total = results.length;
    const safePage = Math.max(1, page);
    const safeLimit = Math.max(1, Math.min(100, limit));
    const totalPages = Math.ceil(total / safeLimit) || 1;
    const startIndex = (safePage - 1) * safeLimit;
    const paginatedTickets = results.slice(startIndex, startIndex + safeLimit);

    return {
      tickets: paginatedTickets.map((t) => ({ ...t })),
      total,
      page: safePage,
      limit: safeLimit,
      totalPages,
      hasMore: safePage < totalPages,
    };
  }

  public claimTicket(
    id: string,
    agentId: string,
    simulateConflict: boolean = false
  ): { success: boolean; ticket?: Ticket; error?: string; status: number } {
    const ticket = this.ticketsMap.get(id);
    if (!ticket) {
      return { success: false, error: `Ticket '${id}' not found`, status: 404 };
    }

    if (!isValidAgentId(agentId)) {
      return {
        success: false,
        error: `Invalid agent ID '${agentId}'. Valid agents: ${VALID_AGENT_IDS.join(', ')}`,
        status: 400,
      };
    }

    // If already claimed by another agent
    if (ticket.assigned_to && ticket.assigned_to !== agentId) {
      return {
        success: false,
        error: `Ticket is already claimed by ${ticket.assigned_to}`,
        status: 409,
      };
    }

    // Simulated race condition conflict
    if (simulateConflict) {
      return {
        success: false,
        error: 'Another agent just claimed this ticket in a concurrent request',
        status: 409,
      };
    }

    // Update assignment
    ticket.assigned_to = agentId;
    if (ticket.status === 'open') {
      ticket.status = 'in_progress';
    }
    ticket.updated_at = new Date().toISOString();
    ticket.version = (ticket.version || 1) + 1;

    return { success: true, ticket: { ...ticket }, status: 200 };
  }

  public updateStatus(
    id: string,
    newStatus: string
  ): { success: boolean; ticket?: Ticket; error?: string; status: number } {
    const ticket = this.ticketsMap.get(id);
    if (!ticket) {
      return { success: false, error: `Ticket '${id}' not found`, status: 404 };
    }

    // Terminal closed status handling (T-2010)
    if (ticket.status === 'closed') {
      return {
        success: false,
        error: 'Ticket is closed and cannot undergo status transitions',
        status: 400,
      };
    }

    // Allowed status transitions per specification:
    // open -> in_progress
    // in_progress -> resolved
    // resolved -> open
    const allowedTransitions: Record<string, string[]> = {
      open: ['in_progress'],
      in_progress: ['resolved'],
      resolved: ['open'],
    };

    const allowed = allowedTransitions[ticket.status] || [];
    if (!allowed.includes(newStatus)) {
      return {
        success: false,
        error: `Invalid status transition from '${ticket.status}' to '${newStatus}'. Allowed transitions: ${allowed.join(', ') || 'none'}`,
        status: 400,
      };
    }

    ticket.status = newStatus as Ticket['status'];
    ticket.updated_at = new Date().toISOString();
    ticket.version = (ticket.version || 1) + 1;

    return { success: true, ticket: { ...ticket }, status: 200 };
  }

  public triageTicket(
    id: string,
    category?: string,
    priority?: string,
    reason?: string
  ): { success: boolean; ticket?: Ticket; error?: string; status: number } {
    const ticket = this.ticketsMap.get(id);
    if (!ticket) {
      return { success: false, error: `Ticket '${id}' not found`, status: 404 };
    }

    // Reason validation: must have at least 10 characters
    if (!reason || reason.trim().length < 10) {
      return {
        success: false,
        error: 'A written reason containing at least 10 characters is strictly required',
        status: 400,
      };
    }

    // Enterprise rule: Enterprise tickets must always stay at least P1
    const targetPriority = priority || ticket.priority;
    if (ticket.customer_plan === 'enterprise') {
      if (targetPriority === 'P2' || targetPriority === 'P3' || targetPriority === 'P5') {
        return {
          success: false,
          error: `Enterprise policy violation: Enterprise tickets must maintain priority P0 or P1 (cannot be downgraded to ${targetPriority})`,
          status: 400,
        };
      }
    }

    // Preserve original AI priority if changing priority
    if (priority && priority !== ticket.priority) {
      if (!ticket.ai_priority) {
        ticket.ai_priority = ticket.priority;
      }
      ticket.priority = priority;
    }

    if (category) {
      ticket.category = category;
    }

    ticket.triage_decision = 'auto_accept';
    ticket.review_reason = reason.trim();
    ticket.updated_at = new Date().toISOString();
    ticket.version = (ticket.version || 1) + 1;

    return { success: true, ticket: { ...ticket }, status: 200 };
  }

  /**
   * Deterministic local mock AI re-triage service.
   * Does NOT make external calls or leak any keys.
   */
  public retriageTicket(
    id: string
  ): { success: boolean; ticket?: Ticket; error?: string; status: number } {
    const ticket = this.ticketsMap.get(id);
    if (!ticket) {
      return { success: false, error: `Ticket '${id}' not found`, status: 404 };
    }

    const textToAnalyze = `${ticket.subject} ${ticket.body || ''}`.toLowerCase();

    // Deterministic keyword-based AI inference
    let newCategory = ticket.category;
    let newPriority: Ticket['priority'] = 'P2';
    let newSummary = ticket.summary || `Automated triage summary for ${ticket.external_id}`;
    let newDecision: 'auto_accept' | 'manual_review' = 'auto_accept';
    let newReason: string | null = null;

    if (textToAnalyze.includes('sso') || textToAnalyze.includes('login') || textToAnalyze.includes('password')) {
      newCategory = 'account_access';
      newPriority = 'P1';
      newSummary = 'User experiencing authentication/access difficulty.';
    } else if (textToAnalyze.includes('refund') || textToAnalyze.includes('invoice') || textToAnalyze.includes('charge')) {
      newCategory = 'billing';
      newPriority = 'P2';
      newSummary = 'Billing inquiry regarding invoices or charges.';
    } else if (textToAnalyze.includes('error') || textToAnalyze.includes('crash') || textToAnalyze.includes('denied') || textToAnalyze.includes('bug')) {
      newCategory = 'bug';
      newPriority = 'P1';
      newSummary = 'Technical error or unexpected system failure reported.';
    } else if (textToAnalyze.includes('dark mode') || textToAnalyze.includes('feature')) {
      newCategory = 'feature_request';
      newPriority = 'P3';
      newSummary = 'Customer request for new feature or enhancement.';
    }

    // Enforce enterprise rule
    if (ticket.customer_plan === 'enterprise' && (newPriority === 'P2' || newPriority === 'P3')) {
      newPriority = 'P1';
      newReason = 'rule_adjusted';
    }

    // Flag ambiguous or suspicious inputs for manual review
    if (textToAnalyze.includes('ignore all previous instructions') || textToAnalyze.length < 5) {
      newDecision = 'manual_review';
      newReason = 'flagged_input';
    }

    ticket.category = newCategory;
    if (ticket.priority !== newPriority) {
      ticket.ai_priority = newPriority;
      ticket.priority = newPriority;
    }
    ticket.summary = newSummary;
    ticket.triage_decision = newDecision;
    ticket.review_reason = newReason;
    ticket.updated_at = new Date().toISOString();
    ticket.version = (ticket.version || 1) + 1;

    return { success: true, ticket: { ...ticket }, status: 200 };
  }

  public getUpdates(sinceTimestamp?: string | null): { updates: Ticket[]; timestamp: string } {
    const nowIso = new Date().toISOString();
    if (!sinceTimestamp) {
      return { updates: [], timestamp: nowIso };
    }

    const sinceDate = new Date(sinceTimestamp);
    const sinceMs = isNaN(sinceDate.getTime()) ? 0 : sinceDate.getTime();

    const changed = this.getAllTickets().filter((t) => {
      const updatedMs = new Date(t.updated_at).getTime();
      return updatedMs > sinceMs;
    });

    return {
      updates: changed.map((t) => ({ ...t })),
      timestamp: nowIso,
    };
  }

  /**
   * Background activity simulator: simulates real concurrent traffic
   * (new tickets arriving, or agents claiming/closing tickets)
   */
  public triggerSimulatedBackgroundActivity(): Ticket | null {
    const rand = Math.random();

    // 1. Simulate new ticket arriving (40% chance)
    if (rand < 0.4) {
      const newId = `T-${this.nextGeneratedIdCounter++}`;
      const plans = ['pro', 'free', 'enterprise'] as const;
      const categories = ['account_access', 'billing', 'bug', 'feature_request'] as const;
      const plan = plans[Math.floor(Math.random() * plans.length)];
      const category = categories[Math.floor(Math.random() * categories.length)];
      const priority = plan === 'enterprise' ? 'P1' : 'P2';

      const newTicket: Ticket = {
        external_id: newId,
        customer_id: `C-${Math.floor(Math.random() * 900) + 100}`,
        customer_plan: plan,
        subject: `Incoming: Issue reported with ${category.replace('_', ' ')}`,
        body: 'Customer submitted a new inquiry via the support portal.',
        attachment_url: null,
        created_at: new Date().toISOString(),
        status: 'open',
        assigned_to: null,
        category,
        priority,
        summary: `New inquiry regarding ${category}.`,
        triage_decision: Math.random() < 0.3 ? 'manual_review' : 'auto_accept',
        review_reason: null,
        updated_at: new Date().toISOString(),
        version: 1,
      };

      this.ticketsMap.set(newId, newTicket);
      // Prepend to ticketOrder so it's fresh
      this.ticketOrder.unshift(newId);
      return newTicket;
    }

    // 2. Simulate another agent claiming an open ticket (40% chance)
    if (rand < 0.8) {
      const openTickets = this.getAllTickets().filter((t) => t.status === 'open' && !t.assigned_to);
      if (openTickets.length > 0) {
        const target = openTickets[Math.floor(Math.random() * Math.min(20, openTickets.length))];
        const otherAgents = ['agent-2', 'agent-3'];
        const agent = otherAgents[Math.floor(Math.random() * otherAgents.length)];
        this.claimTicket(target.external_id, agent, false);
        return this.ticketsMap.get(target.external_id) || null;
      }
    }

    return null;
  }
}

// Global singleton instance for in-memory database
export const mockDatabase = new MockDatabase();
