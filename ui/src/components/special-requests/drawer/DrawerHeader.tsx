import React from "react";
import { X } from "lucide-react";
import { useTranslation } from "@/i18n/client";
import { SpecialOrder } from "@/lib/api/types";

interface DrawerHeaderProps {
  order: SpecialOrder;
  lng: string;
  onClose: () => void;
}

const statusBadgeColors: Record<string, string> = {
  pending: "bg-primary-fixed text-primary-container",
  in_progress: "bg-secondary-fixed text-on-secondary-container",
  done: "bg-green-100 text-green-700",
};

// Drawer header on the DESIGN.md gradient dark-blue glass band.
export const DrawerHeader: React.FC<DrawerHeaderProps> = ({
  order,
  lng,
  onClose,
}) => {
  const { t } = useTranslation(lng, "common");
  const badgeColor =
    statusBadgeColors[order.status] ??
    "bg-primary-fixed text-primary-container";

  return (
    <header className="bg-gradient-to-br from-primary to-primary-container text-on-primary-container p-6 flex items-start justify-between shrink-0">
      <div className="flex flex-col gap-1">
        <span className="text-xs font-bold tracking-widest opacity-70">
          #{order.folio}
        </span>
        <h2
          id="request-drawer-title"
          className="text-2xl font-display font-bold"
        >
          {order.customerName || t("specialRequests.drawer.header.title")}
        </h2>
        <div className="flex items-center gap-3 mt-1">
          <span
            data-testid="drawer-status-badge"
            className={`inline-flex px-3 py-0.5 rounded-sm text-xs font-bold ${badgeColor}`}
          >
            {t(`specialRequests.status.${order.status}`)}
          </span>
          {order.customerWa && (
            <span className="text-xs opacity-70">{order.customerWa}</span>
          )}
        </div>
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label={t("specialRequests.drawer.buttons.close")}
        data-testid="drawer-close"
        className="p-2 rounded-xl hover:bg-white/10 transition-colors"
      >
        <X size={20} />
      </button>
    </header>
  );
};
