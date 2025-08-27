export const fmtEUR = (n: number): string =>
  new Intl.NumberFormat("de-AT", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);
export const fmt = (n: number): string => new Intl.NumberFormat("de-AT").format(n);
