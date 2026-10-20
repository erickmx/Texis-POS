import React from 'react';
import { Paperclip } from 'lucide-react';

interface AttachmentChipProps {
  count: number;
}

export const AttachmentChip: React.FC<AttachmentChipProps> = ({ count }) => {
  if (count <= 0) return null;

  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-xs text-on-surface-variant bg-surface-container">
      <Paperclip size={12} />
      {count}
    </span>
  );
};
