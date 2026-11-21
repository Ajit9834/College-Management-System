import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PageHeader } from "@/components/ui";
import { ConfirmButton, JsonForm } from "@/components/forms";
import { requireCollegePage } from "@/lib/guard";
import { canAccessOffering, canManageTimetable, primaryCollegeId } from "@/lib/permissions";
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
    .select({
      entry: timetableEntries,
      facultyUserId: courseOfferings.facultyUserId,
      code: courses.code,
      title: courses.title,
    })
    .from(timetableEntries)
    .innerJoin(courseOfferings, eq(courseOfferings.id, timetableEntries.offeringId))
    .innerJoin(courses, eq(courses.id, courseOfferings.courseId))
    .where(
      and(
        eq(timetableEntries.id, id),
        eq(timetableEntries.collegeId, collegeId),
        eq(courseOfferings.collegeId, collegeId),
      ),
    )
    .limit(1);
  if (!row || !canAccessOffering(user, row.facultyUserId)) notFound();
  const entry = row.entry;

  return (
    <div>
      <PageHeader
        title="Timetable slot"
        description={`${row.code} · ${row.title}`}
      />
      <Link href="/college/timetable" className="mb-4 inline-block text-sm text-indigo-600">
        ← Back to timetable
      </Link>
      {canManageTimetable(user) ? (
        <section className="card max-w-2xl p-5">
          <h2 className="mb-4 font-semibold">Edit slot</h2>
          <JsonForm
            action={`/api/v1/college/timetable/${entry.id}`}
            method="PATCH"
            submitLabel="Save changes"
            successMessage="Timetable updated."
          >
            <div className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="label" htmlFor="weekday">Weekday</label>
                <select id="weekday" name="weekday" className="select" defaultValue={entry.weekday}>
                  {[1, 2, 3, 4, 5, 6, 7].map((d) => (
                    <option key={d} value={d}>{weekdayName(d)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label" htmlFor="startsAt">Starts</label>
                <input id="startsAt" name="startsAt" className="input" defaultValue={entry.startsAt} required />
              </div>
              <div>
                <label className="label" htmlFor="endsAt">Ends</label>
                <input id="endsAt" name="endsAt" className="input" defaultValue={entry.endsAt} required />
              </div>
              <div className="md:col-span-2">
                <label className="label" htmlFor="room">Room</label>
                <input id="room" name="room" className="input" defaultValue={entry.room ?? ""} />
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
            action={`/api/v1/college/timetable/${entry.id}`}
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
