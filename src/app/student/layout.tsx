import { AppShell } from "@/components/app-shell";
import { studentNav } from "@/components/nav";
import { requireStudentPage } from "@/lib/guard";
import type { ReactNode } from "react";

export const dynamic = "force-dynamic";

export default async function StudentLayout({ children }: { children: ReactNode }) {
  const user = await requireStudentPage();
  return (
    <AppShell user={user} nav={studentNav} portalLabel="Student portal">
      {children}
    </AppShell>
  );
}
