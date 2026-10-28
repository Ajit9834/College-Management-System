import { PageHeader, StatCard, StatusBadge } from "@/components/ui";
import { requireAdminPage } from "@/lib/guard";
import { adminDashboardStats } from "@/lib/data";
import { db } from "@/db";
import { userRoles } from "@/db/schema";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default async function AdminReportsPage() {
  await requireAdminPage();
  const stats = await adminDashboardStats();
  const roleCounts = await db
    .select({
      role: userRoles.role,
      value: sql<number>`count(*)::int`,
    })
    .from(userRoles)
    .groupBy(userRoles.role);

  return (
    <div>
      <PageHeader
        title="Platform reports"
        description="Aggregate counts across every college on CampusFlow."
        action={
          <a className="btn btn-ghost" href="/api/v1/admin/reports/export">
            Export colleges CSV
          </a>
        }
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Colleges" value={stats.colleges} />
        <StatCard label="Users" value={stats.users} accent="cyan" />
        <StatCard label="Students" value={stats.students} accent="emerald" />
        <StatCard label="Suspended" value={stats.suspended} accent="rose" />
      </div>
      <section className="card mt-6 p-5">
        <h2 className="mb-4 font-semibold">Role distribution</h2>
        <ul className="space-y-3">
          {roleCounts.map((row) => (
            <li key={row.role} className="flex items-center justify-between">
              <StatusBadge status={row.role} />
              <span className="font-semibold">{row.value}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
