import React from "react";
import { useTranslation } from "@/i18n/client";
import { SpecialOrder } from "@/lib/api/types";
import { deriveIva, deriveTotal } from "@/lib/special-requests/fiscal";

interface FiscalDetailsCardProps {
  order: SpecialOrder;
  lng: string;
}

const formatMoney = (v: number) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(
    v,
  );

// Derived fiscal card. IVA = 16% x service_fee only (gasto_terceros untaxed);
// Total = gasto_terceros + service_fee + IVA. Derived at render, never stored
// client-side.
export const FiscalDetailsCard: React.FC<FiscalDetailsCardProps> = ({
  order,
  lng,
}) => {
  const { t } = useTranslation(lng, "common");
  const subtotal = (order.gastoTerceros ?? 0) + (order.serviceFee ?? 0);
  const iva = deriveIva(order.serviceFee);
  const total = deriveTotal(order.gastoTerceros, order.serviceFee);

  return (
    <section
      data-testid="fiscal-card"
      className="bg-surface-container-low rounded-xl p-5 flex flex-col gap-2"
    >
      <h3 className="label-md font-bold text-on-surface-variant uppercase tracking-wider">
        {t("specialRequests.drawer.fiscal.title")}
      </h3>
      <div className="flex justify-between text-sm text-on-surface-variant">
        <span>{t("specialRequests.drawer.fiscal.gastoTerceros")}</span>
        <span data-testid="fiscal-gasto">
          {formatMoney(order.gastoTerceros ?? 0)}
        </span>
      </div>
      <div className="flex justify-between text-sm text-on-surface-variant">
        <span>{t("specialRequests.drawer.fiscal.serviceFee")}</span>
        <span data-testid="fiscal-service">
          {formatMoney(order.serviceFee ?? 0)}
        </span>
      </div>
      <div className="flex justify-between text-sm text-on-surface-variant">
        <span>{t("specialRequests.drawer.fiscal.subtotal")}</span>
        <span data-testid="fiscal-subtotal">{formatMoney(subtotal)}</span>
      </div>
      <div className="flex justify-between text-sm text-on-surface-variant">
        <span>
          {t("specialRequests.drawer.fiscal.iva")}
          <span className="ml-2 opacity-60">
            {t("specialRequests.drawer.fiscal.ivaOnService")}
          </span>
        </span>
        <span data-testid="fiscal-iva">{formatMoney(iva)}</span>
      </div>
      <div className="flex justify-between pt-2 text-base font-bold text-on-surface">
        <span>{t("specialRequests.drawer.fiscal.total")}</span>
        <span data-testid="fiscal-total">{formatMoney(total)}</span>
      </div>
    </section>
  );
};
