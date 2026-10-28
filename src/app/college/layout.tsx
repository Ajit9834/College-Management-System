import { AppShell } from "@/components/app-shell";
import { collegeNav } from "@/components/nav";
import { requireCollegePage } from "@/lib/guard";
import type { ReactNode } from "react";

export const dynamic = "force-dynamic";

export default async function CollegeLayout({ children }: { children: ReactNode }) {
  const user = await requireCollegePage();
  return (
    <AppShell user={user} nav={collegeNav} portalLabel="College portal">
      {children}
    </AppShell>
  );
}
