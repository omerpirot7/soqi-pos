import { Role } from "@/types/enums";
import { getSettings } from "@/lib/actions";
import { SettingsClient } from "@/components/settings/settings-client";
import { requirePageSession, resolveLocale } from "@/lib/page-auth";
import { redirect } from "@/i18n/routing";

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ locale: string }> | { locale: string };
}) {
  const locale = await resolveLocale(params);
  await requirePageSession(locale, [Role.ADMIN]);

  const settings = await getSettings();
  if (!settings) {
    redirect({ href: "/", locale });
    throw new Error("Missing settings");
  }

  return <SettingsClient settings={settings} />;
}
