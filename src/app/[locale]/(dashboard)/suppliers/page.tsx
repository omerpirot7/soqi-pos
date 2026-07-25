import { Role } from "@/types/enums";
import { prisma } from "@/lib/prisma";
import { SuppliersClient } from "@/components/suppliers/suppliers-client";
import { requirePageSession, resolveLocale } from "@/lib/page-auth";

export default async function SuppliersPage({
  params,
}: {
  params: Promise<{ locale: string }> | { locale: string };
}) {
  const locale = await resolveLocale(params);
  await requirePageSession(locale, [Role.ADMIN, Role.WAREHOUSE]);

  const suppliers = await prisma.supplier.findMany({
    include: { _count: { select: { products: true } } },
    orderBy: { name: "asc" },
  });

  return (
    <SuppliersClient
      suppliers={suppliers.map((s) => ({
        ...s,
        productCount: s._count.products,
      }))}
    />
  );
}
