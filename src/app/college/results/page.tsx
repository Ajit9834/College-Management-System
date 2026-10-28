import Link from "next/link";
import { PageHeader, StatusBadge } from "@/components/ui";
import { JsonForm } from "@/components/forms";
import { MarksPanel } from "@/components/college-ops";
import { requireCollegePage } from "@/lib/guard";
import { canPublishResults, isFacultyScoped, primaryCollegeId } from "@/lib/permissions";
import { db } from "@/db";
import {
  assessments,
  courseEnrollments,
  courseOfferings,
  courses,
  students,
  users,
} from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ResultsPage() {
  const user = await requireCollegePage(["college_admin", "faculty"]);
  const collegeId = primaryCollegeId(user);
  if (!collegeId) redirect("/access-denied");

  const facultyUserId = isFacultyScoped(user) ? user.id : undefined;

  const [assessmentRows, offerings, enrolled] = await Promise.all([
    db
      .select({
        id: assessments.id,
        title: assessments.title,
        maxMarks: assessments.maxMarks,
        publishStatus: assessments.publishStatus,
        offeringId: assessments.offeringId,
        code: courses.code,
      })
      .from(assessments)
      .innerJoin(courseOfferings, eq(courseOfferings.id, assessments.offeringId))
      .innerJoin(courses, eq(courses.id, courseOfferings.courseId))
      .where(
        and(
          eq(assessments.collegeId, collegeId),
          facultyUserId ? eq(courseOfferings.facultyUserId, facultyUserId) : undefined,
        ),
      ),
    db
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
      ),
    db
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
      ),
  ]);

  const studentsByAssessment: Record<string, { id: string; name: string }[]> = {};
  for (const assessment of assessmentRows) {
    studentsByAssessment[assessment.id] = enrolled
      .filter((e) => e.offeringId === assessment.offeringId)
      .map((e) => ({ id: e.studentId, name: e.name }));
  }

  return (
    <div>
      <PageHeader title="Results" description="Faculty can enter marks. Only college admins can publish results to students." />
      <section className="card mb-6 p-5">
        <h2 className="mb-4 font-semibold">Create assessment</h2>
        <JsonForm action="/api/v1/college/assessments" submitLabel="Create assessment">
          <div className="grid gap-4 md:grid-cols-4">
            <div className="md:col-span-2">
              <label className="label" htmlFor="title">Title</label>
              <input id="title" name="title" className="input" required />
            </div>
            <div>
              <label className="label" htmlFor="offeringId">Offering</label>
              <select id="offeringId" name="offeringId" className="select">
                {offerings.map((o) => (
                  <option key={o.id} value={o.id}>{o.code} · {o.title}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="maxMarks">Max marks</label>
              <input id="maxMarks" name="maxMarks" type="number" defaultValue={100} className="input" />
            </div>
          </div>
        </JsonForm>
      </section>
      <MarksPanel
        assessments={assessmentRows.map((a) => ({
          id: a.id,
          title: a.title,
          maxMarks: a.maxMarks,
          publishStatus: a.publishStatus,
          label: `${a.code} · ${a.title}`,
        }))}
        studentsByAssessment={studentsByAssessment}
        canPublish={canPublishResults(user)}
      />
      <div className="table-wrap card mt-6">
        <table className="data">
          <thead>
            <tr>
              <th>Assessment</th>
              <th>Course</th>
              <th>Max</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {assessmentRows.map((a) => (
              <tr key={a.id}>
                <td>{a.title}</td>
                <td>{a.code}</td>
                <td>{a.maxMarks}</td>
                <td><StatusBadge status={a.publishStatus} /></td>
                <td>
                  <Link href={`/college/assessments/${a.id}`} className="text-sm font-medium text-indigo-600">
                    Manage
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
