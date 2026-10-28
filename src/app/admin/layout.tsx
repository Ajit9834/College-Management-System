import { AppShell } from "@/components/app-shell";
import { adminNav } from "@/components/nav";
import { requireAdminPage } from "@/lib/guard";
import type { ReactNode } from "react";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await requireAdminPage();
  return (
    <AppShell user={user} nav={adminNav} portalLabel="Admin portal">
      {children}
    </AppShell>
  );
}
