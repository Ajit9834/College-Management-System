import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PageHeader } from "@/components/ui";
import { ConfirmButton, JsonForm } from "@/components/forms";
import { requireCollegePage } from "@/lib/guard";
import { canManageAcademics, primaryCollegeId } from "@/lib/permissions";
import { db } from "@/db";
import { courseEnrollments, courseOfferings, courses, students, users } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default async function EnrollmentEditPage({
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
    .from(courseEnrollments)
    .where(eq(courseEnrollments.id, id))
    .limit(1);
  if (!row) notFound();

  const [details] = await db
    .select({
      collegeId: courseOfferings.collegeId,
      courseCode: courses.code,
      courseTitle: courses.title,
      studentName: users.fullName,
      registrationNo: students.registrationNo,
    })
    .from(courseOfferings)
    .innerJoin(courses, eq(courses.id, courseOfferings.courseId))
    .innerJoin(students, eq(students.id, row.studentId))
    .innerJoin(users, eq(users.id, students.userId))
    .where(eq(courseOfferings.id, row.offeringId))
    .limit(1);
  if (!details || details.collegeId !== collegeId) notFound();

  return (
    <div>
      <PageHeader
        title={details.studentName}
        description={`${details.registrationNo} · ${details.courseCode} · ${details.courseTitle}`}
      />
      <Link href="/college/enrollments" className="mb-4 inline-block text-sm text-indigo-600">
        ← Back to enrollments
      </Link>
      {canManageAcademics(user) ? (
        <section className="card max-w-2xl p-5">
          <h2 className="mb-4 font-semibold">Update enrollment</h2>
          <JsonForm
            action={`/api/v1/college/enrollments/${row.id}`}
            method="PATCH"
            submitLabel="Save status"
            successMessage="Enrollment updated."
          >
            <div>
              <label className="label" htmlFor="status">Status</label>
              <select id="status" name="status" className="select" defaultValue={row.status}>
                <option value="enrolled">Enrolled</option>
                <option value="withdrawn">Withdrawn</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </JsonForm>
        </section>
      ) : (
        <p className="text-sm text-slate-500">You do not have permission to edit enrollments.</p>
      )}
      {canManageAcademics(user) ? (
        <section className="card mt-6 max-w-2xl border-rose-200 p-5">
          <h2 className="mb-2 font-semibold text-rose-700">Danger zone</h2>
          <p className="mb-4 text-sm text-slate-500">
            Permanently removes this enrollment. This cannot be undone.
          </p>
          <ConfirmButton
            action={`/api/v1/college/enrollments/${row.id}`}
            method="DELETE"
            variant="danger"
            label="Delete enrollment"
            confirmText="Delete this enrollment permanently? This cannot be undone."
            redirectTo="/college/enrollments"
          />
        </section>
      ) : null}
    </div>
  );
}
