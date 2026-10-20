import React from "react";
import { MessageCircle, FileText, Printer } from "lucide-react";
import { useTranslation } from "@/i18n/client";

interface ActionsSeamProps {
  lng: string;
}

// Inert actions seam — real WhatsApp/CFDI/Print behavior lands in slice 3.
// Clicking does nothing by design (spec: inert seam scenario).
export const ActionsSeam: React.FC<ActionsSeamProps> = ({ lng }) => {
  const { t } = useTranslation(lng, "common");
  const actions = [
    { key: "whatsapp", icon: MessageCircle },
    { key: "cfdi", icon: FileText },
    { key: "print", icon: Printer },
  ];

  return (
    <section data-testid="actions-seam" className="flex gap-3">
      {actions.map(({ key, icon: Icon }) => (
        <button
          key={key}
          type="button"
          disabled
          title={t("specialRequests.drawer.actions.comingSoon")}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface-container-low text-sm font-medium text-on-surface-variant/50 cursor-not-allowed"
        >
          <Icon size={16} />
          {t(`specialRequests.drawer.actions.${key}`)}
        </button>
      ))}
    </section>
  );
};
