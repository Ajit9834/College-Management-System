import Link from "next/link";
import { PageHeader, Pagination } from "@/components/ui";
import { AttendanceRegister } from "@/components/college-ops";
import { requireCollegePage } from "@/lib/guard";
import { isFacultyScoped, primaryCollegeId } from "@/lib/permissions";
import { db } from "@/db";
import {
  attendanceSessions,
  courseEnrollments,
  courseOfferings,
  courses,
  students,
  users,
} from "@/db/schema";
import { and, desc, eq, sql } from "drizzle-orm";
import { normalizePagination } from "@/lib/pagination";
import { formatDate } from "@/lib/format";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const user = await requireCollegePage(["college_admin", "faculty"]);
  const collegeId = primaryCollegeId(user);
  if (!collegeId) redirect("/access-denied");

  const facultyUserId = isFacultyScoped(user) ? user.id : undefined;
  const { page: pageParam } = await searchParams;
  const { page, pageSize, offset } = normalizePagination({ page: pageParam });

  const offerings = await db
    .select({
      id: courseOfferings.id,
      code: courses.code,
      title: courses.title,
    })
    .from(courseOfferings)
    .innerJoin(courses, eq(courses.id, courseOfferings.courseId))
    .where(
      and(
        eq(courseOfferings.collegeId, collegeId),
        facultyUserId ? eq(courseOfferings.facultyUserId, facultyUserId) : undefined,
      ),
    );

  const enrolled = await db
    .select({
      offeringId: courseEnrollments.offeringId,
      studentId: students.id,
      name: users.fullName,
    })
    .from(courseEnrollments)
    .innerJoin(courseOfferings, eq(courseOfferings.id, courseEnrollments.offeringId))
    .innerJoin(students, eq(students.id, courseEnrollments.studentId))
    .innerJoin(users, eq(users.id, students.userId))
    .where(
      and(
        eq(courseOfferings.collegeId, collegeId),
        facultyUserId ? eq(courseOfferings.facultyUserId, facultyUserId) : undefined,
      ),
    );

  const studentsByOffering: Record<string, { id: string; name: string }[]> = {};
  for (const row of enrolled) {
    studentsByOffering[row.offeringId] ??= [];
    studentsByOffering[row.offeringId].push({ id: row.studentId, name: row.name });
  }

  const sessionsWhere = and(
    eq(attendanceSessions.collegeId, collegeId),
    facultyUserId ? eq(courseOfferings.facultyUserId, facultyUserId) : undefined,
  );
  const [recent, counted] = await Promise.all([
    db
      .select({
        id: attendanceSessions.id,
        date: attendanceSessions.sessionDate,
        topic: attendanceSessions.topic,
        code: courses.code,
      })
      .from(attendanceSessions)
      .innerJoin(courseOfferings, eq(courseOfferings.id, attendanceSessions.offeringId))
      .innerJoin(courses, eq(courses.id, courseOfferings.courseId))
      .where(sessionsWhere)
      .orderBy(desc(attendanceSessions.sessionDate))
      .limit(pageSize)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(attendanceSessions)
      .innerJoin(courseOfferings, eq(courseOfferings.id, attendanceSessions.offeringId))
      .innerJoin(courses, eq(courses.id, courseOfferings.courseId))
      .where(sessionsWhere),
  ]);
  const total = counted?.[0]?.count ?? 0;

  return (
    <div>
      <PageHeader title="Attendance" description="Create a session and mark each enrolled student. Corrections are audited." />
      <AttendanceRegister
        offerings={offerings.map((o) => ({ id: o.id, label: `${o.code} · ${o.title}` }))}
        studentsByOffering={studentsByOffering}
      />
      <h2 className="mt-8 mb-3 text-lg font-semibold">Recent sessions</h2>
      <div className="table-wrap card">
        <table className="data">
          <thead>
            <tr>
              <th>Date</th>
              <th>Course</th>
              <th>Topic</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {recent.map((row) => (
              <tr key={row.id}>
                <td>{formatDate(row.date)}</td>
                <td>{row.code}</td>
                <td>{row.topic ?? "—"}</td>
                <td>
                  <Link
                    href={`/college/attendance/${row.id}`}
                    className="text-sm font-medium text-indigo-600"
                  >
                    Manage
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination basePath="/college/attendance" params={{}} page={page} pageSize={pageSize} total={total} />
    </div>
  );
}
