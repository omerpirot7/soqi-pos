"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";
import { stockAdjust } from "@/lib/actions";
import { AdjustmentReason } from "@/types/enums";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Product = { id: string; name: string; nameCkb: string | null; stock: number };

export function StockAdjustClient({ products }: { products: Product[] }) {
  const t = useTranslations("inventory");
  const tCommon = useTranslations("common");
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState(0);
  const [reason, setReason] = useState<AdjustmentReason>(AdjustmentReason.DAMAGED);
  const [note, setNote] = useState("");
  const [pending, startTransition] = useTransition();

  function submit() {
    if (!productId || quantity <= 0) {
      toast.error(tCommon("required"));
      return;
    }
    startTransition(async () => {
      try {
        await stockAdjust({ productId, quantity, reason, note });
        toast.success(tCommon("success"));
        setQuantity(0);
        setNote("");
      } catch {
        toast.error(tCommon("error"));
      }
    });
  }

  return (
    <div className="mx-auto max-w-lg space-y-6 animate-fade-in">
      <PageHeader title={t("stockAdjust")} />
      <Card>
        <CardContent className="space-y-4 p-5">
          <Select value={productId || undefined} onValueChange={setProductId}>
            <SelectTrigger>
              <SelectValue placeholder={t("name")} />
            </SelectTrigger>
            <SelectContent>
              {products.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.nameCkb || p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            type="number"
            placeholder={t("quantity")}
            value={quantity || ""}
            onChange={(e) => setQuantity(Number(e.target.value))}
          />
          <Select value={reason} onValueChange={(v) => setReason(v as AdjustmentReason)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="DAMAGED">{t("damaged")}</SelectItem>
              <SelectItem value="EXPIRED">{t("expired")}</SelectItem>
              <SelectItem value="LOST">{t("lost")}</SelectItem>
              <SelectItem value="OTHER">{t("other")}</SelectItem>
            </SelectContent>
          </Select>
          <Textarea
            placeholder={t("note")}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <Button size="lg" className="w-full" onClick={submit} disabled={pending}>
            {tCommon("save")}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
