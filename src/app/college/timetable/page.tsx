import Link from "next/link";
import { PageHeader, Pagination } from "@/components/ui";
import { JsonForm } from "@/components/forms";
import { requireCollegePage } from "@/lib/guard";
import { canManageTimetable, primaryCollegeId } from "@/lib/permissions";
import { db } from "@/db";
import { courseOfferings, courses, timetableEntries } from "@/db/schema";
import { asc, eq, sql } from "drizzle-orm";
import { normalizePagination } from "@/lib/pagination";
import { weekdayName } from "@/lib/format";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function CollegeTimetablePage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const user = await requireCollegePage(["college_admin", "faculty"]);
  const collegeId = primaryCollegeId(user);
  if (!collegeId) redirect("/access-denied");
  const { page: pageParam } = await searchParams;
  const { page, pageSize, offset } = normalizePagination({ page: pageParam });
  const where = eq(timetableEntries.collegeId, collegeId);
  const [rows, counted, offerings] = await Promise.all([
    db
      .select({
        id: timetableEntries.id,
        weekday: timetableEntries.weekday,
        startsAt: timetableEntries.startsAt,
        endsAt: timetableEntries.endsAt,
        room: timetableEntries.room,
        code: courses.code,
        title: courses.title,
      })
      .from(timetableEntries)
      .innerJoin(courseOfferings, eq(courseOfferings.id, timetableEntries.offeringId))
      .innerJoin(courses, eq(courses.id, courseOfferings.courseId))
      .where(where)
      .orderBy(asc(timetableEntries.weekday), asc(timetableEntries.startsAt))
      .limit(pageSize)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(timetableEntries)
      .innerJoin(courseOfferings, eq(courseOfferings.id, timetableEntries.offeringId))
      .innerJoin(courses, eq(courses.id, courseOfferings.courseId))
      .where(where),
    db
      .select({
        id: courseOfferings.id,
        code: courses.code,
        title: courses.title,
      })
      .from(courseOfferings)
      .innerJoin(courses, eq(courses.id, courseOfferings.courseId))
      .where(eq(courseOfferings.collegeId, collegeId)),
  ]);
  const total = counted?.[0]?.count ?? 0;

  return (
    <div>
      <PageHeader title="Timetable" description="Weekly slots for course offerings." />
      {canManageTimetable(user) ? (
        <section className="card mb-6 p-5">
          <JsonForm action="/api/v1/college/timetable" submitLabel="Add slot">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
              <div className="lg:col-span-2">
                <label className="label" htmlFor="offeringId">Offering</label>
                <select id="offeringId" name="offeringId" className="select">
                  {offerings.map((o) => (
                    <option key={o.id} value={o.id}>{o.code} · {o.title}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label" htmlFor="weekday">Weekday</label>
                <select id="weekday" name="weekday" className="select">
                  {[1, 2, 3, 4, 5, 6, 7].map((d) => (
                    <option key={d} value={d}>{weekdayName(d)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label" htmlFor="startsAt">Starts</label>
                <input id="startsAt" name="startsAt" className="input" placeholder="09:00" required />
              </div>
              <div>
                <label className="label" htmlFor="endsAt">Ends</label>
                <input id="endsAt" name="endsAt" className="input" placeholder="10:30" required />
              </div>
              <div>
                <label className="label" htmlFor="room">Room</label>
                <input id="room" name="room" className="input" />
              </div>
            </div>
          </JsonForm>
        </section>
      ) : null}
      <div className="table-wrap card">
        <table className="data">
          <thead>
            <tr>
              <th>Day</th>
              <th>Time</th>
              <th>Course</th>
              <th>Room</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows
              .sort((a, b) => a.weekday - b.weekday || a.startsAt.localeCompare(b.startsAt))
              .map((row) => (
                <tr key={row.id}>
                  <td>{weekdayName(row.weekday)}</td>
                  <td>{row.startsAt}–{row.endsAt}</td>
                  <td>{row.code} · {row.title}</td>
                  <td>{row.room ?? "—"}</td>
                  <td>
                    <Link href={`/college/timetable/${row.id}`} className="text-sm font-medium text-indigo-600">
                      Manage
                    </Link>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
      <Pagination basePath="/college/timetable" params={{}} page={page} pageSize={pageSize} total={total} />
    </div>
  );
}
