import { Role } from "@/types/enums";
import { getHomeForRole } from "@/lib/permissions";
import { DashboardClient } from "@/components/dashboard/dashboard-client";
import { getDashboardData } from "@/lib/actions";
import { requirePageSession, resolveLocale } from "@/lib/page-auth";
import { redirect } from "@/i18n/routing";

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }> | { locale: string };
}) {
  const locale = await resolveLocale(params);
  const session = await requirePageSession(locale);

  if (session.user.role !== Role.ADMIN) {
    redirect({ href: getHomeForRole(session.user.role), locale });
  }

  const initialData = await getDashboardData("daily");

  return <DashboardClient initialData={initialData} />;
}
