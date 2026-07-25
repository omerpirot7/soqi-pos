import { defineRouting } from "next-intl/routing";
import { createNavigation } from "next-intl/navigation";

export const locales = ["ckb", "en"] as const;
export type Locale = (typeof locales)[number];

export const routing = defineRouting({
  locales,
  defaultLocale: "ckb",
  localePrefix: "always",
});

export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);

/** Kurdish Sorani is RTL; English is LTR */
export function isRtl(locale: string) {
  return locale === "ckb";
}

/** BCP 47 tags for Intl formatters */
export function intlLocale(locale: string) {
  return locale === "en" ? "en-IQ" : "ckb-IQ";
}

export const localeLabels: Record<Locale, string> = {
  ckb: "کوردی",
  en: "English",
};
