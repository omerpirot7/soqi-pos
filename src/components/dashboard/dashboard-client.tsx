"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  DollarSign,
  ShoppingBag,
  AlertTriangle,
  ShoppingCart,
  PackagePlus,
  Warehouse,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { getDashboardData } from "@/lib/actions";
import {
  ACCENT_CHANGE_EVENT,
  readPrimaryCssColor,
} from "@/lib/accent-color";
import { useFormatters } from "@/hooks/use-formatters";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";

type DashData = Awaited<ReturnType<typeof getDashboardData>>;

export function DashboardClient({ initialData }: { initialData: DashData }) {
  const t = useTranslations("dashboard");
  const fmt = useFormatters();
  const [range, setRange] = useState<"daily" | "weekly" | "monthly">("daily");
  const [data, setData] = useState<DashData | null>(initialData);
  const [pending, startTransition] = useTransition();
  const [chartColor, setChartColor] = useState("hsl(158 64% 28%)");
  const loadedRange = useRef<typeof range>("daily");

  useEffect(() => {
    const syncChartColor = () => setChartColor(readPrimaryCssColor());
    syncChartColor();
    window.addEventListener(ACCENT_CHANGE_EVENT, syncChartColor);
    return () => window.removeEventListener(ACCENT_CHANGE_EVENT, syncChartColor);
  }, []);

  useEffect(() => {
    if (loadedRange.current === range) return;
    loadedRange.current = range;
    startTransition(async () => {
      const result = await getDashboardData(range);
      setData(result);
    });
  }, [range]);

  if (!data && pending) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
        <Skeleton className="h-72" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title={t("title")}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button asChild size="lg">
              <Link href="/pos">
                <ShoppingCart className="h-5 w-5" />
                {t("quickPos")}
              </Link>
            </Button>
            <Button asChild variant="secondary" size="lg">
              <Link href="/inventory?new=1">
                <PackagePlus className="h-5 w-5" />
                {t("quickAddProduct")}
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/inventory/intake">
                <Warehouse className="h-5 w-5" />
                {t("quickAddStock")}
              </Link>
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title={t("todaySales")}
          value={fmt.currency(data?.todayTotal || 0)}
          icon={DollarSign}
        />
        <StatCard
          title={t("transactions")}
          value={fmt.number(data?.todayCount || 0)}
          icon={ShoppingBag}
        />
        <StatCard
          title={t("lowStock")}
          value={fmt.number(data?.lowStock.length || 0)}
          icon={AlertTriangle}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>{t("salesTrend")}</CardTitle>
            <Tabs value={range} onValueChange={(v) => setRange(v as typeof range)}>
              <TabsList>
                <TabsTrigger value="daily">{t("daily")}</TabsTrigger>
                <TabsTrigger value="weekly">{t("weekly")}</TabsTrigger>
                <TabsTrigger value="monthly">{t("monthly")}</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.trend || []}>
                <defs>
                  <linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={chartColor} stopOpacity={0.35} />
                    <stop offset="100%" stopColor={chartColor} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} width={50} />
                <Tooltip
                  formatter={(value) => fmt.currency(Number(value ?? 0))}
                  contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))" }}
                />
                <Area
                  type="monotone"
                  dataKey="total"
                  stroke={chartColor}
                  fill="url(#salesFill)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("topProducts")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data?.topProducts.length ? (
              data.topProducts.map((p, i) => (
                <div key={p.name} className="flex items-center justify-between gap-2 rounded-lg bg-muted/40 px-3 py-2">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                      {i + 1}
                    </span>
                    <span className="truncate text-sm font-medium">{p.nameCkb || p.name}</span>
                  </div>
                  <Badge variant="secondary">{fmt.number(p.qty)}</Badge>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">—</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            {t("lowStock")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data?.lowStock.length ? (
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {data.lowStock.map((p) => (
                <div key={p.id} className="rounded-xl border bg-amber-50/50 p-3 dark:bg-amber-950/20">
                  <p className="font-medium">{p.nameCkb || p.name}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {fmt.number(p.stock)} / {fmt.number(p.minStock)}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title={t("noLowStock")} className="border-0 bg-transparent py-10" />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
