import { Suspense } from "react";
import { Role } from "@/types/enums";
import { getInventoryData } from "@/lib/actions";
import { InventoryClient } from "@/components/inventory/inventory-client";
import { Skeleton } from "@/components/ui/skeleton";
import { requirePageSession, resolveLocale } from "@/lib/page-auth";

export default async function InventoryPage({
  params,
}: {
  params: Promise<{ locale: string }> | { locale: string };
}) {
  const locale = await resolveLocale(params);
  await requirePageSession(locale, [Role.ADMIN, Role.WAREHOUSE]);

  const { products, categories, suppliers } = await getInventoryData();

  return (
    <Suspense fallback={<Skeleton className="h-96 w-full" />}>
      <InventoryClient
        products={products.map((p) => ({
          ...p,
          costPrice: Number(p.costPrice),
          sellPrice: Number(p.sellPrice),
          stock: Number(p.stock),
          minStock: Number(p.minStock),
        }))}
        categories={categories}
        suppliers={suppliers}
      />
    </Suspense>
  );
}
