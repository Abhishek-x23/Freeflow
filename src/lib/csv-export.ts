import { Ticket } from '../types/ticket';

/**
 * Escapes and quotes a field according to RFC 4180 CSV specifications.
 */
function formatCsvCell(val: unknown): string {
  if (val === null || val === undefined) {
    return '""';
  }
  const str = String(val);
  // Double up any existing quotes and wrap in quotes
  return `"${str.replace(/"/g, '""')}"`;
}

/**
 * Converts a list of Ticket objects to an RFC 4180 CSV string.
 */
export function convertTicketsToCsv(tickets: Ticket[]): string {
  const headers = [
    'Ticket ID',
    'Customer ID',
    'Customer Plan',
    'Subject',
    'Status',
    'Priority',
    'Category',
    'Assigned Agent',
    'Created At',
    'Updated At',
    'AI Decision',
    'AI Suggested Priority',
    'Review Reason',
    'Summary',
    'Attachment URL',
  ];

  const rows = tickets.map((t) => [
    formatCsvCell(t.external_id),
    formatCsvCell(t.customer_id),
    formatCsvCell(t.customer_plan),
    formatCsvCell(t.subject || ''),
    formatCsvCell(t.status),
    formatCsvCell(t.priority),
    formatCsvCell(t.category),
    formatCsvCell(t.assigned_to || 'Unassigned'),
    formatCsvCell(t.created_at),
    formatCsvCell(t.updated_at),
    formatCsvCell(t.triage_decision),
    formatCsvCell(t.ai_priority || ''),
    formatCsvCell(t.review_reason || ''),
    formatCsvCell(t.summary || ''),
    formatCsvCell(t.attachment_url || ''),
  ]);

  const csvLines = [
    headers.map((h) => `"${h}"`).join(','),
    ...rows.map((row) => row.join(',')),
  ];

  return csvLines.join('\r\n');
}

/**
 * Initiates browser download of the CSV data.
 */
export function downloadCsvFile(csvContent: string, filename: string): void {
  // UTF-8 BOM to ensure proper character encoding in Microsoft Excel & Apple Numbers
  const blob = new Blob(['\uFEFF' + csvContent], {
    type: 'text/csv;charset=utf-8;',
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
