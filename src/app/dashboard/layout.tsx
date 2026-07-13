import { UserRole } from "@prisma/client";
import { AppShell } from "@/components/app-shell";
import { requireUser } from "@/lib/auth";

export default async function DashboardLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const user = await requireUser([UserRole.ADMIN, UserRole.MANAGER]);
  return <AppShell user={user}>{children}</AppShell>;
}
