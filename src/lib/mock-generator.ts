import { Ticket } from '../types/ticket';
import { VALID_AGENT_IDS } from '../types/agent';

/**
 * Deterministic pseudo-random number generator (Mulberry32)
 * Ensures reproducible ticket generation across server restarts and test runs.
 */
class SeededRandom {
  private seed: number;

  constructor(seed: number = 42) {
    this.seed = seed;
  }

  next(): number {
    let t = (this.seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  choice<T>(items: readonly T[]): T {
    const idx = Math.floor(this.next() * items.length);
    return items[idx];
  }

  intRange(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }
}

const CATEGORIES = ['account_access', 'billing', 'bug', 'feature_request', 'other'] as const;
const PLANS = ['enterprise', 'pro', 'free'] as const;
const PRIORITIES = ['P0', 'P1', 'P2', 'P3'] as const;
const STATUSES = ['open', 'in_progress', 'resolved'] as const;

const SUBJECT_TEMPLATES: Record<string, string[]> = {
  account_access: [
    'Cannot reset password via email link',
    'SSO authorization failure with Okta integration',
    'Two-factor authentication code not sending to SMS',
    'User account locked out after multiple failed attempts',
    'Session expired repeatedly during checkout process',
    'OAuth token revoked unexpectedly in production',
    'SAML assertion validation expired error',
    'New team member cannot join workspace invite',
  ],
  billing: [
    'Duplicate subscription charge on Visa ending 4921',
    'Invoice for September missing VAT registration number',
    'Credit card payment rejected by payment gateway',
    'Request for refund on unused annual licenses',
    'Upgrade from Pro to Enterprise tier not activated',
    'Tax exemption certificate upload verification failed',
    'Currency conversion mismatch on international wire',
    'Payment receipt needed for corporate expense report',
  ],
  bug: [
    'Export to CSV generates corrupted 0-byte file',
    'Dashboard widget charts not refreshing automatically',
    'Webhook delivery failing with HTTP 504 gateway timeout',
    'Table pagination resets back to first page unexpectedly',
    'Memory leak causing browser tab freeze on bulk view',
    'File upload progress indicator hangs at 99 percent',
    'Search query with special characters returns blank error',
    'Notification badge count does not decrement after viewing',
  ],
  feature_request: [
    'Request for Dark Mode support across dashboard',
    'Ability to filter activity logs by IP address range',
    'Export audit logs directly to AWS S3 bucket',
    'Custom webhook payload templates support',
    'Bulk ticket assignment shortcut in table view',
    'Integration with Slack notifications for high priority alerts',
    'Custom branding and domain mapping for customer portal',
    'Multi-language localization support for German and Japanese',
  ],
  other: [
    'Inquiry regarding SOC2 Type II compliance report',
    'Security disclosure regarding cross-origin resource policy',
    'Documentation page for REST API v2 has broken link',
    'Request for product roadmap overview for Q4',
    'Office IP address allowlist verification request',
    'Partner integration inquiry for healthcare marketplace',
  ],
};

const BODY_TEMPLATES: Record<string, string[]> = {
  account_access: [
    'Our users have reported that password reset emails are taking over 2 hours to arrive or failing completely.',
    'When attempting to log in via our corporate identity provider, users encounter error code AUTH_403_STATE_MISMATCH.',
    'The 2FA prompt accepts the 6-digit code but immediately loops back to the login screen.',
    'Several administrators were locked out after the scheduled password rotation window expired.',
  ],
  billing: [
    'We noticed our corporate card was billed twice on the 1st of the month for the same subscription tier.',
    'Our accounting department requires a revised invoice showing our EU VAT identification number.',
    'The automated renewal transaction was declined even though our banking limit was increased.',
    'We downgraded our plan 2 weeks ago but were billed for the full enterprise tier this morning.',
  ],
  bug: [
    'When generating the monthly analytics report, the download finishes with a 0-byte corrupted CSV.',
    'The live metrics graph freezes after running for approximately 15 minutes and requires a full page refresh.',
    'Our incoming webhook endpoint received multiple 504 gateway timeouts during peak query traffic.',
    'Clicking the column header to sort tickets resets our active page position back to page 1.',
  ],
  feature_request: [
    'Our team works late night support shifts and a dark mode theme would significantly improve usability.',
    'It would save our compliance team hours if audit logs could be pushed directly to an S3 bucket daily.',
    'Having Slack channel alerts for P0 and P1 tickets would allow our on-call engineers to react faster.',
    'We would love the ability to customize email templates sent out to customers with our corporate logo.',
  ],
  other: [
    'Our security team is conducting annual vendor audits and needs your latest SOC2 compliance summary.',
    'We found a typo and outdated endpoint schema in your documentation for the pagination API.',
    'Can you connect us with your technical partnerships team regarding an ecosystem integration?',
  ],
};

/**
 * Generates ~5,000 deterministic tickets for the in-memory database.
 */
export function generateMockTickets(count: number = 5000): Ticket[] {
  const rng = new SeededRandom(1337);
  const tickets: Ticket[] = [];

  // Base timestamp: 2026-09-20T00:00:00Z
  const baseTimeMs = new Date('2026-09-20T00:00:00Z').getTime();

  for (let i = 1; i <= count; i++) {
    // ID format: T-0001 to T-5000 (disjoint from T-2001..T-2012)
    // Avoid collisions with T-2001 through T-2012 by prefixing generated IDs as T-G0001 or mapping
    const idNum = i;
    // If it conflicts with 2001-2012, offset it
    const external_id =
      idNum >= 2001 && idNum <= 2012
        ? `T-${(idNum + 10000).toString()}`
        : `T-${idNum.toString().padStart(4, '0')}`;

    const plan = rng.choice(PLANS);
    const category = rng.choice(CATEGORIES);
    const subjects = SUBJECT_TEMPLATES[category];
    const bodies = BODY_TEMPLATES[category];

    const subject = rng.choice(subjects);
    const body = rng.choice(bodies);

    // Priorities: Enterprise tickets must always stay at least P1
    let priority: 'P0' | 'P1' | 'P2' | 'P3';
    let aiPriority: 'P0' | 'P1' | 'P2' | 'P3' | undefined = undefined;

    if (plan === 'enterprise') {
      const pChoice = rng.choice(['P0', 'P1', 'P2'] as const);
      if (pChoice === 'P2') {
        // Enforce enterprise rule: adjusted from P2 to P1
        aiPriority = 'P2';
        priority = 'P1';
      } else {
        priority = pChoice;
      }
    } else {
      priority = rng.choice(PRIORITIES);
    }

    const status = rng.choice(STATUSES);
    let assigned_to: string | null = null;
    if (status !== 'open') {
      assigned_to = rng.choice(VALID_AGENT_IDS);
    } else if (rng.next() < 0.25) {
      assigned_to = rng.choice(VALID_AGENT_IDS);
    }

    const triage_decision: 'auto_accept' | 'manual_review' =
      rng.next() < 0.75 ? 'auto_accept' : 'manual_review';

    const review_reason =
      triage_decision === 'manual_review'
        ? rng.choice(['ambiguous_intent', 'flagged_input', 'high_severity_check'])
        : aiPriority
          ? 'rule_adjusted'
          : null;

    // Creation date distributed over the preceding 7 days
    const createdOffsetMs = rng.intRange(0, 7 * 24 * 60 * 60 * 1000);
    const createdAtDate = new Date(baseTimeMs + createdOffsetMs);
    const created_at = createdAtDate.toISOString();

    const customerNum = rng.intRange(100, 999);
    const customer_id = `C-${customerNum}`;

    const summary = `${category.replace('_', ' ')}: ${subject.slice(0, 60)}`;

    tickets.push({
      external_id,
      customer_id,
      customer_plan: plan,
      subject,
      body,
      attachment_url: rng.next() < 0.15 ? `https://files.example.com/attachments/${external_id}.png` : null,
      created_at,
      status,
      assigned_to,
      category,
      priority,
      ai_priority: aiPriority,
      summary,
      triage_decision,
      review_reason,
      updated_at: created_at,
      version: 1,
    });
  }

  return tickets;
}
