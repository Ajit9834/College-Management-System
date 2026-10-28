import { notFound } from "next/navigation";
import { PageHeader, StatusBadge } from "@/components/ui";
import { JsonForm, ConfirmButton } from "@/components/forms";
import { requireAdminPage } from "@/lib/guard";
import { db } from "@/db";
import { colleges, students, users, userRoles } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default async function AdminCollegeDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdminPage();
  const { id } = await params;
  const [college] = await db.select().from(colleges).where(eq(colleges.id, id)).limit(1);
  if (!college) notFound();
  const [studentCount] = await db
    .select({ value: sql<number>`count(*)::int` })
    .from(students)
    .where(eq(students.collegeId, id));
  const staff = await db
    .select({
      name: users.fullName,
      email: users.email,
      role: userRoles.role,
    })
    .from(userRoles)
    .innerJoin(users, eq(users.id, userRoles.userId))
    .where(eq(userRoles.collegeId, id));

  return (
    <div>
      <PageHeader title={college.name} description={`College code ${college.code}`} />
      <div className="mb-4 flex gap-2">
        <StatusBadge status={college.status} />
        <StatusBadge status={`${studentCount?.value ?? 0} students`} />
      </div>
      <section className="card mb-6 max-w-2xl p-5">
        <h2 className="mb-4 font-semibold">Update college</h2>
        <JsonForm action={`/api/v1/admin/colleges/${college.id}`} method="PATCH">
          <div>
            <label className="label" htmlFor="name">Name</label>
            <input id="name" name="name" className="input" defaultValue={college.name} />
          </div>
          <div>
            <label className="label" htmlFor="code">Code</label>
            <input id="code" name="code" className="input" defaultValue={college.code} />
          </div>
          <div>
            <label className="label" htmlFor="status">Status</label>
            <select id="status" name="status" className="select" defaultValue={college.status}>
              <option value="active">Active</option>
              <option value="rejected">Rejected</option>
              <option value="suspended">Suspended</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div>
            <label className="label" htmlFor="city">City</label>
            <input id="city" name="city" className="input" defaultValue={college.city ?? ""} />
          </div>
        </JsonForm>
      </section>
      <section className="card p-5">
        <h2 className="mb-3 font-semibold">Assigned staff & students</h2>
        <ul className="space-y-2 text-sm">
          {staff.map((s) => (
            <li key={`${s.email}-${s.role}`} className="flex justify-between">
              <span>{s.name} · {s.email}</span>
              <span className="capitalize">{s.role.replaceAll("_", " ")}</span>
            </li>
          ))}
        </ul>
      </section>
      <section className="card mt-6 max-w-2xl border-rose-200 p-5">
        <h2 className="mb-2 font-semibold text-rose-700">Danger zone</h2>
        <p className="mb-4 text-sm text-slate-500">
          Permanently removes this college along with its departments, programs, courses,
          offerings, students, attendance, results, fee records, notices, and files. Staff and
          student logins are kept but lose their college access. This cannot be undone.
        </p>
        <ConfirmButton
          action={`/api/v1/admin/colleges/${college.id}`}
          method="DELETE"
          variant="danger"
          label="Delete college"
          confirmText="Delete this college and all its data permanently? This cannot be undone."
          redirectTo="/admin/colleges"
        />
      </section>
    </div>
  );
}
