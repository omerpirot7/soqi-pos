import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { intlLocale } from "@/i18n/routing";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Building an Intl formatter is expensive; tables re-format thousands of cells
const numberFormatters = new Map<string, Intl.NumberFormat>();
const dateFormatters = new Map<string, Intl.DateTimeFormat>();

function numberFormatter(locale: string, options?: Intl.NumberFormatOptions) {
  // Always force Latin digits so Node (SSR) and Chrome never disagree
  const opts: Intl.NumberFormatOptions = { numberingSystem: "latn", ...options };
  const key = `${locale}|${JSON.stringify(opts)}`;
  let f = numberFormatters.get(key);
  if (!f) {
    try {
      f = new Intl.NumberFormat(intlLocale(locale), opts);
    } catch {
      f = new Intl.NumberFormat("en-IQ", opts);
    }
    numberFormatters.set(key, f);
  }
  return f;
}

function dateFormatter(locale: string, options: Intl.DateTimeFormatOptions) {
  const key = `${locale}|${JSON.stringify(options)}`;
  let f = dateFormatters.get(key);
  if (!f) {
    try {
      f = new Intl.DateTimeFormat(intlLocale(locale), options);
    } catch {
      f = new Intl.DateTimeFormat("en-IQ", options);
    }
    dateFormatters.set(key, f);
  }
  return f;
}

export function formatCurrency(
  amount: number | string,
  currency = "IQD",
  locale = "ckb"
) {
  // Avoid style:"currency" — Node and browsers disagree on IQD symbols
  // (e.g. ".د.ع" vs "IQD 0"), which causes React hydration errors.
  const raw = typeof amount === "string" ? parseFloat(amount) : amount;
  const value = Number.isFinite(raw) ? raw : 0;
  const digits = currency === "IQD" ? 0 : 2;
  const numberPart = numberFormatter(locale, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
  return locale === "en" ? `${currency} ${numberPart}` : `${numberPart} ${currency}`;
}

export function formatNumber(value: number | string, locale = "ckb") {
  const n = typeof value === "string" ? parseFloat(value) : value;
  return numberFormatter(locale).format(n);
}

export function formatDate(
  date: Date | string | number,
  locale = "ckb",
  options?: Intl.DateTimeFormatOptions
) {
  const d = date instanceof Date ? date : new Date(date);
  const opts: Intl.DateTimeFormatOptions = options ?? {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  };
  return dateFormatter(locale, opts).format(d);
}

export function generateReceiptNo() {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, "");
  const rand = Math.floor(Math.random() * 9000) + 1000;
  return `R${date}-${rand}`;
}

export function toNumber(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") return parseFloat(value) || 0;
  if (value && typeof value === "object" && "toNumber" in value) {
    return (value as { toNumber: () => number }).toNumber();
  }
  return Number(value) || 0;
}
