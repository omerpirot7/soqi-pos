import { Role } from "@/types/enums";
import { getPosCatalog } from "@/lib/actions";
import { PosClient } from "@/components/pos/pos-client";
import { requirePageSession, resolveLocale } from "@/lib/page-auth";

export default async function PosPage({
  params,
}: {
  params: Promise<{ locale: string }> | { locale: string };
}) {
  const locale = await resolveLocale(params);
  await requirePageSession(locale, [Role.ADMIN, Role.CASHIER]);

  const { categories, products, settings } = await getPosCatalog();

  return (
    <PosClient
      categories={categories}
      products={products.map((p) => ({
        ...p,
        sellPrice: Number(p.sellPrice),
        costPrice: Number(p.costPrice),
        stock: Number(p.stock),
      }))}
      settings={settings}
    />
  );
}
