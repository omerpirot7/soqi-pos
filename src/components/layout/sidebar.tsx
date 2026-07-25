"use client";

import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Tags,
  Truck,
  Receipt,
  Barcode,
  Users,
  Settings,
  Menu,
  X,
  Store,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import { useEffect, useMemo, useState } from "react";
import { Link, usePathname, useRouter } from "@/i18n/routing";
import { getNavForRole } from "@/lib/permissions";
import { Role } from "@/types/enums";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Tags,
  Truck,
  Receipt,
  Barcode,
  Users,
  Settings,
};

export function Sidebar({ storeName }: { storeName: string }) {
  const t = useTranslations("nav");
  const tCommon = useTranslations("common");
  const { data: session } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const role = (session?.user?.role as Role) || Role.CASHIER;
  const items = useMemo(() => getNavForRole(role), [role]);

  // Warm every nav route in the background so the first click isn't a cold compile
  useEffect(() => {
    const idle = window.setTimeout(() => {
      for (const item of items) {
        try {
          router.prefetch(item.href);
        } catch {
          /* ignore */
        }
      }
    }, 400);
    return () => window.clearTimeout(idle);
  }, [items, router]);

  const Nav = (
    <nav className="flex flex-1 flex-col gap-1 p-3">
      {items.map((item) => {
        const Icon = ICONS[item.icon] || Package;
        const active =
          item.href === "/"
            ? pathname === "/"
            : pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.key}
            href={item.href}
            prefetch
            onMouseEnter={() => router.prefetch(item.href)}
            onClick={() => setOpen(false)}
            className={cn(
              "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-colors",
              active
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            <Icon className="h-5 w-5 shrink-0" />
            <span>{t(item.key as Parameters<typeof t>[0])}</span>
          </Link>
        );
      })}
    </nav>
  );

  return (
    <>
      <Button
        variant="outline"
        size="icon"
        className="fixed start-3 top-3 z-50 lg:hidden no-print"
        onClick={() => setOpen(true)}
      >
        <Menu className="h-5 w-5" />
      </Button>

      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden no-print"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 start-0 z-50 flex w-72 flex-col border-e bg-card shadow-sm transition-transform no-print lg:static lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full rtl:translate-x-full lg:rtl:translate-x-0"
        )}
      >
        <div className="flex items-center justify-between gap-2 border-b px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Store className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <p className="truncate font-bold leading-tight">{storeName || tCommon("appName")}</p>
              <p className="text-xs text-muted-foreground">POS</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setOpen(false)}>
            <X className="h-5 w-5" />
          </Button>
        </div>
        {Nav}
      </aside>
    </>
  );
}
