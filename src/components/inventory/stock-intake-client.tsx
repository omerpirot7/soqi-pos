"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";
import { stockIntake } from "@/lib/actions";
import { useFormatters } from "@/hooks/use-formatters";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Product = { id: string; name: string; nameAr: string | null; costPrice: number; stock: number };
type Supplier = { id: string; name: string };

export function StockIntakeClient({
  products,
  suppliers,
}: {
  products: Product[];
  suppliers: Supplier[];
}) {
  const t = useTranslations("inventory");
  const tCommon = useTranslations("common");
  const fmt = useFormatters();
  const [rows, setRows] = useState<{ productId: string; quantity: number; unitCost: number }[]>([
    { productId: "", quantity: 0, unitCost: 0 },
  ]);
  const [supplierId, setSupplierId] = useState("");
  const [pending, startTransition] = useTransition();

  function submit() {
    const items = rows
      .filter((r) => r.productId && r.quantity > 0)
      .map((r) => ({
        productId: r.productId,
        quantity: r.quantity,
        unitCost: r.unitCost || undefined,
        supplierId: supplierId || undefined,
      }));
    if (!items.length) {
      toast.error(tCommon("required"));
      return;
    }
    startTransition(async () => {
      try {
        await stockIntake(items);
        toast.success(tCommon("success"));
        setRows([{ productId: "", quantity: 0, unitCost: 0 }]);
      } catch {
        toast.error(tCommon("error"));
      }
    });
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 animate-fade-in">
      <PageHeader title={t("stockIntake")} />
      <Card>
        <CardContent className="space-y-4 p-5">
          <div className="space-y-2">
            <label className="text-sm font-medium">{t("supplier")}</label>
            <Select value={supplierId || "none"} onValueChange={(v) => setSupplierId(v === "none" ? "" : v)}>
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

          {rows.map((row, idx) => (
            <div key={idx} className="grid gap-2 sm:grid-cols-3">
              <Select
                value={row.productId || undefined}
                onValueChange={(v) => {
                  const p = products.find((x) => x.id === v);
                  setRows((prev) =>
                    prev.map((r, i) =>
                      i === idx
                        ? { ...r, productId: v, unitCost: p ? Number(p.costPrice) : 0 }
                        : r
                    )
                  );
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("name")} />
                </SelectTrigger>
                <SelectContent>
                  {products.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.nameAr || p.name} ({fmt.number(p.stock)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="number"
                placeholder={t("quantity")}
                value={row.quantity || ""}
                onChange={(e) =>
                  setRows((prev) =>
                    prev.map((r, i) =>
                      i === idx ? { ...r, quantity: Number(e.target.value) } : r
                    )
                  )
                }
              />
              <Input
                type="number"
                placeholder={t("costPrice")}
                value={row.unitCost || ""}
                onChange={(e) =>
                  setRows((prev) =>
                    prev.map((r, i) =>
                      i === idx ? { ...r, unitCost: Number(e.target.value) } : r
                    )
                  )
                }
              />
            </div>
          ))}

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() =>
                setRows((prev) => [...prev, { productId: "", quantity: 0, unitCost: 0 }])
              }
            >
              +
            </Button>
            <Button size="lg" onClick={submit} disabled={pending} className="flex-1">
              {tCommon("save")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
