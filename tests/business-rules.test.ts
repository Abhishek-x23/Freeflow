import { describe, it, expect, beforeEach } from 'vitest';
import { mockDatabase } from '../src/lib/mock-database';
import { setSimulationGloballyEnabled } from '../src/lib/chaos-config';

// Disable chaos and delays for 100% deterministic test execution
setSimulationGloballyEnabled(false);

describe('Business Rules & API Validation', () => {
  beforeEach(() => {
    mockDatabase.reset();
  });

  describe('Status Transitions', () => {
    it('allows valid sequence: open -> in_progress -> resolved -> open', () => {
      // T-2001 starts as 'open'
      const ticket = mockDatabase.getTicketById('T-2001')!;
      expect(ticket.status).toBe('open');

      // 1. open -> in_progress
      const step1 = mockDatabase.updateStatus('T-2001', 'in_progress');
      expect(step1.success).toBe(true);
      expect(step1.ticket?.status).toBe('in_progress');

      // 2. in_progress -> resolved
      const step2 = mockDatabase.updateStatus('T-2001', 'resolved');
      expect(step2.success).toBe(true);
      expect(step2.ticket?.status).toBe('resolved');

      // 3. resolved -> open
      const step3 = mockDatabase.updateStatus('T-2001', 'open');
      expect(step3.success).toBe(true);
      expect(step3.ticket?.status).toBe('open');
    });

    it('rejects invalid direct transition: open -> resolved', () => {
      const step = mockDatabase.updateStatus('T-2001', 'resolved');
      expect(step.success).toBe(false);
      expect(step.status).toBe(400);
      expect(step.error).toContain('Invalid status transition');
    });

    it('rejects any status transition on a closed ticket (T-2010)', () => {
      // T-2010 has status: 'closed'
      const ticket = mockDatabase.getTicketById('T-2010')!;
      expect(ticket.status).toBe('closed');

      const attempt = mockDatabase.updateStatus('T-2010', 'open');
      expect(attempt.success).toBe(false);
      expect(attempt.status).toBe(400);
      expect(attempt.error).toContain('closed and cannot undergo status transitions');
    });
  });

  describe('Ticket Claiming & Conflicts', () => {
    it('allows valid agent to claim an unassigned ticket', () => {
      const result = mockDatabase.claimTicket('T-2001', 'agent-1', false);
      expect(result.success).toBe(true);
      expect(result.ticket?.assigned_to).toBe('agent-1');
      expect(result.ticket?.status).toBe('in_progress');
    });

    it('rejects claim if already assigned to a different agent (HTTP 409 Conflict)', () => {
      // First agent claims
      mockDatabase.claimTicket('T-2001', 'agent-1', false);

      // Second agent tries to claim
      const secondClaim = mockDatabase.claimTicket('T-2001', 'agent-2', false);
      expect(secondClaim.success).toBe(false);
      expect(secondClaim.status).toBe(409);
      expect(secondClaim.error).toContain('already claimed');
    });

    it('rejects invalid agent ID such as agent-99 (HTTP 400)', () => {
      const result = mockDatabase.claimTicket('T-2001', 'agent-99', false);
      expect(result.success).toBe(false);
      expect(result.status).toBe(400);
      expect(result.error).toContain('Invalid agent ID');
    });
  });

  describe('Enterprise Priority Restriction Rule', () => {
    it('prevents downgrading enterprise tickets below P1 (rejects P2 and P3)', () => {
      // T-2001 is an Enterprise ticket
      const ticket = mockDatabase.getTicketById('T-2001')!;
      expect(ticket.customer_plan).toBe('enterprise');

      // Attempt to downgrade to P2
      const resP2 = mockDatabase.triageTicket('T-2001', 'billing', 'P2', 'Customer issue is now lower urgency');
      expect(resP2.success).toBe(false);
      expect(resP2.status).toBe(400);
      expect(resP2.error).toContain('Enterprise policy violation');

      // Attempt to downgrade to P3
      const resP3 = mockDatabase.triageTicket('T-2001', 'billing', 'P3', 'Customer issue is now lower urgency');
      expect(resP3.success).toBe(false);
      expect(resP3.status).toBe(400);
      expect(resP3.error).toContain('Enterprise policy violation');
    });

    it('allows enterprise tickets to maintain P0 or P1', () => {
      const resP1 = mockDatabase.triageTicket(
        'T-2001',
        'account_access',
        'P1',
        'Adjusting priority to P1 as SSO bypass is temporarily available'
      );
      expect(resP1.success).toBe(true);
      expect(resP1.ticket?.priority).toBe('P1');
    });
  });

  describe('Triage Written Reason Validation', () => {
    it('rejects triage changes when reason is shorter than 10 characters', () => {
      const shortReason = mockDatabase.triageTicket('T-2002', 'billing', 'P1', 'Fixed');
      expect(shortReason.success).toBe(false);
      expect(shortReason.status).toBe(400);
      expect(shortReason.error).toContain('at least 10 characters');

      const emptyReason = mockDatabase.triageTicket('T-2002', 'billing', 'P1', '');
      expect(emptyReason.success).toBe(false);
      expect(emptyReason.status).toBe(400);
    });

    it('accepts triage changes with a valid written reason (>= 10 chars)', () => {
      const valid = mockDatabase.triageTicket(
        'T-2002',
        'billing',
        'P1',
        'Invoice refund is high priority due to double deduction'
      );
      expect(valid.success).toBe(true);
      expect(valid.ticket?.triage_decision).toBe('auto_accept');
      expect(valid.ticket?.review_reason).toBe(
        'Invoice refund is high priority due to double deduction'
      );
    });
  });

  describe('T-2001 Deduplication', () => {
    it('deduplicates T-2001 so only a single primary record exists in database', () => {
      const allTickets = mockDatabase.getAllTickets();
      const occurrences = allTickets.filter((t) => t.external_id === 'T-2001');
      expect(occurrences.length).toBe(1);
    });
  });

  describe('T-2012 Invalid AI Decision Handling', () => {
    it('safely routes invalid triage_decision "maybe" to manual_review', () => {
      const ticket = mockDatabase.getTicketById('T-2012')!;
      expect(ticket).toBeDefined();
      expect(ticket.triage_decision).toBe('manual_review');
    });
  });
});
