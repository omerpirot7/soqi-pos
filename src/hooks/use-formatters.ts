"use client";

import { useLocale } from "next-intl";
import { formatCurrency, formatDate, formatNumber } from "@/lib/utils";

/** Locale-aware formatters bound to the active next-intl locale */
export function useFormatters() {
  const locale = useLocale();

  return {
    locale,
    currency: (amount: number | string, currency = "IQD") =>
      formatCurrency(amount, currency, locale),
    number: (value: number | string) => formatNumber(value, locale),
    date: (date: Date | string | number, options?: Intl.DateTimeFormatOptions) =>
      formatDate(date, locale, options),
  };
}
