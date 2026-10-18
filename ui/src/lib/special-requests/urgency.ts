export type UrgencyTier = 'overdue' | 'urgent' | 'warning' | 'normal';

export interface UrgencyResult {
  tier: UrgencyTier;
  label: string;
}

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

/**
 * Derives urgency from a deadline string.
 * - null → normal
 * - past → overdue
 * - <24h remaining → urgent
 * - <3d remaining → warning
 * - else → normal
 */
export function getUrgency(deadline: string | null): UrgencyResult {
  if (!deadline) {
    return { tier: 'normal', label: 'Normal' };
  }

  const now = Date.now();
  const deadlineMs = new Date(deadline).getTime();
  const remaining = deadlineMs - now;

  if (remaining < 0) {
    return { tier: 'overdue', label: 'OVERDUE' };
  }
  if (remaining < DAY_MS) {
    return { tier: 'urgent', label: 'Urgent' };
  }
  if (remaining < 3 * DAY_MS) {
    return { tier: 'warning', label: 'Warning' };
  }
  return { tier: 'normal', label: 'Normal' };
}
