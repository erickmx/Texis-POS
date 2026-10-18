'use client';

import React, { useState, useCallback } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import toast from 'react-hot-toast';
import { useTranslation } from '@/i18n/client';
import { useSpecialRequests } from '@/lib/api/hooks/useSpecialRequests';
import { updateOrderStatus } from '@/lib/api/specialRequests';
import { useRequestDrawer } from '@/components/providers/RequestDrawerProvider';
import { SpecialOrder } from '@/lib/api/types';
import { BoardColumn } from './BoardColumn';
import { RequestCard } from './RequestCard';
import { Plus } from 'lucide-react';

interface ColumnConfig {
  status: string;
  labelKey: string;
}

const COLUMNS: ColumnConfig[] = [
  { status: 'pending', labelKey: 'specialRequests.columns.pending' },
  { status: 'in_progress', labelKey: 'specialRequests.columns.in_progress' },
  { status: 'done', labelKey: 'specialRequests.columns.done' },
];

interface SpecialRequestsBoardProps {
  lng: string;
}

export function createDragEndHandler(deps: {
  requests: SpecialOrder[];
  mutate: (
    fn: () => Promise<SpecialOrder[]>,
    opts: {
      optimisticData: SpecialOrder[];
      rollbackOnError: boolean;
      revalidate: boolean;
    },
  ) => Promise<unknown>;
  t: (key: string) => string;
  onClearActive: () => void;
}) {
  return async (event: DragEndEvent) => {
    deps.onClearActive();
    const { active, over } = event;
    if (!over) return;

    const orderId = active.id as string;
    const newStatus = over.id as string;
    const order = deps.requests.find((r) => r.orderId === orderId);
    if (!order || order.status === newStatus) return;
    if (!COLUMNS.some((c) => c.status === newStatus)) return;

    const optimisticData = deps.requests.map((r) =>
      r.orderId === orderId ? { ...r, status: newStatus as SpecialOrder['status'] } : r
    );

    try {
      await deps.mutate(
        async () => {
          await updateOrderStatus(orderId, newStatus);
          return optimisticData;
        },
        { optimisticData, rollbackOnError: true, revalidate: true }
      );
    } catch {
      toast.error(deps.t('specialRequests.error.moveFailed'));
    }
  };
}

export const SpecialRequestsBoard: React.FC<SpecialRequestsBoardProps> = ({ lng }) => {
  const { t } = useTranslation(lng, 'common');
  const { requests, isLoading, mutate } = useSpecialRequests();
  const { openCreate } = useRequestDrawer();
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const getOrdersByStatus = useCallback(
    (status: string) => requests.filter((r) => r.status === status),
    [requests]
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) =>
      createDragEndHandler({
        requests,
        mutate,
        t,
        onClearActive: () => setActiveId(null),
      })(event),
    [requests, mutate, t]
  );

  const activeOrder = activeId ? requests.find((r) => r.orderId === activeId) : null;

  return (
    <div className="p-12 flex flex-col gap-8 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex items-end justify-between mb-2">
        <div className="flex flex-col gap-3">
          <nav className="flex items-center gap-2 text-[10px] font-bold tracking-[0.2em] text-on-surface-variant/30 uppercase">
            <span>{t('sidebar.warehouse')}</span>
            <span className="opacity-30">/</span>
            <span className="text-primary-container">{t('specialRequests.title')}</span>
          </nav>
          <h1 className="text-6xl font-display font-bold text-on-surface tracking-tight">
            {t('specialRequests.title')}
          </h1>
        </div>
        <button
          type="button"
          onClick={openCreate}
          data-testid="new-request-button"
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-talavera text-white text-sm font-bold shadow-ambient hover:shadow-lg transition-shadow"
        >
          <Plus size={18} />
          {t('specialRequests.newRequest')}
        </button>
      </div>

      {/* Board */}
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        {!isLoading && requests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center" data-testid="board-empty">
            <p className="text-on-surface-variant/60 text-lg font-medium">{t('specialRequests.empty.board')}</p>
          </div>
        ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {COLUMNS.map((col) => (
            <BoardColumn
              key={col.status}
              status={col.status}
              label={t(col.labelKey)}
              orders={getOrdersByStatus(col.status)}
              isLoading={isLoading}
              emptyLabel={t('specialRequests.empty.column')}
            />
          ))}
        </div>
        )}

        <DragOverlay>
          {activeOrder ? <RequestCard order={activeOrder} /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
};
