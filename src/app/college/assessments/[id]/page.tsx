import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PageHeader, StatusBadge } from "@/components/ui";
import { JsonForm, ConfirmButton } from "@/components/forms";
import { requireCollegePage } from "@/lib/guard";
import { canPublishResults, primaryCollegeId } from "@/lib/permissions";
import { db } from "@/db";
import { assessments, courseOfferings, courses } from "@/db/schema";
import { and, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default async function AssessmentEditPage({
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
    .from(assessments)
    .where(and(eq(assessments.id, id), eq(assessments.collegeId, collegeId)))
    .limit(1);
  if (!row) notFound();
  const [course] = await db
    .select({ code: courses.code, title: courses.title })
    .from(courseOfferings)
    .innerJoin(courses, eq(courses.id, courseOfferings.courseId))
    .where(eq(courseOfferings.id, row.offeringId))
    .limit(1);
  const canPublish = canPublishResults(user);

  return (
    <div>
      <PageHeader
        title={row.title}
        description={course ? `${course.code} · ${course.title}` : "Assessment"}
      />
      <Link href="/college/results" className="mb-4 inline-block text-sm text-indigo-600">
        ← Back to results
      </Link>
      <div className="mb-6">
        <StatusBadge status={row.publishStatus} />
      </div>
      <section className="card mb-6 max-w-2xl p-5">
        <h2 className="mb-4 font-semibold">Edit assessment</h2>
        <JsonForm
          action={`/api/v1/college/assessments/${row.id}`}
          method="PATCH"
          submitLabel="Save changes"
          successMessage="Assessment updated."
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="label" htmlFor="title">Title</label>
              <input id="title" name="title" className="input" defaultValue={row.title} required />
            </div>
            <div>
              <label className="label" htmlFor="maxMarks">Max marks</label>
              <input id="maxMarks" name="maxMarks" type="number" min={1} max={1000} className="input" defaultValue={row.maxMarks} />
            </div>
            <div>
              <label className="label" htmlFor="examDate">Exam date</label>
              <input id="examDate" name="examDate" type="date" className="input" defaultValue={row.examDate ?? ""} />
            </div>
          </div>
        </JsonForm>
      </section>
      {canPublish ? (
        <section className="card max-w-2xl p-5">
          <h2 className="mb-2 font-semibold">Result visibility</h2>
          <p className="mb-4 text-sm text-slate-500">
            Publishing makes marks visible to students. Drafting hides them again.
          </p>
          <div className="flex flex-wrap gap-2">
            {row.publishStatus !== "published" ? (
              <ConfirmButton
                action={`/api/v1/college/assessments/${row.id}`}
                method="PATCH"
                body={{ publishStatus: "published" }}
                label="Publish results"
                confirmText="Publish these results to students?"
              />
            ) : (
              <ConfirmButton
                action={`/api/v1/college/assessments/${row.id}`}
                method="PATCH"
                body={{ publishStatus: "draft" }}
                label="Unpublish results"
                confirmText="Unpublish these results? Students will no longer see them."
              />
            )}
          </div>
        </section>
      ) : null}
      <section className="card mt-6 max-w-2xl border-rose-200 p-5">
        <h2 className="mb-2 font-semibold text-rose-700">Danger zone</h2>
        <p className="mb-4 text-sm text-slate-500">
          Permanently removes this assessment and its recorded marks. This cannot be undone.
        </p>
        <ConfirmButton
          action={`/api/v1/college/assessments/${row.id}`}
          method="DELETE"
          variant="danger"
          label="Delete assessment"
          confirmText="Delete this assessment permanently? This cannot be undone."
          redirectTo="/college/results"
        />
      </section>
    </div>
  );
}
