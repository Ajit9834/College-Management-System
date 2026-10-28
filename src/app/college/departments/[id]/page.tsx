import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PageHeader } from "@/components/ui";
import { ConfirmButton, JsonForm } from "@/components/forms";
import { requireCollegePage } from "@/lib/guard";
import { canManageAcademics, primaryCollegeId } from "@/lib/permissions";
import { db } from "@/db";
import { departments } from "@/db/schema";
import { and, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default async function DepartmentEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireCollegePage();
  const collegeId = primaryCollegeId(user);
  if (!collegeId) redirect("/access-denied");
  const { id } = await params;
  const [row] = await db
    .select()
    .from(departments)
    .where(and(eq(departments.id, id), eq(departments.collegeId, collegeId)))
    .limit(1);
  if (!row) notFound();

  return (
    <div>
      <PageHeader title={row.name} description={`Department · ${row.code}`} />
      <Link href="/college/departments" className="mb-4 inline-block text-sm text-indigo-600">
        ← Back to departments
      </Link>
      {canManageAcademics(user) ? (
        <section className="card max-w-2xl p-5">
          <h2 className="mb-4 font-semibold">Edit department</h2>
          <JsonForm
            action={`/api/v1/college/departments/${row.id}`}
            method="PATCH"
            submitLabel="Save changes"
            successMessage="Department updated."
          >
            <div>
              <label className="label" htmlFor="name">Name</label>
              <input id="name" name="name" className="input" defaultValue={row.name} required />
            </div>
            <div>
              <label className="label" htmlFor="code">Code</label>
              <input id="code" name="code" className="input" defaultValue={row.code} required />
            </div>
            <div>
              <label className="label" htmlFor="description">Description</label>
              <textarea id="description" name="description" className="textarea" rows={3} defaultValue={row.description ?? ""} />
            </div>
            <div>
              <label className="label" htmlFor="isActive">Status</label>
              <select id="isActive" name="isActive" className="select" defaultValue={row.isActive ? "true" : "false"}>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
          </JsonForm>
        </section>
      ) : (
        <p className="text-sm text-slate-500">You do not have permission to edit departments.</p>
      )}
      {canManageAcademics(user) ? (
        <section className="card mt-6 max-w-2xl border-rose-200 p-5">
          <h2 className="mb-2 font-semibold text-rose-700">Danger zone</h2>
          <p className="mb-4 text-sm text-slate-500">
            Permanently removes this department. This cannot be undone.
          </p>
          <ConfirmButton
            action={`/api/v1/college/departments/${row.id}`}
            method="DELETE"
            variant="danger"
            label="Delete department"
            confirmText="Delete this department permanently? This cannot be undone."
            redirectTo="/college/departments"
          />
        </section>
      ) : null}
    </div>
  );
}
