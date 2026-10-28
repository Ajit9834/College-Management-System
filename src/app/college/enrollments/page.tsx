import Link from "next/link";
import { PageHeader, Pagination } from "@/components/ui";
import { JsonForm } from "@/components/forms";
import { requireCollegePage } from "@/lib/guard";
import { listCollegeStudents } from "@/lib/data";
import { canManageAcademics, primaryCollegeId } from "@/lib/permissions";
import { db } from "@/db";
import { courseEnrollments, courseOfferings, courses, students, users } from "@/db/schema";
import { asc, eq, sql } from "drizzle-orm";
import { normalizePagination } from "@/lib/pagination";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function EnrollmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const user = await requireCollegePage(["college_admin", "faculty"]);
  const collegeId = primaryCollegeId(user);
  if (!collegeId) redirect("/access-denied");
  const { page: pageParam } = await searchParams;
  const { page, pageSize, offset } = normalizePagination({ page: pageParam });
  const where = eq(courseOfferings.collegeId, collegeId);
  const [offerings, studentRows, enrollmentRows, counted] = await Promise.all([
    db
      .select({
        id: courseOfferings.id,
        academicYear: courseOfferings.academicYear,
        semester: courseOfferings.semester,
        code: courses.code,
        title: courses.title,
      })
      .from(courseOfferings)
      .innerJoin(courses, eq(courses.id, courseOfferings.courseId))
      .where(where),
    listCollegeStudents(collegeId),
    db
      .select({
        id: courseEnrollments.id,
        status: courseEnrollments.status,
        studentName: users.fullName,
        code: courses.code,
        title: courses.title,
      })
      .from(courseEnrollments)
      .innerJoin(courseOfferings, eq(courseOfferings.id, courseEnrollments.offeringId))
      .innerJoin(courses, eq(courses.id, courseOfferings.courseId))
      .innerJoin(students, eq(students.id, courseEnrollments.studentId))
      .innerJoin(users, eq(users.id, students.userId))
      .where(where)
      .orderBy(asc(courseEnrollments.id))
      .limit(pageSize)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(courseEnrollments)
      .innerJoin(courseOfferings, eq(courseOfferings.id, courseEnrollments.offeringId))
      .where(where),
  ]);
  const total = counted?.[0]?.count ?? 0;

  return (
    <div>
      <PageHeader title="Enrollments" description="Assign students to course offerings." />
      {canManageAcademics(user) ? (
        <section className="card mb-6 p-5">
          <JsonForm action="/api/v1/college/enrollments" submitLabel="Enroll student">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="label" htmlFor="studentId">Student</label>
                <select id="studentId" name="studentId" className="select">
                  {studentRows.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.fullName} · {s.registrationNo}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label" htmlFor="offeringId">Offering</label>
                <select id="offeringId" name="offeringId" className="select">
                  {offerings.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.code} · {o.title} ({o.academicYear} S{o.semester})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </JsonForm>
        </section>
      ) : null}
      <div className="table-wrap card">
        <table className="data">
          <thead>
            <tr>
              <th>Student</th>
              <th>Course</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {enrollmentRows.map((row) => (
              <tr key={row.id}>
                <td>{row.studentName}</td>
                <td>{row.code} · {row.title}</td>
                <td className="capitalize">{row.status}</td>
                <td>
                  <Link href={`/college/enrollments/${row.id}`} className="text-sm font-medium text-indigo-600">
                    Manage
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination basePath="/college/enrollments" params={{}} page={page} pageSize={pageSize} total={total} />
    </div>
  );
}
