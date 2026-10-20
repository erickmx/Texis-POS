// Pure fiscal derivation for special orders. Mirror of
// backend/internal/orders/fiscal.go — both sides MUST agree.
// IVA applies to service_fee only; gasto_terceros is a non-taxable
// third-party passthrough. Nulls derive as 0.

const IVA_RATE = 0.16;

function toCents(v: number | null | undefined): number {
  return Math.round((v ?? 0) * 100);
}

function toUnits(cents: number): number {
  return cents / 100;
}

export function ivaCents(serviceCents: number): number {
  return Math.round(serviceCents * IVA_RATE);
}

export function deriveIva(serviceFee: number | null | undefined): number {
  return toUnits(ivaCents(toCents(serviceFee)));
}

export function deriveTotal(
  gastoTerceros: number | null | undefined,
  serviceFee: number | null | undefined,
): number {
  const gastoCents = toCents(gastoTerceros);
  const serviceCents = toCents(serviceFee);
  return toUnits(gastoCents + serviceCents + ivaCents(serviceCents));
}
