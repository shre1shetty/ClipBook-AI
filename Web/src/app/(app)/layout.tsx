import { AppShell } from "@/shared/layout/AppShell";
import { getCurrentUser } from "@/features/auth";
import { getServerPageData, serverApi } from "@/shared/api/server";

export default async function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const initialSession = await getServerPageData(getCurrentUser(serverApi));
  return <AppShell initialSession={initialSession}>{children}</AppShell>;
}
