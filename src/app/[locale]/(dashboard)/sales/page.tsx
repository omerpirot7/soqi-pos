import { Role } from "@/types/enums";
import { getSales } from "@/lib/actions";
import { prisma } from "@/lib/prisma";
import { SalesClient } from "@/components/sales/sales-client";
import { getStoreSettings, requirePageSession, resolveLocale } from "@/lib/page-auth";

export default async function SalesPage({
  params,
}: {
  params: Promise<{ locale: string }> | { locale: string };
}) {
  const locale = await resolveLocale(params);
  const session = await requirePageSession(locale, [Role.ADMIN, Role.CASHIER]);

  const isAdmin = session.user.role === Role.ADMIN;
  // Keep this page light: list + settings only. Reports load on demand in the client.
  const [sales, settings, cashiers] = await Promise.all([
    getSales({ ownOnly: !isAdmin }),
    getStoreSettings(),
    isAdmin
      ? prisma.user.findMany({
          where: { role: { in: [Role.ADMIN, Role.CASHIER] } },
          select: { id: true, name: true },
        })
      : [],
  ]);

  return (
    <SalesClient
      sales={sales.map((s) => ({
        ...s,
        subtotal: Number(s.subtotal),
        discount: Number(s.discount),
        total: Number(s.total),
        amountPaid: s.amountPaid != null ? Number(s.amountPaid) : null,
        change: s.change != null ? Number(s.change) : null,
        items: s.items.map((i) => ({
          ...i,
          quantity: Number(i.quantity),
          unitPrice: Number(i.unitPrice),
          lineTotal: Number(i.lineTotal),
          costPrice: Number(i.costPrice),
        })),
      }))}
      settings={settings}
      isAdmin={isAdmin}
      cashiers={cashiers}
    />
  );
}
