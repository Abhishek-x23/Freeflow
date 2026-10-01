import { DeadlineInfo, DeadlineState, TicketPriority } from '../types/ticket';

export const SLA_DURATIONS_MS: Record<string, number> = {
  P0: 1 * 60 * 60 * 1000, // 1 hour
  P1: 4 * 60 * 60 * 1000, // 4 hours
  P2: 24 * 60 * 60 * 1000, // 24 hours
  P3: 72 * 60 * 60 * 1000, // 72 hours
};

/**
 * Robust date parser handling ISO 8601, ISO with timezone offset (+05:30),
 * and non-standard space-separated dates ("2026-09-20 11:30:00").
 */
export function parseDateSafe(dateString: string | null | undefined): Date | null {
  if (!dateString || typeof dateString !== 'string') {
    return null;
  }

  const trimmed = dateString.trim();
  if (!trimmed) {
    return null;
  }

  // Handle "YYYY-MM-DD HH:mm:ss" without 'T' and 'Z' (e.g., T-2007)
  let normalized = trimmed;
  if (/^\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2}$/.test(trimmed)) {
    normalized = trimmed.replace(' ', 'T') + 'Z';
  }

  const parsed = new Date(normalized);
  if (isNaN(parsed.getTime())) {
    // Attempt standard Date constructor on original trimmed string
    const fallback = new Date(trimmed);
    return isNaN(fallback.getTime()) ? null : fallback;
  }

  return parsed;
}

/**
 * Calculates deadline, remaining time, countdown format, and status (late, at_risk, on_track).
 */
export function calculateDeadlineInfo(
  createdAtStr: string | null | undefined,
  priority: TicketPriority | null | undefined,
  now: Date = new Date()
): DeadlineInfo {
  const createdAt = parseDateSafe(createdAtStr);
  const slaDurationMs = priority ? SLA_DURATIONS_MS[priority] : undefined;

  // Unknown priority or invalid createdAt
  if (!createdAt || !slaDurationMs) {
    return {
      deadline: null,
      state: 'unknown',
      remainingMs: 0,
      formattedCountdown: slaDurationMs ? 'Invalid Date' : 'No SLA',
      totalDurationMs: slaDurationMs || 0,
      percentRemaining: 0,
      isExpired: false,
    };
  }

  const createdAtMs = createdAt.getTime();
  const deadlineMs = createdAtMs + slaDurationMs;
  const deadlineDate = new Date(deadlineMs);
  const nowMs = now.getTime();

  // Edge case: Ticket created in the future (T-2008)
  if (createdAtMs > nowMs) {
    const diffUntilStart = createdAtMs - nowMs;
    return {
      deadline: deadlineDate,
      state: 'future',
      remainingMs: slaDurationMs,
      formattedCountdown: `Starts in ${formatDuration(diffUntilStart)}`,
      totalDurationMs: slaDurationMs,
      percentRemaining: 100,
      isExpired: false,
    };
  }

  const remainingMs = deadlineMs - nowMs;
  const percentRemaining = Math.max(0, Math.min(100, (remainingMs / slaDurationMs) * 100));

  if (remainingMs <= 0) {
    const overdueMs = Math.abs(remainingMs);
    return {
      deadline: deadlineDate,
      state: 'late',
      remainingMs: 0,
      formattedCountdown: `Late by ${formatDuration(overdueMs)}`,
      totalDurationMs: slaDurationMs,
      percentRemaining: 0,
      isExpired: true,
    };
  }

  // "at risk": less than 20% of original SLA time remains
  const state: DeadlineState = percentRemaining < 20 ? 'at_risk' : 'on_track';

  return {
    deadline: deadlineDate,
    state,
    remainingMs,
    formattedCountdown: formatDuration(remainingMs),
    totalDurationMs: slaDurationMs,
    percentRemaining,
    isExpired: false,
  };
}

/**
 * Formats milliseconds into human-readable HH:MM:SS or DDd HHh format
 */
export function formatDuration(ms: number): string {
  if (ms <= 0) return '00:00:00';

  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m`;
  }

  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

/**
 * Returns badge styling classes for deadline state
 */
export function getDeadlineBadgeStyle(state: DeadlineState): {
  bg: string;
  text: string;
  border: string;
  label: string;
  dotColor: string;
} {
  switch (state) {
    case 'late':
      return {
        bg: 'bg-rose-50',
        text: 'text-rose-700 font-semibold',
        border: 'border-rose-200',
        label: 'Late',
        dotColor: 'bg-rose-500',
      };
    case 'at_risk':
      return {
        bg: 'bg-amber-50',
        text: 'text-amber-800 font-semibold',
        border: 'border-amber-200',
        label: 'At Risk',
        dotColor: 'bg-amber-500',
      };
    case 'on_track':
      return {
        bg: 'bg-zinc-50',
        text: 'text-zinc-700',
        border: 'border-zinc-200',
        label: 'On Track',
        dotColor: 'bg-emerald-500',
      };
    case 'future':
      return {
        bg: 'bg-zinc-50',
        text: 'text-zinc-600',
        border: 'border-zinc-200',
        label: 'Future',
        dotColor: 'bg-blue-400',
      };
    default:
      return {
        bg: 'bg-zinc-50',
        text: 'text-zinc-500',
        border: 'border-zinc-200',
        label: 'No SLA',
        dotColor: 'bg-zinc-400',
      };
  }
}
