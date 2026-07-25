import { Role } from "@/types/enums";
import { getInventoryData } from "@/lib/actions";
import { StockAdjustClient } from "@/components/inventory/stock-adjust-client";
import { requirePageSession, resolveLocale } from "@/lib/page-auth";

export default async function StockAdjustPage({
  params,
}: {
  params: Promise<{ locale: string }> | { locale: string };
}) {
  const locale = await resolveLocale(params);
  await requirePageSession(locale, [Role.ADMIN, Role.WAREHOUSE]);
  const { products } = await getInventoryData();
  return (
    <StockAdjustClient
      products={products.map((p) => ({
        id: p.id,
        name: p.name,
        nameAr: p.nameAr,
        stock: Number(p.stock),
      }))}
    />
  );
}
