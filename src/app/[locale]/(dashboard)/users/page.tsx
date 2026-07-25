import { Role } from "@/types/enums";
import { getUsers } from "@/lib/actions";
import { UsersClient } from "@/components/users/users-client";
import { requirePageSession, resolveLocale } from "@/lib/page-auth";

export default async function UsersPage({
  params,
}: {
  params: Promise<{ locale: string }> | { locale: string };
}) {
  const locale = await resolveLocale(params);
  await requirePageSession(locale, [Role.ADMIN]);

  const users = await getUsers();
  return <UsersClient users={users} />;
}
