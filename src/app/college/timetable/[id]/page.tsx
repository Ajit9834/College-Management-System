import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PageHeader } from "@/components/ui";
import { ConfirmButton, JsonForm } from "@/components/forms";
import { requireCollegePage } from "@/lib/guard";
import { canManageTimetable, primaryCollegeId } from "@/lib/permissions";
import { db } from "@/db";
import { courseOfferings, courses, timetableEntries } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { weekdayName } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function TimetableEditPage({
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
    .from(timetableEntries)
    .where(and(eq(timetableEntries.id, id), eq(timetableEntries.collegeId, collegeId)))
    .limit(1);
  if (!row) notFound();
  const [course] = await db
    .select({ code: courses.code, title: courses.title })
    .from(courseOfferings)
    .innerJoin(courses, eq(courses.id, courseOfferings.courseId))
    .where(eq(courseOfferings.id, row.offeringId))
    .limit(1);

  return (
    <div>
      <PageHeader
        title="Timetable slot"
        description={course ? `${course.code} · ${course.title}` : undefined}
      />
      <Link href="/college/timetable" className="mb-4 inline-block text-sm text-indigo-600">
        ← Back to timetable
      </Link>
      {canManageTimetable(user) ? (
        <section className="card max-w-2xl p-5">
          <h2 className="mb-4 font-semibold">Edit slot</h2>
          <JsonForm
            action={`/api/v1/college/timetable/${row.id}`}
            method="PATCH"
            submitLabel="Save changes"
            successMessage="Timetable updated."
          >
            <div className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="label" htmlFor="weekday">Weekday</label>
                <select id="weekday" name="weekday" className="select" defaultValue={row.weekday}>
                  {[1, 2, 3, 4, 5, 6, 7].map((d) => (
                    <option key={d} value={d}>{weekdayName(d)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label" htmlFor="startsAt">Starts</label>
                <input id="startsAt" name="startsAt" className="input" defaultValue={row.startsAt} required />
              </div>
              <div>
                <label className="label" htmlFor="endsAt">Ends</label>
                <input id="endsAt" name="endsAt" className="input" defaultValue={row.endsAt} required />
              </div>
              <div className="md:col-span-2">
                <label className="label" htmlFor="room">Room</label>
                <input id="room" name="room" className="input" defaultValue={row.room ?? ""} />
              </div>
            </div>
          </JsonForm>
        </section>
      ) : (
        <p className="text-sm text-slate-500">You do not have permission to edit the timetable.</p>
      )}
      {canManageTimetable(user) ? (
        <section className="card mt-6 max-w-2xl border-rose-200 p-5">
          <h2 className="mb-2 font-semibold text-rose-700">Danger zone</h2>
          <p className="mb-4 text-sm text-slate-500">
            Permanently removes this timetable slot. This cannot be undone.
          </p>
          <ConfirmButton
            action={`/api/v1/college/timetable/${row.id}`}
            method="DELETE"
            variant="danger"
            label="Delete slot"
            confirmText="Delete this timetable slot permanently? This cannot be undone."
            redirectTo="/college/timetable"
          />
        </section>
      ) : null}
    </div>
  );
}
