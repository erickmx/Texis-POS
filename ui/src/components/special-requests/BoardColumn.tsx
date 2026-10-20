import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { SpecialOrder } from '@/lib/api/types';
import { RequestCard } from './RequestCard';
import { SkeletonCard } from './SkeletonCard';

const statusDotColors: Record<string, string> = {
  pending: 'bg-amber-400',
  in_progress: 'bg-primary-container',
  done: 'bg-green-500',
};

interface BoardColumnProps {
  status: string;
  label: string;
  orders: SpecialOrder[];
  isLoading: boolean;
  emptyLabel: string;
}

export const BoardColumn: React.FC<BoardColumnProps> = ({
  status,
  label,
  orders,
  isLoading,
  emptyLabel,
}) => {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const dotColor = statusDotColors[status] ?? 'bg-surface-container-high';
  const orderIds = orders.map((o) => o.orderId);

  return (
    <div className="flex flex-col flex-1 min-w-[280px]">
      {/* Column header */}
      <div className="flex items-center gap-2 mb-4 px-1">
        <span className={`w-2.5 h-2.5 rounded-full ${dotColor}`} />
        <span className="text-sm font-bold text-on-surface tracking-tight">{label}</span>
        <span className="text-xs text-on-surface-variant/60 ml-auto">{orders.length}</span>
      </div>

      {/* Droppable area */}
      <div
        ref={setNodeRef}
        className={`flex flex-col gap-4 p-3 rounded-xl min-h-[200px] transition-colors ${
          isOver ? 'bg-primary-fixed/30' : 'bg-surface-container-low'
        }`}
      >
        <SortableContext items={orderIds} strategy={verticalListSortingStrategy}>
          {isLoading ? (
            <>
              <SkeletonCard />
              <SkeletonCard />
            </>
          ) : orders.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-xs text-on-surface-variant/40 font-medium">
              {emptyLabel}
            </div>
          ) : (
            orders.map((order) => <RequestCard key={order.orderId} order={order} />)
          )}
        </SortableContext>
      </div>
    </div>
  );
};
