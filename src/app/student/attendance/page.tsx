import { EmptyState, PageHeader, StatCard, StatusBadge } from "@/components/ui";
import { requireStudentPage } from "@/lib/guard";
import { getStudentByUserId, listStudentAttendance } from "@/lib/data";
import { formatDate, percent } from "@/lib/format";
import { SampleDataNotice } from "@/components/sample-data-notice";
import { demoAttendance } from "../demo-data";

export const dynamic = "force-dynamic";

export default async function StudentAttendancePage() {
  const user = await requireStudentPage();
  const profile = await getStudentByUserId(user.id);
  const savedData = profile
    ? await listStudentAttendance(profile.student.id)
    : { records: [], summary: [] };
  const usingSampleData = savedData.records.length === 0;
  const data = usingSampleData ? demoAttendance : savedData;
  const present = data.records.filter((r) => r.status !== "absent").length;

  return (
    <div>
      <PageHeader title="Attendance" description="Your attendance is shown after faculty mark each session." />
      {usingSampleData ? <SampleDataNotice /> : null}
      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <StatCard label="Overall" value={`${percent(present, data.records.length)}%`} accent="emerald" />
        <StatCard label="Sessions" value={data.records.length} accent="cyan" />
        <StatCard label="Courses tracked" value={data.summary.length} />
      </div>
      {data.records.length > 0 ? (
        <div className="table-wrap card">
          <table className="data">
            <thead>
              <tr>
                <th>Date</th>
                <th>Course</th>
                <th>Topic</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {data.records.map((row) => (
                <tr key={row.id}>
                  <td>{formatDate(row.sessionDate)}</td>
                  <td>
                    {row.courseCode} · {row.courseTitle}
                  </td>
                  <td>{row.topic ?? "—"}</td>
                  <td>
                    <StatusBadge status={row.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : <EmptyState title="No attendance yet" description="Records will appear after your first marked class." />}
    </div>
  );
}
