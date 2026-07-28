"use client";

import {
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  ShoppingCart,
  Package,
  Tags,
  Truck,
  Receipt,
  Barcode,
  Users,
  Settings,
  Store,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, usePathname, useRouter } from "@/i18n/routing";
import { getNavForRole } from "@/lib/permissions";
import { Role } from "@/types/enums";
import { cn } from "@/lib/utils";

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

  const role = (session?.user?.role as Role) || Role.CASHIER;
  const items = useMemo(() => getNavForRole(role), [role]);
  const mobileScrollRef = useRef<HTMLDivElement>(null);
  const [canScrollStart, setCanScrollStart] = useState(false);
  const [canScrollEnd, setCanScrollEnd] = useState(false);

  const updateMobileScrollHints = useCallback(() => {
    const el = mobileScrollRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    if (max <= 2) {
      setCanScrollStart(false);
      setCanScrollEnd(false);
      return;
    }
    const pos = Math.abs(el.scrollLeft);
    setCanScrollStart(pos > 4);
    setCanScrollEnd(pos < max - 4);
  }, []);

  const scrollMobileNav = useCallback((direction: "start" | "end") => {
    const el = mobileScrollRef.current;
    if (!el) return;
    const isRtl = getComputedStyle(el).direction === "rtl";
    const step = 140;
    const delta =
      direction === "start" ? (isRtl ? step : -step) : isRtl ? -step : step;
    el.scrollBy({ left: delta, behavior: "smooth" });
  }, []);

  useEffect(() => {
    updateMobileScrollHints();
    const raf = requestAnimationFrame(updateMobileScrollHints);
    const el = mobileScrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", updateMobileScrollHints, { passive: true });
    const ro = new ResizeObserver(updateMobileScrollHints);
    ro.observe(el);
    window.addEventListener("resize", updateMobileScrollHints);
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener("scroll", updateMobileScrollHints);
      ro.disconnect();
      window.removeEventListener("resize", updateMobileScrollHints);
    };
  }, [items, updateMobileScrollHints]);

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

  function isActive(href: string) {
    return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
  }

  const allItemsNav = (
    <nav className="hidden flex-wrap items-center gap-2 px-4 py-3 lg:flex xl:gap-2.5 2xl:gap-3">
      {items.map((item) => {
        const Icon = ICONS[item.icon] || Package;
        const active = isActive(item.href);
        return (
          <Link
            key={item.key}
            href={item.href}
            prefetch
            onMouseEnter={() => router.prefetch(item.href)}
            title={t(item.key as Parameters<typeof t>[0])}
            className={cn(
              "group relative flex min-h-9 shrink-0 touch-manipulation items-center gap-1.5 rounded-2xl border px-2 py-1.5 text-xs font-semibold transition-all lg:min-h-9 lg:gap-1.5 lg:px-2.5 lg:text-xs xl:min-h-10 xl:gap-2 xl:px-3 xl:py-2 xl:text-sm 2xl:min-h-11 2xl:px-4 2xl:text-base",
              active
                ? "border-primary/30 bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                : "border-transparent bg-background/50 text-muted-foreground hover:border-border hover:bg-accent/70 hover:text-accent-foreground"
            )}
          >
            <Icon className="h-4 w-4 shrink-0 lg:h-4 lg:w-4 xl:h-[1.125rem] xl:w-[1.125rem] 2xl:h-5 2xl:w-5" />
            <span className="truncate">{t(item.key as Parameters<typeof t>[0])}</span>
            <span
              className={cn(
                "absolute inset-x-3 -bottom-1 h-0.5 origin-center rounded-full transition-all duration-300",
                active
                  ? "scale-x-100 bg-primary-foreground/90"
                  : "scale-x-0 bg-current/60 group-hover:scale-x-100"
              )}
            />
          </Link>
        );
      })}
    </nav>
  );

  const mobileNav = (
    <div className="relative lg:hidden">
      {canScrollStart && (
        <>
          <div
            className="pointer-events-none absolute inset-y-0 start-0 z-10 w-10 bg-gradient-to-e from-card/95 to-transparent"
            aria-hidden
          />
          <button
            type="button"
            onClick={() => scrollMobileNav("start")}
            className="absolute start-1 top-1/2 z-20 flex h-7 w-7 -translate-y-1/2 items-center justify-center text-muted-foreground/70 transition-colors hover:text-foreground"
            aria-label="Scroll nav start"
          >
            <ChevronLeft className="h-5 w-5 rtl:rotate-180" />
          </button>
        </>
      )}
      {canScrollEnd && (
        <>
          <div
            className="pointer-events-none absolute inset-y-0 end-0 z-10 w-10 bg-gradient-to-l from-card/95 to-transparent"
            aria-hidden
          />
          <button
            type="button"
            onClick={() => scrollMobileNav("end")}
            className="absolute end-1 top-1/2 z-20 flex h-7 w-7 -translate-y-1/2 items-center justify-center text-muted-foreground/70 transition-colors hover:text-foreground"
            aria-label="Scroll nav end"
          >
            <ChevronRight className="h-5 w-5 rtl:rotate-180" />
          </button>
        </>
      )}
      <div
        ref={mobileScrollRef}
        className={cn(
          "flex gap-1.5 overflow-x-auto py-2.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
          canScrollStart ? "ps-7" : "ps-4",
          canScrollEnd ? "pe-7" : "pe-4"
        )}
      >
      {items.map((item) => {
        const Icon = ICONS[item.icon] || Package;
        const active = isActive(item.href);
        return (
          <Link
            key={item.key}
            href={item.href}
            prefetch
            onMouseEnter={() => router.prefetch(item.href)}
            title={t(item.key as Parameters<typeof t>[0])}
            className={cn(
              "group relative flex h-9 min-w-[5.25rem] shrink-0 touch-manipulation items-center justify-center gap-1 rounded-2xl border px-2 transition-all sm:h-10",
              active
                ? "border-primary/30 bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                : "border-border/50 bg-background/70 text-muted-foreground hover:bg-accent/70 hover:text-accent-foreground"
            )}
          >
            <Icon className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
            <span className="truncate text-[clamp(0.62rem,2.1vw,0.8rem)] font-semibold">
              {t(item.key as Parameters<typeof t>[0])}
            </span>
            <span
              className={cn(
                "absolute -bottom-1 h-1 w-6 rounded-full transition-all duration-300",
                active
                  ? "bg-primary scale-100"
                  : "bg-current/60 scale-0 group-hover:scale-100"
              )}
            />
          </Link>
        );
      })}
      </div>
    </div>
  );

  return (
    <aside className="sticky top-0 z-40 border-b border-white/10 bg-[linear-gradient(135deg,hsl(var(--background)/0.92),hsl(var(--card)/0.82))] shadow-sm backdrop-blur-xl no-print">
      <div className="flex items-center gap-3 border-b border-white/10 px-4 py-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/90 text-primary-foreground shadow-sm shadow-primary/20 ring-1 ring-white/10">
          <Store className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="truncate font-bold leading-tight">{storeName || tCommon("appName")}</p>
          <p className="text-xs text-muted-foreground">POS</p>
        </div>
      </div>
      {mobileNav}
      {allItemsNav}
    </aside>
  );
}
