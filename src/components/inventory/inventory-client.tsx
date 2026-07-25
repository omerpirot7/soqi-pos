"use client";

import { useMemo, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import {
  LayoutGrid,
  List,
  Plus,
  Pencil,
  Trash2,
  PackagePlus,
  AlertTriangle,
  Warehouse,
} from "lucide-react";
import toast from "react-hot-toast";
import { ColumnDef } from "@tanstack/react-table";
import { Link } from "@/i18n/routing";
import { deleteProduct, upsertProduct } from "@/lib/actions";
import { toNumber } from "@/lib/utils";
import { useFormatters } from "@/hooks/use-formatters";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { DataTable } from "@/components/shared/data-table";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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

type Product = {
  id: string;
  name: string;
  nameAr: string | null;
  barcode: string | null;
  sku: string | null;
  categoryId: string;
  supplierId: string | null;
  costPrice: number;
  sellPrice: number;
  unit: string;
  stock: number;
  minStock: number;
  imageUrl: string | null;
  expiresAt: Date | string | null;
  category: { id: string; name: string; nameAr: string | null };
  supplier: { id: string; name: string } | null;
};

type Category = { id: string; name: string; nameAr: string | null };
type Supplier = { id: string; name: string };

const emptyForm = {
  name: "",
  nameAr: "",
  barcode: "",
  sku: "",
  categoryId: "",
  supplierId: "",
  costPrice: 0,
  sellPrice: 0,
  unit: "piece",
  stock: 0,
  minStock: 5,
  expiresAt: "",
};

export function InventoryClient({
  products: initial,
  categories,
  suppliers,
}: {
  products: Product[];
  categories: Category[];
  suppliers: Supplier[];
}) {
  const t = useTranslations("inventory");
  const tCommon = useTranslations("common");
  const fmt = useFormatters();
  const searchParams = useSearchParams();
  const [products, setProducts] = useState(initial);
  const [view, setView] = useState<"table" | "card">("table");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [stockFilter, setStockFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(searchParams.get("new") === "1");
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    return products.filter((p) => {
      if (categoryFilter !== "all" && p.categoryId !== categoryFilter) return false;
      if (stockFilter === "low" && p.stock > p.minStock) return false;
      if (stockFilter === "out" && p.stock > 0) return false;
      if (stockFilter === "in" && p.stock <= 0) return false;
      const q = search.trim().toLowerCase();
      if (
        q &&
        !p.name.toLowerCase().includes(q) &&
        !(p.nameAr || "").includes(q) &&
        !(p.barcode || "").includes(q)
      )
        return false;
      return true;
    });
  }, [products, categoryFilter, stockFilter, search]);

  const lowStock = products.filter((p) => p.stock <= p.minStock);
  const expiring = products.filter((p) => {
    if (!p.expiresAt) return false;
    const d = new Date(p.expiresAt);
    const soon = new Date();
    soon.setDate(soon.getDate() + 7);
    return d <= soon;
  });

  function openCreate() {
    setEditing(null);
    setForm({ ...emptyForm, categoryId: categories[0]?.id || "" });
    setOpen(true);
  }

  function openEdit(p: Product) {
    setEditing(p);
    setForm({
      name: p.name,
      nameAr: p.nameAr || "",
      barcode: p.barcode || "",
      sku: p.sku || "",
      categoryId: p.categoryId,
      supplierId: p.supplierId || "",
      costPrice: toNumber(p.costPrice),
      sellPrice: toNumber(p.sellPrice),
      unit: p.unit,
      stock: toNumber(p.stock),
      minStock: toNumber(p.minStock),
      expiresAt: p.expiresAt ? new Date(p.expiresAt).toISOString().slice(0, 10) : "",
    });
    setOpen(true);
  }

  function save() {
    if (!form.name || !form.categoryId) {
      toast.error(tCommon("required"));
      return;
    }
    startTransition(async () => {
      try {
        await upsertProduct({
          id: editing?.id,
          name: form.name,
          nameAr: form.nameAr || null,
          barcode: form.barcode || null,
          sku: form.sku || null,
          categoryId: form.categoryId,
          supplierId: form.supplierId || null,
          costPrice: form.costPrice,
          sellPrice: form.sellPrice,
          unit: form.unit,
          stock: form.stock,
          minStock: form.minStock,
          expiresAt: form.expiresAt || null,
        });
        toast.success(tCommon("success"));
        setOpen(false);
        window.location.reload();
      } catch {
        toast.error(tCommon("error"));
      }
    });
  }

  const columns: ColumnDef<Product>[] = [
    {
      accessorKey: "name",
      header: t("name"),
      cell: ({ row }) => (
        <div>
          <p className="font-medium">{row.original.nameAr || row.original.name}</p>
          <p className="text-xs text-muted-foreground">{row.original.barcode}</p>
        </div>
      ),
    },
    {
      accessorKey: "category",
      header: t("category"),
      cell: ({ row }) => row.original.category.nameAr || row.original.category.name,
    },
    {
      accessorKey: "sellPrice",
      header: t("sellPrice"),
      cell: ({ row }) => fmt.currency(toNumber(row.original.sellPrice)),
    },
    {
      accessorKey: "stock",
      header: t("stock"),
      cell: ({ row }) => {
        const low = row.original.stock <= row.original.minStock;
        return (
          <Badge variant={low ? "warning" : "secondary"}>
            {fmt.number(row.original.stock)}
          </Badge>
        );
      },
    },
    {
      id: "actions",
      header: tCommon("actions"),
      cell: ({ row }) => (
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" onClick={() => openEdit(row.original)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setDeleteId(row.original.id)}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title={t("title")}
        actions={
          <>
            <Button asChild variant="outline">
              <Link href="/inventory/intake">
                <Warehouse className="h-4 w-4" />
                {t("stockIntake")}
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/inventory/adjust">
                <PackagePlus className="h-4 w-4" />
                {t("stockAdjust")}
              </Link>
            </Button>
            <Button onClick={openCreate} size="lg">
              <Plus className="h-5 w-5" />
              {t("addProduct")}
            </Button>
          </>
        }
      />

      {(lowStock.length > 0 || expiring.length > 0) && (
        <div className="grid gap-3 sm:grid-cols-2">
          {lowStock.length > 0 && (
            <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/20">
              <CardContent className="flex items-start gap-3 p-4">
                <AlertTriangle className="mt-0.5 h-5 w-5 text-amber-600" />
                <div>
                  <p className="font-semibold">{t("lowStock")}</p>
                  <p className="text-sm text-muted-foreground">
                    {lowStock
                      .slice(0, 3)
                      .map((p) => p.nameAr || p.name)
                      .join(" · ")}
                    {lowStock.length > 3 ? ` +${lowStock.length - 3}` : ""}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
          {expiring.length > 0 && (
            <Card className="border-orange-200 bg-orange-50/50 dark:border-orange-900 dark:bg-orange-950/20">
              <CardContent className="flex items-start gap-3 p-4">
                <AlertTriangle className="mt-0.5 h-5 w-5 text-orange-600" />
                <div>
                  <p className="font-semibold">{t("expiringSoon")}</p>
                  <p className="text-sm text-muted-foreground">
                    {expiring
                      .slice(0, 3)
                      .map((p) => p.nameAr || p.name)
                      .join(" · ")}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          placeholder={tCommon("search")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder={t("filterCategory")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{tCommon("all")}</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.nameAr || c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={stockFilter} onValueChange={setStockFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder={t("filterStock")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{tCommon("all")}</SelectItem>
            <SelectItem value="in">{t("inStock")}</SelectItem>
            <SelectItem value="low">{t("lowStock")}</SelectItem>
            <SelectItem value="out">{t("outOfStock")}</SelectItem>
          </SelectContent>
        </Select>
        <div className="ms-auto flex gap-1 rounded-lg border p-1">
          <Button
            variant={view === "table" ? "secondary" : "ghost"}
            size="icon"
            onClick={() => setView("table")}
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant={view === "card" ? "secondary" : "ghost"}
            size="icon"
            onClick={() => setView("card")}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState title={tCommon("noResults")} />
      ) : view === "table" ? (
        <DataTable columns={columns} data={filtered} />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((p) => (
            <Card key={p.id} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold">{p.nameAr || p.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {p.category.nameAr || p.category.name}
                    </p>
                  </div>
                  <Badge variant={p.stock <= p.minStock ? "warning" : "secondary"}>
                    {fmt.number(p.stock)}
                  </Badge>
                </div>
                <p className="mt-3 text-lg font-bold text-primary">
                  {fmt.currency(toNumber(p.sellPrice))}
                </p>
                <div className="mt-3 flex gap-1">
                  <Button variant="outline" size="sm" onClick={() => openEdit(p)}>
                    <Pencil className="h-3 w-3" />
                    {tCommon("edit")}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setDeleteId(p.id)}>
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? t("editProduct") : t("addProduct")}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label>{t("name")}</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>{t("nameAr")}</Label>
              <Input value={form.nameAr} onChange={(e) => setForm({ ...form, nameAr: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>{t("barcode")}</Label>
              <Input value={form.barcode} onChange={(e) => setForm({ ...form, barcode: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>{t("sku")}</Label>
              <Input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>{t("category")}</Label>
              <Select value={form.categoryId} onValueChange={(v) => setForm({ ...form, categoryId: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nameAr || c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t("supplier")}</Label>
              <Select
                value={form.supplierId || "none"}
                onValueChange={(v) => setForm({ ...form, supplierId: v === "none" ? "" : v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">—</SelectItem>
                  {suppliers.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t("costPrice")}</Label>
              <Input
                type="number"
                value={form.costPrice}
                onChange={(e) => setForm({ ...form, costPrice: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label>{t("sellPrice")}</Label>
              <Input
                type="number"
                value={form.sellPrice}
                onChange={(e) => setForm({ ...form, sellPrice: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label>{t("unit")}</Label>
              <Select value={form.unit} onValueChange={(v) => setForm({ ...form, unit: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["piece", "kg", "box", "liter"].map((u) => (
                    <SelectItem key={u} value={u}>
                      {t(`units.${u}` as "units.piece")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t("stock")}</Label>
              <Input
                type="number"
                value={form.stock}
                onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label>{t("minStock")}</Label>
              <Input
                type="number"
                value={form.minStock}
                onChange={(e) => setForm({ ...form, minStock: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label>{t("expiresAt")}</Label>
              <Input
                type="date"
                value={form.expiresAt}
                onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              {tCommon("cancel")}
            </Button>
            <Button onClick={save} disabled={pending}>
              {tCommon("save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
        title={t("deleteConfirm")}
        onConfirm={() => {
          if (!deleteId) return;
          startTransition(async () => {
            await deleteProduct(deleteId);
            setProducts((prev) => prev.filter((p) => p.id !== deleteId));
            setDeleteId(null);
            toast.success(tCommon("success"));
          });
        }}
        confirmLabel={tCommon("delete")}
        cancelLabel={tCommon("cancel")}
      />
    </div>
  );
}
