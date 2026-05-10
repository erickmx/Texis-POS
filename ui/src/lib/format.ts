/**
 * Localized currency utility.
 * Defaults to es-MX and MXN as requested.
 */
export const formatCurrency = (amount: number, locale = 'es-MX', currency = 'MXN') => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

export const formatNumber = (num: number, locale = 'es-MX') => {
  return new Intl.NumberFormat(locale).format(num);
};
