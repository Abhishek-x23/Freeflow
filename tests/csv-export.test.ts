import { describe, it, expect } from 'vitest';
import { convertTicketsToCsv } from '../src/lib/csv-export';
import { Ticket } from '../src/types/ticket';

describe('CSV Export Utility (RFC 4180)', () => {
  const sampleTickets: Ticket[] = [
    {
      external_id: 'T-1001',
      customer_id: 'C-01',
      customer_plan: 'enterprise',
      subject: 'Issue with "SSO" and SAML, urgent',
      body: 'Line 1\nLine 2 with "quotes" and, commas',
      attachment_url: 'https://example.com/log.txt',
      created_at: '2026-09-20T09:00:00Z',
      status: 'open',
      assigned_to: 'agent-1',
      category: 'account_access',
      priority: 'P0',
      summary: 'Urgent login fault',
      triage_decision: 'auto_accept',
      review_reason: null,
      updated_at: '2026-09-20T09:05:00Z',
      version: 1,
    },
    {
      external_id: 'T-1002',
      customer_id: 'C-02',
      customer_plan: 'free',
      subject: 'Simple subject',
      body: 'Simple body',
      attachment_url: null,
      created_at: '2026-09-20T10:00:00Z',
      status: 'resolved',
      assigned_to: null,
      category: 'billing',
      priority: 'P3',
      summary: null,
      triage_decision: 'manual_review',
      review_reason: 'Requires agent check',
      updated_at: '2026-09-20T10:10:00Z',
      version: 1,
    },
  ];

  it('generates correct RFC 4180 headers', () => {
    const csv = convertTicketsToCsv(sampleTickets);
    const firstLine = csv.split('\r\n')[0];

    expect(firstLine).toContain('"Ticket ID"');
    expect(firstLine).toContain('"Customer ID"');
    expect(firstLine).toContain('"Priority"');
    expect(firstLine).toContain('"Status"');
    expect(firstLine).toContain('"Category"');
    expect(firstLine).toContain('"Subject"');
  });

  it('escapes quotes and handles commas safely', () => {
    const csv = convertTicketsToCsv(sampleTickets);

    // Subject has `Issue with "SSO" and SAML, urgent` -> should become `"Issue with ""SSO"" and SAML, urgent"`
    expect(csv).toContain('Issue with ""SSO"" and SAML, urgent');
  });

  it('handles null values and unassigned agents safely without undefined or NaN', () => {
    const csv = convertTicketsToCsv(sampleTickets);

    expect(csv).not.toContain('undefined');
    expect(csv).not.toContain('NaN');
    expect(csv).toContain('"Unassigned"'); // For T-1002 which has assigned_to: null
  });
});
