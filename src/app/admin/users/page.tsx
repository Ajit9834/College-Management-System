import Link from "next/link";
import { PageHeader, Pagination, StatusBadge } from "@/components/ui";
import { JsonForm } from "@/components/forms";
import { requireAdminPage } from "@/lib/guard";
import { db } from "@/db";
import { colleges, userRoles, users } from "@/db/schema";
import { asc, desc, ilike, inArray, or, sql } from "drizzle-orm";
import { normalizePagination } from "@/lib/pagination";
import { roleLabel } from "@/lib/permissions";
import type { RoleName } from "@/db/schema";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  await requireAdminPage();
  const { q, page: pageParam } = await searchParams;
  const { page, pageSize, offset } = normalizePagination({ page: pageParam });

  const where = q
    ? or(ilike(users.fullName, `%${q}%`), ilike(users.email, `%${q}%`))
    : undefined;

  const [accounts, counted, collegeRows] = await Promise.all([
    db
      .select()
      .from(users)
      .where(where)
      .orderBy(desc(users.createdAt), asc(users.id))
      .limit(pageSize)
      .offset(offset),
    db.select({ count: sql<number>`count(*)::int` }).from(users).where(where),
    db.select().from(colleges),
  ]);
  const total = counted?.[0]?.count ?? 0;

  const roles = accounts.length
    ? await db
        .select()
        .from(userRoles)
        .where(inArray(userRoles.userId, accounts.map((account) => account.id)))
    : [];

  return (
    <div>
      <PageHeader title="Users & roles" description="Assign portal access. Role changes are written to the audit log." />
      <form className="mb-5 flex flex-col gap-3 sm:flex-row">
        <input className="input max-w-sm" name="q" placeholder="Search name or email" defaultValue={q} />
        <button className="btn btn-ghost" type="submit">
          Search
        </button>
      </form>
      <section className="card mb-6 p-5">
        <h2 className="mb-4 font-semibold">Create user</h2>
        <JsonForm action="/api/v1/admin/users" submitLabel="Create user">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="label" htmlFor="fullName">Full name</label>
              <input id="fullName" name="fullName" className="input" required />
            </div>
            <div>
              <label className="label" htmlFor="email">Email</label>
              <input id="email" name="email" type="email" className="input" required />
            </div>
            <div>
              <label className="label" htmlFor="password">Password</label>
              <input id="password" name="password" className="input" required minLength={8} />
            </div>
            <div>
              <label className="label" htmlFor="role">Role</label>
              <select id="role" name="role" className="select">
                <option value="college_admin">College admin</option>
                <option value="faculty">Faculty</option>
                <option value="accounts_staff">Accounts staff</option>
                <option value="student">Student</option>
                <option value="platform_admin">Platform admin</option>
              </select>
            </div>
            <div>
              <label className="label" htmlFor="collegeId">College</label>
              <select id="collegeId" name="collegeId" className="select">
                <option value="">None (platform admin)</option>
                {collegeRows.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>
        </JsonForm>
      </section>
      <div className="table-wrap card">
        <table className="data">
          <thead>
            <tr>
              <th>User</th>
              <th>Roles</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {accounts.map((account) => {
              const assigned = roles.filter((r) => r.userId === account.id);
              return (
                <tr key={account.id}>
                  <td>
                    <p className="font-medium">{account.fullName}</p>
                    <p className="text-xs text-slate-500">{account.email}</p>
                  </td>
                  <td>
                    {assigned
                      .map((r) => roleLabel(r.role as RoleName))
                      .join(", ") || "—"}
                  </td>
                  <td>
                    <StatusBadge status={account.status} />
                  </td>
                  <td>
                    <Link href={`/admin/users/${account.id}`} className="text-sm font-medium text-indigo-600">
                      Manage
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <Pagination basePath="/admin/users" params={{ q }} page={page} pageSize={pageSize} total={total} />
    </div>
  );
}
