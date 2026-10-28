import Link from "next/link";
import { PageHeader, StatCard, StatusBadge } from "@/components/ui";
import { requireAdminPage } from "@/lib/guard";
import { adminDashboardStats } from "@/lib/data";
import { formatDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  await requireAdminPage();
  const stats = await adminDashboardStats();

  return (
    <div>
      <PageHeader
        title="Platform overview"
        description="Colleges, accounts, and recent audited activity across CampusFlow."
        action={
          <div className="flex gap-2">
            <Link href="/admin/colleges" className="btn btn-primary">
              Add college
            </Link>
            <Link href="/admin/users" className="btn btn-secondary">
              Manage users
            </Link>
          </div>
        }
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Colleges" value={stats.colleges} />
        <StatCard label="Active users" value={stats.users} accent="cyan" />
        <StatCard label="Active students" value={stats.students} accent="emerald" />
        <StatCard label="Pending approvals" value={stats.pendingColleges.length} accent="amber" />
      </div>
      {stats.pendingColleges.length > 0 ? (
        <section className="card mt-6 border-amber-200 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">College registrations awaiting approval</h2>
            <Link href="/admin/approvals" className="text-sm font-medium text-indigo-600">
              Review all
            </Link>
          </div>
          <ul className="space-y-3">
            {stats.pendingColleges.slice(0, 5).map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-medium">{c.name}</p>
                  <p className="text-sm text-slate-500">
                    {c.email ?? c.code} · submitted {formatDateTime(c.createdAt)}
                  </p>
                </div>
                <StatusBadge status={c.status} />
              </li>
            ))}
          </ul>
          <Link href="/admin/approvals" className="btn btn-primary mt-4">
            Go to approvals
          </Link>
        </section>
      ) : null}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="card p-5">
          <h2 className="mb-4 text-lg font-semibold">Colleges</h2>
          <ul className="space-y-3">
            {stats.collegeRows.map((c) => (
              <li key={c.id} className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{c.name}</p>
                  <p className="text-sm text-slate-500">{c.code}</p>
                </div>
                <StatusBadge status={c.status} />
              </li>
            ))}
          </ul>
        </section>
        <section className="card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Recent audit events</h2>
            <Link href="/admin/audit" className="text-sm font-medium text-indigo-600">
              View all
            </Link>
          </div>
          <ul className="space-y-3 text-sm">
            {stats.recentAudit.map((row) => (
              <li key={row.id} className="flex justify-between gap-4">
                <div>
                  <p className="font-medium">{row.action}</p>
                  <p className="text-slate-500">{row.actorName ?? "System"} · {row.targetType}</p>
                </div>
                <span className="text-slate-500">{formatDateTime(row.createdAt)}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
