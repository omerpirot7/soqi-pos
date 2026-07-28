import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { getStoreSettings, requirePageSession, resolveLocale } from "@/lib/page-auth";

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }> | { locale: string };
}) {
  const locale = await resolveLocale(params);
  await requirePageSession(locale);

  const settings = await getStoreSettings();
  const storeName = settings?.storeName || "سۆقی";

  return (
    <div className="min-h-screen bg-background">
      <Sidebar storeName={storeName} />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar storeName={storeName} />
        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
