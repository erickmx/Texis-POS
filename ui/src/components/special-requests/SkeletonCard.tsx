import React from 'react';

export const SkeletonCard: React.FC = () => {
  return (
    <div className="bg-surface-container-lowest rounded-xl p-5 shadow-ambient animate-pulse">
      <div className="flex items-center gap-3 mb-3">
        <div className="h-4 w-12 bg-surface-container-high rounded" />
        <div className="h-5 w-5 bg-surface-container-high rounded-sm" />
      </div>
      <div className="h-4 w-3/4 bg-surface-container-high rounded mb-2" />
      <div className="h-3 w-full bg-surface-container-high rounded mb-1" />
      <div className="h-3 w-2/3 bg-surface-container-high rounded" />
    </div>
  );
};
