import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PageHeader, StatusBadge } from "@/components/ui";
import { ConfirmButton, JsonForm } from "@/components/forms";
import { requireCollegePage } from "@/lib/guard";
import { canManageAcademics, primaryCollegeId } from "@/lib/permissions";
import { db } from "@/db";
import { courseOfferings, courses } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { listFaculty } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function OfferingEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireCollegePage(["college_admin", "faculty"]);
  const collegeId = primaryCollegeId(user);
  if (!collegeId) redirect("/access-denied");
  const { id } = await params;
  const [row] = await db
    .select()
    .from(courseOfferings)
    .where(and(eq(courseOfferings.id, id), eq(courseOfferings.collegeId, collegeId)))
    .limit(1);
  if (!row) notFound();
  const [[course], faculty] = await Promise.all([
    db.select().from(courses).where(eq(courses.id, row.courseId)).limit(1),
    listFaculty(collegeId),
  ]);

  return (
    <div>
      <PageHeader
        title={course ? `${course.code} · ${course.title}` : "Course offering"}
        description="Semester offering"
      />
      <Link href="/college/courses" className="mb-4 inline-block text-sm text-indigo-600">
        ← Back to courses
      </Link>
      <div className="mb-6">
        <StatusBadge status={row.status} />
      </div>
      {canManageAcademics(user) ? (
        <section className="card max-w-2xl p-5">
          <h2 className="mb-4 font-semibold">Edit offering</h2>
          <JsonForm
            action={`/api/v1/college/offerings/${row.id}`}
            method="PATCH"
            submitLabel="Save changes"
            successMessage="Offering updated."
          >
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="label" htmlFor="academicYear">Academic year</label>
                <input id="academicYear" name="academicYear" className="input" defaultValue={row.academicYear} />
              </div>
              <div>
                <label className="label" htmlFor="semester">Semester</label>
                <input id="semester" name="semester" type="number" min={1} max={16} className="input" defaultValue={row.semester} />
              </div>
              <div>
                <label className="label" htmlFor="facultyUserId">Faculty</label>
                <select id="facultyUserId" name="facultyUserId" className="select" defaultValue={row.facultyUserId ?? ""}>
                  <option value="">Unassigned</option>
                  {faculty.map((f) => (
                    <option key={f.userId} value={f.userId}>{f.fullName}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label" htmlFor="status">Status</label>
                <select id="status" name="status" className="select" defaultValue={row.status}>
                  <option value="scheduled">Scheduled</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
          </JsonForm>
        </section>
      ) : (
        <p className="text-sm text-slate-500">You do not have permission to edit offerings.</p>
      )}
      {canManageAcademics(user) ? (
        <section className="card mt-6 max-w-2xl border-rose-200 p-5">
          <h2 className="mb-2 font-semibold text-rose-700">Danger zone</h2>
          <p className="mb-4 text-sm text-slate-500">
            Permanently removes this offering and its related records. This cannot be undone.
          </p>
          <ConfirmButton
            action={`/api/v1/college/offerings/${row.id}`}
            method="DELETE"
            variant="danger"
            label="Delete offering"
            confirmText="Delete this offering permanently? This cannot be undone."
            redirectTo="/college/courses"
          />
        </section>
      ) : null}
    </div>
  );
}
