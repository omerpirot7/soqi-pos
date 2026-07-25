import { cache } from "react";
import { getSession } from "@/lib/auth";
import { redirect } from "@/i18n/routing";
import { Role } from "@/types/enums";
import { getHomeForRole } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

/** Deduped per request: layout + page share one session read */
const cachedSession = cache(getSession);

/** Deduped per request: store settings are read by the shell and by pages */
export const getStoreSettings = cache(async () =>
  prisma.storeSettings.findUnique({
    where: { id: "default" },
    select: {
      storeName: true,
      address: true,
      phone: true,
      currency: true,
      receiptFooter: true,
      receiptWidthMm: true,
      locale: true,
      logoUrl: true,
    },
  })
);

export async function requirePageSession(locale: string, allowed?: Role[]) {
  const session = await cachedSession();
  if (!session?.user) {
    redirect({ href: "/login", locale });
    throw new Error("Unauthorized");
  }
  if (allowed && !allowed.includes(session.user.role as Role)) {
    redirect({ href: getHomeForRole(session.user.role as Role), locale });
    throw new Error("Forbidden");
  }
  return session as {
    user: { id: string; name: string; email: string; role: Role };
  };
}

export async function resolveLocale(
  params: Promise<{ locale: string }> | { locale: string }
) {
  const { locale } = await Promise.resolve(params);
  return locale;
}
