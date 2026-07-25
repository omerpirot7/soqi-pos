"use client";

import { signOut, useSession } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";
import { LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./theme-toggle";
import { LanguageSwitcher } from "./language-switcher";
import { AccentColorPicker } from "./accent-color-picker";
import { Badge } from "@/components/ui/badge";

export function TopBar({ storeName }: { storeName: string }) {
  const { data: session } = useSession();
  const t = useTranslations("common");
  const tUsers = useTranslations("users");
  const locale = useLocale();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b bg-background/90 px-4 backdrop-blur no-print sm:px-6">
      <div className="ps-12 lg:ps-0">
        <p className="truncate text-sm font-semibold sm:text-base">{storeName}</p>
      </div>
      <div className="flex items-center gap-2">
        <LanguageSwitcher />
        <AccentColorPicker />
        <ThemeToggle />
        {session?.user && (
          <div className="hidden items-center gap-2 rounded-xl border bg-card px-3 py-1.5 sm:flex">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">{session.user.name}</span>
            <Badge variant="secondary" className="text-[10px]">
              {tUsers(`roles.${session.user.role}` as "roles.ADMIN")}
            </Badge>
          </div>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={() => signOut({ callbackUrl: `/${locale}/login` })}
          className="gap-2"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">{t("logout")}</span>
        </Button>
      </div>
    </header>
  );
}
