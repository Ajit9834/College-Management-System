import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PageHeader } from "@/components/ui";
import { ConfirmButton, JsonForm } from "@/components/forms";
import { requireCollegePage } from "@/lib/guard";
import { canManageAcademics, primaryCollegeId } from "@/lib/permissions";
import { db } from "@/db";
import { departments, programs } from "@/db/schema";
import { and, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default async function ProgramEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireCollegePage();
  const collegeId = primaryCollegeId(user);
  if (!collegeId) redirect("/access-denied");
  const { id } = await params;
  const [[row], depts] = await Promise.all([
    db
      .select()
      .from(programs)
      .where(and(eq(programs.id, id), eq(programs.collegeId, collegeId)))
      .limit(1),
    db.select().from(departments).where(eq(departments.collegeId, collegeId)),
  ]);
  if (!row) notFound();

  return (
    <div>
      <PageHeader title={row.name} description={`Program · ${row.code}`} />
      <Link href="/college/departments" className="mb-4 inline-block text-sm text-indigo-600">
        ← Back to departments &amp; programs
      </Link>
      {canManageAcademics(user) ? (
        <section className="card max-w-2xl p-5">
          <h2 className="mb-4 font-semibold">Edit program</h2>
          <JsonForm
            action={`/api/v1/college/programs/${row.id}`}
            method="PATCH"
            submitLabel="Save changes"
            successMessage="Program updated."
          >
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="label" htmlFor="name">Name</label>
                <input id="name" name="name" className="input" defaultValue={row.name} required />
              </div>
              <div>
                <label className="label" htmlFor="code">Code</label>
                <input id="code" name="code" className="input" defaultValue={row.code} required />
              </div>
              <div>
                <label className="label" htmlFor="departmentId">Department</label>
                <select id="departmentId" name="departmentId" className="select" defaultValue={row.departmentId}>
                  {depts.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label" htmlFor="durationSemesters">Duration (semesters)</label>
                <input id="durationSemesters" name="durationSemesters" type="number" min={1} max={16} className="input" defaultValue={row.durationSemesters} />
              </div>
              <div>
                <label className="label" htmlFor="isActive">Status</label>
                <select id="isActive" name="isActive" className="select" defaultValue={row.isActive ? "true" : "false"}>
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>
            </div>
          </JsonForm>
        </section>
      ) : (
        <p className="text-sm text-slate-500">You do not have permission to edit programs.</p>
      )}
      {canManageAcademics(user) ? (
        <section className="card mt-6 max-w-2xl border-rose-200 p-5">
          <h2 className="mb-2 font-semibold text-rose-700">Danger zone</h2>
          <p className="mb-4 text-sm text-slate-500">
            Permanently removes this program. This cannot be undone.
          </p>
          <ConfirmButton
            action={`/api/v1/college/programs/${row.id}`}
            method="DELETE"
            variant="danger"
            label="Delete program"
            confirmText="Delete this program permanently? This cannot be undone."
            redirectTo="/college/departments"
          />
        </section>
      ) : null}
    </div>
  );
}
