import { Role } from "@/types/enums";
import { prisma } from "@/lib/prisma";
import { CategoriesClient } from "@/components/categories/categories-client";
import { requirePageSession, resolveLocale } from "@/lib/page-auth";

export default async function CategoriesPage({
  params,
}: {
  params: Promise<{ locale: string }> | { locale: string };
}) {
  const locale = await resolveLocale(params);
  await requirePageSession(locale, [Role.ADMIN, Role.WAREHOUSE]);

  const categories = await prisma.category.findMany({
    include: { _count: { select: { products: true } } },
    orderBy: { name: "asc" },
  });

  return (
    <CategoriesClient
      categories={categories.map((c) => ({
        ...c,
        productCount: c._count.products,
      }))}
    />
  );
}
