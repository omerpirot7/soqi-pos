"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Eye, Printer, FileDown, FileSpreadsheet, DollarSign, TrendingUp, Users } from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";
import { formatDate } from "@/lib/utils";
import { useFormatters } from "@/hooks/use-formatters";
import { getReportsData } from "@/lib/actions";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable } from "@/components/shared/data-table";
import { StatCard } from "@/components/shared/stat-card";
import { ReceiptPrintLayout } from "@/components/receipt/receipt-print-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Sale = {
  id: string;
  receiptNo: string;
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: string;
  amountPaid: number | null;
  change: number | null;
  createdAt: string | Date;
  cashier: { id: string; name: string };
  items: {
    quantity: number;
    unitPrice: number;
    lineTotal: number;
    costPrice: number;
    product: { name: string; nameAr: string | null };
  }[];
};

type Settings = {
  storeName: string;
  address: string | null;
  phone: string | null;
  receiptFooter: string | null;
  receiptWidthMm: number;
  currency: string;
} | null;

type Reports = {
  revenue: number;
  cost: number;
  profit: number;
  margin: number;
  bestSellers: { name: string; qty: number; revenue: number }[];
  byCashier: { name: string; count: number; revenue: number }[];
};

export function SalesClient({
  sales: initialSales,
  settings,
  isAdmin,
  cashiers,
}: {
  sales: Sale[];
  settings: Settings;
  isAdmin: boolean;
  cashiers: { id: string; name: string }[];
}) {
  const t = useTranslations("sales");
  const tCommon = useTranslations("common");
  const tPos = useTranslations("pos");
  const locale = useLocale();
  const fmt = useFormatters();
  const [sales] = useState(initialSales);
  const [reports, setReports] = useState<Reports | null>(null);
  const [reportsPending, startReports] = useTransition();
  const [tab, setTab] = useState("history");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [cashierFilter, setCashierFilter] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [selected, setSelected] = useState<Sale | null>(null);

  useEffect(() => {
    if (!isAdmin || tab !== "reports" || reports) return;
    startReports(async () => {
      const data = await getReportsData();
      setReports({
        revenue: Number(data.revenue),
        cost: Number(data.cost),
        profit: Number(data.profit),
        margin: Number(data.margin),
        bestSellers: data.bestSellers,
        byCashier: data.byCashier,
      });
    });
  }, [isAdmin, tab, reports]);

  const filtered = useMemo(() => {
    return sales.filter((s) => {
      if (paymentFilter !== "all" && s.paymentMethod !== paymentFilter) return false;
      if (cashierFilter !== "all" && s.cashier.id !== cashierFilter) return false;
      const d = new Date(s.createdAt);
      if (from && d < new Date(from)) return false;
      if (to) {
        const end = new Date(to);
        end.setHours(23, 59, 59);
        if (d > end) return false;
      }
      return true;
    });
  }, [sales, paymentFilter, cashierFilter, from, to]);

  const columns: ColumnDef<Sale>[] = [
    {
      accessorKey: "receiptNo",
      header: t("receiptNo"),
      cell: ({ row }) => <span className="font-mono text-sm">{row.original.receiptNo}</span>,
    },
    {
      accessorKey: "createdAt",
      header: t("date"),
      cell: ({ row }) => formatDate(row.original.createdAt, locale),
    },
    {
      accessorKey: "cashier",
      header: t("cashier"),
      cell: ({ row }) => row.original.cashier.name,
    },
    {
      accessorKey: "paymentMethod",
      header: t("paymentMethod"),
      cell: ({ row }) => (
        <Badge variant="secondary">
          {row.original.paymentMethod === "CASH" ? tPos("cash") : tPos("card")}
        </Badge>
      ),
    },
    {
      accessorKey: "total",
      header: t("total"),
      cell: ({ row }) => (
        <span className="font-semibold">{fmt.currency(row.original.total)}</span>
      ),
    },
    {
      id: "actions",
      header: tCommon("actions"),
      cell: ({ row }) => (
        <Button variant="ghost" size="icon" onClick={() => setSelected(row.original)}>
          <Eye className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  async function exportExcel() {
    const XLSX = await import("xlsx");
    const rows = filtered.map((s) => ({
      Receipt: s.receiptNo,
      Date: new Date(s.createdAt).toISOString(),
      Cashier: s.cashier.name,
      Payment: s.paymentMethod,
      Total: s.total,
      Discount: s.discount,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sales");
    XLSX.writeFile(wb, "sales.xlsx");
  }

  async function exportPdf() {
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text("Sales Report", 14, 16);
    doc.setFontSize(10);
    let y = 28;
    filtered.slice(0, 40).forEach((s) => {
      doc.text(
        `${s.receiptNo}  ${s.cashier.name}  ${s.total}`,
        14,
        y
      );
      y += 7;
      if (y > 280) {
        doc.addPage();
        y = 20;
      }
    });
    doc.save("sales.pdf");
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title={t("title")}
        actions={
          isAdmin ? (
            <>
              <Button variant="outline" onClick={exportPdf}>
                <FileDown className="h-4 w-4" />
                {t("exportPdf")}
              </Button>
              <Button variant="outline" onClick={exportExcel}>
                <FileSpreadsheet className="h-4 w-4" />
                {t("exportExcel")}
              </Button>
            </>
          ) : null
        }
      />

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="history">{t("history")}</TabsTrigger>
          {isAdmin && <TabsTrigger value="reports">{t("reports")}</TabsTrigger>}
        </TabsList>

        <TabsContent value="history" className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-auto" />
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-auto" />
            <Select value={paymentFilter} onValueChange={setPaymentFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{tCommon("all")}</SelectItem>
                <SelectItem value="CASH">{tPos("cash")}</SelectItem>
                <SelectItem value="CARD">{tPos("card")}</SelectItem>
              </SelectContent>
            </Select>
            {isAdmin && (
              <Select value={cashierFilter} onValueChange={setCashierFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{tCommon("all")}</SelectItem>
                  {cashiers.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          <DataTable columns={columns} data={filtered} searchKey="receiptNo" searchPlaceholder={t("receiptNo")} />
        </TabsContent>

        {isAdmin && (
          <TabsContent value="reports" className="space-y-4">
            {reportsPending && !reports ? (
              <div className="grid gap-4 sm:grid-cols-3">
                <Skeleton className="h-28" />
                <Skeleton className="h-28" />
                <Skeleton className="h-28" />
              </div>
            ) : reports ? (
              <>
                <div className="grid gap-4 sm:grid-cols-3">
                  <StatCard title={t("revenue")} value={fmt.currency(reports.revenue)} icon={DollarSign} />
                  <StatCard title={t("profit")} value={fmt.currency(reports.profit)} icon={TrendingUp} />
                  <StatCard
                    title={t("profit")}
                    value={`${fmt.number(Math.round(reports.margin))}%`}
                    icon={Users}
                    description={t("byCashier")}
                  />
                </div>
                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="rounded-xl border bg-card p-5">
                    <h3 className="mb-3 font-semibold">{t("bestSellers")}</h3>
                    <div className="space-y-2">
                      {reports.bestSellers.map((p, i) => (
                        <div key={p.name} className="flex justify-between text-sm">
                          <span>
                            {i + 1}. {p.name}
                          </span>
                          <span className="font-medium">{fmt.number(p.qty)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-xl border bg-card p-5">
                    <h3 className="mb-3 font-semibold">{t("byCashier")}</h3>
                    <div className="space-y-2">
                      {reports.byCashier.map((c) => (
                        <div key={c.name} className="flex justify-between text-sm">
                          <span>
                            {c.name} ({fmt.number(c.count)})
                          </span>
                          <span className="font-medium">{fmt.currency(c.revenue)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            ) : null}
          </TabsContent>
        )}
      </Tabs>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
          <DialogHeader className="no-print">
            <DialogTitle>{t("viewReceipt")}</DialogTitle>
          </DialogHeader>
          {selected && (
            <ReceiptPrintLayout
              storeName={settings?.storeName || tCommon("appName")}
              address={settings?.address}
              phone={settings?.phone}
              receiptNo={selected.receiptNo}
              cashierName={selected.cashier.name}
              date={formatDate(selected.createdAt, locale)}
              items={selected.items.map((i) => ({
                name: i.product.nameAr || i.product.name,
                quantity: i.quantity,
                unitPrice: i.unitPrice,
                lineTotal: i.lineTotal,
              }))}
              subtotal={selected.subtotal}
              discount={selected.discount}
              total={selected.total}
              paymentMethod={selected.paymentMethod}
              amountPaid={selected.amountPaid}
              change={selected.change}
              footer={settings?.receiptFooter}
              widthMm={settings?.receiptWidthMm}
              currency={settings?.currency}
            />
          )}
          <DialogFooter className="no-print">
            <Button variant="outline" onClick={() => setSelected(null)}>
              {tCommon("cancel")}
            </Button>
            <Button onClick={() => window.print()}>
              <Printer className="h-4 w-4" />
              {t("reprint")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
