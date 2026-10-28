import { EmptyState, PageHeader, StatusBadge } from "@/components/ui";
import { requireStudentPage } from "@/lib/guard";
import { getStudentByUserId, listStudentResults } from "@/lib/data";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function StudentResultsPage() {
  const user = await requireStudentPage();
  const profile = await getStudentByUserId(user.id);
  const rows = profile ? await listStudentResults(profile.student.id) : [];

  return (
    <div>
      <PageHeader
        title="Results"
        description="Only published assessments are visible here."
        action={
          <div className="flex flex-wrap gap-2">
            <a
              className="btn btn-secondary"
              href="/api/v1/student/transcript"
              target="_blank"
              rel="noreferrer"
            >
              Transcript (PDF)
            </a>
            <a
              className="btn btn-secondary"
              href="/api/v1/student/report-card"
              target="_blank"
              rel="noreferrer"
            >
              Report card (PDF)
            </a>
          </div>
        }
      />
      {rows.length === 0 ? (
        <EmptyState title="No published results" description="Marks appear after your college publishes an assessment." />
      ) : (
        <div className="table-wrap card">
          <table className="data">
            <thead>
              <tr>
                <th>Assessment</th>
                <th>Course</th>
                <th>Marks</th>
                <th>Grade</th>
                <th>Published</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td className="font-medium">{row.title}</td>
                  <td>
                    {row.courseCode} · {row.courseTitle}
                  </td>
                  <td>
                    {row.marks} / {row.maxMarks}
                  </td>
                  <td>
                    <StatusBadge status={row.grade ?? "—"} />
                  </td>
                  <td>{formatDate(row.publishedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
