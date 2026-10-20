import React from 'react';
import { UrgencyTier } from '@/lib/special-requests/urgency';

const tierStyles: Record<UrgencyTier, string> = {
  overdue: 'bg-secondary-fixed text-secondary-container font-bold',
  urgent: 'bg-red-100 text-red-700',
  warning: 'bg-amber-100 text-amber-700',
  normal: 'bg-surface-container-high text-on-surface-variant',
};

interface UrgencyChipProps {
  tier: UrgencyTier;
  label: string;
}

export const UrgencyChip: React.FC<UrgencyChipProps> = ({ tier, label }) => {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-sm text-xs tracking-tight ${tierStyles[tier]}`}
    >
      {label}
    </span>
  );
};
