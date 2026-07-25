import { Role } from "@/types/enums";
import { getProductsForLabels } from "@/lib/actions";
import { LabelsClient } from "@/components/labels/labels-client";
import { requirePageSession, resolveLocale } from "@/lib/page-auth";

export default async function LabelsPage({
  params,
}: {
  params: Promise<{ locale: string }> | { locale: string };
}) {
  const locale = await resolveLocale(params);
  await requirePageSession(locale, [Role.ADMIN, Role.WAREHOUSE]);

  const products = await getProductsForLabels();
  return (
    <LabelsClient
      products={products.map((p) => ({
        id: p.id,
        name: p.name,
        nameAr: p.nameAr,
        barcode: p.barcode,
        sellPrice: Number(p.sellPrice),
      }))}
    />
  );
}
