import React from 'react';

interface ProgressBarProps {
  phase: string | null;
  progressPct: number | null;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ phase, progressPct }) => {
  if (phase == null && progressPct == null) return null;

  const pct = progressPct ?? 0;
  const label = phase ? `${phase} ${pct}%` : `${pct}%`;

  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-on-surface-variant font-medium">{label}</span>
      <div className="h-2.5 rounded-full bg-surface-container-high overflow-hidden">
        <div
          className="h-1 rounded-full bg-primary-container transition-all duration-300"
          style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
        />
      </div>
    </div>
  );
};
