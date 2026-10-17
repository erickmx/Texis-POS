import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { SpecialOrder } from "@/lib/api/types";
import { getUrgency } from "@/lib/special-requests/urgency";
import { useRequestDrawer } from "@/components/providers/RequestDrawerProvider";
import { UrgencyChip } from "./UrgencyChip";
import { AttachmentChip } from "./AttachmentChip";
import { ProgressBar } from "./ProgressBar";

const statusEdgeColors: Record<string, string> = {
  pending: "border-l-amber-400",
  in_progress: "border-l-primary-container",
  done: "border-l-green-500",
};

interface RequestCardProps {
  order: SpecialOrder;
}

export const RequestCard: React.FC<RequestCardProps> = ({ order }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: order.orderId });
  const { openView } = useRequestDrawer();

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const urgency = getUrgency(order.deadline);
  const edgeColor =
    statusEdgeColors[order.status] ?? "border-l-surface-container-high";

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => {
        // Click vs drag: PointerSensor distance:5 activates drag before a
        // real drag starts; a click that survives is an open-drawer intent.
        if (!isDragging) openView(order.orderId);
      }}
      data-testid={`request-card-${order.orderId}`}
      className={`bg-surface-container-lowest rounded-xl p-5 shadow-ambient border-l-4 ${edgeColor} cursor-grab active:cursor-grabbing touch-none`}
    >
      {/* Top row: folio + urgency */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-primary-container font-medium">
          #{order.folio}
        </span>
        <UrgencyChip tier={urgency.tier} label={urgency.label} />
      </div>

      {/* Title */}
      {order.title && (
        <h3 className="text-sm font-bold text-on-surface mb-1">
          {order.title}
        </h3>
      )}

      {/* Description (2-line clamp) */}
      {order.description && (
        <p className="text-xs text-on-surface-variant line-clamp-2 mb-3">
          {order.description}
        </p>
      )}

      {/* Active badge for in_progress */}
      {order.status === "in_progress" && (
        <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-xs font-bold text-primary-container bg-primary-fixed mb-2">
          ACTIVE
        </span>
      )}

      {/* Progress bar (in_progress only) */}
      {order.status === "in_progress" && (
        <div className="mb-2">
          <ProgressBar phase={order.phase} progressPct={order.progressPct} />
        </div>
      )}

      {/* Bottom row: attachments */}
      <div className="flex items-center justify-between mt-2">
        <AttachmentChip count={order.attachmentCount} />
        {order.customerName && (
          <span className="text-xs text-on-surface-variant/60 truncate max-w-[120px]">
            {order.customerName}
          </span>
        )}
      </div>
    </div>
  );
};
