"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import JsBarcode from "jsbarcode";
import toast from "react-hot-toast";
import { Printer } from "lucide-react";
import { generateBarcodeForProduct } from "@/lib/actions";
import { useFormatters } from "@/hooks/use-formatters";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox-simple";

type Product = {
  id: string;
  name: string;
  nameCkb: string | null;
  barcode: string | null;
  sellPrice: number;
};

function BarcodeSvg({ value }: { value: string }) {
  const ref = useRef<SVGSVGElement>(null);
  useEffect(() => {
    if (ref.current && value) {
      try {
        JsBarcode(ref.current, value, {
          format: "CODE128",
          width: 1.5,
          height: 40,
          displayValue: true,
          fontSize: 12,
          margin: 4,
        });
      } catch {
        /* ignore invalid */
      }
    }
  }, [value]);
  return <svg ref={ref} />;
}

export function LabelsClient({ products: initial }: { products: Product[] }) {
  const t = useTranslations("labels");
  const tCommon = useTranslations("common");
  const fmt = useFormatters();
  const [products, setProducts] = useState(initial);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pending, startTransition] = useTransition();

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function generateMissing() {
    const missing = products.filter((p) => selected.has(p.id) && !p.barcode);
    startTransition(async () => {
      for (const p of missing) {
        const { barcode } = await generateBarcodeForProduct(p.id);
        setProducts((prev) =>
          prev.map((x) => (x.id === p.id ? { ...x, barcode } : x))
        );
      }
      toast.success(tCommon("success"));
    });
  }

  const selectedProducts = products.filter((p) => selected.has(p.id) && p.barcode);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title={t("title")}
        actions={
          <>
            <Button variant="outline" onClick={generateMissing} disabled={pending}>
              {t("generate")}
            </Button>
            <Button
              size="lg"
              onClick={() => window.print()}
              disabled={!selectedProducts.length}
            >
              <Printer className="h-5 w-5" />
              {t("printLabels")}
            </Button>
          </>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 no-print">
        {products.map((p) => (
          <Card
            key={p.id}
            className={`cursor-pointer transition-colors ${selected.has(p.id) ? "ring-2 ring-primary" : ""}`}
            onClick={() => toggle(p.id)}
          >
            <CardContent className="flex items-center gap-3 p-4">
              <Checkbox checked={selected.has(p.id)} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{p.nameCkb || p.name}</p>
                <p className="text-sm text-primary">{fmt.currency(p.sellPrice)}</p>
                <p className="text-xs text-muted-foreground">
                  {p.barcode || t("noBarcode")}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div id="receipt-print" className="hidden print:block">
        <div className="flex flex-wrap gap-4 p-4">
          {selectedProducts.map((p) => (
            <div
              key={p.id}
              className="flex w-[200px] flex-col items-center border border-black p-2 text-center"
            >
              <p className="mb-1 text-xs font-bold">{p.nameCkb || p.name}</p>
              <p className="mb-1 text-sm font-semibold">{fmt.currency(p.sellPrice)}</p>
              {p.barcode && <BarcodeSvg value={p.barcode} />}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
