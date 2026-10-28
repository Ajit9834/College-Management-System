import Link from "next/link";
import { PageHeader, Pagination, StatusBadge } from "@/components/ui";
import { JsonForm } from "@/components/forms";
import { requireCollegePage } from "@/lib/guard";
import { canManageAcademics, primaryCollegeId } from "@/lib/permissions";
import { db } from "@/db";
import { courseOfferings, courses, departments } from "@/db/schema";
import { asc, eq, sql } from "drizzle-orm";
import { normalizePagination } from "@/lib/pagination";
import { listFaculty } from "@/lib/data";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function CoursesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const user = await requireCollegePage(["college_admin", "faculty"]);
  const collegeId = primaryCollegeId(user);
  if (!collegeId) redirect("/access-denied");
  const { page: pageParam } = await searchParams;
  const { page, pageSize, offset } = normalizePagination({ page: pageParam });
  const where = eq(courses.collegeId, collegeId);
  const [courseRows, counted, courseOptions, depts, offerings, faculty] = await Promise.all([
    db
      .select()
      .from(courses)
      .where(where)
      .orderBy(asc(courses.code))
      .limit(pageSize)
      .offset(offset),
    db.select({ count: sql<number>`count(*)::int` }).from(courses).where(where),
    db
      .select({ id: courses.id, code: courses.code, title: courses.title })
      .from(courses)
      .where(eq(courses.collegeId, collegeId)),
    db.select().from(departments).where(eq(departments.collegeId, collegeId)),
    db.select().from(courseOfferings).where(eq(courseOfferings.collegeId, collegeId)),
    listFaculty(collegeId),
  ]);
  const total = counted?.[0]?.count ?? 0;
  const canManage = canManageAcademics(user);

  return (
    <div>
      <PageHeader title="Courses" description="Catalog and semester offerings." />
      {canManage ? (
        <div className="mb-6 grid gap-6 lg:grid-cols-2">
          <section className="card p-5">
            <h2 className="mb-4 font-semibold">Add course</h2>
            <JsonForm action="/api/v1/college/courses" submitLabel="Create course">
              <div>
                <label className="label" htmlFor="title">Title</label>
                <input id="title" name="title" className="input" required />
              </div>
              <div>
                <label className="label" htmlFor="code">Code</label>
                <input id="code" name="code" className="input" required />
              </div>
              <div>
                <label className="label" htmlFor="departmentId">Department</label>
                <select id="departmentId" name="departmentId" className="select">
                  {depts.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label" htmlFor="credits">Credits</label>
                <input id="credits" name="credits" type="number" defaultValue={3} className="input" />
              </div>
            </JsonForm>
          </section>
          <section className="card p-5">
            <h2 className="mb-4 font-semibold">Create offering</h2>
            <JsonForm action="/api/v1/college/offerings" submitLabel="Create offering">
              <div>
                <label className="label" htmlFor="courseId">Course</label>
                <select id="courseId" name="courseId" className="select">
                  {courseOptions.map((c) => (
                    <option key={c.id} value={c.id}>{c.code} · {c.title}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label" htmlFor="academicYear">Academic year</label>
                <input id="academicYear" name="academicYear" className="input" defaultValue="2025-2026" />
              </div>
              <div>
                <label className="label" htmlFor="semester">Semester</label>
                <input id="semester" name="semester" type="number" defaultValue={5} className="input" />
              </div>
              <div>
                <label className="label" htmlFor="facultyUserId">Faculty</label>
                <select id="facultyUserId" name="facultyUserId" className="select">
                  <option value="">Unassigned</option>
                  {faculty.map((f) => (
                    <option key={f.userId} value={f.userId}>{f.fullName}</option>
                  ))}
                </select>
              </div>
            </JsonForm>
          </section>
        </div>
      ) : null}
      <div className="table-wrap card">
        <table className="data">
          <thead>
            <tr>
              <th>Code</th>
              <th>Title</th>
              <th>Credits</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {courseRows.map((c) => (
              <tr key={c.id}>
                <td className="font-medium">{c.code}</td>
                <td>{c.title}</td>
                <td>{c.credits}</td>
                <td><StatusBadge status={c.isActive ? "active" : "inactive"} /></td>
                <td>
                  <Link href={`/college/courses/${c.id}`} className="text-sm font-medium text-indigo-600">
                    Manage
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination basePath="/college/courses" params={{}} page={page} pageSize={pageSize} total={total} />
      <h2 className="mt-8 mb-3 text-lg font-semibold">Offerings</h2>
      <div className="table-wrap card">
        <table className="data">
          <thead>
            <tr>
              <th>Course</th>
              <th>Year</th>
              <th>Semester</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {offerings.map((o) => {
              const course = courseOptions.find((c) => c.id === o.courseId);
              return (
                <tr key={o.id}>
                  <td>{course ? `${course.code} · ${course.title}` : o.courseId}</td>
                  <td>{o.academicYear}</td>
                  <td>{o.semester}</td>
                  <td><StatusBadge status={o.status} /></td>
                  <td>
                    <Link href={`/college/offerings/${o.id}`} className="text-sm font-medium text-indigo-600">
                      Manage
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
