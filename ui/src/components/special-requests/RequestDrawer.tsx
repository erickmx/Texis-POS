"use client";

import React, { useEffect } from "react";
import { X } from "lucide-react";
import { useTranslation } from "@/i18n/client";
import { useRequestDrawer } from "@/components/providers/RequestDrawerProvider";
import { useSpecialRequests } from "@/lib/api/hooks/useSpecialRequests";
import { SpecialOrder } from "@/lib/api/types";
import { getUrgency } from "@/lib/special-requests/urgency";
import { ProgressBar } from "./ProgressBar";
import { DrawerHeader } from "./drawer/DrawerHeader";
import { FiscalDetailsCard } from "./drawer/FiscalDetailsCard";
import { AttachmentsGrid } from "./drawer/AttachmentsGrid";
import { ActionsSeam } from "./drawer/ActionsSeam";
import { EditForm } from "./drawer/EditForm";
import { CreateForm } from "./drawer/CreateForm";

// Right-side slide-over drawer for full special-order details, opened from
// the board. The order resolves from the SWR cache by id (no second fetch).
export const RequestDrawer: React.FC<{ lng: string }> = ({ lng }) => {
  const { t } = useTranslation(lng, "common");
  const { isOpen, orderId, mode, setMode, close } = useRequestDrawer();
  const { requests, mutate } = useSpecialRequests();

  const order: SpecialOrder | null = orderId
    ? (requests.find((r) => r.orderId === orderId) ?? null)
    : null;

  // Close on Escape (Modal.tsx precedent). setState runs inside the event
  // callback, never synchronously in the effect body.
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, close]);

  if (!isOpen) return null;

  // Create mode (slice 2b): same drawer surface, no order lookup.
  if (mode === "create") {
    return (
      <div
        className="fixed inset-0 z-50"
        role="dialog"
        aria-modal="true"
        aria-labelledby="request-drawer-title"
      >
        <div
          className="absolute inset-0 bg-on-surface/20"
          onClick={close}
          data-testid="drawer-backdrop"
        />
        <aside
          data-testid="request-drawer"
          className="absolute right-0 top-0 h-full w-full max-w-xl bg-surface-container-lowest/85 backdrop-blur-[24px] shadow-ambient rounded-l-3xl flex flex-col overflow-hidden"
        >
          <header className="bg-gradient-to-br from-primary to-primary-container text-on-primary-container p-6 flex items-start justify-between shrink-0">
            <h2
              id="request-drawer-title"
              className="text-2xl font-display font-bold"
            >
              {t("specialRequests.newRequestForm.title")}
            </h2>
            <button
              type="button"
              onClick={close}
              aria-label={t("specialRequests.drawer.buttons.close")}
              data-testid="drawer-close"
              className="p-2 rounded-xl hover:bg-white/10 transition-colors"
            >
              <X size={20} />
            </button>
          </header>
          <div className="flex-1 overflow-y-auto p-6">
            <CreateForm
              lng={lng}
              onCreated={async () => {
                await mutate();
                close();
              }}
            />
          </div>
        </aside>
      </div>
    );
  }

  if (!order) return null;

  const urgency = getUrgency(order.deadline);

  return (
    <div
      className="fixed inset-0 z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="request-drawer-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-on-surface/20"
        onClick={close}
        data-testid="drawer-backdrop"
      />

      {/* Slide-over panel — glassmorphism per DESIGN.md (85% opacity, 24px blur) */}
      <aside
        data-testid="request-drawer"
        className="absolute right-0 top-0 h-full w-full max-w-xl bg-surface-container-lowest/85 backdrop-blur-[24px] shadow-ambient rounded-l-3xl flex flex-col overflow-hidden"
      >
        <DrawerHeader order={order} lng={lng} onClose={close} />

        {mode === "edit" ? (
          <div className="flex-1 overflow-y-auto p-6">
            <EditForm
              order={order}
              lng={lng}
              onCancel={() => setMode("view")}
              onSaved={async () => {
                await mutate();
                setMode("view");
              }}
            />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
            {/* Title + description */}
            <section className="flex flex-col gap-2">
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-lg font-bold text-on-surface">
                  {order.title}
                </h3>
                <button
                  type="button"
                  onClick={() => setMode("edit")}
                  data-testid="drawer-edit"
                  className="shrink-0 px-4 py-2 rounded-xl bg-primary-fixed text-primary-container text-xs font-bold hover:shadow-ambient transition-shadow"
                >
                  {t("specialRequests.drawer.buttons.edit")}
                </button>
              </div>
              {order.description && (
                <p className="text-sm text-on-surface-variant whitespace-pre-line">
                  {order.description}
                </p>
              )}
              <p className="text-xs text-on-surface-variant/70">
                {t("specialRequests.urgency." + urgency.tier)} ·{" "}
                {order.deadline
                  ? new Date(order.deadline).toLocaleString(
                      lng === "en" ? "en-US" : "es-MX",
                    )
                  : t("specialRequests.drawer.fields.deadlineNone")}
              </p>
            </section>

            {/* Phase + progress */}
            {(order.phase || order.progressPct != null) && (
              <section>
                <ProgressBar
                  phase={order.phase}
                  progressPct={order.progressPct}
                />
              </section>
            )}

            {/* Derived fiscal card */}
            <FiscalDetailsCard order={order} lng={lng} />

            {/* Attachments: interactive upload/delete (slice 2b) */}
            <AttachmentsGrid
              attachments={order.attachments}
              lng={lng}
              orderId={order.orderId}
              onChanged={async () => {
                await mutate();
              }}
            />

            {/* Inert actions seam (slice 3) */}
            <ActionsSeam lng={lng} />
          </div>
        )}
      </aside>
    </div>
  );
};
