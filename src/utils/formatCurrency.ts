import { Decimal } from "decimal.js";

export function formatCurrency(price: Decimal, currency: string = "USD"): string {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      notation: price.abs().gte(new Decimal(1e12)) || price.abs().lte(new Decimal(1e-6))
        ? "scientific"
        : "standard",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(price.toNumber());
  }