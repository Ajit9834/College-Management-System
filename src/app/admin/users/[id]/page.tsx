import { notFound } from "next/navigation";
import { PageHeader, StatusBadge } from "@/components/ui";
import { JsonForm, ConfirmButton } from "@/components/forms";
import { requireAdminPage } from "@/lib/guard";
import { db } from "@/db";
import { colleges, userRoles, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { roleLabel } from "@/lib/permissions";
import { formatDateTime } from "@/lib/format";
import type { RoleName } from "@/db/schema";

export const dynamic = "force-dynamic";

export default async function AdminUserDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdminPage();
  const { id } = await params;
  const [account] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  if (!account) notFound();

  const [assigned, collegeRows] = await Promise.all([
    db.select().from(userRoles).where(eq(userRoles.userId, id)),
    db.select().from(colleges),
  ]);
  const current = assigned[0];
  const isActive = account.status === "active";

  return (
    <div>
      <PageHeader title={account.fullName} description={account.email} />
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <StatusBadge status={account.status} />
        {assigned.map((r) => (
          <span key={r.id} className="badge bg-indigo-50 text-indigo-700">
            {roleLabel(r.role as RoleName)}
            {r.collegeId
              ? ` · ${collegeRows.find((c) => c.id === r.collegeId)?.name ?? "college"}`
              : ""}
          </span>
        ))}
      </div>

      <section className="card mb-6 max-w-2xl p-5">
        <h2 className="mb-4 font-semibold">Account details</h2>
        <JsonForm
          action={`/api/v1/admin/users/${account.id}`}
          method="PATCH"
          submitLabel="Save changes"
          successMessage="User updated."
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="label" htmlFor="fullName">Full name</label>
              <input id="fullName" name="fullName" className="input" defaultValue={account.fullName} required />
            </div>
            <div>
              <label className="label" htmlFor="phone">Phone</label>
              <input id="phone" name="phone" className="input" defaultValue={account.phone ?? ""} />
            </div>
            <div>
              <label className="label" htmlFor="status">Status</label>
              <select id="status" name="status" className="select" defaultValue={account.status}>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
                <option value="deactivated">Deactivated</option>
              </select>
            </div>
            <div>
              <label className="label" htmlFor="role">Role</label>
              <select id="role" name="role" className="select" defaultValue={current?.role ?? "platform_admin"}>
                <option value="platform_admin">Platform admin</option>
                <option value="college_admin">College admin</option>
                <option value="faculty">Faculty</option>
                <option value="accounts_staff">Accounts staff</option>
                <option value="student">Student</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="label" htmlFor="collegeId">College</label>
              <select id="collegeId" name="collegeId" className="select" defaultValue={current?.collegeId ?? ""}>
                <option value="">None (platform admin)</option>
                {collegeRows.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="label" htmlFor="password">Reset password (optional)</label>
              <input
                id="password"
                name="password"
                type="password"
                className="input"
                minLength={8}
                placeholder="Leave blank to keep the current password"
              />
              <p className="mt-1 text-xs text-slate-500">
                Setting a password signs the user out of every session.
              </p>
            </div>
          </div>
        </JsonForm>
      </section>

      <section className="card max-w-2xl p-5">
        <h2 className="mb-2 font-semibold">Access</h2>
        <p className="mb-4 text-sm text-slate-500">
          Last sign-in: {formatDateTime(account.lastLoginAt)}. Suspending blocks protected routes immediately.
        </p>
        <div className="flex flex-wrap gap-2">
          {isActive ? (
            <ConfirmButton
              action={`/api/v1/admin/users/${account.id}`}
              method="PATCH"
              body={{ status: "suspended" }}
              label="Suspend user"
              confirmText="Suspend this user? They will lose access immediately."
            />
          ) : (
            <ConfirmButton
              action={`/api/v1/admin/users/${account.id}`}
              method="PATCH"
              body={{ status: "active" }}
              label="Reactivate user"
              confirmText="Reactivate this user and restore access?"
            />
          )}
        </div>
      </section>

      <section className="card mt-6 max-w-2xl border-rose-200 p-5">
        <h2 className="mb-2 font-semibold text-rose-700">Danger zone</h2>
        <p className="mb-4 text-sm text-slate-500">
          Permanently removes this account and its roles. If the account is a student or faculty
          member, their college profile and related records are removed as well. This cannot be
          undone.
        </p>
        <ConfirmButton
          action={`/api/v1/admin/users/${account.id}`}
          method="DELETE"
          variant="danger"
          label="Delete user"
          confirmText="Delete this user account permanently? This cannot be undone."
          redirectTo="/admin/users"
        />
      </section>
    </div>
  );
}
