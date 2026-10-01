import { describe, it, expect } from 'vitest';
import { sanitizeHtml } from '../src/lib/sanitize';
import { isSafeUrl, sanitizeAttachmentUrl } from '../src/lib/safe-url';
import { calculateDeadlineInfo, parseDateSafe } from '../src/lib/deadline-utils';

describe('Safety, XSS Sanitization & Deadline Calculations', () => {
  describe('HTML Sanitization (T-2002 & T-2011 edge cases)', () => {
    it('strips <img onerror="..."> and <script> while keeping safe tags like <b> and <a>', () => {
      // T-2002 body: <img src=x onerror="alert('hacked')"> I was charged twice. <a href="https://example.com/invoice">Invoice</a>
      const rawBody =
        '<img src=x onerror="alert(\'hacked\')"> I was charged twice. <a href="https://example.com/invoice">Invoice</a>';
      const clean = sanitizeHtml(rawBody);

      expect(clean).not.toContain('onerror');
      expect(clean).not.toContain('alert');
      expect(clean).toContain('I was charged twice.');
      expect(clean).toContain('Invoice');
    });

    it('sanitizes AI summary containing malicious HTML (T-2011)', () => {
      // T-2011 summary: <img src=x onerror="alert('summary')"> Customer asks about API rate limits.
      const rawSummary =
        '<img src=x onerror="alert(\'summary\')"> Customer asks about API rate limits.';
      const clean = sanitizeHtml(rawSummary);

      expect(clean).not.toContain('onerror');
      expect(clean).not.toContain('alert');
      expect(clean).toContain('Customer asks about API rate limits.');
    });
  });

  describe('Attachment URL Safety (T-2003 edge case)', () => {
    it('rejects javascript: protocol URLs and prevents script execution', () => {
      // T-2003 attachment_url: javascript:alert(document.cookie)
      const raw = 'javascript:alert(document.cookie)';
      expect(isSafeUrl(raw)).toBe(false);
      expect(sanitizeAttachmentUrl(raw)).toBeNull();
    });

    it('rejects data: and file: URLs', () => {
      expect(isSafeUrl('data:text/html,<script>alert(1)</script>')).toBe(false);
      expect(isSafeUrl('file:///etc/passwd')).toBe(false);
    });

    it('allows valid HTTPS attachment URLs', () => {
      const valid = 'https://files.example.com/screenshots/export-bug.png';
      expect(isSafeUrl(valid)).toBe(true);
      expect(sanitizeAttachmentUrl(valid)).toBe(valid);
    });
  });

  describe('Date Parsing & Deadline Calculations', () => {
    it('parses space-separated timestamps without ISO "T" and "Z" (T-2007)', () => {
      const raw = '2026-09-20 11:30:00';
      const date = parseDateSafe(raw);
      expect(date).not.toBeNull();
      expect(isNaN(date!.getTime())).toBe(false);
    });

    it('handles timestamps with timezone offset (T-2009 "+05:30")', () => {
      const raw = '2026-09-21T08:45:00+05:30';
      const date = parseDateSafe(raw);
      expect(date).not.toBeNull();
      expect(isNaN(date!.getTime())).toBe(false);
    });

    it('handles future timestamps without negative countdown or NaN (T-2008)', () => {
      const futureDate = '2027-01-01T00:00:00Z';
      const now = new Date('2026-09-20T12:00:00Z');
      const info = calculateDeadlineInfo(futureDate, 'P3', now);

      expect(info.state).toBe('future');
      expect(info.formattedCountdown).toContain('Starts in');
      expect(info.isExpired).toBe(false);
    });

    it('handles invalid priority "P5" safely without crashing (T-2004)', () => {
      const now = new Date('2026-09-20T12:00:00Z');
      const info = calculateDeadlineInfo('2026-09-20T11:00:00Z', 'P5', now);

      expect(info.state).toBe('unknown');
      expect(info.formattedCountdown).toBe('No SLA');
    });

    it('correctly categorizes on_track, at_risk, and late based on 20% threshold', () => {
      const base = new Date('2026-09-20T10:00:00Z');
      // P0 = 1 hour (3600s). Deadline is 11:00:00Z. 20% remaining = 12 minutes (720s)

      // 1. At 10:10:00Z (50 min remaining > 12 min): on_track
      const infoOnTrack = calculateDeadlineInfo('2026-09-20T10:00:00Z', 'P0', new Date('2026-09-20T10:10:00Z'));
      expect(infoOnTrack.state).toBe('on_track');

      // 2. At 10:50:00Z (10 min remaining < 12 min): at_risk
      const infoAtRisk = calculateDeadlineInfo('2026-09-20T10:00:00Z', 'P0', new Date('2026-09-20T10:50:00Z'));
      expect(infoAtRisk.state).toBe('at_risk');

      // 3. At 11:05:00Z (overdue): late
      const infoLate = calculateDeadlineInfo('2026-09-20T10:00:00Z', 'P0', new Date('2026-09-20T11:05:00Z'));
      expect(infoLate.state).toBe('late');
      expect(infoLate.formattedCountdown).toContain('Late by');
    });
  });
});
