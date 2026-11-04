import { EmptyState, PageHeader, StatusBadge } from "@/components/ui";
import { requireStudentPage } from "@/lib/guard";
import { getStudentByUserId, listStudentCourses, syncStudentCourseEnrollments } from "@/lib/data";
import { SampleDataNotice } from "@/components/sample-data-notice";
import { demoCourses } from "../demo-data";

export const dynamic = "force-dynamic";

export default async function StudentCoursesPage() {
  const user = await requireStudentPage();
  const profile = await getStudentByUserId(user.id);
  if (profile) await syncStudentCourseEnrollments(profile.student.id);
  const savedCourses = profile ? await listStudentCourses(profile.student.id) : [];
  const usingSampleData = savedCourses.length === 0;
  const courses = usingSampleData ? demoCourses : savedCourses;

  return (
    <div>
      <PageHeader title="My courses" description="Courses assigned to your current enrollment." />
      {usingSampleData ? <SampleDataNotice /> : null}
      {courses.length > 0 ? (
        <div className="table-wrap card">
          <table className="data">
            <thead>
              <tr>
                <th>Code</th>
                <th>Title</th>
                <th>Credits</th>
                <th>Faculty</th>
                <th>Term</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {courses.map((row) => (
                <tr key={row.enrollmentId}>
                  <td className="font-medium">{row.courseCode}</td>
                  <td>{row.courseTitle}</td>
                  <td>{row.credits}</td>
                  <td>{row.facultyName ?? "TBA"}</td>
                  <td>
                    {row.academicYear} · Sem {row.semester}
                  </td>
                  <td>
                    <StatusBadge status={row.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : <EmptyState title="No courses yet" description="Your college will assign course offerings for this semester." />}
    </div>
  );
}
