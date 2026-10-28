import Link from "next/link";
import { PageHeader, Pagination, StatusBadge } from "@/components/ui";
import { JsonForm } from "@/components/forms";
import { requireCollegePage } from "@/lib/guard";
import { canManageAcademics, primaryCollegeId } from "@/lib/permissions";
import { db } from "@/db";
import { departments, programs } from "@/db/schema";
import { asc, eq, sql } from "drizzle-orm";
import { normalizePagination } from "@/lib/pagination";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function DepartmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const user = await requireCollegePage();
  const collegeId = primaryCollegeId(user);
  if (!collegeId) redirect("/access-denied");
  const { page: pageParam } = await searchParams;
  const { page, pageSize, offset } = normalizePagination({ page: pageParam });
  const where = eq(departments.collegeId, collegeId);
  const [deptRows, counted, deptOptions, progs] = await Promise.all([
    db
      .select()
      .from(departments)
      .where(where)
      .orderBy(asc(departments.name))
      .limit(pageSize)
      .offset(offset),
    db.select({ count: sql<number>`count(*)::int` }).from(departments).where(where),
    db
      .select({ id: departments.id, name: departments.name })
      .from(departments)
      .where(eq(departments.collegeId, collegeId)),
    db.select().from(programs).where(eq(programs.collegeId, collegeId)),
  ]);
  const total = counted?.[0]?.count ?? 0;
  const canManage = canManageAcademics(user);

  return (
    <div>
      <PageHeader title="Departments & programs" description="Academic structure for your college." />
      {canManage ? (
        <div className="mb-6 grid gap-6 lg:grid-cols-2">
          <section className="card p-5">
            <h2 className="mb-4 font-semibold">Add department</h2>
            <JsonForm action="/api/v1/college/departments" submitLabel="Create department">
              <div>
                <label className="label" htmlFor="name">Name</label>
                <input id="name" name="name" className="input" required />
              </div>
              <div>
                <label className="label" htmlFor="code">Code</label>
                <input id="code" name="code" className="input" required />
              </div>
            </JsonForm>
          </section>
          <section className="card p-5">
            <h2 className="mb-4 font-semibold">Add program</h2>
            <JsonForm action="/api/v1/college/programs" submitLabel="Create program">
              <div>
                <label className="label" htmlFor="pname">Name</label>
                <input id="pname" name="name" className="input" required />
              </div>
              <div>
                <label className="label" htmlFor="pcode">Code</label>
                <input id="pcode" name="code" className="input" required />
              </div>
              <div>
                <label className="label" htmlFor="departmentId">Department</label>
                <select id="departmentId" name="departmentId" className="select" required>
                  {deptOptions.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label" htmlFor="durationSemesters">Duration (semesters)</label>
                <input id="durationSemesters" name="durationSemesters" type="number" defaultValue={8} className="input" />
              </div>
            </JsonForm>
          </section>
        </div>
      ) : null}
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card p-5">
          <h2 className="mb-3 font-semibold">Departments</h2>
          <ul className="space-y-3">
            {deptRows.map((d) => (
              <li key={d.id} className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{d.name}</p>
                  <p className="text-sm text-slate-500">{d.code}</p>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={d.isActive ? "active" : "inactive"} />
                  <Link href={`/college/departments/${d.id}`} className="text-sm font-medium text-indigo-600">
                    Edit
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </section>
        <section className="card p-5">
          <h2 className="mb-3 font-semibold">Programs</h2>
          <ul className="space-y-3">
            {progs.map((p) => (
              <li key={p.id} className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{p.name}</p>
                  <p className="text-sm text-slate-500">
                    {p.code} · {p.durationSemesters} semesters
                  </p>
                </div>
                <Link href={`/college/programs/${p.id}`} className="text-sm font-medium text-indigo-600">
                  Edit
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
      <Pagination basePath="/college/departments" params={{}} page={page} pageSize={pageSize} total={total} />
    </div>
  );
}
