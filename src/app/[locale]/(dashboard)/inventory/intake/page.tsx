import { Role } from "@/types/enums";
import { getInventoryData } from "@/lib/actions";
import { StockIntakeClient } from "@/components/inventory/stock-intake-client";
import { requirePageSession, resolveLocale } from "@/lib/page-auth";

export default async function StockIntakePage({
  params,
}: {
  params: Promise<{ locale: string }> | { locale: string };
}) {
  const locale = await resolveLocale(params);
  await requirePageSession(locale, [Role.ADMIN, Role.WAREHOUSE]);
  const { products, suppliers } = await getInventoryData();
  return (
    <StockIntakeClient
      products={products.map((p) => ({
        id: p.id,
        name: p.name,
        nameAr: p.nameAr,
        costPrice: Number(p.costPrice),
        stock: Number(p.stock),
      }))}
      suppliers={suppliers}
    />
  );
}
