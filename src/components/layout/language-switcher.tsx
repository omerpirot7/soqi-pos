"use client";

import { useLocale, useTranslations } from "next-intl";
import { useTransition } from "react";
import { Globe, Check } from "lucide-react";
import { usePathname, useRouter, localeLabels, type Locale, routing } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { updateMyLocale } from "@/lib/actions";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";

export function LanguageSwitcher() {
  const t = useTranslations("common");
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, update } = useSession();
  const [pending, startTransition] = useTransition();

  function switchLocale(next: Locale) {
    if (next === locale) return;
    startTransition(async () => {
      if (session?.user) {
        try {
          await updateMyLocale(next);
          await update({ locale: next });
        } catch {
          /* still switch UI locale */
        }
      }
      router.replace(pathname, { locale: next });
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10"
          aria-label={t("language")}
          disabled={pending}
        >
          <Globe className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[10rem]">
        {routing.locales.map((code) => (
          <DropdownMenuItem
            key={code}
            onClick={() => switchLocale(code)}
            className={cn("flex cursor-pointer items-center justify-between gap-3", code === locale && "bg-accent")}
          >
            <span>{localeLabels[code]}</span>
            {code === locale && <Check className="h-4 w-4 text-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
